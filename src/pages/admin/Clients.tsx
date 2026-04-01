import { useMemo, useState } from 'react'
import { storageService } from '../../services/storage.service'

type Client = {
  name: string
  doc: string
  address: string
  phone: string
}

export default function Clients() {
  const [items, setItems] = useState<Client[]>(() => storageService.getClients())
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<Client>({ name: '', doc: '', address: '', phone: '' })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.doc.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    )
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function openAdd() {
    setEditingIndex(null)
    setForm({ name: '', doc: '', address: '', phone: '' })
    setModalOpen(true)
  }

  function openEdit(index: number) {
    const globalIndex = (page - 1) * pageSize + index
    setEditingIndex(globalIndex)
    setForm(items[globalIndex])
    setModalOpen(true)
  }

  function remove(index: number) {
    if (!confirm('Deseja realmente excluir este cliente?')) return
    const globalIndex = (page - 1) * pageSize + index
    const next = items.slice()
    next.splice(globalIndex, 1)
    setItems(next)
    storageService.setClients(next)
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.doc.trim()) return
    const next = items.slice()
    if (editingIndex == null) {
      next.unshift(form)
    } else {
      next[editingIndex] = form
    }
    setItems(next)
    storageService.setClients(next)
    setModalOpen(false)
  }

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Clientes</h1>
          <p className="main-subtitle">Visualize e gerencie seus clientes</p>
        </div>
        <button className="button button-success" onClick={openAdd}>
          <span className="button-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </span>
          Novo Cliente
        </button>
      </header>

      <div className="toolbar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
          </svg>
          <input
            className="search-input"
            placeholder="Pesquisar por nome, documento ou endereço..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      <div className="card">
        <div className="table">
          <div className="table-head" style={{ gridTemplateColumns: '2fr 1.5fr 2.5fr 1.5fr 1fr' }}>
            <div className="th">Empresa / Cliente</div>
            <div className="th">CPF / CNPJ</div>
            <div className="th">Endereço</div>
            <div className="th">Telefone</div>
            <div className="th" style={{ textAlign: 'right' }}>Ações</div>
          </div>
          {current.length === 0 ? (
            <div className="empty-state">Nenhum cliente encontrado.</div>
          ) : (
            current.map((c, idx) => (
              <div className="table-row" key={c.name + idx} style={{ gridTemplateColumns: '2fr 1.5fr 2.5fr 1.5fr 1fr' }}>
                <div className="td">
                  <div className="td-title">{c.name}</div>
                </div>
                <div className="td" style={{ color: '#8a93a3', fontSize: '13px' }}>{c.doc}</div>
                <div className="td">
                  <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                    {c.address.split('\n').map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
                <div className="td" style={{ fontWeight: 600 }}>{c.phone}</div>
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
        <div className="modal" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingIndex == null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(18, 158, 98, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
                    </div>
                    Cadastrar Cliente
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    Editar Cliente
                  </div>
                )}
              </h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <form className="modal-form" id="client-form" onSubmit={submitForm}>
                <label className="modal-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Empresa / Cliente</span>
                  </div>
                  <input
                    placeholder="Nome completo ou Razão Social"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>

                <label className="modal-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CPF / CNPJ</span>
                  </div>
                  <input
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={form.doc}
                    onChange={(e) => setForm({ ...form, doc: e.target.value })}
                    required
                  />
                </label>

                <label className="modal-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endereço Completo</span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Rua, número, bairro, cidade e CEP"
                    style={{ resize: 'none' }}
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </label>

                <label className="modal-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telefone / WhatsApp</span>
                  </div>
                  <input
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>
              </form>
            </div>

            <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="button" onClick={() => setModalOpen(false)} style={{ padding: '12px 24px' }}>
                Cancelar
              </button>
              <button type="submit" form="client-form" className="button button-success" style={{ padding: '12px 32px' }}>
                {editingIndex == null ? 'Cadastrar Cliente' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
