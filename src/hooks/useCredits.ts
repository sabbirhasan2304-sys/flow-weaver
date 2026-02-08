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

// Credit packages (BDT @ ৳127/$1) - 400% markup on AI cost for profit
// Google Gemini 2.5 Flash: ~$0.001/message, we charge ~$0.04/credit = 40x markup
export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 50, price: 254, currency: 'BDT', popular: false },       // ~$2, ৳5.08/credit
  { id: 'basic', name: 'Basic', credits: 200, price: 762, currency: 'BDT', popular: false },          // ~$6, ৳3.81/credit
  { id: 'pro', name: 'Pro', credits: 1000, price: 2540, currency: 'BDT', popular: true },             // ~$20, ৳2.54/credit
  { id: 'enterprise', name: 'Enterprise', credits: 5000, price: 8890, currency: 'BDT', popular: false }, // ~$70, ৳1.78/credit
];

// Cost per AI operation (in credits)
export const AI_CREDIT_COSTS = {
  chat: 1,              // 1 credit per AI chat message (~৳2.54-5.08)
  workflow_generation: 15, // 15 credits per AI-generated workflow (~৳38-76)
  analysis: 5,          // 5 credits per AI analysis (~৳12-25)
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
