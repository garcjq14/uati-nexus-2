import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 xs:p-4"
      style={{
        paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(0.75rem, env(safe-area-inset-left))',
        paddingRight: 'max(0.75rem, env(safe-area-inset-right))'
      }}
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-[10000] w-full rounded-lg border border-border bg-background shadow-lg max-h-[85vh] sm:max-h-[90vh] overflow-y-auto",
          {
            "w-[calc(100vw-1.5rem)] max-w-sm xl:max-w-md": size === "sm",
            "w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-md xl:max-w-lg": size === "md",
            "w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-lg xl:max-w-2xl": size === "lg",
            "w-[calc(100vw-1.5rem)] sm:w-[calc(100vw-2rem)] max-w-xl xl:max-w-3xl": size === "xl",
          }
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border p-3 sm:p-4">
            <h2 className="text-sm sm:text-base lg:text-lg font-semibold pr-2 min-w-0 truncate">{title}</h2>
            <button
              onClick={onClose}
              className="rounded p-2 hover:bg-muted transition-colors touch-manipulation flex-shrink-0"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Fechar modal"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}
        <div className="p-3 sm:p-4 lg:p-6">{children}</div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

