import { useEffect, useMemo, useState } from 'react'

type Role = 'Colaborador' | 'Administrador'
type Status = 'Ativo' | 'Inativo'
type User = {
  name: string
  email: string
  password: string
  cpf: string
  phone: string
  role: Role
  status: Status
}

const initialUsers: User[] = [
  { name: 'Gabriel Rosa', email: 'gabriel@mm.com.br', password: '********', cpf: '000.000.000-00', phone: '(71) 95765-4321', role: 'Colaborador', status: 'Ativo' },
  { name: 'Ana Martins', email: 'ana@mm.com.br', password: '********', cpf: '000.000.000-00', phone: '(71) 98332-3655', role: 'Administrador', status: 'Ativo' },
]

export default function Users() {
  const [items, setItems] = useState<User[]>(() => {
    const stored = localStorage.getItem('mm-users')
    return stored ? (JSON.parse(stored) as User[]) : initialUsers
  })
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [form, setForm] = useState<User>({
    name: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    role: 'Colaborador',
    status: 'Ativo',
  })

  useEffect(() => {
    localStorage.setItem('mm-users', JSON.stringify(items))
  }, [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((u) => {
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        u.status.toLowerCase().includes(q)
      )
    })
  }, [items, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  function openAdd() {
    setEditingIndex(null)
    setForm({ name: '', email: '', password: '', cpf: '', phone: '', role: 'Colaborador', status: 'Ativo' })
    setModalOpen(true)
  }

  function openEdit(index: number) {
    const globalIndex = (page - 1) * pageSize + index
    setEditingIndex(globalIndex)
    setForm(items[globalIndex])
    setModalOpen(true)
  }

  function remove(index: number) {
    const globalIndex = (page - 1) * pageSize + index
    const next = items.slice()
    next.splice(globalIndex, 1)
    setItems(next)
  }

  function submitForm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim()) return
    const next = items.slice()
    if (editingIndex == null) {
      next.unshift(form)
    } else {
      next[editingIndex] = form
    }
    setItems(next)
    setModalOpen(false)
  }

  return (
    <div className="dashboard-home">
      <header className="main-header">
        <div>
          <h1 className="main-title">Usuários</h1>
          <p className="main-subtitle">Gerencie colaboradores e acessos</p>
        </div>
        <button className="button button-success" onClick={openAdd}>
          <span className="button-icon">
            <svg viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </span>
          Novo Colaborador
        </button>
      </header>

      <div className="toolbar">
        <div className="search">
          <svg className="search-icon" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19zM9.5 14A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z" />
          </svg>
          <input
            className="search-input"
            placeholder="Buscar por nome, email, função ou status..."
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
          <div className="table-head" style={{ gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1fr 1fr 1fr' }}>
            <div className="th">Nome</div>
            <div className="th">Email</div>
            <div className="th">CPF</div>
            <div className="th">Telefone</div>
            <div className="th">Função</div>
            <div className="th">Status</div>
            <div className="th" style={{ textAlign: 'right' }}>Ações</div>
          </div>
          {current.length === 0 ? (
            <div className="empty-state">Nenhum usuário encontrado.</div>
          ) : (
            current.map((u, idx) => (
              <div className="table-row" key={u.email + idx} style={{ gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1fr 1fr 1fr' }}>
                <div className="td">
                  <div className="td-title">{u.name}</div>
                </div>
                <div className="td" style={{ fontSize: '13px' }}>{u.email}</div>
                <div className="td" style={{ color: '#8a93a3', fontSize: '13px' }}>{u.cpf}</div>
                <div className="td" style={{ fontSize: '13px' }}>{u.phone}</div>
                <div className="td">
                  <span style={{ fontSize: '13px', fontWeight: 600, color: u.role === 'Administrador' ? '#129e62' : 'inherit' }}>
                    {u.role}
                  </span>
                </div>
                <div className="td">
                  <span className={`status-chip ${u.status === 'Ativo' ? 'chip-done' : 'chip-cancel'}`} style={{ padding: '2px 8px', fontSize: '11px' }}>
                    {u.status}
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
        <div className="modal" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingIndex == null ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(18, 158, 98, 0.1)', color: 'var(--primary)', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="17" y1="11" x2="23" y2="11"/></svg>
                    </div>
                    Novo Colaborador
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: 'rgba(33, 150, 243, 0.1)', color: '#2196f3', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                    Editar Colaborador
                  </div>
                )}
              </h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body">
              <form className="modal-form" id="user-form" onSubmit={submitForm}>
                <label className="modal-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Nome Completo</span>
                  </div>
                  <input 
                    placeholder="Ex: João Silva"
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    required 
                  />
                </label>

                <label className="modal-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>E-mail de Acesso</span>
                  </div>
                  <input 
                    type="email" 
                    placeholder="email@exemplo.com"
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    required 
                  />
                </label>

                <label className="modal-field">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Senha</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="********"
                    value={form.password} 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                    required 
                  />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <label className="modal-field">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CPF</span>
                    </div>
                    <input 
                      placeholder="000.000.000-00"
                      value={form.cpf} 
                      onChange={(e) => setForm({ ...form, cpf: e.target.value })} 
                    />
                  </label>

                  <label className="modal-field">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Telefone</span>
                    </div>
                    <input 
                      placeholder="(00) 00000-0000"
                      value={form.phone} 
                      onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    />
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <label className="modal-field">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Função</span>
                    </div>
                    <div className="select">
                      <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                        <option>Colaborador</option>
                        <option>Administrador</option>
                      </select>
                    </div>
                  </label>

                  <label className="modal-field">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--primary)' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</span>
                    </div>
                    <div className="select">
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                        <option>Ativo</option>
                        <option>Inativo</option>
                      </select>
                    </div>
                  </label>
                </div>
              </form>
            </div>

            <div className="modal-footer" style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="button" onClick={() => setModalOpen(false)} style={{ padding: '12px 24px' }}>
                Cancelar
              </button>
              <button type="submit" form="user-form" className="button button-success" style={{ padding: '12px 32px' }}>
                {editingIndex == null ? 'Cadastrar Colaborador' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
