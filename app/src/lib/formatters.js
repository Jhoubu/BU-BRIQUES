export function formatCurrency(value) {
  if (value == null || isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function formatPercent(value) {
  if (value == null || isNaN(value)) return '0%'
  return `${value.toFixed(1)}%`
}

export function getMonthLabel(yyyyMm) {
  if (!yyyyMm) return ''
  const [year, month] = yyyyMm.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(date)
}

export function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function getMonthRange(monthsBack = 6) {
  const months = []
  const now = new Date()
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

export function formatFormasPagamento(forma) {
  const map = {
    a_vista: 'À Vista',
    fiado: 'Fiado',
    dinheiro_mais_item: 'Dinheiro + Item',
  }
  return map[forma] ?? forma
}
