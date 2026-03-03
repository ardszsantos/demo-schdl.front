import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addBlock,
  deleteBlock,
  getTeacher,
  setAvailability,
  updateTeacher,
  type AvailabilitySlot,
  type CreateBlockBody,
  type TeacherBlock,
  type UpdateTeacherBody,
} from '../api/teachers'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const DAY_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function toHHMM(timeStr: string): string {
  if (timeStr.includes('T')) return timeStr.substring(11, 16)
  return timeStr.substring(0, 5)
}

type SlotDraft = { day_of_week: number; start_time: string; end_time: string }

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teachers', id],
    queryFn: () => getTeacher(id!),
    enabled: !!id,
  })

  // ── Edit teacher modal ──
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editRegistration, setEditRegistration] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmploymentType, setEditEmploymentType] = useState('')
  const [editWeeklyHours, setEditWeeklyHours] = useState('')
  const [editMonthlyHours, setEditMonthlyHours] = useState('')
  const [editError, setEditError] = useState('')

  function openEdit() {
    if (!teacher) return
    setEditName(teacher.name)
    setEditRegistration(teacher.registration ?? '')
    setEditEmail(teacher.email ?? '')
    setEditPhone(teacher.phone ?? '')
    setEditEmploymentType(teacher.employment_type ?? '')
    setEditWeeklyHours(teacher.weekly_hours_limit != null ? String(teacher.weekly_hours_limit) : '')
    setEditMonthlyHours(teacher.monthly_hours_limit != null ? String(teacher.monthly_hours_limit) : '')
    setEditError('')
    setShowEdit(true)
  }

  const updateMutation = useMutation<unknown, ApiError, UpdateTeacherBody>({
    mutationFn: (body) => updateTeacher(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers', id] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
      setShowEdit(false)
    },
    onError: (err) => setEditError(err.message ?? 'Erro ao editar professor'),
  })

  function handleUpdate() {
    if (!editName.trim()) return
    updateMutation.mutate({
      name: editName.trim(),
      registration: editRegistration.trim() || undefined,
      email: editEmail.trim() || undefined,
      phone: editPhone.trim() || undefined,
      employment_type: editEmploymentType.trim() || undefined,
      weekly_hours_limit: editWeeklyHours ? Number(editWeeklyHours) : undefined,
      monthly_hours_limit: editMonthlyHours ? Number(editMonthlyHours) : undefined,
    })
  }

  // ── Availability modal ──
  const [showAvail, setShowAvail] = useState(false)
  const [slotDrafts, setSlotDrafts] = useState<SlotDraft[]>([])
  const [availError, setAvailError] = useState('')

  function openAvail() {
    const current = teacher?.availabilities ?? []
    setSlotDrafts(
      current.map((a) => ({
        day_of_week: a.day_of_week,
        start_time: toHHMM(a.start_time),
        end_time: toHHMM(a.end_time),
      }))
    )
    setAvailError('')
    setShowAvail(true)
  }

  function addSlot() {
    setSlotDrafts((prev) => [...prev, { day_of_week: 1, start_time: '08:00', end_time: '17:00' }])
  }

  function removeSlot(idx: number) {
    setSlotDrafts((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateSlot(idx: number, field: keyof SlotDraft, value: string | number) {
    setSlotDrafts((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    )
  }

  const availMutation = useMutation<{ count: number }, ApiError, AvailabilitySlot[]>({
    mutationFn: (slots) => setAvailability(id!, slots),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers', id] })
      setShowAvail(false)
    },
    onError: (err) => setAvailError(err.message ?? 'Erro ao salvar disponibilidade'),
  })

  // ── Add block modal ──
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [blockError, setBlockError] = useState('')

  function closeAddBlock() {
    setShowAddBlock(false)
    setBlockStart('')
    setBlockEnd('')
    setBlockReason('')
    setBlockError('')
  }

  const addBlockMutation = useMutation<TeacherBlock, ApiError, CreateBlockBody>({
    mutationFn: (body) => addBlock(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers', id] })
      closeAddBlock()
    },
    onError: (err) => setBlockError(err.message ?? 'Erro ao adicionar bloqueio'),
  })

  function handleAddBlock() {
    if (!blockStart || !blockEnd) return
    addBlockMutation.mutate({
      start_date: blockStart,
      end_date: blockEnd,
      ...(blockReason.trim() ? { reason: blockReason.trim() } : {}),
    })
  }

  // ── Delete block ──
  const [deleteBlockTarget, setDeleteBlockTarget] = useState<TeacherBlock | null>(null)

  const deleteBlockMutation = useMutation<unknown, ApiError, string>({
    mutationFn: (blockId) => deleteBlock(id!, blockId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers', id] })
      setDeleteBlockTarget(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!teacher) {
    return <p className="text-zinc-400">Professor não encontrado.</p>
  }

  const availabilities = teacher.availabilities ?? []
  const blocks = teacher.blocks_teacher ?? []
  const availByDay = Array.from({ length: 7 }, (_, d) =>
    availabilities.filter((a) => a.day_of_week === d)
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link to="/teachers" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Professores
      </Link>

      {/* Header */}
      <h1 className="text-xl font-semibold text-white">{teacher.name}</h1>

      {/* Info card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Informações do Professor</h2>
          <Button size="sm" variant="ghost" onClick={openEdit}>
            Editar
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-zinc-500">Registro</p>
            <p className="text-white">{teacher.registration ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">E-mail</p>
            <p className="text-white">{teacher.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Telefone</p>
            <p className="text-white">{teacher.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Tipo de contrato</p>
            <p className="text-white">{teacher.employment_type ?? '—'}</p>
          </div>
          <div>
            <p className="text-zinc-500">Limite semanal</p>
            <p className="text-white">
              {teacher.weekly_hours_limit != null ? `${teacher.weekly_hours_limit}h` : '—'}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Limite mensal</p>
            <p className="text-white">
              {teacher.monthly_hours_limit != null ? `${teacher.monthly_hours_limit}h` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Availability card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Disponibilidade Semanal</h2>
          <Button size="sm" onClick={openAvail}>
            Editar Disponibilidade
          </Button>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          {availabilities.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-4">Nenhuma disponibilidade cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {availByDay.map((slots, day) =>
                slots.length === 0 ? null : (
                  <div key={day} className="flex items-start gap-3 text-sm">
                    <span className="w-24 shrink-0 font-medium text-zinc-300">{DAY_LABELS[day]}</span>
                    <div className="flex flex-wrap gap-2">
                      {slots.map((s) => (
                        <span key={s.id} className="rounded-md bg-zinc-800 px-2 py-0.5 text-zinc-300">
                          {toHHMM(s.start_time)} – {toHHMM(s.end_time)}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Blocks card */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Bloqueios / Ausências</h2>
          <Button size="sm" onClick={() => setShowAddBlock(true)}>
            Adicionar Bloqueio
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-zinc-500">
                    Nenhum bloqueio cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell>
                      {new Date(block.start_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {new Date(block.end_date).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>{block.reason ?? '—'}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteBlockTarget(block)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit teacher modal */}
      <Dialog open={showEdit} onOpenChange={(open) => { if (!open) setShowEdit(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Nome</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Registro</label>
                <Input
                  value={editRegistration}
                  onChange={(e) => setEditRegistration(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Tipo de contrato</label>
                <Input
                  value={editEmploymentType}
                  onChange={(e) => setEditEmploymentType(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">E-mail</label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Telefone</label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Limite semanal (h)</label>
                <Input
                  type="number"
                  min={0}
                  value={editWeeklyHours}
                  onChange={(e) => setEditWeeklyHours(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Limite mensal (h)</label>
                <Input
                  type="number"
                  min={0}
                  value={editMonthlyHours}
                  onChange={(e) => setEditMonthlyHours(e.target.value)}
                />
              </div>
            </div>
            {editError && <p className="text-sm text-red-400">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!editName.trim() || updateMutation.isPending}
              onClick={handleUpdate}
            >
              {updateMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability modal */}
      <Dialog open={showAvail} onOpenChange={(open) => { if (!open) setShowAvail(false) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Disponibilidade Semanal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              Defina os horários disponíveis por dia da semana. Ao salvar, todos os slots anteriores serão substituídos.
            </p>
            {slotDrafts.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-600">
                Nenhum slot. Clique em "+ Adicionar" para começar.
              </p>
            ) : (
              <div className="space-y-2">
                {slotDrafts.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={String(slot.day_of_week)}
                      onValueChange={(v) => updateSlot(idx, 'day_of_week', Number(v))}
                    >
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAY_LABELS.map((label, d) => (
                          <SelectItem key={d} value={String(d)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateSlot(idx, 'start_time', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-zinc-500">–</span>
                    <Input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateSlot(idx, 'end_time', e.target.value)}
                      className="w-32"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => removeSlot(idx)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <Button size="sm" variant="ghost" onClick={addSlot}>
              + Adicionar slot
            </Button>
            {availError && <p className="text-sm text-red-400">{availError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowAvail(false)}>
              Cancelar
            </Button>
            <Button
              disabled={availMutation.isPending}
              onClick={() => availMutation.mutate(slotDrafts)}
            >
              {availMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add block modal */}
      <Dialog open={showAddBlock} onOpenChange={(open) => { if (!open) closeAddBlock() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Bloqueio</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Data de início</label>
              <Input
                type="date"
                value={blockStart}
                onChange={(e) => setBlockStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Data de fim</label>
              <Input
                type="date"
                value={blockEnd}
                onChange={(e) => setBlockEnd(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Motivo (opcional)</label>
              <Input
                placeholder="Ex: Férias, licença médica..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
            {blockError && <p className="text-sm text-red-400">{blockError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeAddBlock}>
              Cancelar
            </Button>
            <Button
              disabled={!blockStart || !blockEnd || addBlockMutation.isPending}
              onClick={handleAddBlock}
            >
              {addBlockMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete block confirm */}
      <Dialog open={!!deleteBlockTarget} onOpenChange={(open) => { if (!open) setDeleteBlockTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Bloqueio</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-300">
            Tem certeza que deseja remover este bloqueio?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteBlockTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteBlockMutation.isPending}
              onClick={() => deleteBlockTarget && deleteBlockMutation.mutate(deleteBlockTarget.id)}
            >
              {deleteBlockMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
