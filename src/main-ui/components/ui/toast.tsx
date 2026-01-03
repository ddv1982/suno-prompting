import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, XCircle, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { APP_CONSTANTS } from "@shared/constants"

// Toast variant styles using CVA
const toastVariants = cva(
  "flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] rounded-lg shadow-soft text-[length:var(--text-body)] font-medium animate-in fade-in-0 slide-in-from-bottom-2 duration-200",
  {
    variants: {
      variant: {
        success: "bg-green-500/90 text-white",
        error: "bg-destructive/90 text-white",
        info: "bg-blue-500/90 text-white",
      },
    },
    defaultVariants: {
      variant: "success",
    },
  }
)

// Toast icon mapping
const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const

interface Toast {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface ToastProps extends React.ComponentProps<"div">, VariantProps<typeof toastVariants> {
  message: string
}

function ToastItem({ message, variant, className, ...props }: ToastProps) {
  const Icon = toastIcons[variant ?? "success"]

  return (
    <div
      data-slot="toast"
      role="alert"
      aria-live="polite"
      className={cn(toastVariants({ variant }), className)}
      {...props}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

// Toast Context
interface ToastContextType {
  showToast: (message: string, type?: Toast["type"]) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

// useToast hook
export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Auto-dismiss duration from app constants
const TOAST_DISMISS_DURATION = APP_CONSTANTS.UI.TOAST_DURATION_MS

// ToastProvider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback((message: string, type: Toast["type"] = "success") => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, TOAST_DISMISS_DURATION)
  }, [])

  const contextValue = React.useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {/* Toast container - fixed bottom-right, stacks vertically */}
      <div
        data-slot="toast-container"
        className="fixed bottom-[var(--space-4)] right-[var(--space-4)] z-50 flex flex-col gap-[var(--space-2)] pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem message={toast.message} variant={toast.type} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export { ToastItem, toastVariants }
