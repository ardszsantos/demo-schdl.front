const API_BASE = 'http://localhost:3000'

export type CalendarEventType = 'HOLIDAY' | 'RECESS' | 'BLOCK'

export interface CalendarEvent {
  id: string
  date: string
  name: string
  type: CalendarEventType
  created_at: string
}

export interface CreateCalendarEventBody {
  date: string
  name: string
  type: CalendarEventType
}

export interface SeedCalendarResponse {
  created: number
  message: string
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

export function getCalendarEvents(year: number) {
  return authRequest<CalendarEvent[]>(`/calendar?year=${year}`)
}

export function createCalendarEvent(body: CreateCalendarEventBody) {
  return authRequest<CalendarEvent>('/calendar', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function deleteCalendarEvent(id: string) {
  return authRequest<void>(`/calendar/${id}`, { method: 'DELETE' })
}

export function seedCalendar(year: number) {
  return authRequest<SeedCalendarResponse>(`/calendar/seed/${year}`, {
    method: 'POST',
  })
}
