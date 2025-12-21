import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const buttonClassName = cn(
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-manipulation",
      {
        "bg-primary text-primary-foreground hover:bg-primary/90":
          variant === "default",
        "border border-border bg-transparent text-foreground hover:bg-secondary/60":
          variant === "outline",
        "text-muted-foreground hover:text-foreground hover:bg-secondary/50":
          variant === "ghost",
        "bg-secondary text-secondary-foreground hover:bg-secondary/80":
          variant === "secondary",
        "h-11 xs:h-10 sm:h-10 min-h-[44px] px-4 xs:px-4 py-2.5 xs:py-2": size === "default",
        "h-10 xs:h-9 sm:h-9 min-h-[44px] rounded-md px-3 xs:px-3": size === "sm",
        "h-12 xs:h-11 sm:h-11 min-h-[44px] rounded-md px-5 xs:px-6 sm:px-8": size === "lg",
      },
      className
    )

    if (asChild && React.isValidElement(props.children)) {
      const child = props.children as React.ReactElement<{ className?: string }>
      return React.cloneElement(
        child,
        {
          ...child.props,
          className: cn(buttonClassName, child.props?.className),
        }
      )
    }

    return (
      <button
        className={buttonClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
