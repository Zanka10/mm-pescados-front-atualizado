export interface AbacatePayProduct {
  externalId: string
  name: string
  quantity: number
  unitPrice: number // in cents
}

export interface AbacatePayBillingRequest {
  frequency: 'ONE_TIME'
  methods: ('PIX' | 'CARD')[]
  products: AbacatePayProduct[]
  returnUrl: string
  completionUrl: string
  customer?: {
    name: string
    cellphone: string
    email: string
    taxId: string
  }
}

class PaymentService {
  private readonly API_URL = import.meta.env.VITE_ABACATE_PAY_API_URL || 'https://api.abacatepay.com/v1'
  private readonly API_KEY = import.meta.env.VITE_ABACATE_PAY_KEY || 'YOUR_ABACATE_PAY_KEY'

  async createBilling(data: AbacatePayBillingRequest) {
    // Nota: Em um app real, isso deve ser feito via Backend para não expor a API KEY
    // Para este MVP, vamos simular ou permitir que o usuário configure
    
    try {
      // Se não houver chave real, simulamos o comportamento
      if (this.API_KEY === 'YOUR_ABACATE_PAY_KEY') {
        console.log('Simulando cobrança Abacate Pay:', data)
        return {
          data: {
            url: 'https://abacatepay.com/checkout/simulated'
          }
        }
      }

      const response = await fetch(`${this.API_URL}/billing/create`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      return await response.json()
    } catch (error) {
      console.error('Erro ao criar cobrança no Abacate Pay:', error)
      throw error
    }
  }
}

export const paymentService = new PaymentService()
