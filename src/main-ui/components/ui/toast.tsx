import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { APP_CONSTANTS } from '@shared/constants';

import type { ReactElement } from 'react';

// Toast variant styles using CVA
const toastVariants = cva(
  'flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] rounded-lg shadow-soft text-[length:var(--text-body)] font-medium animate-in fade-in-0 slide-in-from-bottom-2 duration-200',
  {
    variants: {
      variant: {
        success: 'bg-green-500/90 text-white',
        error: 'bg-destructive/90 text-white',
        info: 'bg-blue-500/90 text-white',
        warning: 'bg-orange-500/90 text-white',
      },
    },
    defaultVariants: {
      variant: 'success',
    },
  }
);

// Toast icon mapping
const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastWithMeta {
  id: string;
  message: string;
  type: Toast['type'];
  count: number;
  lastUpdated: number;
  originalMessage: string;
}

interface ToastProps extends React.ComponentProps<'div'>, VariantProps<typeof toastVariants> {
  message: string;
}

function ToastItem({ message, variant, className, ...props }: ToastProps): ReactElement {
  const Icon = toastIcons[variant ?? 'success'];

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
  );
}

// Toast Context
interface ToastContextType {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

// useToast hook
export function useToast(): ToastContextType {
  const context: ToastContextType | null = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Auto-dismiss duration from app constants
const TOAST_DISMISS_DURATION = APP_CONSTANTS.UI.TOAST_DURATION_MS;
const DEDUPLICATION_WINDOW_MS = APP_CONSTANTS.UI.TOAST_DEDUPLICATION_WINDOW_MS;
const MAX_TOASTS = 4;
const MAX_MESSAGE_LENGTH = 150;

/**
 * Truncates long messages to maintain visual consistency
 */
function truncateMessage(message: string): string {
  if (message.length <= MAX_MESSAGE_LENGTH) return message;
  return message.slice(0, MAX_MESSAGE_LENGTH - 3) + '...';
}

// ToastProvider component
export function ToastProvider({ children }: { children: React.ReactNode }): ReactElement {
  const [toasts, setToasts] = React.useState<ToastWithMeta[]>([]);

  const showToast = React.useCallback((message: string, type: Toast['type'] = 'success'): void => {
    const truncatedMessage = truncateMessage(message);
    const now = Date.now();

    setToasts((prev) => {
      // Check for duplicate within deduplication window
      const duplicateIndex = prev.findIndex(
        (t) =>
          t.originalMessage === truncatedMessage &&
          t.type === type &&
          now - t.lastUpdated < DEDUPLICATION_WINDOW_MS
      );

      if (duplicateIndex >= 0) {
        // Update existing toast with incremented count
        const updated = [...prev];
        const duplicate = updated[duplicateIndex];
        if (duplicate) {
          duplicate.count += 1;
          duplicate.lastUpdated = now;
          duplicate.message = `${duplicate.originalMessage} (${duplicate.count}x)`;
        }
        return updated;
      }

      // Create new toast
      const id = crypto.randomUUID();
      const newToast: ToastWithMeta = {
        id,
        message: truncatedMessage,
        type,
        count: 1,
        lastUpdated: now,
        originalMessage: truncatedMessage,
      };

      // Apply max toast limit (FIFO)
      const newToasts =
        prev.length >= MAX_TOASTS
          ? [...prev.slice(1), newToast] // Remove oldest, add new
          : [...prev, newToast]; // Just add new

      // Auto-dismiss after duration
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, TOAST_DISMISS_DURATION);

      return newToasts;
    });
  }, []);

  const contextValue = React.useMemo(() => ({ showToast }), [showToast]);

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
  );
}

export { ToastItem, toastVariants };
