import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { parseAsInteger, useQueryStates } from 'nuqs'
import { toast } from 'sonner'
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

interface ApiCategory {
  id: string
  name: string
  isActive: boolean
}

interface ProductFormFields {
  name: string
  categoryId: string
  price: number
  description: string
  quantity: number
  minQuantity: number
}

export default function Products() {
  const [items, setItems] = useState<ApiProduct[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [{ page, limit }, setPagination] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    limit: parseAsInteger.withDefault(10),
  })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [unitLabel, setUnitLabel] = useState('kg')
  const [isActive, setIsActive] = useState(true)
  const [hasPromo, setHasPromo] = useState(false)
  const [promoPriceCents, setPromoPriceCents] = useState<number | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([])
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ProductFormFields>({
    defaultValues: { name: '', categoryId: '', price: 0, description: '', quantity: 0, minQuantity: 0 },
  })

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImageUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRes = await api.get('/categories/all')
        setApiCategories(categoriesRes ?? [])
      } catch (err) {
        console.error('Erro ao carregar categorias:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        })
        if (search.trim()) params.set('search', search.trim())
        if (filterCategoryId) params.set('categoryId', filterCategoryId)

        const res = await api.get(`/products?${params.toString()}`)
        setItems(res.data ?? [])
        setTotal(res.meta?.total ?? 0)
        setTotalPages(res.meta?.totalPages ?? 1)
      } catch (err) {
        console.error('Erro ao carregar produtos:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [page, limit, search, filterCategoryId])

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

  function resetDrawer() {
    reset({ name: '', categoryId: '', price: 0, description: '', quantity: 0, minQuantity: 0 })
    setUnitLabel('kg')
    setIsActive(true)
    setHasPromo(false)
    setPromoPriceCents(null)
    setImageUrl('')
    setImageFile(null)
  }

  const onSubmit = handleSubmit(async (data) => {
    if (!editingId && !imageFile) {
      toast.error('Selecione uma imagem para o produto.')
      return
    }

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('product', JSON.stringify({
      name: data.name.trim(),
      slug: generateSlug(data.name),
      description: data.description || null,
      priceCents: Math.round(data.price * 100),
      promoPriceCents: hasPromo ? promoPriceCents : null,
      unitLabel,
      isActive,
      categoryId: data.categoryId,
      quantity: data.quantity,
      minQuantity: data.minQuantity,
    }))
    if (imageFile) {
      formData.append('image', imageFile)
    }

    try {
      if (editingId) {
        await api.patchFormData(`/products/${editingId}`, formData)
        toast.success('Produto atualizado com sucesso!')
      } else {
        await api.postFormData('/products', formData)
        toast.success('Produto cadastrado com sucesso!')
      }
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (search.trim()) params.set('search', search.trim())
      if (filterCategoryId) params.set('categoryId', filterCategoryId)
      const response = await api.get(`/products?${params.toString()}`)
      setItems(response.data ?? [])
      setTotal(response.meta?.total ?? 0)
      setTotalPages(response.meta?.totalPages ?? 1)
      setDrawerOpen(false)
      setEditingId(null)
      resetDrawer()
    } catch (err: any) {
      console.error(editingId ? 'Erro ao editar produto:' : 'Erro ao cadastrar produto:', err)
      toast.error((editingId ? 'Erro ao editar produto: ' : 'Erro ao cadastrar produto: ') + (err.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  })

  function openEdit(p: ApiProduct) {
    setEditingId(p.id)
    reset({
      name: p.name,
      categoryId: p.category.id,
      price: p.priceCents / 100,
      description: p.description ?? '',
      quantity: p.inventory.quantity,
      minQuantity: p.inventory.minQuantity,
    })
    setUnitLabel(p.unitLabel)
    setIsActive(p.isActive)
    setHasPromo(p.promoPriceCents !== null)
    setPromoPriceCents(p.promoPriceCents)
    setImageUrl(p.imageUrl ?? '')
    setImageFile(null)
    setDrawerOpen(true)
  }

  async function remove(id: string) {
    if (!confirm('Deseja realmente excluir este produto?')) return
    try {
      await api.delete(`/products/${id}`)
      setItems(prev => prev.filter(p => p.id !== id))
      toast.success('Produto excluído.')
    } catch (err: any) {
      console.error('Erro ao excluir produto:', err)
      toast.error('Erro ao excluir produto: ' + (err.message || 'Erro desconhecido'))
    }
  }

  async function addCategory() {
    const name = newCategory.trim()
    if (!name) return
    setIsSubmittingCategory(true)
    try {
      const res = await api.post('/categories', { name, slug: name.toLowerCase() })
      const created: ApiCategory = res.category
      setApiCategories(prev => [...prev, created])
      reset({ ...getValues(), categoryId: created.id })
      setNewCategory('')
      setAddingCategory(false)
      toast.success(`Categoria "${created.name}" criada.`)
    } catch (err: any) {
      console.error('Erro ao criar categoria:', err)
      toast.error('Erro ao criar categoria: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setIsSubmittingCategory(false)
    }
  }

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Produtos</h1>
          <p className="main-subtitle">Gerencie os produtos do painel</p>
        </div>
        <button className="button button-success" onClick={() => { resetDrawer(); setEditingId(null); setDrawerOpen(true) }}>
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
            onChange={(e) => { setSearch(e.target.value); setPagination({ page: 1 }) }}

          />
        </div>
        <div className="select">
          <select value={filterCategoryId} onChange={(e) => { setFilterCategoryId(e.target.value); setPagination({ page: 1 }) }}>
            <option value="">Todas as Categorias</option>
            {apiCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
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
          ) : items.length === 0 ? (
            <div className="empty-state">Nenhum produto encontrado.</div>
          ) : (
            items.map((p) => (
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
                      {!p.isActive && (
                        <span style={{ color: '#ff6b6b', fontSize: '11px', fontWeight: 700, marginLeft: 8 }}>DESABILITADO</span>
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
              Mostrando <b>{Math.min((page - 1) * limit + 1, total)}</b>–<b>{Math.min(page * limit, total)}</b> de <b>{total}</b>
            </div>
            <div className="page-size-selector">
              <span>Mostrar:</span>
              <select value={limit} onChange={(e) => setPagination({ page: 1, limit: Number(e.target.value) })}>
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pager">
            <div className="pager-buttons">
              <button className="pager-btn" onClick={() => setPagination(prev => ({ page: Math.max(1, prev.page - 1) }))} disabled={page <= 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <span style={{ padding: '0 12px' }}>Página {page} de {totalPages}</span>
              <button className="pager-btn" onClick={() => setPagination(prev => ({ page: Math.min(totalPages, prev.page + 1) }))} disabled={page >= totalPages}>
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
              <form className="modal-form" onSubmit={onSubmit}>

                {/* Imagem */}
                <div className="modal-field">
                  <span>Imagem {!editingId && <span style={{ color: '#ff6b6b' }}>*</span>}</span>
                  <div className="image-upload-container">
                    <div className="image-preview-box">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" />
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
                      <p className="upload-hint">{editingId ? 'Deixe em branco para manter a imagem atual' : 'Envie uma imagem do produto'}</p>
                    </div>
                  </div>
                </div>

                {/* Nome */}
                <label className="modal-field">
                  <span>Nome <span style={{ color: '#ff6b6b' }}>*</span></span>
                  <input
                    placeholder="Digite o nome do produto"
                    {...register('name', { required: 'Nome é obrigatório' })}
                    style={errors.name ? { borderColor: '#ff6b6b' } : {}}
                  />
                  {errors.name && <span style={{ color: '#ff6b6b', fontSize: '12px' }}>{errors.name.message}</span>}
                </label>

                {/* Status de Ativação */}
                <div className="promo-section" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)' }}>
                  <div className="promo-header">
                    <span className="promo-title" style={{ color: isActive ? 'var(--primary)' : '#ff6b6b' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      {isActive ? 'Produto Habilitado' : 'Produto Desabilitado'}
                    </span>
                    <label className="switch-status">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={e => setIsActive(e.target.checked)}
                      />
                      <span className="slider-status">
                        <span className="on-text">ON</span>
                        <span className="off-text">OFF</span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Preço */}
                <div className="modal-field">
                  <span>Preço <span style={{ color: '#ff6b6b' }}>*</span></span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="price-type-selector">
                      <button type="button" className={`price-type-btn ${unitLabel === 'un' ? 'active' : ''}`} onClick={() => setUnitLabel('un')}>Por unidade</button>
                      <button type="button" className={`price-type-btn ${unitLabel === 'kg' ? 'active' : ''}`} onClick={() => setUnitLabel('kg')}>Por kg</button>
                    </div>
                    <div className="price-input-row">
                      <span className="price-prefix">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        style={{ width: '120px', ...(errors.price ? { borderColor: '#ff6b6b' } : {}) }}
                        {...register('price', {
                          required: 'Preço é obrigatório',
                          min: { value: 0.01, message: 'Preço deve ser maior que zero' },
                          valueAsNumber: true,
                        })}
                      />
                      <span className="price-suffix">/{unitLabel}</span>
                    </div>
                    {errors.price && <span style={{ color: '#ff6b6b', fontSize: '12px' }}>{errors.price.message}</span>}
                  </div>
                </div>

                {/* Descrição */}
                <label className="modal-field">
                  <span>Descrição</span>
                  <textarea
                    placeholder="Digite uma descrição..."
                    rows={3}
                    style={{ resize: 'none' }}
                    {...register('description')}
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
                          if (!e.target.checked) setPromoPriceCents(null)
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
                          value={promoPriceCents ? promoPriceCents / 100 : ''}
                          onChange={e => setPromoPriceCents(Math.round(Number(e.target.value) * 100))}
                          style={{ width: '120px' }}
                        />
                        <span className="price-suffix">/{unitLabel}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categoria */}
                <div className="modal-field">
                  <span>Categoria <span style={{ color: '#ff6b6b' }}>*</span></span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="select">
                      <select
                        {...register('categoryId', { required: 'Selecione uma categoria' })}
                        style={errors.categoryId ? { borderColor: '#ff6b6b' } : {}}
                      >
                        <option value="">Selecione uma categoria</option>
                        {apiCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.categoryId && <span style={{ color: '#ff6b6b', fontSize: '12px' }}>{errors.categoryId.message}</span>}
                    {!addingCategory ? (
                      <button type="button" style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '13px' }} onClick={() => setAddingCategory(true)}>
                        + Cadastrar Categoria
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          placeholder="Nova categoria"
                          value={newCategory}
                          onChange={e => setNewCategory(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                        />
                        <button type="button" className="button button-success" style={{ padding: '8px 16px' }} onClick={addCategory} disabled={isSubmittingCategory}>
                          {isSubmittingCategory ? '...' : 'OK'}
                        </button>
                        <button type="button" className="button" style={{ padding: '8px 16px' }} onClick={() => { setAddingCategory(false); setNewCategory('') }}>X</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Estoque */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <label className="modal-field">
                    <span>Estoque ({unitLabel})</span>
                    <input type="number" {...register('quantity', { valueAsNumber: true })} />
                  </label>
                  <label className="modal-field">
                    <span>Mínimo ({unitLabel})</span>
                    <input type="number" {...register('minQuantity', { valueAsNumber: true })} />
                  </label>
                </div>

              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="button btn-cancel" onClick={() => setDrawerOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="button button-success" onClick={onSubmit} disabled={isSubmitting}>
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
