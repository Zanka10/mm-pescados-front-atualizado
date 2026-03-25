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
          <div className="table-head" style={{ gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr' }}>
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
              <div className="table-row" key={u.email + idx} style={{ gridTemplateColumns: '1.5fr 2fr 1.2fr 1.2fr 1.2fr 1fr 1.2fr' }}>
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
        <div className="modal">
          <div className="modal-card">
            <div className="modal-title">{editingIndex == null ? 'Cadastrar colaborador' : 'Atualizar colaborador'}</div>
            <form className="modal-form" onSubmit={submitForm}>
              <label className="modal-field">
                <span>Nome</span>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm7 8v-1c0-2.76-3.58-5-8-5s-8 2.24-8 5v1z" /></svg>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
              </label>
              <label className="modal-field">
                <span>Email</span>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24"><path d="M12 13 3.5 7h17L12 13zm0 2L3 8v9h18V8l-9 7z" /></svg>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
              </label>
              <label className="modal-field">
                <span>Senha</span>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24"><path d="M12 17a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm6-6h-1V9a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zm-7-2a3 3 0 0 1 6 0v2H11z" /></svg>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
              </label>
              <label className="modal-field">
                <span>CPF</span>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24"><path d="M7 3h10v2H7zM5 7h14v14H5z" /></svg>
                  <input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                </div>
              </label>
              <label className="modal-field">
                <span>Telefone</span>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V21a1 1 0 0 1-1 1C10.29 22 2 13.71 2 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.21 2.2z" /></svg>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </label>
              <label className="modal-field">
                <span>Função</span>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm7 8v-1c0-2.76-3.58-5-8-5s-8 2.24-8 5v1z" /></svg>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
                    <option>Colaborador</option>
                    <option>Administrador</option>
                  </select>
                </div>
              </label>
              <label className="modal-field">
                <span>Status</span>
                <div className="input-with-icon">
                  <svg className="input-icon" viewBox="0 0 24 24"><path d="M12 17a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm0-14A10 10 0 1 0 22 13 10 10 0 0 0 12 3z" /></svg>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}>
                    <option>Ativo</option>
                    <option>Inativo</option>
                  </select>
                </div>
              </label>
              <div className="modal-actions">
                <button type="button" className="button" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="button button-success">
                  {editingIndex == null ? 'Salvar' : 'Alterar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
