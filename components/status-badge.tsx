import { cn } from '@/lib/utils'

type Status = 'approved' | 'pending' | 'suspended' | 'upcoming' | 'completed' | 'cancelled'

interface StatusBadgeProps {
  status: Status
  className?: string
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  approved: {
    label: 'Approved',
    className: 'bg-status-success/10 text-status-success border-status-success/20',
  },
  pending: {
    label: 'Pending',
    className: 'bg-status-warning/10 text-status-warning border-status-warning/20',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-status-danger/10 text-status-danger border-status-danger/20',
  },
  upcoming: {
    label: 'Upcoming',
    className: 'bg-status-info/10 text-status-info border-status-info/20',
  },
  completed: {
    label: 'Completed',
    className: 'bg-status-success/10 text-status-success border-status-success/20',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-status-neutral/10 text-status-neutral border-status-neutral/20',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
