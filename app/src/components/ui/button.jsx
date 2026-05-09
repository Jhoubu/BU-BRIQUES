import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97]',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.97]',
  outline: 'border border-border bg-transparent hover:bg-secondary active:scale-[0.97]',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.97]',
  ghost: 'hover:bg-secondary active:scale-[0.97]',
  link: 'text-primary underline-offset-4 hover:underline',
}

const sizes = {
  default: 'h-11 px-4 py-2 text-sm',
  sm: 'h-9 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10',
}

const Button = forwardRef(({ className, variant = 'default', size = 'default', disabled, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
})
Button.displayName = 'Button'

export { Button }
