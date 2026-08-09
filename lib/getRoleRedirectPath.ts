export function getRoleRedirectPath(role: string, driverStatus?: string | null) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'DRIVER') {
    if (driverStatus === 'APPROVED') return '/driver';
    if (driverStatus === 'PENDING') return '/driver/pending';
    if (driverStatus === 'SUSPENDED') return '/driver/suspended';
    if (driverStatus === 'REJECTED') return '/driver/rejected';
    return '/driver/pending'; // safe fallback
  }
  return '/dashboard'; // RIDER default
}
