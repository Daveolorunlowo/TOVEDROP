import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
}

export function Skeleton({
  className,
  width,
  height,
  borderRadius = '4px',
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("skeleton-shimmer", className)}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
      {...props}
    />
  )
}
