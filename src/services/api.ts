export const API_URL =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:3333/api'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function requestFormData<T = any>(
  path: string,
  method: Exclude<HttpMethod, 'GET'>,
  body: FormData,
  withCredentials = false
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    method,
    credentials: withCredentials ? 'include' : 'same-origin',
    body,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  const data = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const message =
      (typeof data === 'object' &&
        data &&
        'message' in data &&
        (data as any).message) ||
      (typeof data === 'string' && data) ||
      'Erro na requisição'

    throw new Error(message)
  }

  return data as T
}

async function request<T = any>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  withCredentials = false
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  const response = await fetch(`${API_URL}${normalizedPath}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: withCredentials ? 'include' : 'same-origin',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')

  const data = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null)

  if (!response.ok) {
    const message =
      (typeof data === 'object' &&
        data &&
        'message' in data &&
        (data as any).message) ||
      (typeof data === 'string' && data) ||
      'Erro na requisição'

    throw new Error(message)
  }

  return data as T
}

export const api = {
  get<T = any>(path: string, withCredentials = true) {
    return request<T>(path, 'GET', undefined, withCredentials)
  },

  post<T = any>(path: string, body?: unknown, withCredentials = true) {
    return request<T>(path, 'POST', body, withCredentials)
  },

  put<T = any>(path: string, body?: unknown, withCredentials = true) {
    return request<T>(path, 'PUT', body, withCredentials)
  },

  patch<T = any>(path: string, body?: unknown, withCredentials = true) {
    return request<T>(path, 'PATCH', body, withCredentials)
  },

  delete<T = any>(path: string, withCredentials = true) {
    return request<T>(path, 'DELETE', undefined, withCredentials)
  },

  postFormData<T = any>(path: string, body: FormData, withCredentials = true) {
    return requestFormData<T>(path, 'POST', body, withCredentials)
  },

  patchFormData<T = any>(path: string, body: FormData, withCredentials = true) {
    return requestFormData<T>(path, 'PATCH', body, withCredentials)
  },
}