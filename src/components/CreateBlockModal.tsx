import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { BLOCK_COLORS, DEFAULT_BLOCK_COLOR } from '@/lib/blockColors'
import { getTeachers } from '../api/teachers'
import { getCourses, getCourse } from '../api/courses'
import { getRooms } from '../api/rooms'
import {
  createBlock,
  type CreateScheduleBlockBody,
  type ScheduleBlock,
  type BlockConflictError,
} from '../api/blocks'

const DAY_LABELS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
]

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateBlockModal({ open, onClose }: Props) {
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(DEFAULT_BLOCK_COLOR)
  const [teacherId, setTeacherId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [ucId, setUcId] = useState<string | null>(null)
  const [roomId, setRoomId] = useState('')
  const [totalHours, setTotalHours] = useState('')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])
  const [startTime, setStartTime] = useState('18:00')
  const [endTime, setEndTime] = useState('22:00')
  const [startDate, setStartDate] = useState('')
  const [conflictError, setConflictError] = useState('')

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => getTeachers(),
    enabled: open,
  })

  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
    enabled: open,
  })

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => getRooms(1, 100),
    enabled: open,
  })

  const { data: courseDetail } = useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => getCourse(courseId),
    enabled: !!courseId,
  })

  const mutation = useMutation<ScheduleBlock, BlockConflictError, CreateScheduleBlockBody>({
    mutationFn: createBlock,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] })
      handleClose()
    },
    onError: (err) => {
      if (err?.statusCode === 409) {
        setConflictError(err.message)
      } else {
        setConflictError('Erro ao criar alocação. Tente novamente.')
      }
    },
  })

  function handleClose() {
    setName('')
    setTeacherId('')
    setCourseId('')
    setUcId(null)
    setRoomId('')
    setTotalHours('')
    setDaysOfWeek([])
    setStartTime('18:00')
    setEndTime('22:00')
    setStartDate('')
    setConflictError('')
    setSelectedColor(DEFAULT_BLOCK_COLOR)
    onClose()
  }

  function handleCourseChange(val: string) {
    setCourseId(val)
    setUcId(null)
    setTotalHours('')
    const course = (courses ?? []).find((c) => c.id === val)
    if (course?.type === 'FIC' && course.total_hours != null) {
      setTotalHours(String(Number(course.total_hours)))
    }
    // REGULAR: aguarda seleção de UC para preencher horas
  }

  function handleUCChange(val: string) {
    setUcId(val || null)
    const uc = (courseDetail?.ucs ?? []).find((u) => u.id === val)
    setTotalHours(uc?.total_hours != null ? String(Number(uc.total_hours)) : '')
  }

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  function handleSubmit() {
    if (!isValid) return
    setConflictError('')
    mutation.mutate({
      name,
      color: selectedColor,
      teacher_id: teacherId,
      course_id: courseId,
      uc_id: ucId,
      room_id: roomId,
      total_hours: Number(totalHours),
      days_of_week: daysOfWeek,
      start_time: startTime,
      end_time: endTime,
      start_date: startDate,
    })
  }

  const isRegular = courseDetail?.type === 'REGULAR'

  const isValid =
    name.trim() !== '' &&
    teacherId !== '' &&
    courseId !== '' &&
    roomId !== '' &&
    totalHours !== '' &&
    Number(totalHours) > 0 &&
    daysOfWeek.length > 0 &&
    startTime !== '' &&
    endTime !== '' &&
    startDate !== '' &&
    (!isRegular || ucId !== null)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Alocação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="block-name">Nome da turma</Label>
            <Input
              id="block-name"
              placeholder="Ex: Azulejos - Turma Manhã"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Professor */}
          <div className="space-y-1.5">
            <Label>Professor</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                {(teachers ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Curso */}
          <div className="space-y-1.5">
            <Label>Curso</Label>
            <Select value={courseId} onValueChange={handleCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o curso" />
              </SelectTrigger>
              <SelectContent>
                {(courses ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* UC — obrigatória para cursos REGULAR */}
          {courseId && courseDetail?.type === 'REGULAR' && (
            <div className="space-y-1.5">
              <Label>
                Disciplina (UC)
                <span className="ml-1 text-red-400">*</span>
              </Label>
              {(courseDetail?.ucs ?? []).length === 0 ? (
                <p className="rounded-lg border border-amber-900/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-400">
                  Este curso não possui UCs cadastradas. Adicione UCs antes de criar uma alocação.
                </p>
              ) : (
                <Select value={ucId ?? ''} onValueChange={handleUCChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courseDetail?.ucs ?? []).map((uc) => (
                      <SelectItem key={uc.id} value={uc.id}>
                        {uc.name}
                        {uc.total_hours != null && (
                          <span className="ml-1.5 text-zinc-500">
                            ({Number(uc.total_hours)}h)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Sala */}
          <div className="space-y-1.5">
            <Label>Sala</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a sala" />
              </SelectTrigger>
              <SelectContent>
                {(rooms?.data ?? []).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                    {r.capacity ? ` (cap. ${r.capacity})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Carga horária total */}
          <div className="space-y-1.5">
            <Label htmlFor="total-hours">Carga horária total (h)</Label>
            <Input
              id="total-hours"
              type="number"
              min={1}
              placeholder={isRegular ? 'Selecione a disciplina primeiro' : 'Selecione um curso primeiro'}
              value={totalHours}
              readOnly
              className="cursor-not-allowed opacity-70"
            />
          </div>

          {/* Dias da semana */}
          <div className="space-y-1.5">
            <Label>Dias da semana</Label>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    daysOfWeek.includes(value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-time">Início</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-time">Fim</Label>
              <Input
                id="end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Data de início */}
          <div className="space-y-1.5">
            <Label htmlFor="start-date">Data de início</Label>
            <Input
              id="start-date"
              type="date"
              min={new Date().toISOString().substring(0, 10)}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Cor da alocação */}
          <div className="space-y-2">
            <Label>Cor no calendário</Label>
            <div className="flex flex-wrap gap-2">
              {BLOCK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedColor(c)}
                  className={cn(
                    'size-7 rounded-full transition-transform hover:scale-110',
                    selectedColor === c &&
                      'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110',
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Erro de conflito */}
          {conflictError && (
            <div className="rounded-lg border border-red-900/50 bg-red-900/20 px-3 py-2 text-sm text-red-400">
              {conflictError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={mutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || mutation.isPending}>
            {mutation.isPending && <Spinner size="sm" className="mr-2" />}
            Criar Alocação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
