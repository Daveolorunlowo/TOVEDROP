import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground font-bold hover:bg-[#f5841f] shadow-sm',
        secondary:
          'bg-transparent border border-border text-text-secondary hover:border-primary active:border-primary active:text-primary',
        danger:
          'bg-transparent border border-destructive text-destructive hover:bg-destructive/10 active:font-bold',
        link: 'text-primary text-[13px] hover:underline active:text-[#fdb682]',
        ghost: 'hover:bg-muted hover:text-foreground',
      },
      size: {
        default: 'px-6 py-3', // 12-16px vertical, 20-24px horizontal
        sm: 'h-9 px-4',
        lg: 'h-14 px-8 text-base',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

