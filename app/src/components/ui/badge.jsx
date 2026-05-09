import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-primary/20 text-primary border-primary/30',
  secondary: 'bg-secondary text-muted-foreground border-border',
  destructive: 'bg-destructive/20 text-destructive border-destructive/30',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
