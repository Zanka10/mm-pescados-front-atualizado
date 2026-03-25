export type Product = {
  name: string
  price: number
  promoPrice?: number
  isPromo?: boolean
  category: string
  stockKg: number
  image?: string
  minStockKg: number
  description?: string
}

export type OrderStatus = 'Pendente' | 'Em andamento' | 'Concluido' | 'Cancelado'
export type Payment = 'Cartão' | 'Dinheiro' | 'Pix' | 'Pend.' | 'AbacatePay'

export type OrderItem = {
  productName: string
  quantity: number
  price: number
  image?: string
}

export type Order = {
  id: number
  clientName: string
  clientPhone: string
  date: number
  createdAt: number
  total: number
  payment: Payment
  status: OrderStatus
  items?: OrderItem[]
}

export type UserRole = 'Administrador' | 'Colaborador'
export type UserStatus = 'Ativo' | 'Inativo'

export type User = {
  name: string
  email: string
  password?: string
  role: UserRole
  status: UserStatus
}
