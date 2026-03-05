import { useState, useMemo } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'
import type { EventInput, DatesSetArg, EventClickArg } from '@fullcalendar/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { DEFAULT_BLOCK_COLOR } from '@/lib/blockColors'
import { getBlocks, getBlockSessions, extractHHMM } from '../api/blocks'
import { getCalendarEvents, type CalendarEventType } from '../api/calendar'
import { CreateBlockModal } from '../components/CreateBlockModal'
import { ManageCalendarModal } from '../components/ManageCalendarModal'
import { EditBlockModal } from '../components/EditBlockModal'

const CAL_EVENT_COLORS: Record<CalendarEventType, string> = {
  HOLIDAY: '#ef4444',
  RECESS: '#f59e0b',
  BLOCK: '#a855f7',
}

const DAY_LABELS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
]

export function CalendarPage() {
  const [showCreateBlock, setShowCreateBlock] = useState(false)
  const [showManageCalendar, setShowManageCalendar] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [search, setSearch] = useState('')
  const [filterDays, setFilterDays] = useState<number[]>([])
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)

  const { data: blocksPage } = useQuery({
    queryKey: ['blocks'],
    queryFn: () => getBlocks(),
  })

  const blocks = blocksPage?.data ?? []

  const sessionQueries = useQueries({
    queries: blocks.map((block) => ({
      queryKey: ['blocks', block.id, 'sessions'],
      queryFn: () => getBlockSessions(block.id),
    })),
  })

  const { data: calEvents } = useQuery({
    queryKey: ['calendar', calYear],
    queryFn: () => getCalendarEvents(calYear),
  })

  const sessionsByBlockId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getBlockSessions> extends Promise<infer T> ? T : never>()
    blocks.forEach((block, idx) => {
      const data = sessionQueries[idx]?.data
      if (data) map.set(block.id, data)
    })
    return map
  }, [blocks, sessionQueries]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBlocks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return blocks
    return blocks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.teacher.name.toLowerCase().includes(q) ||
        b.course.name.toLowerCase().includes(q) ||
        b.room.name.toLowerCase().includes(q),
    )
  }, [blocks, search])

  function toggleDay(day: number) {
    setFilterDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  function clearFilters() {
    setSearch('')
    setFilterDays([])
  }

  const hasActiveFilters = search.trim() !== '' || filterDays.length > 0

  function handleDatesSet(info: DatesSetArg) {
    const mid = new Date((info.start.getTime() + info.end.getTime()) / 2)
    setCalYear(mid.getFullYear())
  }

  function handleEventClick(info: EventClickArg) {
    const { type, blockId } = info.event.extendedProps
    if (type === 'session' && blockId) {
      setEditingBlockId(blockId)
    }
  }

  const editingBlock = editingBlockId ? blocks.find((b) => b.id === editingBlockId) ?? null : null

  const fcEvents = useMemo<EventInput[]>(() => {
    const events: EventInput[] = []

    filteredBlocks.forEach((block) => {
      const sessions = sessionsByBlockId.get(block.id) ?? []
      const startHHMM = extractHHMM(block.start_time)
      const endHHMM = extractHHMM(block.end_time)
      const color = block.color ?? DEFAULT_BLOCK_COLOR

      sessions.forEach((session) => {
        if (filterDays.length > 0) {
          const jsDay = new Date(session.date.substring(0, 10) + 'T12:00:00').getDay()
          const ourDay = jsDay === 0 ? 7 : jsDay
          if (!filterDays.includes(ourDay)) return
        }
        const dateStr = session.date.substring(0, 10)
        events.push({
          id: session.id,
          title: `${block.name} · ${block.teacher.name}`,
          start: `${dateStr}T${startHHMM}`,
          end: `${dateStr}T${endHHMM}`,
          backgroundColor: color,
          borderColor: color,
          textColor: '#ffffff',
          extendedProps: { type: 'session', blockId: block.id },
        })
      })
    })

    ;(calEvents ?? []).forEach((ev) => {
      events.push({
        id: `cal-${ev.id}`,
        title: ev.name,
        start: ev.date.substring(0, 10),
        allDay: true,
        display: 'background',
        backgroundColor: CAL_EVENT_COLORS[ev.type],
        extendedProps: { type: 'calendarEvent', calType: ev.type },
      })
    })

    return events
  }, [filteredBlocks, sessionsByBlockId, calEvents, filterDays])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Calendário</h1>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setShowManageCalendar(true)}>
            Gerenciar Calendário
          </Button>
          <Button size="sm" onClick={() => setShowCreateBlock(true)}>
            + Nova Alocação
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <Input
              className="pl-9"
              placeholder="Buscar por turma, professor, curso ou sala…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters} className="shrink-0 text-zinc-400">
              Limpar
            </Button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 shrink-0">Dias:</span>
          {DAY_LABELS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => toggleDay(value)}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                filterDays.includes(value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
              )}
            >
              {label}
            </button>
          ))}
          {search.trim() && (
            <span className="text-xs text-zinc-500">
              {filteredBlocks.length} de {blocks.length} alocaç{blocks.length === 1 ? 'ão' : 'ões'}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-full bg-zinc-400" />
          Aulas (cor personalizável)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-red-500" />
          Feriado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-amber-500" />
          Recesso
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-sm bg-purple-500" />
          Bloqueio letivo
        </span>
      </div>

      {/* Calendar */}
      <div className="fc-dark-wrapper rounded-xl border border-zinc-800 bg-zinc-950 p-3">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
          }}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Lista',
          }}
          showNonCurrentDates={false}
          validRange={{ start: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }}
          events={fcEvents}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          nowIndicator
          eventDisplay="block"
        />
      </div>

      <CreateBlockModal
        open={showCreateBlock}
        onClose={() => setShowCreateBlock(false)}
      />
      <ManageCalendarModal
        open={showManageCalendar}
        onClose={() => setShowManageCalendar(false)}
      />
      <EditBlockModal
        block={editingBlock}
        onClose={() => setEditingBlockId(null)}
      />
    </div>
  )
}
