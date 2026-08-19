import { SkeletonStatCard, SkeletonTripCard } from '@/components/shared/SkeletonVariants'
import { Skeleton } from '@/components/shared/Skeleton'

export default function DashboardLoading() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto px-5 py-8">
        
        {/* Header Skeleton */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <Skeleton width={100} height={12} className="mb-2" />
            <Skeleton width={200} height={28} className="mb-2" />
            <Skeleton width={150} height={14} />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton width={80} height={32} borderRadius="6px" />
            <Skeleton width={110} height={32} borderRadius="6px" />
            <Skeleton width={120} height={32} borderRadius="6px" />
          </div>
        </div>

        <SkeletonStatCard />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <Skeleton width={120} height={12} />
            </div>
            <div className="rounded-lg overflow-hidden bg-surface-card border border-border-default">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonTripCard key={i} />
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <Skeleton width={100} height={12} />
            </div>
            <div className="rounded-lg overflow-hidden bg-surface-card border border-border-default">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonTripCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
