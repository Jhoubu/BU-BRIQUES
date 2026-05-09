import { useState, useRef } from 'react'
import {
  Plus, Search, X, Trash2, Edit3, ShoppingCart, Camera, Package, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  useProdutos, createProduto, updateProduto, deleteProduto,
  addGasto, deleteGasto, marcarVendido, uploadFoto,
} from '@/hooks/useData'
import { formatCurrency, formatPercent, formatDate } from '@/lib/formatters'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CardSkeleton } from '@/components/layout/Skeleton'
import { toast } from 'sonner'

// ── Modal: Novo / Editar Produto ──────────────────────────────
function ProdutoModal({ open, onClose, produto, onSuccess }) {
  const isEditing = !!produto
  const [form, setForm] = useState({
    titulo: produto?.titulo ?? '',
    descricao: produto?.descricao ?? '',
    custo_base: produto?.custo_base ?? '',
  })
  const [foto, setFoto] = useState(null)
  const [preview, setPreview] = useState(produto?.foto_url ?? null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef()

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setFoto(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.titulo.trim()) { toast.error('Título obrigatório'); return }
    const custo = parseFloat(String(form.custo_base).replace(',', '.'))
    if (isNaN(custo)) { toast.error('Custo base inválido'); return }

    setSaving(true)
    try {
      if (isEditing) {
        let foto_url = produto.foto_url
        if (foto) foto_url = await uploadFoto(foto, produto.id)
        await updateProduto(produto.id, { titulo: form.titulo, descricao: form.descricao, custo_base: custo, foto_url })
        toast.success('Produto atualizado!')
      } else {
        const novo = await createProduto({ titulo: form.titulo, descricao: form.descricao, custo_base: custo })
        if (foto) {
          const foto_url = await uploadFoto(foto, novo.id)
          await updateProduto(novo.id, { foto_url })
        }
        toast.success('Produto criado!')
      }
      onSuccess()
      onClose()
    } catch (e) {
      toast.error(isEditing ? 'Erro ao atualizar' : 'Erro ao criar produto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Foto */}
          <div>
            <Label>Foto</Label>
            <div
              className="mt-2 h-36 rounded-xl border-2 border-dashed border-border bg-secondary flex items-center justify-center cursor-pointer overflow-hidden active:opacity-80 transition-opacity"
              onClick={() => fileRef.current?.click()}
            >
              {preview
                ? <img src={preview} alt="" className="h-full w-full object-cover" />
                : <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="h-6 w-6" />
                    <span className="text-sm">Toque para adicionar foto</span>
                  </div>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>

          <div>
            <Label htmlFor="titulo">Título *</Label>
            <Input id="titulo" className="mt-1.5" value={form.titulo} onChange={set('titulo')} placeholder="Ex: Câmera Sony" />
          </div>

          <div>
            <Label htmlFor="desc">Descrição</Label>
            <Textarea id="desc" className="mt-1.5" value={form.descricao} onChange={set('descricao')} placeholder="Detalhes do produto..." />
          </div>

          <div>
            <Label htmlFor="custo">Custo Base (R$) *</Label>
            <Input id="custo" className="mt-1.5" type="number" step="0.01" min="0" inputMode="decimal"
              value={form.custo_base} onChange={set('custo_base')} placeholder="0,00" />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar produto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Modal: Marcar como Vendido ────────────────────────────────
function VenderModal({ open, onClose, produto, onSuccess }) {
  const custoTotal = (produto?.custo_base ?? 0) + (produto?.gastos_produto ?? []).reduce((s, g) => s + g.valor, 0)
  const hoje = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    valor_venda: '',
    data_venda: hoje,
    forma_pagamento: 'a_vista',
    observacoes: '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const valorVenda = parseFloat(String(form.valor_venda).replace(',', '.')) || 0
  const lucro = valorVenda - custoTotal
  const margem = valorVenda > 0 ? (lucro / valorVenda) * 100 : 0

  const handleSubmit = async () => {
    if (!form.valor_venda || isNaN(valorVenda)) { toast.error('Informe o valor de venda'); return }
    setSaving(true)
    try {
      await marcarVendido(produto.id, {
        valor_venda: valorVenda,
        data_venda: form.data_venda,
        forma_pagamento: form.forma_pagamento,
        observacoes: form.observacoes || null,
      })
      toast.success('Venda registrada!')
      onSuccess()
      onClose()
    } catch (e) {
      toast.error('Erro ao registrar venda')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Marcar como Vendido</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-secondary text-sm">
            <p className="font-medium truncate">{produto?.titulo}</p>
            <p className="text-muted-foreground text-xs mt-0.5">Custo total: <span className="text-foreground">{formatCurrency(custoTotal)}</span></p>
          </div>

          <div>
            <Label>Valor de Venda (R$) *</Label>
            <Input className="mt-1.5" type="number" step="0.01" min="0" inputMode="decimal"
              value={form.valor_venda} onChange={set('valor_venda')} placeholder="0,00" />
          </div>

          <div>
            <Label>Data da Venda</Label>
            <Input className="mt-1.5" type="date" value={form.data_venda} onChange={set('data_venda')} />
          </div>

          <div>
            <Label>Forma de Pagamento</Label>
            <Select className="mt-1.5" value={form.forma_pagamento} onChange={set('forma_pagamento')}>
              <option value="a_vista">À Vista</option>
              <option value="fiado">Fiado</option>
              <option value="dinheiro_mais_item">Dinheiro + Item</option>
            </Select>
          </div>

          {form.forma_pagamento === 'dinheiro_mais_item' && (
            <div>
              <Label>Descrição do Item Recebido</Label>
              <Textarea className="mt-1.5" value={form.observacoes} onChange={set('observacoes')} placeholder="Ex: Tênis Nike tamanho 42" />
            </div>
          )}

          {form.forma_pagamento !== 'dinheiro_mais_item' && (
            <div>
              <Label>Observações</Label>
              <Textarea className="mt-1.5" value={form.observacoes} onChange={set('observacoes')} placeholder="Opcional..." />
            </div>
          )}

          {/* Resumo */}
          {valorVenda > 0 && (
            <div className="rounded-xl border border-border p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Resumo</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lucro</span>
                <span className={`font-bold ${lucro >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatCurrency(lucro)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margem</span>
                <span className={`font-medium ${margem >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {formatPercent(margem)}
                </span>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Registrando...' : 'Confirmar Venda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Modal: Adicionar Gasto ────────────────────────────────────
function GastoModal({ open, onClose, produtoId, onSuccess }) {
  const [desc, setDesc] = useState('')
  const [valor, setValor] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!desc.trim()) { toast.error('Descrição obrigatória'); return }
    const v = parseFloat(valor.replace(',', '.'))
    if (isNaN(v) || v <= 0) { toast.error('Valor inválido'); return }
    setSaving(true)
    try {
      await addGasto({ produto_id: produtoId, descricao: desc, valor: v })
      toast.success('Gasto adicionado!')
      onSuccess()
      onClose()
      setDesc('')
      setValor('')
    } catch {
      toast.error('Erro ao adicionar gasto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar Gasto</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Descrição *</Label>
            <Input className="mt-1.5" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Frete, Conserto..." />
          </div>
          <div>
            <Label>Valor (R$) *</Label>
            <Input className="mt-1.5" type="number" step="0.01" min="0" inputMode="decimal"
              value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : 'Adicionar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Card de Produto ───────────────────────────────────────────
function ProdutoCard({ produto, onRefetch }) {
  const [expanded, setExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [venderOpen, setVenderOpen] = useState(false)
  const [gastoOpen, setGastoOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const gastos = produto.gastos_produto ?? []
  const custoTotal = (produto.custo_base ?? 0) + gastos.reduce((s, g) => s + g.valor, 0)
  const isVendido = produto.status === 'vendido'

  const handleDelete = async () => {
    if (!confirm(`Excluir "${produto.titulo}"?`)) return
    setDeleting(true)
    try {
      await deleteProduto(produto.id)
      toast.success('Produto excluído')
      onRefetch()
    } catch {
      toast.error('Erro ao excluir')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteGasto = async (id) => {
    try {
      await deleteGasto(id)
      toast.success('Gasto removido')
      onRefetch()
    } catch {
      toast.error('Erro ao remover gasto')
    }
  }

  return (
    <>
      <Card className={isVendido ? 'opacity-70' : ''}>
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex gap-3">
            <div className="h-16 w-16 rounded-xl bg-secondary flex-shrink-0 overflow-hidden">
              {produto.foto_url
                ? <img src={produto.foto_url} alt={produto.titulo} className="h-full w-full object-cover" />
                : <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm leading-tight line-clamp-2">{produto.titulo}</p>
                <Badge variant={isVendido ? 'secondary' : 'success'} className="flex-shrink-0 text-xs">
                  {isVendido ? 'Vendido' : 'Disponível'}
                </Badge>
              </div>
              {produto.descricao && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{produto.descricao}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Custo total</p>
                  <p className="text-sm font-bold tabular-nums">{formatCurrency(custoTotal)}</p>
                </div>
                {gastos.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Gastos extras</p>
                    <p className="text-sm font-medium tabular-nums">{formatCurrency(gastos.reduce((s, g) => s + g.valor, 0))}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit3 className="h-3.5 w-3.5" /> Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExpanded(e => !e)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Gastos {gastos.length > 0 && `(${gastos.length})`}
            </Button>
            {!isVendido && (
              <Button size="sm" onClick={() => setVenderOpen(true)}>
                <ShoppingCart className="h-3.5 w-3.5" /> Vender
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Gastos expanded */}
          {expanded && (
            <div className="space-y-2 pt-1 border-t border-border">
              {gastos.length === 0
                ? <p className="text-xs text-muted-foreground text-center py-2">Nenhum gasto adicional</p>
                : gastos.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{g.descricao}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(g.criado_em)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(g.valor)}</span>
                      <button onClick={() => handleDeleteGasto(g.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              }
              {!isVendido && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setGastoOpen(true)}>
                  <Plus className="h-3.5 w-3.5" /> Adicionar Gasto
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ProdutoModal open={editOpen} onClose={() => setEditOpen(false)} produto={produto} onSuccess={onRefetch} />
      <VenderModal open={venderOpen} onClose={() => setVenderOpen(false)} produto={produto} onSuccess={onRefetch} />
      <GastoModal open={gastoOpen} onClose={() => setGastoOpen(false)} produtoId={produto.id} onSuccess={onRefetch} />
    </>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function Produtos() {
  const { produtos, loading, refetch } = useProdutos()
  const [novoOpen, setNovoOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  const filtered = produtos.filter(p => {
    const matchBusca = p.titulo.toLowerCase().includes(busca.toLowerCase())
    const matchStatus = filtroStatus === 'todos' || p.status === filtroStatus
    return matchBusca && matchStatus
  })

  return (
    <div className="flex flex-col pb-28">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 space-y-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Produtos</h1>
          <Button size="sm" onClick={() => setNovoOpen(true)}>
            <Plus className="h-4 w-4" /> Novo
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar produto..." value={busca} onChange={e => setBusca(e.target.value)} />
          {busca && (
            <button className="absolute right-3 top-3 text-muted-foreground" onClick={() => setBusca('')}>
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['todos', 'disponivel', 'vendido'].map(f => (
            <button
              key={f}
              onClick={() => setFiltroStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtroStatus === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'disponivel' ? 'Disponível' : 'Vendido'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="px-4 pt-3 space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <CardSkeleton key={i} lines={3} />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </p>
            {!busca && (
              <Button className="mt-4" onClick={() => setNovoOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar produto
              </Button>
            )}
          </div>
        ) : (
          filtered.map(p => (
            <ProdutoCard key={p.id} produto={p} onRefetch={refetch} />
          ))
        )}
      </div>

      <ProdutoModal open={novoOpen} onClose={() => setNovoOpen(false)} onSuccess={refetch} />
    </div>
  )
}
