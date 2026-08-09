import { Skeleton } from './Skeleton'

export function SkeletonTripCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border-default last:border-0">
      <Skeleton width={6} height={6} borderRadius="9999px" className="shrink-0" />
      <Skeleton width={28} height={28} borderRadius="9999px" className="shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton width="40%" height={14} />
        <Skeleton width="70%" height={12} />
      </div>
      <div className="shrink-0 text-right hidden sm:block space-y-1.5 mr-2">
        <Skeleton width={60} height={12} />
        <Skeleton width={40} height={12} className="ml-auto" />
      </div>
      <Skeleton width={56} height={18} borderRadius="4px" />
      <Skeleton width={20} height={20} borderRadius="4px" />
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-lg mb-6 p-[16px_20px] bg-surface-card border border-border-default">
      <Skeleton width={100} height={12} className="mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-border-default">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`${i > 0 ? 'pl-6' : ''} ${i < 3 ? 'pr-6' : ''}`}>
            <Skeleton width={70} height={10} className="mb-2" />
            <Skeleton width={40} height={24} />
          </div>
        ))}
      </div>
      <div className="border-t border-border-default mt-[14px] pt-[10px]">
        <Skeleton width={120} height={12} />
      </div>
    </div>
  )
}

export function SkeletonDriverCard() {
  return (
    <div className="bg-surface-elevated border border-border-default rounded-2xl p-5">
      <div className="flex items-start gap-4">
        <Skeleton width={48} height={48} borderRadius="9999px" className="shrink-0" />
        <div className="flex-1">
          <Skeleton width="50%" height={20} className="mb-4" />
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Skeleton width={40} height={10} className="mb-2" />
              <Skeleton width={60} height={16} />
            </div>
            <div>
              <Skeleton width={40} height={10} className="mb-2" />
              <Skeleton width={50} height={16} />
            </div>
            <div>
              <Skeleton width={50} height={10} className="mb-2" />
              <Skeleton width={100} height={16} />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border-subtle">
        <Skeleton width={150} height={12} />
        <Skeleton width={80} height={32} borderRadius="8px" />
      </div>
    </div>
  )
}

export function SkeletonTableRow() {
  return (
    <div className="flex items-center p-4 border-b border-border-default last:border-b-0">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton width={32} height={32} borderRadius="9999px" />
        <div className="space-y-1.5">
          <Skeleton width={120} height={14} />
          <Skeleton width={180} height={12} />
        </div>
      </div>
      <div className="flex-1 hidden md:block">
        <Skeleton width={140} height={14} />
      </div>
      <div className="w-24 text-right">
        <Skeleton width={60} height={14} className="ml-auto" />
      </div>
    </div>
  )
}
