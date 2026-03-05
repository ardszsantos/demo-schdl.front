import { API_BASE } from './config'

export interface Teacher {
  id: string
  name: string
  registration: string | null
  email: string | null
  phone: string | null
  employment_type: string | null
  created_at: string
}

export interface CreateTeacherBody {
  name: string
  registration?: string
  email?: string
  phone?: string
  employment_type?: string
}

export type UpdateTeacherBody = Partial<CreateTeacherBody>

async function authRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('schdl_token')
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw data
  }

  return data as T
}

export function getTeachers() {
  return authRequest<Teacher[]>('/teachers')
}

export function getTeacher(id: string) {
  return authRequest<Teacher>(`/teachers/${id}`)
}

export function createTeacher(body: CreateTeacherBody) {
  return authRequest<Teacher>('/teachers', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateTeacher(id: string, body: UpdateTeacherBody) {
  return authRequest<Teacher>(`/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export function deleteTeacher(id: string) {
  return authRequest<Teacher>(`/teachers/${id}`, { method: 'DELETE' })
}
