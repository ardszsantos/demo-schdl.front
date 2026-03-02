const API_BASE = 'http://localhost:3000'

export interface Room {
  id: string
  name: string
  capacity: number | null
  created_at: string
}

export interface PaginatedRooms {
  data: Room[]
  total: number
  page: number
  limit: number
}

export interface CreateRoomBody {
  name: string
  capacity?: number
}

export interface UpdateRoomBody {
  name?: string
  capacity?: number
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

export function getRooms(page = 1, limit = 20) {
  return authRequest<PaginatedRooms>(`/rooms?page=${page}&limit=${limit}`)
}

export function createRoom(body: CreateRoomBody) {
  return authRequest<Room>('/rooms', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateRoom(id: string, body: UpdateRoomBody) {
  return authRequest<Room>(`/rooms/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deleteRoom(id: string) {
  return authRequest<void>(`/rooms/${id}`, { method: 'DELETE' })
}
