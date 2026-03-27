import { useState, useMemo, useEffect } from 'react'
import '../../assets/styles/Shop.css'
import type { Order, OrderItem, Product } from '../../types'
import { paymentService } from '../../services/payment.service'
import { storageService } from '../../services/storage.service'
import { formatCurrency, formatPhone, formatCep } from '../../utils/formatters'
import { api } from '../../services/api'
type CheckoutStep = 'cart' | 'contact' | 'delivery' | 'payment' | 'review'

interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string;
  inventory: { quantity: number };
}

interface CategoryProps {
  id: string;
  name: string;
  isActive: boolean;
  products: ApiProduct[];
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart')

  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: '',
    taxId: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    deliveryType: 'delivery' as 'delivery' | 'pickup',
    payment: 'Pix' as 'Pix' | 'Cartão' | 'Dinheiro' | 'AbacatePay',
    notes: ''
  })

  const [orderSuccess, setOrderSuccess] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [selectedCategory, setSelectedCategory] = useState('Todas')
  const [loadingCep, setLoadingCep] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [categories, setCategories] = useState<CategoryProps[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productIdMap, setProductIdMap] = useState<Record<string, string>>({});
  const [cartItemIdMap, setCartItemIdMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleCategories = async () => {
      try {
        const response: CategoryProps[] = await api.get('/categories');
        setCategories(response);

        const idMap: Record<string, string> = {};
        const allProducts = response.flatMap(cat =>
          cat.products.map(p => {
            idMap[p.name] = p.id;
            return {
              name: p.name,
              price: p.priceCents / 100,
              category: cat.name,
              stockKg: p.inventory.quantity,
              image: p.imageUrl,
              description: p.description ?? undefined,
              minStockKg: 0,
            };
          })
        );
        setProductIdMap(idMap);
        setProducts(allProducts);
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingProducts(false);
      }
    }
    handleCategories();
  }, [setProducts])

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.get('/cart/me')
        const idMap: Record<string, string> = {}
        const items: OrderItem[] = (response?.items ?? []).map((item: any) => {
          idMap[item.product.name] = item.id
          return {
            productName: item.product.name,
            quantity: item.quantity,
            price: item.product.priceCents / 100,
            image: item.product.imageUrl,
          }
        })
        setCartItemIdMap(idMap)
        setCart(items)
      } catch (err) {
        console.error('Erro ao carregar carrinho:', err)
      }
    }
    fetchCart()
  }, [])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todas') return products
    return products.filter(p => p.category === selectedCategory)
  }, [products, selectedCategory])


  const addToCart = async (product: Product) => {
    const qty = quantities[product.name] || 1
    const productId = productIdMap[product.name]

    try {
      const response = await api.post('/cart/items', { productId, quantity: qty })
      const itemId = response?.cart?.items?.find((i: any) => i.productId === productId)?.id
      if (itemId) {
        setCartItemIdMap(prev => ({ ...prev, [product.name]: itemId }))
      }
    } catch (err) {
      console.error('Erro ao adicionar ao carrinho:', err)
      alert('Não foi possível adicionar o item ao carrinho. Tente novamente.')
      return
    }

    const existing = cart.find(item => item.productName === product.name)
    if (existing) {
      setCart(cart.map(item =>
        item.productName === product.name
          ? { ...item, quantity: item.quantity + qty }
          : item
      ))
    } else {
      setCart([...cart, {
        productName: product.name,
        quantity: qty,
        price: product.promoPrice || product.price,
        image: product.image
      }])
    }
    setQuantities({ ...quantities, [product.name]: 1 })
    setIsDrawerOpen(true)
    setCheckoutStep('cart')
  }

  const updateCartQuantity = async (productName: string, delta: number) => {
    const item = cart.find(i => i.productName === productName)
    if (!item) return

    const newQuantity = Math.max(1, item.quantity + delta)
    const itemId = cartItemIdMap[productName]

    if (itemId) {
      try {
        await api.patch(`/cart/items/${itemId}`, { quantity: newQuantity })
      } catch (err) {
        console.error('Erro ao atualizar quantidade:', err)
        return
      }
    }

    setCart(prev => prev.map(i =>
      i.productName === productName ? { ...i, quantity: newQuantity } : i
    ))
  }

  const removeFromCart = async (productName: string) => {
    const itemId = cartItemIdMap[productName]

    if (itemId) {
      try {
        await api.delete(`/cart/items/${itemId}`)
      } catch (err) {
        console.error('Erro ao remover item do carrinho:', err)
        return
      }
    }

    setCart(prev => prev.filter(item => item.productName !== productName))
    setCartItemIdMap(prev => {
      const updated = { ...prev }
      delete updated[productName]
      return updated
    })
  }

  const cartTotal = useMemo(() =>
    cart.reduce((acc, item) => acc + (item.price * item.quantity), 0),
    [cart])

  const validateContact = () => {
    const newErrors: Record<string, string> = {}
    if (clientInfo.name.length < 2) newErrors.name = 'Nome deve ter pelo menos 2 caracteres'
    if (clientInfo.phone.length < 14) newErrors.phone = 'Telefone inválido'
    if (!clientInfo.email.includes('@')) newErrors.email = 'E-mail inválido'
    if (clientInfo.taxId.length < 14) newErrors.taxId = 'CPF inválido'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCepChange = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    const formattedCep = formatCep(cleanCep)
    setClientInfo({ ...clientInfo, cep: formattedCep })

    if (cleanCep.length === 8) {
      setLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()

        if (!data.erro) {
          setClientInfo(prev => ({
            ...prev,
            cep: formattedCep,
            address: `${data.logradouro}, ${data.bairro}, ${data.localidade}-${data.uf}`
          }))
        }
      } catch (err) {
        console.error('Erro ao buscar CEP:', err)
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handleFinalize = async () => {
    setIsProcessing(true)
    try {
      await api.post('/orders', {})

      setOrderSuccess(true)
      setCart([])
      setCartItemIdMap({})
      setIsDrawerOpen(false)
      setCheckoutStep('cart')
      setTimeout(() => setOrderSuccess(false), 5000)
    } catch (err: any) {
      console.error('Erro detalhado:', err)
      alert('Erro ao processar pedido: ' + (err.message || 'Erro desconhecido'))
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="shop-container">
      <header className="shop-header">
        <div className="header-left">
          <div className="store-info">
            <div className="store-name-row">
              <h1 className="store-name">MM Pescados</h1>
              <span className="status-badge-open">Aberto</span>
            </div>
            <p className="store-location">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              Vargem Grande, Florianópolis - SC
            </p>
          </div>
        </div>
        <div className="header-right">
          <a href="/login" className="admin-btn">Painel admin</a>
          <button className="view-cart-btn" onClick={() => setIsDrawerOpen(true)}>
            <span className="cart-badge">{cart.length}</span>
            <svg viewBox="0 0 24 24" className="cart-icon-small">
              <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.27.12-.41 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
            Ver Carrinho
          </button>
        </div>
      </header>

      <main className="shop-content">
        <div className="shop-filters-container">
          <div className="shop-filters">
            {categories && categories.length > 0 ? (
              <>
                <button
                  className={`filter-btn ${selectedCategory === 'Todas' ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('Todas')}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`filter-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            ) : null}
          </div>
        </div>

        <div className="shop-grid">
          {loadingProducts ? (
            <div className="shop-loading">
              <div className="shop-spinner" />
              <p className="shop-loading-text">Carregando produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <p className="no-products">Nenhum produto disponível no momento.</p>
          ) : (
            filteredProducts.map(p => (
              <div key={p.name} className="shop-card">
                <div className="shop-card-img" onClick={() => setSelectedProduct(p)} style={{ cursor: 'pointer' }}>
                  {p.image ? (
                    <img src={p.image} alt={p.name} />
                  ) : (
                    <div className="no-img-placeholder">🐟</div>
                  )}
                  {p.isPromo && p.promoPrice && p.promoPrice > 0 && (
                    <span className="promo-badge">Promoção!</span>
                  )}
                </div>
                <div className="shop-card-info">
                  <h3 className="product-name">{p.name}</h3>

                  <div className="price-stock-row">
                    <div className="product-price">
                      {p.isPromo && p.promoPrice && p.promoPrice > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-muted)', marginBottom: '-4px' }}>
                            {formatCurrency(p.price)}
                          </span>
                          <span className="current-price">{formatCurrency(p.promoPrice)}</span>
                        </div>
                      ) : (
                        <span className="current-price">{formatCurrency(p.price)}</span>
                      )}
                    </div>
                    <div className="stock-indicator">
                      Est: {p.stockKg.toFixed(0)}
                    </div>
                  </div>

                  <button
                    className="add-to-cart-btn-simple"
                    onClick={() => addToCart(p)}
                  >
                    <svg viewBox="0 0 24 24" className="btn-cart-icon">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.27.12-.41 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                    Adicionar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Botão flutuante do WhatsApp */}
      <div className="floating-contact">
        <a href="https://wa.me/5548984483329" target="_blank" rel="noreferrer" className="fab whatsapp">
          <svg viewBox="0 0 24 24"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.04 20.14c-1.48 0-2.93-.4-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.211 8.211 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.177 8.177 0 0 1 2.41 5.83c.01 4.54-3.69 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.45.06-.68.31-.22.25-.87.85-.87 2.08 0 1.23.89 2.42 1.01 2.58.12.17 1.75 2.67 4.23 3.74.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.07-.1-.23-.16-.48-.28z" /></svg>
        </a>
        <a href="tel:+5548984483329" className="fab phone">
          <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V21a1 1 0 0 1-1 1C10.29 22 2 13.71 2 3a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.24 1.01l-2.21 2.2z" /></svg>
        </a>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="product-modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="product-modal" onClick={e => e.stopPropagation()}>
            <div className="product-modal-header">
              <h2 className="product-modal-title">{selectedProduct.name}</h2>
              <button className="product-modal-close" onClick={() => setSelectedProduct(null)}>&times;</button>
            </div>
            <div className="product-modal-body">
              <div className="product-modal-img">
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} />
                ) : (
                  <div className="modal-no-img">🐟</div>
                )}
              </div>
              <div className="product-modal-info">
                <p className="product-modal-desc">
                  {selectedProduct.description || "Produto fresco e de alta qualidade, selecionado com rigor para garantir o melhor sabor à sua mesa."}
                </p>
                <div className="product-modal-footer">
                  <div className="product-modal-total">
                    <span>Total:</span>
                    <div style={{ textAlign: 'right' }}>
                      {selectedProduct.isPromo && selectedProduct.promoPrice && selectedProduct.promoPrice > 0 ? (
                        <>
                          <div style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                            {formatCurrency(selectedProduct.price)}
                          </div>
                          <span className="modal-price">{formatCurrency(selectedProduct.promoPrice)}</span>
                        </>
                      ) : (
                        <span className="modal-price">{formatCurrency(selectedProduct.price)}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="modal-add-btn"
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                  >
                    <svg viewBox="0 0 24 24" className="modal-btn-icon">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.27.12-.41 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
                    </svg>
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <div className={`cart-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)}>
        <div className="cart-drawer" onClick={e => e.stopPropagation()}>
          <div className="drawer-header">
            <h2 className="drawer-title">
              {checkoutStep === 'cart' && 'Seu carrinho'}
              {checkoutStep === 'contact' && 'Informações de Contato'}
              {checkoutStep === 'delivery' && 'Endereço de Entrega'}
              {checkoutStep === 'payment' && 'Forma de Pagamento'}
              {checkoutStep === 'review' && 'Revisão do Pedido'}
            </h2>
            <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>×</button>
          </div>

          <div className="drawer-body">
            {checkoutStep === 'cart' && (
              <div className="cart-step">
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <span className="empty-icon">🛒</span>
                    <p>Seu carrinho está vazio</p>
                    <button className="back-to-shop" onClick={() => setIsDrawerOpen(false)}>Começar a comprar</button>
                  </div>
                ) : (
                  <>
                    <div className="cart-list">
                      {cart.map(item => (
                        <div key={item.productName} className="cart-item">
                          <div className="item-img">
                            {item.image ? <img src={item.image} alt={item.productName} /> : <span>🐟</span>}
                          </div>
                          <div className="item-info">
                            <span className="item-name">{item.productName}</span>
                            <span className="item-price-unit">{formatCurrency(item.price)} cada</span>
                            <div className="item-controls">
                              <div className="qty-btns">
                                <button onClick={() => updateCartQuantity(item.productName, -1)}>-</button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateCartQuantity(item.productName, 1)}>+</button>
                              </div>
                              <button className="remove-item" onClick={() => removeFromCart(item.productName)}>Remover</button>
                            </div>
                          </div>
                          <span className="item-total">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {checkoutStep === 'contact' && (
              <div className="checkout-step contact-form">
                <p className="step-desc">Seus dados para contato e entrega</p>
                <div className="form-group">
                  <label>Nome completo *</label>
                  <input
                    placeholder="Digite seu nome completo"
                    value={clientInfo.name}
                    onChange={e => setClientInfo({ ...clientInfo, name: e.target.value })}
                  />
                  {errors.name && <span className="field-error">{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Telefone/WhatsApp *</label>
                  <input
                    placeholder="(00) 00000-0000"
                    value={clientInfo.phone}
                    onChange={e => setClientInfo({ ...clientInfo, phone: formatPhone(e.target.value) })}
                    maxLength={15}
                  />
                  <span className="field-hint">Para atualizações sobre seu pedido</span>
                  {errors.phone && <span className="field-error">{errors.phone}</span>}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>CPF *</label>
                    <input
                      placeholder="000.000.000-00"
                      value={clientInfo.taxId}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '')
                        if (v.length <= 11) {
                          if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
                          else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3')
                          else if (v.length > 3) v = v.replace(/(\d{3})(\d{3})/, '$1.$2')
                          setClientInfo({ ...clientInfo, taxId: v })
                        }
                      }}
                      maxLength={14}
                    />
                  </div>
                  <div className="form-group">
                    <label>E-mail *</label>
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={clientInfo.email}
                      onChange={e => setClientInfo({ ...clientInfo, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Observações (opcional)</label>
                  <textarea
                    placeholder="Alguma observação para o pedido?"
                    value={clientInfo.notes}
                    onChange={e => setClientInfo({ ...clientInfo, notes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {checkoutStep === 'delivery' && (
              <div className="checkout-step delivery-form">
                <div className="delivery-types">
                  <button
                    className={`type-btn ${clientInfo.deliveryType === 'delivery' ? 'active' : ''}`}
                    onClick={() => setClientInfo({ ...clientInfo, deliveryType: 'delivery' })}
                  >
                    🚀 Entrega
                  </button>
                  <button
                    className={`type-btn ${clientInfo.deliveryType === 'pickup' ? 'active' : ''}`}
                    onClick={() => setClientInfo({ ...clientInfo, deliveryType: 'pickup' })}
                  >
                    🏪 Retirada
                  </button>
                </div>

                {clientInfo.deliveryType === 'delivery' && (
                  <div className="address-fields">
                    <div className="form-group">
                      <label>CEP *</label>
                      <div className="input-with-loading">
                        <input
                          placeholder="00000-000"
                          value={clientInfo.cep}
                          onChange={e => handleCepChange(e.target.value)}
                          maxLength={9}
                        />
                        {loadingCep && <div className="spinner"></div>}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Endereço completo *</label>
                      <input
                        placeholder="Rua, Avenida, etc"
                        value={clientInfo.address}
                        onChange={e => setClientInfo({ ...clientInfo, address: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Número *</label>
                        <input
                          placeholder="123"
                          value={clientInfo.number}
                          onChange={e => setClientInfo({ ...clientInfo, number: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Complemento</label>
                        <input
                          placeholder="Apto, Bloco, etc"
                          value={clientInfo.complement}
                          onChange={e => setClientInfo({ ...clientInfo, complement: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {clientInfo.deliveryType === 'pickup' && (
                  <div className="pickup-info">
                    <p>Você poderá retirar seu pedido em nossa loja:</p>
                    <address>
                      Rua Exemplo, 123 - Bairro - Cidade/UF
                    </address>
                  </div>
                )}
              </div>
            )}

            {checkoutStep === 'payment' && (
              <div className="checkout-step payment-form">
                <p className="step-desc">Como deseja pagar?</p>
                <div className="payment-options">
                  <button
                    className={`pay-opt ${clientInfo.payment === 'Pix' ? 'active' : ''}`}
                    onClick={() => setClientInfo({ ...clientInfo, payment: 'Pix' })}
                  >
                    💎 Pix (na entrega)
                  </button>
                  <button
                    className={`pay-opt ${clientInfo.payment === 'Cartão' ? 'active' : ''}`}
                    onClick={() => setClientInfo({ ...clientInfo, payment: 'Cartão' })}
                  >
                    💳 Cartão (na entrega)
                  </button>
                  <button
                    className={`pay-opt ${clientInfo.payment === 'Dinheiro' ? 'active' : ''}`}
                    onClick={() => setClientInfo({ ...clientInfo, payment: 'Dinheiro' })}
                  >
                    💵 Dinheiro (na entrega)
                  </button>
                  <button
                    className={`pay-opt ${clientInfo.payment === 'AbacatePay' ? 'active' : ''}`}
                    onClick={() => setClientInfo({ ...clientInfo, payment: 'AbacatePay' })}
                  >
                    🥑 Abacate Pay (Online)
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'review' && (
              <div className="checkout-step review-step">
                <div className="review-section">
                  <h4>Itens</h4>
                  {cart.map(item => (
                    <div key={item.productName} className="review-item">
                      <span>{item.quantity}x {item.productName}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="review-section">
                  <h4>Entrega</h4>
                  <p>{clientInfo.name} - {clientInfo.phone}</p>
                  <p>{clientInfo.deliveryType === 'delivery' ? `${clientInfo.address}, ${clientInfo.number}` : 'Retirada na loja'}</p>
                </div>
                <div className="review-section">
                  <h4>Pagamento</h4>
                  <p>{clientInfo.payment}</p>
                </div>
              </div>
            )}
          </div>

          <div className="drawer-footer">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>

            {checkoutStep === 'cart' && (
              <button
                className="action-btn main-action"
                disabled={cart.length === 0}
                onClick={() => setCheckoutStep('contact')}
              >
                Finalizar pedido
              </button>
            )}

            {checkoutStep === 'contact' && (
              <div className="action-btns">
                <button className="action-btn back-btn" onClick={() => setCheckoutStep('cart')}>Voltar</button>
                <button className="action-btn main-action" onClick={() => validateContact() && setCheckoutStep('delivery')}>Continuar</button>
              </div>
            )}

            {checkoutStep === 'delivery' && (
              <div className="action-btns">
                <button className="action-btn back-btn" onClick={() => setCheckoutStep('contact')}>Voltar</button>
                <button className="action-btn main-action" onClick={() => setCheckoutStep('payment')}>Continuar</button>
              </div>
            )}

            {checkoutStep === 'payment' && (
              <div className="action-btns">
                <button className="action-btn back-btn" onClick={() => setCheckoutStep('delivery')}>Voltar</button>
                <button className="action-btn main-action" onClick={() => setCheckoutStep('review')}>Revisar Pedido</button>
              </div>
            )}

            {checkoutStep === 'review' && (
              <div className="action-btns">
                <button className="action-btn back-btn" onClick={() => setCheckoutStep('payment')}>Voltar</button>
                <button className="action-btn main-action" onClick={handleFinalize} disabled={isProcessing}>
                  {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {orderSuccess && (
        <div className="success-toast">
          ✅ Pedido realizado com sucesso! Aguarde nosso contato.
        </div>
      )}
    </div>
  )
}
