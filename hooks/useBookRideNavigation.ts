'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getRoleRedirectPath } from '@/lib/getRoleRedirectPath';

export function useBookRideNavigation() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleBookRideClick = (eOrDest?: React.MouseEvent | string) => {
    let destination = '';
    if (typeof eOrDest === 'string') {
      destination = eOrDest;
    } else if (eOrDest && typeof (eOrDest as React.MouseEvent).preventDefault === 'function') {
      (eOrDest as React.MouseEvent).preventDefault();
    }
    
    const destQuery = destination ? `&destination=${encodeURIComponent(destination)}` : '';
    const destQueryPlain = destination ? `?destination=${encodeURIComponent(destination)}` : '';
    
    if (!session) {
      router.push(`/auth?tab=login&intent=book${destQuery}`);
    } else if (session.user.role === 'RIDER') {
      router.push(`/book${destQueryPlain}`);
    } else {
      router.push(getRoleRedirectPath(session.user.role as string, (session.user as any).driverStatus as string | null));
    }
  };

  return handleBookRideClick;
}
