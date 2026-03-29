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
  CLIENTS: 'mm-clients',
  SHOP_AUTH_LOGGED: 'mm-shop-auth-logged',
  SHOP_AUTH_USER: 'mm-shop-auth-user',
  SHOP_AUTH_TOKEN: 'mm-shop-auth-token'
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
      const orders: Order[] = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]')
      // Limpeza preventiva: remove imagens de pedidos antigos se existirem
      let hasImage = false
      const cleaned = orders.map(o => {
        if (o.items) {
          o.items = o.items.map(item => {
            if (item.image) {
              hasImage = true
              const { image, ...rest } = item
              return rest
            }
            return item
          })
        }
        return o
      })
      if (hasImage) storageService.setOrders(cleaned)
      return cleaned
    } catch { return [] }
  },
  setOrders: (orders: Order[]) => {
    try {
      localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders))
    } catch (e) {
      console.error('Erro ao salvar pedidos:', e)
      // Se estourar a cota, tentamos salvar apenas os últimos 50 pedidos
      if (orders.length > 50) {
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders.slice(0, 50)))
      }
    }
  },

  clearOrders: () => {
    localStorage.removeItem(KEYS.ORDERS)
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

  // Admin Auth
  getAuthUser: (): Partial<User> | null => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.AUTH_USER) || 'null')
    } catch { return null }
  },
  getToken: () => localStorage.getItem(KEYS.AUTH_TOKEN),
  setAuth: (logged: boolean, user: Partial<User> | null, token: string | null) => {
    localStorage.setItem(KEYS.AUTH_LOGGED, String(logged))
    localStorage.setItem(KEYS.AUTH_USER, JSON.stringify(user))
    if (token) localStorage.setItem(KEYS.AUTH_TOKEN, token)
    else localStorage.removeItem(KEYS.AUTH_TOKEN)
  },
  isAuthenticated: (): boolean => {
    return localStorage.getItem(KEYS.AUTH_LOGGED) === 'true'
  },
  logout: () => {
    localStorage.removeItem(KEYS.AUTH_LOGGED)
    localStorage.removeItem(KEYS.AUTH_USER)
    localStorage.removeItem(KEYS.AUTH_TOKEN)
  },

  // Shop Auth (External Clients)
  getShopAuthUser: (): any | null => {
    try {
      return JSON.parse(localStorage.getItem(KEYS.SHOP_AUTH_USER) || 'null')
    } catch { return null }
  },
  getShopToken: () => localStorage.getItem(KEYS.SHOP_AUTH_TOKEN),
  setShopAuth: (logged: boolean, user: any | null, token: string | null) => {
    localStorage.setItem(KEYS.SHOP_AUTH_LOGGED, String(logged))
    localStorage.setItem(KEYS.SHOP_AUTH_USER, JSON.stringify(user))
    if (token) localStorage.setItem(KEYS.SHOP_AUTH_TOKEN, token)
    else localStorage.removeItem(KEYS.SHOP_AUTH_TOKEN)
  },
  isShopAuthenticated: (): boolean => {
    return localStorage.getItem(KEYS.SHOP_AUTH_LOGGED) === 'true'
  },
  shopLogout: () => {
    localStorage.removeItem(KEYS.SHOP_AUTH_LOGGED)
    localStorage.removeItem(KEYS.SHOP_AUTH_USER)
    localStorage.removeItem(KEYS.SHOP_AUTH_TOKEN)
  }
}
