import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  updateBlock,
  extractHHMM,
  type ScheduleBlock,
  type UpdateScheduleBlockBody,
  type BlockStatus,
} from '../api/blocks'

const STATUS_LABELS: Record<BlockStatus, string> = {
  PLANNED: 'Planejado',
  ACTIVE: 'Em andamento',
  IN_PROGRESS: 'Em andamento (legacy)',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
}

const STATUS_OPTIONS: BlockStatus[] = ['PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']

interface Props {
  block: ScheduleBlock | null
  onClose: () => void
}

export function EditBlockModal({ block, onClose }: Props) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [status, setStatus] = useState<BlockStatus>('PLANNED')
  const [selectedColor, setSelectedColor] = useState(DEFAULT_BLOCK_COLOR)
  const [error, setError] = useState('')

  useEffect(() => {
    if (block) {
      setName(block.name)
      setStatus(block.status)
      setSelectedColor(block.color ?? DEFAULT_BLOCK_COLOR)
      setError('')
    }
  }, [block])

  const mutation = useMutation<ScheduleBlock, unknown, UpdateScheduleBlockBody>({
    mutationFn: (body) => updateBlock(block!.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocks'] })
      onClose()
    },
    onError: () => setError('Erro ao salvar alterações.'),
  })

  function handleSave() {
    if (!name.trim() || !block) return
    setError('')
    mutation.mutate({ name: name.trim(), status, color: selectedColor })
  }

  if (!block) return null

  const startHHMM = extractHHMM(block.start_time)
  const endHHMM = extractHHMM(block.end_time)
  const startDate = new Date(block.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  const endDate = new Date(block.projected_end_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })

  return (
    <Dialog open={!!block} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Alocação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nome */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Nome da turma</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Status</label>
            <Select value={status} onValueChange={(v) => setStatus(v as BlockStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Cor no calendário</label>
            <div className="flex flex-wrap gap-2">
              {BLOCK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
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

          {/* Info somente leitura */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div>
                <p className="text-xs text-zinc-500">Professor</p>
                <p className="text-zinc-200">{block.teacher.name}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Sala</p>
                <p className="text-zinc-200">{block.room.name}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Curso</p>
                <p className="text-zinc-200">{block.course.name}</p>
              </div>
              {block.uc && (
                <div>
                  <p className="text-xs text-zinc-500">Disciplina</p>
                  <p className="text-zinc-200">{block.uc.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500">Horário</p>
                <p className="text-zinc-200">{startHHMM} – {endHHMM}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Carga horária</p>
                <p className="text-zinc-200">{Number(block.total_hours)}h</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Início</p>
                <p className="text-zinc-200">{startDate}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Previsão de término</p>
                <p className="text-zinc-200">{endDate}</p>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            disabled={!name.trim() || mutation.isPending}
            onClick={handleSave}
          >
            {mutation.isPending && <Spinner size="sm" className="mr-1.5" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
