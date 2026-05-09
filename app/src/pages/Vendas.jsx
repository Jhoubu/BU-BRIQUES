import { useState } from 'react'
import { ShoppingBag, Package, Calendar } from 'lucide-react'
import { useVendas } from '@/hooks/useData'
import { formatCurrency, formatPercent, formatDate, formatFormasPagamento, getCurrentMonth } from '@/lib/formatters'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CardSkeleton } from '@/components/layout/Skeleton'

const PAGAMENTO_VARIANT = {
  a_vista: 'success',
  fiado: 'warning',
  dinheiro_mais_item: 'default',
}

function VendaCard({ venda }) {
  const produto = venda.produtos
  const custoBase = produto?.custo_base ?? 0
  const gastos = produto?.gastos_produto ?? []
  const custoTotal = custoBase + gastos.reduce((s, g) => s + g.valor, 0)
  const lucro = venda.valor_venda - custoTotal
  const margem = venda.valor_venda > 0 ? (lucro / venda.valor_venda) * 100 : 0

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="h-14 w-14 rounded-xl bg-secondary flex-shrink-0 overflow-hidden">
            {produto?.foto_url
              ? <img src={produto.foto_url} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-sm leading-tight line-clamp-1">{produto?.titulo ?? 'Produto removido'}</p>
              <Badge variant={PAGAMENTO_VARIANT[venda.forma_pagamento] ?? 'default'} className="flex-shrink-0 text-xs">
                {formatFormasPagamento(venda.forma_pagamento)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formatDate(venda.data_venda)}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-border">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Vendido</p>
            <p className="text-sm font-bold tabular-nums">{formatCurrency(venda.valor_venda)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Custo</p>
            <p className="text-sm font-medium tabular-nums text-muted-foreground">{formatCurrency(custoTotal)}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Lucro</p>
            <p className={`text-sm font-bold tabular-nums ${lucro >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(lucro)}
            </p>
          </div>
        </div>

        {venda.observacoes && (
          <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border line-clamp-2">
            {venda.observacoes}
          </p>
        )}

        <div className="flex items-center justify-end mt-2">
          <span className={`text-xs font-medium ${margem >= 0 ? 'text-primary' : 'text-destructive'}`}>
            Margem: {formatPercent(margem)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Vendas() {
  const [mes, setMes] = useState(getCurrentMonth())
  const { vendas, loading } = useVendas(mes)

  const faturamento = vendas.reduce((s, v) => s + v.valor_venda, 0)
  const custoTotal = vendas.reduce((s, v) => {
    const p = v.produtos
    if (!p) return s
    return s + (p.custo_base ?? 0) + (p.gastos_produto ?? []).reduce((a, g) => a + g.valor, 0)
  }, 0)
  const lucro = faturamento - custoTotal
  const margemMedia = faturamento > 0 ? (lucro / faturamento) * 100 : 0

  return (
    <div className="flex flex-col pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 border-b border-border">
        <h1 className="text-xl font-bold mb-3">Vendas</h1>
        <input
          type="month"
          value={mes}
          onChange={e => setMes(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Period summary */}
      {vendas.length > 0 && (
        <div className="px-4 pt-3 pb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Faturamento', value: formatCurrency(faturamento) },
            { label: 'Lucro', value: formatCurrency(lucro), highlight: true },
            { label: 'Margem média', value: formatPercent(margemMedia) },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="rounded-xl bg-card border border-border p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className={`text-sm font-bold tabular-nums mt-1 ${highlight ? 'text-primary' : ''}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div className="px-4 pt-1 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <CardSkeleton key={i} lines={3} />)
        ) : vendas.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhuma venda neste período</p>
          </div>
        ) : (
          vendas.map(v => <VendaCard key={v.id} venda={v} />)
        )}
      </div>
    </div>
  )
}
