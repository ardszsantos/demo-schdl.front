const API_BASE = 'http://localhost:3000'

export interface UC {
  id: string
  name: string
  total_hours: string
  order: number | null
  course_id: string
  created_at: string
}

export interface Course {
  id: string
  name: string
  description: string | null
  type: 'FIC' | 'REGULAR'
  created_at: string
}

export interface CourseWithUCs extends Course {
  ucs: UC[]
}

export interface CreateCourseBody {
  name: string
  description?: string
  type: 'FIC' | 'REGULAR'
}

export interface UpdateCourseBody {
  name?: string
  description?: string
  type?: 'FIC' | 'REGULAR'
}

export interface CreateUCBody {
  name: string
  total_hours: number
  order?: number
}

export interface UpdateUCBody {
  name?: string
  total_hours?: number
  order?: number
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

export function getCourses() {
  return authRequest<Course[]>('/courses')
}

export function getCourse(id: string) {
  return authRequest<CourseWithUCs>(`/courses/${id}`)
}

export function createCourse(body: CreateCourseBody) {
  return authRequest<Course>('/courses', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateCourse(id: string, body: UpdateCourseBody) {
  return authRequest<Course>(`/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteCourse(id: string) {
  return authRequest<void>(`/courses/${id}`, { method: 'DELETE' })
}

export function createUC(courseId: string, body: CreateUCBody) {
  return authRequest<UC>(`/courses/${courseId}/ucs`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateUC(courseId: string, ucId: string, body: UpdateUCBody) {
  return authRequest<UC>(`/courses/${courseId}/ucs/${ucId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteUC(courseId: string, ucId: string) {
  return authRequest<void>(`/courses/${courseId}/ucs/${ucId}`, { method: 'DELETE' })
}
