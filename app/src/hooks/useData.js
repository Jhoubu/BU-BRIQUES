import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

// ── Produtos ──────────────────────────────────────────────────
export function useProdutos() {
  const [produtos, setProdutos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('produtos')
      .select('*, gastos_produto(*)')
      .order('criado_em', { ascending: false })
    if (!error) setProdutos(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { produtos, loading, refetch: fetch }
}

export async function createProduto(payload) {
  const { data, error } = await supabase.from('produtos').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateProduto(id, payload) {
  const { error } = await supabase.from('produtos').update(payload).eq('id', id)
  if (error) throw error
}

export async function deleteProduto(id) {
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw error
}

export async function marcarVendido(produtoId, vendaPayload) {
  const { error: vendaErr } = await supabase.from('vendas').insert({ ...vendaPayload, produto_id: produtoId })
  if (vendaErr) throw vendaErr
  const { error: statusErr } = await supabase.from('produtos').update({ status: 'vendido' }).eq('id', produtoId)
  if (statusErr) throw statusErr
}

// ── Gastos ────────────────────────────────────────────────────
export async function addGasto(payload) {
  const { error } = await supabase.from('gastos_produto').insert(payload)
  if (error) throw error
}

export async function deleteGasto(id) {
  const { error } = await supabase.from('gastos_produto').delete().eq('id', id)
  if (error) throw error
}

// ── Vendas ────────────────────────────────────────────────────
export function useVendas(mes = null) {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('vendas')
      .select('*, produtos(titulo, foto_url, custo_base, gastos_produto(valor))')
      .order('data_venda', { ascending: false })
    if (mes) {
      const start = `${mes}-01`
      const end = `${mes}-31`
      query = query.gte('data_venda', start).lte('data_venda', end)
    }
    const { data, error } = await query
    if (!error) setVendas(data ?? [])
    setLoading(false)
  }, [mes])

  useEffect(() => { fetch() }, [fetch])
  return { vendas, loading, refetch: fetch }
}

// ── Meta do Mês ───────────────────────────────────────────────
export function useMetaMes(mes) {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('meta_mes').select('*').eq('mes', mes).maybeSingle()
    setMeta(data)
    setLoading(false)
  }, [mes])

  useEffect(() => { fetch() }, [fetch])
  return { meta, loading, refetch: fetch }
}

export async function upsertMeta(mes, valor_meta) {
  const { error } = await supabase
    .from('meta_mes')
    .upsert({ mes, valor_meta }, { onConflict: 'mes' })
  if (error) throw error
}

// ── Dashboard metrics ─────────────────────────────────────────
export function useDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)

    const [{ data: produtos }, { data: vendas }] = await Promise.all([
      supabase.from('produtos').select('*, gastos_produto(valor)'),
      supabase.from('vendas').select('*, produtos(custo_base, gastos_produto(valor))'),
    ])

    const p = produtos ?? []
    const v = vendas ?? []

    const custoTotal = (item) =>
      (item.custo_base ?? 0) + (item.gastos_produto ?? []).reduce((s, g) => s + g.valor, 0)

    const totalInvestido = p.reduce((s, item) => s + custoTotal(item), 0)

    const disponiveis = p.filter(x => x.status === 'disponivel')
    const valorEstoque = disponiveis.reduce((s, item) => s + custoTotal(item), 0)

    const faturamento = v.reduce((s, venda) => s + venda.valor_venda, 0)
    const custoVendido = v.reduce((s, venda) => {
      const prod = venda.produtos
      if (!prod) return s
      return s + (prod.custo_base ?? 0) + (prod.gastos_produto ?? []).reduce((a, g) => a + g.valor, 0)
    }, 0)
    const lucro = faturamento - custoVendido

    // Margem média das vendas
    const margens = v.map(venda => {
      const prod = venda.produtos
      if (!prod || venda.valor_venda === 0) return null
      const custo = (prod.custo_base ?? 0) + (prod.gastos_produto ?? []).reduce((a, g) => a + g.valor, 0)
      return ((venda.valor_venda - custo) / venda.valor_venda) * 100
    }).filter(m => m !== null)
    const margemMedia = margens.length ? margens.reduce((a, b) => a + b, 0) / margens.length : 0

    const lucroEstimadoEstoque = disponiveis.reduce((s, item) => {
      const custo = custoTotal(item)
      if (item.preco_estimado_venda != null) return s + (item.preco_estimado_venda - custo)
      return s + custo * (margemMedia / 100)
    }, 0)

    // Top 3 produtos mais lucrativos
    const topProdutos = v.map(venda => {
      const prod = venda.produtos
      if (!prod) return null
      const custo = (prod.custo_base ?? 0) + (prod.gastos_produto ?? []).reduce((a, g) => a + g.valor, 0)
      const lucroVenda = venda.valor_venda - custo
      const margem = venda.valor_venda > 0 ? (lucroVenda / venda.valor_venda) * 100 : 0
      return { ...venda, lucroVenda, margem, custoTotal: custo }
    })
    .filter(Boolean)
    .sort((a, b) => b.lucroVenda - a.lucroVenda)
    .slice(0, 3)

    // Últimas 5 vendas
    const recentVendas = [...v].slice(0, 5)

    setMetrics({
      lucroTotal: lucro,
      faturamentoTotal: faturamento,
      totalInvestido,
      valorEstoque,
      produtosVendidos: v.length,
      lucroEstimadoEstoque,
      margemMedia,
      topProdutos,
      recentVendas,
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { metrics, loading, refetch: fetch }
}

// ── Relatórios ────────────────────────────────────────────────
export function useRelatorios() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const [{ data: produtos }, { data: vendas }] = await Promise.all([
      supabase.from('produtos').select('*, gastos_produto(valor)'),
      supabase.from('vendas').select('*, produtos(custo_base, gastos_produto(valor))').order('data_venda'),
    ])

    const v = vendas ?? []
    const p = produtos ?? []

    const custoTotal = (item) =>
      (item.custo_base ?? 0) + (item.gastos_produto ?? []).reduce((s, g) => s + g.valor, 0)

    // Group by month
    const byMonth = {}
    v.forEach(venda => {
      const mes = venda.data_venda?.slice(0, 7)
      if (!mes) return
      if (!byMonth[mes]) byMonth[mes] = { faturamento: 0, custo: 0, lucro: 0, count: 0 }
      const custo = venda.produtos ? custoTotal(venda.produtos) : 0
      byMonth[mes].faturamento += venda.valor_venda
      byMonth[mes].custo += custo
      byMonth[mes].lucro += venda.valor_venda - custo
      byMonth[mes].count++
    })

    // Last 6 months
    const meses = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      meses.push({ mes: key, ...(byMonth[key] ?? { faturamento: 0, custo: 0, lucro: 0, count: 0 }) })
    }

    // Payment distribution
    const pagamentos = {}
    v.forEach(venda => {
      pagamentos[venda.forma_pagamento] = (pagamentos[venda.forma_pagamento] ?? 0) + 1
    })

    // Overall margin
    const totalFat = v.reduce((s, x) => s + x.valor_venda, 0)
    const totalCusto = v.reduce((s, x) => s + (x.produtos ? custoTotal(x.produtos) : 0), 0)
    const margemGeral = totalFat > 0 ? ((totalFat - totalCusto) / totalFat) * 100 : 0

    // Best product ever
    const prodRanked = v.map(venda => {
      const custo = venda.produtos ? custoTotal(venda.produtos) : 0
      return { titulo: venda.produtos?.titulo ?? '?', lucro: venda.valor_venda - custo }
    }).sort((a, b) => b.lucro - a.lucro)
    const melhorProduto = prodRanked[0] ?? null

    // Best month
    const melhorMes = Object.entries(byMonth).sort((a, b) => b[1].lucro - a[1].lucro)[0] ?? null

    setData({ meses, pagamentos, margemGeral, melhorProduto, melhorMes })
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, refetch: fetch }
}

// ── Storage upload ────────────────────────────────────────────
export async function uploadFoto(file, produtoId) {
  const ext = file.name.split('.').pop()
  const path = `${produtoId}.${ext}`
  const { error } = await supabase.storage.from('produtos').upload(path, file, { upsert: true })
  if (error) {
    if (error.message?.includes('Bucket not found') || error.statusCode === '404') {
      throw new Error('Bucket de fotos não encontrado. Execute o SQL de criação do bucket no Supabase.')
    }
    throw new Error(`Falha no upload: ${error.message}`)
  }
  const { data } = supabase.storage.from('produtos').getPublicUrl(path)
  return data.publicUrl
}
