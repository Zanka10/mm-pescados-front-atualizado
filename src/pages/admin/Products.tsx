import { useEffect, useMemo, useState } from 'react'
import { api } from '../../services/api'
import { formatCurrency } from '../../utils/formatters'

interface ApiProduct {
  id: string
  name: string
  description: string | null
  imageUrl: string
  priceCents: number
  promoPriceCents: number | null
  unitLabel: string
  isActive: boolean
  category: {
    id: string
    name: string
  }
  inventory: {
    quantity: number
    minQuantity: number
  }
}

interface ProductForm {
  name: string
  description: string
  imageUrl: string
  priceCents: number
  promoPriceCents: number | null
  unitLabel: string
  categoryId: string
  quantity: number
  minQuantity: number
}

const EMPTY_FORM: ProductForm = {
  name: '',
  description: '',
  imageUrl: '',
  priceCents: 0,
  promoPriceCents: null,
  unitLabel: 'kg',
  categoryId: '',
  quantity: 0,
  minQuantity: 0,
}

export default function Products() {
  const [items, setItems] = useState<ApiProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todas as Categorias')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM)
  const [hasPromo, setHasPromo] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm(prev => ({ ...prev, imageUrl: reader.result as string }))
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products')
        setItems(response.data ?? [])
      } catch (err) {
        console.error('Erro ao carregar produtos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const categories = useMemo(() => {
    const names = items.map(p => p.category.name)
    return Array.from(new Set(names))
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q)
      const matchesCategory = category === 'Todas as Categorias' || p.category.name === category
      return matchesSearch && matchesCategory
    })
  }, [items, search, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filtered.length / pageSize))
    if (page > tp) setPage(tp)
  }, [filtered])

  function statusOf(p: ApiProduct): 'stock' | 'low' | 'none' {
    if (p.inventory.quantity <= 0) return 'none'
    if (p.inventory.quantity < p.inventory.minQuantity) return 'low'
    return 'stock'
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  async function submitProduct() {
    if (!form.name.trim() || !form.categoryId) return

    setIsSubmitting(true)
    const payload = {
      name: form.name.trim(),
      slug: generateSlug(form.name),
      description: form.description || null,
      // imageUrl: form.imageUrl || null, // TODO: implementar upload de imagem no backend
      priceCents: form.priceCents,
      promoPriceCents: hasPromo ? form.promoPriceCents : null,
      unitLabel: form.unitLabel,
      isActive: true,
      categoryId: form.categoryId,
      quantity: form.quantity,
      minQuantity: form.minQuantity,
    }

    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, payload)
      } else {
        await api.post('/products', payload)
      }
      const response = await api.get('/products')
      setItems(response.data ?? [])
      setDrawerOpen(false)
      setForm(EMPTY_FORM)
      setHasPromo(false)
      setEditingId(null)
    } catch (err: any) {
      console.error(editingId ? 'Erro ao editar produto:' : 'Erro ao cadastrar produto:', err)
      alert((editingId ? 'Erro ao editar produto: ' : 'Erro ao cadastrar produto: ') + (err.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  function openEdit(p: ApiProduct) {
    setEditingId(p.id)
    setForm({
      name: p.name,
      description: p.description ?? '',
      imageUrl: p.imageUrl ?? '',
      priceCents: p.priceCents,
      promoPriceCents: p.promoPriceCents,
      unitLabel: p.unitLabel,
      categoryId: p.category.id,
      quantity: p.inventory.quantity,
      minQuantity: p.inventory.minQuantity,
    })
    setHasPromo(p.promoPriceCents !== null)
    setDrawerOpen(true)
  }

  async function remove(id: string) {
    if (!confirm('Deseja realmente excluir este produto?')) return
    try {
      await api.delete(`/products/${id}`)
      setItems(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      console.error('Erro ao excluir produto:', err)
      alert('Erro ao excluir produto: ' + (err.message || 'Erro desconhecido'))
    }
  }

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Produtos</h1>
          <p className="main-subtitle">Gerencie os produtos do painel</p>
        </div>
        <button className="button button-success" onClick={() => { setForm(EMPTY_FORM); setHasPromo(false); setEditingId(null); setDrawerOpen(true) }}>
          <span className="button-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </span>
          Cadastrar Produto
        </button>
      </header>

      <div className="toolbar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar por nome ou categoria..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="select">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }}>
            <option>Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table">
          <div className="table-head" style={{ gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1.2fr 1.2fr 1fr' }}>
            <div className="th">Produto</div>
            <div className="th">Categoria</div>
            <div className="th">Estoque</div>
            <div className="th">Mínimo</div>
            <div className="th">Preço</div>
            <div className="th">Status</div>
            <div className="th" style={{ textAlign: 'right' }}>Ações</div>
          </div>

          {loading ? (
            <div className="empty-state">Carregando produtos...</div>
          ) : current.length === 0 ? (
            <div className="empty-state">Nenhum produto encontrado.</div>
          ) : (
            current.map((p) => (
              <div className="table-row" key={p.id} style={{ gridTemplateColumns: '3fr 1.5fr 1fr 1fr 1.2fr 1.2fr 1fr' }}>
                <div className="td">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="product-avatar">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} />
                      ) : (
                        <span style={{ fontSize: '20px' }}>🐟</span>
                      )}
                    </div>
                    <div>
                      <div className="td-title">{p.name}</div>
                      {p.promoPriceCents !== null && (
                        <span style={{ color: '#129e62', fontSize: '11px', fontWeight: 700 }}>OFERTA ATIVA</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="td">{p.category.name}</div>
                <div className="td">
                  <span style={{ fontWeight: 600, color: p.inventory.quantity <= p.inventory.minQuantity ? '#ff6b6b' : 'inherit' }}>
                    {p.inventory.quantity} {p.unitLabel}
                  </span>
                </div>
                <div className="td" style={{ color: '#8a93a3' }}>{p.inventory.minQuantity} {p.unitLabel}</div>
                <div className="td">
                  <div style={{ fontWeight: 600 }}>{formatCurrency(p.priceCents / 100)}</div>
                  {p.promoPriceCents !== null && (
                    <div style={{ fontSize: '11px', color: '#129e62' }}>
                      Promo: {formatCurrency(p.promoPriceCents / 100)}
                    </div>
                  )}
                </div>
                <div className="td">
                  <span className={`status-badge ${statusOf(p) === 'stock' ? 'status-ok' : statusOf(p) === 'low' ? 'status-low' : 'status-none'}`}>
                    {statusOf(p) === 'stock' ? 'Em Estoque' : statusOf(p) === 'low' ? 'Baixo' : 'Sem Estoque'}
                  </span>
                </div>
                <div className="td col-actions">
                  <button className="button button-edit" title="Editar" onClick={() => openEdit(p)}>
                    <span className="button-icon">
                      <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75l11-11-3.75-3.75-11 11zM17.66 3.41a1.996 1.996 0 1 1 2.82 2.82l-1.41 1.41-2.82-2.82z" /></svg>
                    </span>
                  </button>
                  <button className="button button-delete" onClick={() => remove(p.id)} title="Excluir">
                    <span className="button-icon">
                      <svg viewBox="0 0 24 24"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zm3.46-9h1.5v8h-1.5zm5.58 0h1.5v8h-1.5zM15.5 4l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="table-footer">
          <div className="table-footer-left">
            <div>
              Mostrando <b>{Math.min((page - 1) * pageSize + 1, filtered.length)}</b>–<b>{Math.min(page * pageSize, filtered.length)}</b> de <b>{filtered.length}</b>
            </div>
            <div className="page-size-selector">
              <span>Mostrar:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}>
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pager">
            <div className="pager-buttons">
              <button className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span style={{ padding: '0 12px' }}>Página {page} de {totalPages}</span>
              <button className="pager-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="modal" onClick={() => setDrawerOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Editar Produto' : 'Cadastrar Produto'}</h2>
              <button className="modal-close" onClick={() => setDrawerOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <form className="modal-form" onSubmit={e => e.preventDefault()}>

                {/* Imagem */}
                <div className="modal-field">
                  <span>Imagem</span>
                  <div className="image-upload-container">
                    <div className="image-preview-box">
                      {form.imageUrl ? (
                        <img src={form.imageUrl} alt="Preview" />
                      ) : (
                        <span style={{ fontSize: '32px' }}>🐟</span>
                      )}
                    </div>
                    <div className="upload-controls">
                      <label className="upload-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                        Enviar Imagem
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                      </label>
                      <p className="upload-hint">Envie uma imagem do produto</p>
                    </div>
                  </div>
                </div>

                {/* Nome */}
                <label className="modal-field">
                  <span>Nome *</span>
                  <input
                    placeholder="Digite o nome do produto"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>

                {/* Preço */}
                <div className="modal-field">
                  <span>Preço</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="price-type-selector">
                      <button type="button" className={`price-type-btn ${form.unitLabel === 'un' ? 'active' : ''}`} onClick={() => setForm({ ...form, unitLabel: 'un' })}>Por unidade</button>
                      <button type="button" className={`price-type-btn ${form.unitLabel === 'kg' ? 'active' : ''}`} onClick={() => setForm({ ...form, unitLabel: 'kg' })}>Por kg</button>
                    </div>
                    <div className="price-input-row">
                      <span className="price-prefix">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={form.priceCents ? form.priceCents / 100 : ''}
                        onChange={e => setForm({ ...form, priceCents: Math.round(Number(e.target.value) * 100) })}
                        required
                        style={{ width: '120px' }}
                      />
                      <span className="price-suffix">/{form.unitLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <label className="modal-field">
                  <span>Descrição</span>
                  <textarea
                    placeholder="Digite uma descrição..."
                    rows={3}
                    style={{ resize: 'none' }}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </label>

                {/* Promoção */}
                <div className="promo-section">
                  <div className="promo-header">
                    <span className="promo-title">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>
                      Ativar Promoção
                    </span>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={hasPromo}
                        onChange={e => {
                          setHasPromo(e.target.checked)
                          if (!e.target.checked) setForm({ ...form, promoPriceCents: null })
                        }}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  {hasPromo && (
                    <div className="modal-field" style={{ margin: 0 }}>
                      <span>Preço Promocional (R$)</span>
                      <div className="price-input-row">
                        <span className="price-prefix">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={form.promoPriceCents ? form.promoPriceCents / 100 : ''}
                          onChange={e => setForm({ ...form, promoPriceCents: Math.round(Number(e.target.value) * 100) })}
                          style={{ width: '120px' }}
                        />
                        <span className="price-suffix">/{form.unitLabel}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div className="modal-field">
                  <span>Categoria</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="select">
                      <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                        <option value="">Selecione uma categoria</option>
                        {Array.from(new Map(items.map(p => [p.category.id, p.category])).values()).map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    {!addingCategory ? (
                      <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '13px' }} onClick={() => setAddingCategory(true)}>
                        + Cadastrar Categoria
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input placeholder="Nova categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                        <button type="button" className="button button-success" style={{ padding: '8px 16px' }} onClick={() => { setNewCategory(''); setAddingCategory(false) }}>OK</button>
                        <button type="button" className="button" style={{ padding: '8px 16px' }} onClick={() => setAddingCategory(false)}>X</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estoque */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <label className="modal-field">
                    <span>Estoque ({form.unitLabel})</span>
                    <input type="number" value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} />
                  </label>
                  <label className="modal-field">
                    <span>Mínimo ({form.unitLabel})</span>
                    <input type="number" value={form.minQuantity || ''} onChange={e => setForm({ ...form, minQuantity: Number(e.target.value) })} />
                  </label>
                </div>

              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="button btn-cancel" onClick={() => setDrawerOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="button button-success" onClick={submitProduct} disabled={isSubmitting}>
                {isSubmitting ? (
                  <><span className="shop-spinner" style={{ width: 16, height: 16, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />Processando...</>
                ) : (
                  editingId ? 'Salvar Alterações' : 'Cadastrar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
