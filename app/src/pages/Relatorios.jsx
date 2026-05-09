import { Trophy, TrendingUp, Calendar, BarChart2, PieChart, LineChart } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart as RechartLine,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartPie,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useRelatorios } from '@/hooks/useData'
import { formatCurrency, formatPercent, getMonthLabel } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardSkeleton } from '@/components/layout/Skeleton'

const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444']

const PAGAMENTO_LABELS = {
  a_vista: 'À Vista',
  fiado: 'Fiado',
  dinheiro_mais_item: 'Din+Item',
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card p-3 text-xs shadow-xl">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 100
            ? formatCurrency(p.value)
            : `${p.value?.toFixed ? p.value.toFixed(0) : p.value}`
          }
        </p>
      ))}
    </div>
  )
}

function EmptyChart({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
      <Icon className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-xs">{label}</p>
    </div>
  )
}

export default function Relatorios() {
  const { data, loading } = useRelatorios()

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-28 space-y-4">
        {[...Array(5)].map((_, i) => <CardSkeleton key={i} lines={4} />)}
      </div>
    )
  }

  if (!data) return null

  const { meses, pagamentos, margemGeral, melhorProduto, melhorMes } = data

  const hasData = meses.some(m => m.faturamento > 0)

  const pieData = Object.entries(pagamentos).map(([k, v]) => ({
    name: PAGAMENTO_LABELS[k] ?? k,
    value: v,
  }))

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <div className="pt-2 pb-1">
        <h1 className="text-xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Análise dos últimos 6 meses</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Margem Histórica</p>
            <p className="text-2xl font-bold text-primary tabular-nums">{formatPercent(margemGeral)}</p>
            <p className="text-xs text-muted-foreground mt-1">média geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              <Trophy className="h-3 w-3 inline mr-1" />Melhor Produto
            </p>
            {melhorProduto ? (
              <>
                <p className="text-sm font-bold line-clamp-1">{melhorProduto.titulo}</p>
                <p className="text-xs text-primary tabular-nums mt-1">{formatCurrency(melhorProduto.lucro)}</p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {melhorMes && (
          <Card className="col-span-2">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Melhor Mês</p>
                <p className="font-bold">{getMonthLabel(melhorMes[0])}</p>
                <p className="text-xs text-primary tabular-nums">{formatCurrency(melhorMes[1].lucro)} lucro</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lucro por mês */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" /> Lucro por Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-2 pb-4">
          {hasData ? (
            <ResponsiveContainer width="100%" height={180}>
              <RechartLine data={meses.map(m => ({ ...m, label: getMonthLabel(m.mes) }))} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} activeDot={{ r: 5 }} />
              </RechartLine>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={TrendingUp} label="Nenhuma venda registrada ainda" />
          )}
        </CardContent>
      </Card>

      {/* Faturamento vs Investimento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-blue-400" /> Faturamento vs Custo
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-2 pb-4">
          {hasData ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={meses.map(m => ({ ...m, label: getMonthLabel(m.mes) }))} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="faturamento" name="Faturamento" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="custo" name="Custo" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={BarChart2} label="Nenhuma venda registrada ainda" />
          )}
        </CardContent>
      </Card>

      {/* Formas de pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <PieChart className="h-4 w-4 text-violet-400" /> Formas de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-4">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <RechartPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartPie>
            </ResponsiveContainer>
          ) : (
            <EmptyChart icon={PieChart} label="Nenhuma venda registrada ainda" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
