const BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getAuthHeaders(): Record<string, string> {
  const adminToken = localStorage.getItem('mm-auth-token')
  const shopToken = localStorage.getItem('mm-shop-auth-token')
  const token = adminToken || shopToken
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export const api = {
  async post(path: string, data: any, skipAuth = false) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!skipAuth) {
      Object.assign(headers, getAuthHeaders())
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  },

  async patch(path: string, data: any, skipAuth = false) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!skipAuth) {
      Object.assign(headers, getAuthHeaders())
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  },

  async put(path: string, data: any, skipAuth = false) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!skipAuth) {
      Object.assign(headers, getAuthHeaders())
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  },

  async delete(path: string, skipAuth = false) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!skipAuth) {
      Object.assign(headers, getAuthHeaders())
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  },

  async postFormData(path: string, data: FormData, skipAuth = false) {
    const headers: Record<string, string> = {}
    if (!skipAuth) {
      Object.assign(headers, getAuthHeaders())
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: data,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  },

  async patchFormData(path: string, data: FormData, skipAuth = false) {
    const headers: Record<string, string> = {}
    if (!skipAuth) {
      Object.assign(headers, getAuthHeaders())
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: data,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  },

  async get(path: string, skipAuth = false) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (!skipAuth) {
      Object.assign(headers, getAuthHeaders())
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Erro na requisição')
    }

    return response.json()
  }
}
