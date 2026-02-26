const API_BASE = 'http://localhost:3000'

export interface User {
  id: string
  name: string
  email: string
  role: 'COORDINATOR' | 'OPP'
  created_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  role: 'COORDINATOR' | 'OPP'
}

export interface ApiError {
  statusCode: number
  message: string
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw data as ApiError
  }

  return data as T
}

export function login(data: LoginRequest) {
  return request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function register(data: RegisterRequest) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getMe(token: string) {
  return request<User>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}
