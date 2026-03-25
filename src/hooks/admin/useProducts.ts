import { useState, useEffect } from 'react'
import type { Product } from '../../types'
import { storageService } from '../../services/storage.service'
import { initialProducts } from '../../data/initialData'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>(() => {
    const stored = storageService.getProducts()
    if (stored.length > 0) return stored
    
    const images = storageService.getProductImages()
    return initialProducts.map(p => ({ ...p, image: images[p.name] ?? p.image }))
  })

  useEffect(() => {
    storageService.setProducts(products)
    
    // Atualizar mapeamento de imagens
    const images: Record<string, string> = {}
    products.forEach(p => { if (p.image) images[p.name] = p.image })
    storageService.setProductImages(images)
  }, [products])

  return { products, setProducts }
}
