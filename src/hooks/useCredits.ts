import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserCredits {
  id: string;
  profile_id: string;
  balance: number;
  total_purchased: number;
  total_used: number;
  created_at: string;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  profile_id: string;
  amount: number;
  type: 'purchase' | 'usage' | 'bonus' | 'refund';
  description: string | null;
  balance_after: number;
  created_at: string;
}

// Credit packages available for purchase (BDT pricing)
export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 10, price: 1200, currency: 'BDT', popular: false },
  { id: 'basic', name: 'Basic', credits: 50, price: 4500, currency: 'BDT', popular: false },
  { id: 'pro', name: 'Pro', credits: 150, price: 12000, currency: 'BDT', popular: true },
  { id: 'enterprise', name: 'Enterprise', credits: 500, price: 35000, currency: 'BDT', popular: false },
];

// Cost per AI operation (in credits) - balanced for value
export const AI_CREDIT_COSTS = {
  chat: 0.15, // Per message (~$0.18-0.27 per message)
  workflow_generation: 2, // Per workflow generated (~$2.40-3.50 per workflow)
  analysis: 0.75, // Per analysis (~$0.90-1.30 per analysis)
};

export function useCredits() {
  const { profile } = useAuth();
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (creditsError) throw creditsError;

      if (creditsData) {
        setCredits({
          id: creditsData.id,
          profile_id: creditsData.profile_id,
          balance: Number(creditsData.balance),
          total_purchased: Number(creditsData.total_purchased),
          total_used: Number(creditsData.total_used),
          created_at: creditsData.created_at,
          updated_at: creditsData.updated_at,
        });
      }

      // Fetch recent transactions
      const { data: txData, error: txError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txError) throw txError;

      setTransactions((txData || []).map(tx => ({
        id: tx.id,
        profile_id: tx.profile_id,
        amount: Number(tx.amount),
        type: tx.type as CreditTransaction['type'],
        description: tx.description,
        balance_after: Number(tx.balance_after),
        created_at: tx.created_at,
      })));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const hasEnoughCredits = useCallback((amount: number): boolean => {
    return (credits?.balance || 0) >= amount;
  }, [credits?.balance]);

  const addCredits = useCallback(async (amount: number, description?: string): Promise<boolean> => {
    if (!profile?.id) return false;

    try {
      const { error } = await supabase.rpc('add_credits', {
        p_profile_id: profile.id,
        p_amount: amount,
        p_type: 'purchase',
        p_description: description || `Purchased ${amount} credits`,
      });

      if (error) throw error;
      
      await fetchCredits();
      return true;
    } catch (err) {
      console.error('Failed to add credits:', err);
      return false;
    }
  }, [profile?.id, fetchCredits]);

  const deductCredits = useCallback(async (amount: number, description?: string): Promise<boolean> => {
    if (!profile?.id) return false;
    if (!hasEnoughCredits(amount)) return false;

    try {
      const { error } = await supabase.rpc('deduct_credits', {
        p_profile_id: profile.id,
        p_amount: amount,
        p_description: description || 'AI usage',
      });

      if (error) throw error;
      
      await fetchCredits();
      return true;
    } catch (err) {
      console.error('Failed to deduct credits:', err);
      return false;
    }
  }, [profile?.id, hasEnoughCredits, fetchCredits]);

  return {
    credits,
    transactions,
    loading,
    error,
    hasEnoughCredits,
    addCredits,
    deductCredits,
    refetch: fetchCredits,
    CREDIT_PACKAGES,
    AI_CREDIT_COSTS,
  };
}
