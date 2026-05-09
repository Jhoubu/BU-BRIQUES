import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/vendas', icon: ShoppingBag, label: 'Vendas' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-40 border-t border-border bg-card">
      <div className="flex items-stretch">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-3 text-xs font-medium transition-colors duration-150 select-none cursor-pointer',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-5 w-5 transition-transform duration-150', isActive && 'scale-110')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      {/* iOS safe area */}
      <div className="h-safe-bottom bg-card" style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  )
}
