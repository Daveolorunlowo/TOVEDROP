import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export function useDropsBalance() {
  const { data: session, status } = useSession();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refetch = useCallback(async () => {
    // Only fetch if authenticated and user session is active
    if (status !== 'authenticated' || !session?.user) {
      setBalance(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/drops/balance');
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Failed to fetch drops balance:', error);
    } finally {
      setLoading(false);
    }
  }, [status, session?.user]);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      refetch();
    } else {
      setBalance(null);
      setLoading(false);
    }
  }, [status, session?.user, refetch]);

  return { balance, loading, refetch };
}
