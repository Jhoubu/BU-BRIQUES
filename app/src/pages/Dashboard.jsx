import { useState } from 'react'
import { TrendingUp, DollarSign, Package, Layers, Edit3, CheckCircle2, AlertCircle } from 'lucide-react'
import { useDashboard, useMetaMes, upsertMeta } from '@/hooks/useData'
import { formatCurrency, formatPercent, formatDate, formatFormasPagamento, getCurrentMonth } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CardSkeleton } from '@/components/layout/Skeleton'
import { toast } from 'sonner'

function MetricCard({ icon: Icon, label, value, sub, highlight = false, iconColor = 'text-primary' }) {
  return (
    <Card className={highlight ? 'border-primary/40 bg-primary/10' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <div className={`p-1.5 rounded-lg bg-secondary ${iconColor}`}>
            <Icon className="h-3.5 w-3.5" />
          </div>
        </div>
        <p className={`text-xl font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function MetaSection({ mes }) {
  const { meta, refetch } = useMetaMes(mes)
  const { metrics } = useDashboard()
  const [open, setOpen] = useState(false)
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  const lucroAtual = metrics?.lucroTotal ?? 0
  const metaValor = meta?.valor_meta ?? 0
  const progresso = metaValor > 0 ? Math.min((lucroAtual / metaValor) * 100, 100) : 0
  const falta = Math.max(metaValor - lucroAtual, 0)

  const handleSave = async () => {
    const v = parseFloat(valor.replace(',', '.'))
    if (isNaN(v) || v <= 0) {
      toast.error('Informe um valor válido')
      return
    }
    setSaving(true)
    try {
      await upsertMeta(mes, v)
      await refetch()
      toast.success('Meta atualizada!')
      setOpen(false)
      setValor('')
    } catch (e) {
      toast.error('Erro ao salvar meta')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Meta do Mês</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setValor(metaValor ? String(metaValor) : ''); setOpen(true) }}>
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-4 px-4">
          {metaValor > 0 ? (
            <div className="space-y-3">
              <Progress value={progresso} className="h-2.5" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lucro: <span className="text-foreground font-semibold">{formatCurrency(lucroAtual)}</span></span>
                <span>Meta: <span className="text-foreground font-semibold">{formatCurrency(metaValor)}</span></span>
              </div>
              <div className="flex items-center gap-2">
                {progresso >= 100 ? (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Meta batida!
                  </Badge>
                ) : (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Faltam {formatCurrency(falta)} — {formatPercent(progresso)} concluído
                  </Badge>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">Nenhuma meta definida</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setOpen(true)}>
                Definir meta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Meta do Mês</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <label className="text-sm font-medium">Valor da meta (R$)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="Ex: 1500"
              inputMode="decimal"
            />
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

const PAGAMENTO_LABELS = {
  a_vista: 'À Vista',
  fiado: 'Fiado',
  dinheiro_mais_item: 'Dinheiro+Item',
}

function RecentVendas({ vendas }) {
  if (!vendas?.length) return (
    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda ainda</p>
  )
  return (
    <div className="space-y-2">
      {vendas.map(v => (
        <div key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{v.produtos?.titulo ?? 'Produto'}</p>
            <p className="text-xs text-muted-foreground">{formatDate(v.data_venda)} · {PAGAMENTO_LABELS[v.forma_pagamento]}</p>
          </div>
          <span className="text-sm font-bold text-primary tabular-nums ml-3">{formatCurrency(v.valor_venda)}</span>
        </div>
      ))}
    </div>
  )
}

function TopProdutos({ items }) {
  if (!items?.length) return (
    <p className="text-sm text-muted-foreground text-center py-4">Sem dados ainda</p>
  )
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums">{i + 1}</span>
          <div className="h-10 w-10 rounded-lg bg-secondary flex-shrink-0 overflow-hidden">
            {item.produtos?.foto_url
              ? <img src={item.produtos.foto_url} alt="" className="h-full w-full object-cover" />
              : <div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.produtos?.titulo ?? '?'}</p>
            <p className="text-xs text-muted-foreground">{formatPercent(item.margem)} margem</p>
          </div>
          <span className="text-sm font-bold text-primary tabular-nums">{formatCurrency(item.lucroVenda)}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { metrics, loading } = useDashboard()
  const mes = getCurrentMonth()

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-28 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => <CardSkeleton key={i} lines={1} />)}
        </div>
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
    )
  }

  const m = metrics ?? {}

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      {/* Greeting */}
      <div className="pt-2 pb-1">
        <h1 className="text-xl font-bold">Brique 🏪</h1>
        <p className="text-sm text-muted-foreground">Resumo geral</p>
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={TrendingUp}
          label="Lucro Total"
          value={formatCurrency(m.lucroTotal)}
          highlight
          iconColor="text-primary"
        />
        <MetricCard
          icon={DollarSign}
          label="Faturamento"
          value={formatCurrency(m.faturamentoTotal)}
          iconColor="text-blue-400"
        />
        <MetricCard
          icon={Layers}
          label="Investido"
          value={formatCurrency(m.totalInvestido)}
          iconColor="text-amber-400"
        />
        <MetricCard
          icon={Package}
          label="Em Estoque"
          value={formatCurrency(m.valorEstoque)}
          iconColor="text-violet-400"
        />
        <MetricCard
          icon={CheckCircle2}
          label="Vendidos"
          value={m.produtosVendidos ?? 0}
          iconColor="text-emerald-400"
        />
        <MetricCard
          icon={TrendingUp}
          label="Lucro Estimado"
          value={formatCurrency(m.lucroEstimadoEstoque)}
          sub="estimado pelo estoque"
          iconColor="text-cyan-400"
        />
      </div>

      {/* Meta */}
      <MetaSection mes={mes} />

      {/* Top Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Top Produtos Lucrativos</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TopProdutos items={m.topProdutos} />
        </CardContent>
      </Card>

      {/* Vendas recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RecentVendas vendas={m.recentVendas} />
        </CardContent>
      </Card>
    </div>
  )
}
