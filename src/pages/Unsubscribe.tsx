import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle2, XCircle, Loader2, MailX } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); return; }
    (async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
          headers: { apikey: anonKey },
        });
        const data = await res.json();
        if (!res.ok) { setStatus('invalid'); return; }
        if (data.valid === false && data.reason === 'already_unsubscribed') { setStatus('already_unsubscribed'); return; }
        setStatus('valid');
      } catch { setStatus('error'); }
    })();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', { body: { token } });
      if (error) throw error;
      if (data?.success) setStatus('success');
      else if (data?.reason === 'already_unsubscribed') setStatus('already_unsubscribed');
      else setStatus('error');
    } catch { setStatus('error'); }
    finally { setProcessing(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">BiztoriBD</span>
          </Link>
          <CardTitle>Email Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Validating your request...</p>
            </div>
          )}
          {status === 'valid' && (
            <>
              <MailX className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Click the button below to unsubscribe from app emails. You will still receive important account-related emails.</p>
              <Button onClick={handleUnsubscribe} disabled={processing} variant="destructive" className="w-full">
                {processing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</> : 'Confirm Unsubscribe'}
              </Button>
            </>
          )}
          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
              <p className="font-semibold text-lg">You've been unsubscribed</p>
              <p className="text-muted-foreground text-sm">You will no longer receive app emails from BiztoriBD.</p>
            </>
          )}
          {status === 'already_unsubscribed' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="font-semibold">Already unsubscribed</p>
              <p className="text-muted-foreground text-sm">You've already unsubscribed from these emails.</p>
            </>
          )}
          {status === 'invalid' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="font-semibold">Invalid or expired link</p>
              <p className="text-muted-foreground text-sm">This unsubscribe link is no longer valid.</p>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" />
              <p className="font-semibold">Something went wrong</p>
              <p className="text-muted-foreground text-sm">Please try again later or contact support.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
