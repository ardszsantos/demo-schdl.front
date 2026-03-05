import { API_BASE } from './config'

export type BlockStatus = 'PLANNED' | 'ACTIVE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface ScheduleBlock {
  id: string
  name: string
  color: string | null
  teacher: { id: string; name: string }
  course: { id: string; name: string; type: 'FIC' | 'REGULAR' }
  uc: { id: string; name: string } | null
  room: { id: string; name: string }
  total_hours: string
  days_of_week: number[]
  start_time: string
  end_time: string
  start_date: string
  projected_end_date: string
  status: BlockStatus
  sessions_count: number
  created_at: string
}

export interface BlockSession {
  id: string
  block_id: string
  date: string
}

export interface CreateScheduleBlockBody {
  name: string
  color?: string
  teacher_id: string
  course_id: string
  uc_id: string | null
  room_id: string
  total_hours: number
  days_of_week: number[]
  start_time: string
  end_time: string
  start_date: string
}

export interface UpdateScheduleBlockBody {
  name?: string
  color?: string
  status?: BlockStatus
  teacher_id?: string
  course_id?: string
  uc_id?: string | null
  room_id?: string
  total_hours?: number
  days_of_week?: number[]
  start_time?: string
  end_time?: string
  start_date?: string
  projected_end_date?: string
}

export interface BlockConflictError {
  statusCode: 409
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

export interface PaginatedBlocks {
  data: ScheduleBlock[]
  total: number
  page: number
  limit: number
}

export function getBlocks(page = 1, limit = 100) {
  return authRequest<PaginatedBlocks>(`/blocks?page=${page}&limit=${limit}`)
}

export function createBlock(body: CreateScheduleBlockBody) {
  return authRequest<ScheduleBlock>('/blocks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateBlock(blockId: string, body: UpdateScheduleBlockBody) {
  return authRequest<ScheduleBlock>(`/blocks/${blockId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getBlockSessions(blockId: string) {
  return authRequest<BlockSession[]>(`/blocks/${blockId}/sessions`)
}

export function extractHHMM(isoTime: string): string {
  return new Date(isoTime).toISOString().substring(11, 16)
}
