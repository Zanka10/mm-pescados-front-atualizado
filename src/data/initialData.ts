import type { Product } from '../types'

export const initialProducts: Product[] = [
  { name: 'Filé de salmão', price: 79.9, promoPrice: 69.9, category: 'Peixe', stockKg: 25, minStockKg: 15 },
  { name: 'Filé de tilápia', price: 24.9, promoPrice: 0, category: 'Peixe', stockKg: 120, minStockKg: 20 },
  { name: 'Camarão 1kg', price: 89.9, promoPrice: 0, category: 'Frutos do mar', stockKg: 35, minStockKg: 10 },
  { name: 'Lula Congelada', price: 34.5, promoPrice: 0, category: 'Frutos do mar', stockKg: 0, minStockKg: 5 },
  { name: 'Bacalhau', price: 62.0, promoPrice: 0, category: 'Peixe', stockKg: 50, minStockKg: 15 },
  { name: 'Sardinha', price: 12.9, promoPrice: 0, category: 'Peixe', stockKg: 200, minStockKg: 30 },
  { name: 'Polvo', price: 45.0, promoPrice: 0, category: 'Frutos do mar', stockKg: 8, minStockKg: 20 },
  { name: 'Filé de Merluza', price: 32.9, promoPrice: 0, category: 'Peixe', stockKg: 0, minStockKg: 10 },
]
