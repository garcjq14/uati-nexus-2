import * as React from "react"
import { cn } from "../../lib/utils"

interface DropdownProps {
  children: React.ReactNode
  trigger: React.ReactNode
  className?: string
}

export function Dropdown({ children, trigger, className }: DropdownProps) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState<'bottom' | 'top'>('bottom')

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'top' : 'bottom')
    }
  }, [open])

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <div className={cn("relative", className)}>
      <div ref={triggerRef} onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div 
            ref={dropdownRef}
            className={cn(
              "absolute z-20 mt-2 rounded-md border border-border bg-secondary shadow-lg overflow-hidden",
              "w-[calc(100vw-3rem)] xs:w-[calc(100vw-2rem)] max-w-[280px] sm:min-w-[200px] sm:w-auto",
              position === 'top' && 'bottom-full mb-2 mt-0'
            )}
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              right: 'auto'
            }}
          >
            <div className="max-h-[60vh] sm:max-h-[400px] overflow-y-auto">
              {children}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <div
      className={cn(
        "cursor-pointer px-3 sm:px-4 py-2.5 sm:py-2 text-xs sm:text-sm hover:bg-muted touch-manipulation",
        className
      )}
      style={{ minHeight: '44px' }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

