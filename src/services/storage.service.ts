import type { Product, Order, User } from '../types'

const KEYS = {
  PRODUCTS: 'mm-products',
  PRODUCT_IMAGES: 'mm-product-images',
  PRODUCT_CATEGORIES: 'mm-product-categories',
  ORDERS: 'mm-orders',
  USERS: 'mm-users',
  AUTH_LOGGED: 'mm-auth-logged',
  AUTH_USER: 'mm-auth-user',
  AUTH_TOKEN: 'mm-auth-token',
  CLIENTS: 'mm-clients'
}

export const storageService = {
  // Products
  getProducts: (): Product[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]')
    } catch { return [] }
  },
  setProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products))
  },

  // Images
  getProductImages: (): Record<string, string> => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.PRODUCT_IMAGES) || '{}')
    } catch { return {} }
  },
  setProductImages: (images: Record<string, string>) => {
    localStorage.setItem(KEYS.PRODUCT_IMAGES, JSON.stringify(images))
  },

  // Categories
  getCategories: (): string[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.PRODUCT_CATEGORIES) || '[]')
    } catch { return [] }
  },
  setCategories: (categories: string[]) => {
    localStorage.setItem(KEYS.PRODUCT_CATEGORIES, JSON.stringify(categories))
  },

  // Orders
  getOrders: (): Order[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]')
    } catch { return [] }
  },
  setOrders: (orders: Order[]) => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders))
  },

  // Clients
  getClients: (): any[] => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.CLIENTS) || '[]')
    } catch { return [] }
  },
  setClients: (clients: any[]) => {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients))
  },
  addClientFromOrder: (order: { name: string, doc: string, address: string, phone: string }) => {
    const clients = storageService.getClients()
    const exists = clients.find(c => c.doc === order.doc)
    if (!exists) {
      storageService.setClients([order, ...clients])
    }
  },

  // Auth
  getAuthUser: (): Partial<User> | null => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.AUTH_USER) || 'null')
    } catch { return null }
  },
  getToken: () => localStorage.getItem(KEYS.AUTH_TOKEN),
  setAuth: (logged: boolean, user: Partial<User> | null, token?: string) => {
    localStorage.setItem(KEYS.AUTH_LOGGED, String(logged))
    localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user))
    if (token) {
      localStorage.setItem(KEYS.AUTH_TOKEN, token)
    } else {
      localStorage.removeItem(KEYS.AUTH_TOKEN)
    }
  },
  logout: () => {
    localStorage.removeItem(KEYS.AUTH_LOGGED)
    localStorage.removeItem(KEYS.AUTH_USER)
    localStorage.removeItem(KEYS.AUTH_TOKEN)
  },
  isAuthenticated: () => localStorage.getItem(KEYS.AUTH_LOGGED) === 'true'
}
