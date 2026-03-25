import { useEffect, useMemo, useState } from 'react'
import { initialProducts } from '../../data/initialData'
import type { Product } from '../../types'
import { storageService } from '../../services/storage.service'
import { useProducts } from '../../hooks/admin/useProducts'
import { formatCurrency } from '../../utils/formatters'

export default function Products() {
  const { products: items, setProducts: setItems } = useProducts()
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<string[]>(() => {
    const raw = storageService.getCategories()
    if (raw.length > 0) return raw
    
    // Fallback: extrair categorias dos produtos iniciais se não houver no localStorage
    const initialCats = Array.from(new Set(initialProducts.map(p => p.category)))
    return initialCats.length > 0 ? initialCats : ['Peixe', 'Frutos do mar']
  })
  const [category, setCategory] = useState<string>('Todas as Categorias')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [priceType, setPriceType] = useState<'un' | 'kg'>('kg')
  const [form, setForm] = useState<Product>({ 
    name: '', 
    price: 0, 
    category: 'Peixe', 
    stockKg: 0, 
    minStockKg: 0, 
    isPromo: false,
    image: ''
  })
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    storageService.setCategories(categories)
  }, [categories])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      const matchesCategory = category === 'Todas as Categorias' || p.category === category
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

  function openAdd() {
    setEditingIndex(null)
    setPriceType('kg')
    setForm({ 
      name: '', 
      price: 0, 
      promoPrice: undefined, 
      category: categories[0] || 'Peixe', 
      stockKg: 0, 
      minStockKg: 0, 
      isPromo: false,
      image: ''
    })
    setModalOpen(true)
  }

  function openEdit(indexInCurrent: number) {
    const product = current[indexInCurrent]
    if (!product) return

    const globalIndex = items.findIndex((p) => p.name === product.name)
    if (globalIndex === -1) return

    setEditingIndex(globalIndex)
    setForm({ ...items[globalIndex] })
    setModalOpen(true)
  }

  function remove(indexInCurrent: number) {
    if (!confirm('Deseja realmente excluir este produto?')) return

    const productToRemove = current[indexInCurrent]
    if (!productToRemove) return

    setItems((prevItems) => prevItems.filter((item) => item.name !== productToRemove.name))
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm({ ...form, image: reader.result as string })
    }
    reader.readAsDataURL(file)
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const next = items.slice()
    if (editingIndex == null) {
      next.unshift(form)
    } else {
      next[editingIndex] = form
    }
    setItems(next)
    setModalOpen(false)
  }

  function statusOf(p: Product): 'stock' | 'low' | 'none' {
    if (p.stockKg <= 0) return 'none'
    if (p.stockKg < p.minStockKg) return 'low'
    return 'stock'
  }

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Produtos</h1>
          <p className="main-subtitle">Gerencie os produtos do painel</p>
        </div>
        <button className="button button-success" onClick={openAdd}>
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
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        
        <div className="select">
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(1)
            }}
          >
            <option>Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table">
          <div className="table-head" style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1.2fr 1.2fr 1.5fr' }}>
            <div className="th">Produto</div>
            <div className="th">Categoria</div>
            <div className="th">Estoque</div>
            <div className="th">Mínimo</div>
            <div className="th">Preço</div>
            <div className="th">Status</div>
            <div className="th" style={{ textAlign: 'right' }}>Ações</div>
          </div>
          {current.length === 0 ? (
            <div className="empty-state">Nenhum produto encontrado.</div>
          ) : (
            current.map((p, idx) => (
              <div className="table-row" key={p.name} style={{ gridTemplateColumns: '2.5fr 1.5fr 1fr 1fr 1.2fr 1.2fr 1.5fr' }}>
                <div className="td">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      className="product-avatar"
                    >
                      {p.image ? (
                        <img src={p.image} alt={p.name} />
                      ) : (
                        <span style={{ fontSize: '20px' }}>🐟</span>
                      )}
                    </div>
                    <div>
                      <div className="td-title">{p.name}</div>
                      {p.isPromo && <span style={{ color: '#129e62', fontSize: '11px', fontWeight: 700 }}>OFERTA ATIVA</span>}
                    </div>
                  </div>
                </div>
                <div className="td">{p.category}</div>
                <div className="td">
                  <span style={{ fontWeight: 600, color: p.stockKg <= p.minStockKg ? '#ff6b6b' : 'inherit' }}>
                    {p.stockKg} kg
                  </span>
                </div>
                <div className="td" style={{ color: '#8a93a3' }}>{p.minStockKg} kg</div>
                <div className="td">
                  <div style={{ fontWeight: 600 }}>{formatCurrency(p.price)}</div>
                  {p.promoPrice && <div style={{ fontSize: '11px', color: '#129e62', textDecoration: 'line-through' }}>{formatCurrency(p.promoPrice)}</div>}
                </div>
                <div className="td">
                  <span className={`status-badge ${statusOf(p) === 'stock' ? 'status-ok' : statusOf(p) === 'low' ? 'status-low' : 'status-none'}`}>
                    {statusOf(p) === 'stock' ? 'Em Estoque' : statusOf(p) === 'low' ? 'Baixo' : 'Sem Estoque'}
                  </span>
                </div>
                <div className="td col-actions">
                  <button className="button button-edit" onClick={() => openEdit(idx)} title="Editar">
                    <span className="button-icon">
                      <svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75l11-11-3.75-3.75-11 11zM17.66 3.41a1.996 1.996 0 1 1 2.82 2.82l-1.41 1.41-2.82-2.82z" /></svg>
                    </span>
                  </button>
                  <button className="button button-delete" onClick={() => remove(idx)} title="Excluir">
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
              Mostrando <b>{Math.min((page - 1) * pageSize + 1, filtered.length)}</b>-<b>{Math.min(page * pageSize, filtered.length)}</b> de <b>{filtered.length}</b>
            </div>
            <div className="page-size-selector">
              <span>Mostrar:</span>
              <select 
                value={pageSize} 
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
              >
                {[5, 10, 20, 50].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="pager">
            <div className="pager-buttons">
              <button className="pager-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span style={{ padding: '0 12px' }}>Página {page} de {totalPages}</span>
              <button className="pager-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modal">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">{editingIndex == null ? 'Cadastrar Produto' : 'Editar Produto'}</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <form className="modal-form" onSubmit={submitForm}>
                {/* Image Section */}
                <div className="modal-field">
                  <span>Imagem</span>
                  <div className="image-upload-container">
                    <div className="image-preview-box">
                      {form.image ? (
                        <img src={form.image} alt="Preview" />
                      ) : (
                        <span style={{ fontSize: '32px' }}>🐟</span>
                      )}
                    </div>
                    <div className="upload-controls">
                      <label className="upload-btn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                        Enviar Imagem
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                      </label>
                      <p className="upload-hint">Envie uma imagem de um produto</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <label className="modal-field">
                  <span>Nome</span>
                  <input 
                    placeholder="Digite o nome do produto"
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    required 
                  />
                </label>

                {/* Price */}
                <div className="modal-field">
                  <span>Preço</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="price-type-selector">
                      <button 
                        type="button" 
                        className={`price-type-btn ${priceType === 'un' ? 'active' : ''}`}
                        onClick={() => setPriceType('un')}
                      >
                        Por unidade
                      </button>
                      <button 
                        type="button" 
                        className={`price-type-btn ${priceType === 'kg' ? 'active' : ''}`}
                        onClick={() => setPriceType('kg')}
                      >
                        Por kg
                      </button>
                    </div>
                    <div className="price-input-row">
                      <span className="price-prefix">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={form.price || ''}
                        onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                        required
                        style={{ width: '120px' }}
                      />
                      <span className="price-suffix">/{priceType}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <label className="modal-field">
                  <span>Descrição</span>
                  <textarea 
                    placeholder="Digite uma descrição..." 
                    rows={3}
                    style={{ resize: 'none' }}
                  />
                </label>

                {/* Category */}
                <div className="modal-field">
                  <span>Categoria</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className="select">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    
                    {!addingCategory ? (
                      <button 
                        type="button" 
                        className="add-cat-link" 
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '13px' }}
                        onClick={() => setAddingCategory(true)}
                      >
                        + Cadastrar Categoria
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          placeholder="Nova categoria"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <button
                          type="button"
                          className="button button-success"
                          style={{ padding: '8px 16px' }}
                          onClick={() => {
                            const c = newCategory.trim()
                            if (!c) return
                            if (!categories.includes(c)) setCategories([...categories, c])
                            setForm({ ...form, category: c })
                            setNewCategory('')
                            setAddingCategory(false)
                          }}
                        >
                          OK
                        </button>
                        <button type="button" className="button" style={{ padding: '8px 16px' }} onClick={() => setAddingCategory(false)}>
                          X
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <label className="modal-field">
                    <span>Estoque ({priceType})</span>
                    <input
                      type="number"
                      value={form.stockKg}
                      onChange={(e) => setForm({ ...form, stockKg: Number(e.target.value) })}
                    />
                  </label>
                  <label className="modal-field">
                    <span>Mínimo ({priceType})</span>
                    <input
                      type="number"
                      value={form.minStockKg}
                      onChange={(e) => setForm({ ...form, minStockKg: Number(e.target.value) })}
                    />
                  </label>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <button type="button" className="button btn-cancel" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="button button-success" onClick={submitForm}>
                {editingIndex == null ? 'Cadastrar' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
