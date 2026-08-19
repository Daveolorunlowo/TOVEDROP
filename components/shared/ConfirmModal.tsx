import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: React.ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  isDestructive?: boolean
  isLoading?: boolean
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  description, 
  confirmText = "Confirm", 
  cancelText = "Cancel", 
  onConfirm, 
  onCancel,
  isDestructive = false,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-orange-brand/10 text-orange-brand'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="pt-1">
              <h3 className="text-lg font-bold text-foreground leading-tight mb-2">{title}</h3>
              <div className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button 
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-surface-elevated text-muted-foreground hover:text-foreground border border-border transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-50 ${isDestructive ? 'bg-red-600' : 'bg-orange-brand'}`}
              style={!isDestructive ? { backgroundColor: 'var(--orange-brand)' } : undefined}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
