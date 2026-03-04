import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  seedCalendar,
  type CalendarEvent,
  type CalendarEventType,
  type CreateCalendarEventBody,
  type SeedCalendarResponse,
} from '../api/calendar'

const TYPE_LABELS: Record<CalendarEventType, string> = {
  HOLIDAY: 'Feriado',
  RECESS: 'Recesso',
  BLOCK: 'Bloqueio',
}

const TYPE_COLORS: Record<CalendarEventType, string> = {
  HOLIDAY: 'text-red-400 bg-red-900/30 border-red-900/50',
  RECESS: 'text-amber-400 bg-amber-900/30 border-amber-900/50',
  BLOCK: 'text-purple-400 bg-purple-900/30 border-purple-900/50',
}

interface Props {
  open: boolean
  onClose: () => void
}

export function ManageCalendarModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [newDate, setNewDate] = useState('')
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<CalendarEventType>('HOLIDAY')
  const [addError, setAddError] = useState('')
  const [seedMessage, setSeedMessage] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar', year],
    queryFn: () => getCalendarEvents(year),
    enabled: open,
  })

  const seedMutation = useMutation<SeedCalendarResponse, unknown, number>({
    mutationFn: seedCalendar,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['calendar', year] })
      setSeedMessage(data.message)
      setTimeout(() => setSeedMessage(''), 4000)
    },
  })

  const deleteMutation = useMutation<void, unknown, string>({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', year] })
      setDeletingId(null)
    },
    onError: () => setDeletingId(null),
  })

  const addMutation = useMutation<CalendarEvent, unknown, CreateCalendarEventBody>({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendar', year] })
      setNewDate('')
      setNewName('')
      setNewType('HOLIDAY')
      setAddError('')
    },
    onError: () => setAddError('Erro ao adicionar evento.'),
  })

  function handleDelete(id: string) {
    setDeletingId(id)
    deleteMutation.mutate(id)
  }

  function handleAdd() {
    if (!newDate || !newName.trim()) return
    setAddError('')
    addMutation.mutate({ date: newDate, name: newName.trim(), type: newType })
  }

  const sorted = [...(events ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calendário Letivo</DialogTitle>
        </DialogHeader>

        {/* Year navigation */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setYear((y) => y - 1); setSeedMessage('') }}
              disabled={year <= currentYear}
              className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-30"
            >
              ‹
            </button>
            <span className="text-sm font-semibold text-white">{year}</span>
            <button
              onClick={() => { setYear((y) => y + 1); setSeedMessage('') }}
              className="flex size-7 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              ›
            </button>
          </div>

          <div className="flex items-center gap-2">
            {seedMessage && (
              <span className="text-xs text-green-400">{seedMessage}</span>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={seedMutation.isPending}
              onClick={() => seedMutation.mutate(year)}
            >
              {seedMutation.isPending && <Spinner size="sm" className="mr-1.5" />}
              Importar Feriados Nacionais
            </Button>
          </div>
        </div>

        {/* Event list */}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">
              Nenhum evento cadastrado para {year}.
            </p>
          ) : (
            sorted.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
              >
                <span className="w-24 shrink-0 text-xs text-zinc-400">
                  {new Date(ev.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded border px-1.5 py-0.5 text-xs font-medium',
                    TYPE_COLORS[ev.type],
                  )}
                >
                  {TYPE_LABELS[ev.type]}
                </span>
                <span className="flex-1 truncate text-sm text-zinc-200">{ev.name}</span>
                <button
                  onClick={() => handleDelete(ev.id)}
                  disabled={deletingId === ev.id}
                  className="shrink-0 text-xs text-zinc-500 hover:text-red-400 disabled:opacity-50"
                >
                  {deletingId === ev.id ? '...' : 'Remover'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add event form */}
        <div className="space-y-3 border-t border-zinc-800 pt-4">
          <Label className="text-sm font-medium text-zinc-300">Adicionar evento</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="date"
              min={`${currentYear}-01-01`}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <Input
              placeholder="Nome"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <Select value={newType} onValueChange={(v) => setNewType(v as CalendarEventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOLIDAY">Feriado</SelectItem>
                <SelectItem value="RECESS">Recesso</SelectItem>
                <SelectItem value="BLOCK">Bloqueio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {addError && <p className="text-sm text-red-400">{addError}</p>}
          <Button
            size="sm"
            disabled={!newDate || !newName.trim() || addMutation.isPending}
            onClick={handleAdd}
          >
            {addMutation.isPending && <Spinner size="sm" className="mr-1.5" />}
            Adicionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
