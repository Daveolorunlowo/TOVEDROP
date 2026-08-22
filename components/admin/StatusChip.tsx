export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    approved:  { label: 'Approved',  color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    pending:   { label: 'Pending',   color: 'var(--orange-brand)', bg: 'rgba(217,119,6,0.08)' },
    suspended: { label: 'Suspended', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  }
  const s = map[status.toLowerCase()] ?? { label: status, color: 'var(--muted-foreground)', bg: 'var(--border)' }
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 inline-block"
      style={{ background: s.bg, color: s.color, borderRadius: '4px' }}
    >
      {s.label}
    </span>
  )
}
