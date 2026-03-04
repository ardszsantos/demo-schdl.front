export const BLOCK_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#a855f7', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
] as const

export const DEFAULT_BLOCK_COLOR = '#3b82f6'

const STORAGE_KEY = 'schdl_block_colors'

export function loadBlockColors(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function saveBlockColor(blockId: string, color: string, current: Record<string, string>) {
  const next = { ...current, [blockId]: color }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}
