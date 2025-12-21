import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  onClose: () => void
  duration?: number
}

export function Toast({ message, type = "info", onClose, duration = 3000 }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-lg border p-4 shadow-lg",
        {
          "bg-success/20 border-success text-success": type === "success",
          "bg-primary/20 border-primary text-primary": type === "error",
          "bg-secondary border-border": type === "info",
        }
      )}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="rounded p-1 hover:bg-black/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = React.useState<{ message: string; type?: "success" | "error" | "info" } | null>(null)

  const showToast = (message: string, type?: "success" | "error" | "info") => {
    setToast({ message, type })
  }

  const ToastComponent = toast ? (
    <Toast
      message={toast.message}
      type={toast.type}
      onClose={() => setToast(null)}
    />
  ) : null

  return { showToast, ToastComponent }
}

