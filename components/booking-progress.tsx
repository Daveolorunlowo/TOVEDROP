import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookingProgressProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { number: 1, label: 'Trip Details' },
  { number: 2, label: 'Choose Driver' },
  { number: 3, label: 'Confirm' },
]

export function BookingProgress({ currentStep }: BookingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 mt-2">
      {steps.map((step, idx) => {
        const isDone = step.number < currentStep
        const isActive = step.number === currentStep
        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-3 h-3 rounded-full transition-all',
                  isDone || isActive ? 'bg-orange-brand' : 'bg-surface-elevated border border-border-default'
                )}
              />
              <span
                className={cn(
                  'mt-2 text-[11px] font-semibold uppercase tracking-[0.05em] whitespace-nowrap',
                  isActive ? 'text-text-primary' : isDone ? 'text-orange-brand' : 'text-text-muted'
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'h-[3px] w-16 sm:w-24 mb-5 mx-2 rounded-full',
                  step.number < currentStep ? 'bg-orange-brand' : 'bg-surface-elevated'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
