import { useState, useEffect } from 'react';

export function useDropsBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = async () => {
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
  };

  useEffect(() => {
    refetch();
  }, []);

  return { balance, loading, refetch };
}
