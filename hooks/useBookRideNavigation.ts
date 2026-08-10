'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath';

export function useBookRideNavigation() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleBookRideClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (!session) {
      router.push('/auth?tab=login&intent=book');
    } else if (session.user.role === 'RIDER') {
      router.push('/book');
    } else {
      router.push(getRoleRedirectPath(session.user.role as string, (session.user as any).driverStatus as string | null));
    }
  };

  return handleBookRideClick;
}
