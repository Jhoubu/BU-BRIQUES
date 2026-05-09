import { cn } from '@/lib/utils'

export function PageHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-center justify-between px-4 pt-6 pb-4', className)}>
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
