const API_BASE = 'http://localhost:3000'

export interface Availability {
  id: string
  teacher_id: string
  day_of_week: number
  start_time: string
  end_time: string
}

export interface TeacherBlock {
  id: string
  teacher_id: string
  start_date: string
  end_date: string
  reason: string | null
}

export interface Teacher {
  id: string
  name: string
  registration: string | null
  email: string | null
  phone: string | null
  employment_type: string | null
  weekly_hours_limit: number | null
  monthly_hours_limit: number | null
  created_at: string
}

export interface TeacherWithDetails extends Teacher {
  availabilities: Availability[]
  blocks_teacher: TeacherBlock[]
}

export type TeacherListResponse = TeacherWithDetails[]

export interface CreateTeacherBody {
  name: string
  registration?: string
  email?: string
  phone?: string
  employment_type?: string
  weekly_hours_limit?: number
  monthly_hours_limit?: number
}

export type UpdateTeacherBody = Partial<CreateTeacherBody>

export interface AvailabilitySlot {
  day_of_week: number
  start_time: string // HH:mm
  end_time: string   // HH:mm
}

export interface CreateBlockBody {
  start_date: string
  end_date: string
  reason?: string
}

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

export function getTeachers(page = 1, limit = 50) {
  return authRequest<TeacherListResponse>(`/teachers?page=${page}&limit=${limit}`)
}

export function getTeacher(id: string) {
  return authRequest<TeacherWithDetails>(`/teachers/${id}`)
}

export function createTeacher(body: CreateTeacherBody) {
  return authRequest<Teacher>('/teachers', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateTeacher(id: string, body: UpdateTeacherBody) {
  return authRequest<Teacher>(`/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteTeacher(id: string) {
  return authRequest<Teacher>(`/teachers/${id}`, { method: 'DELETE' })
}

export function setAvailability(id: string, slots: AvailabilitySlot[]) {
  return authRequest<{ count: number }>(`/teachers/${id}/availability`, {
    method: 'PUT',
    body: JSON.stringify({ availability: slots }),
  })
}

export function addBlock(id: string, body: CreateBlockBody) {
  return authRequest<TeacherBlock>(`/teachers/${id}/blocks`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteBlock(id: string, blockId: string) {
  return authRequest<TeacherBlock>(`/teachers/${id}/blocks/${blockId}`, { method: 'DELETE' })
}
