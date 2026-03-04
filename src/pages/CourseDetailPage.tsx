import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUC,
  deleteUC,
  getCourse,
  updateCourse,
  updateUC,
  type CreateUCBody,
  type UC,
  type UpdateCourseBody,
  type UpdateUCBody,
} from '../api/courses'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', id],
    queryFn: () => getCourse(id!),
    enabled: !!id,
  })

  // ── Edit course modal ──
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editType, setEditType] = useState<'FIC' | 'REGULAR'>('FIC')
  const [editTotalHours, setEditTotalHours] = useState('')
  const [editError, setEditError] = useState('')

  function openEdit() {
    if (!course) return
    setEditName(course.name)
    setEditDesc(course.description ?? '')
    setEditType(course.type)
    setEditTotalHours(course.total_hours != null ? String(Number(course.total_hours)) : '')
    setEditError('')
    setShowEdit(true)
  }

  const updateCourseMutation = useMutation<unknown, ApiError, UpdateCourseBody>({
    mutationFn: (body) => updateCourse(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', id] })
      qc.invalidateQueries({ queryKey: ['courses'] })
      setShowEdit(false)
    },
    onError: (err) => setEditError(err.message ?? 'Erro ao editar curso'),
  })

  // ── Add UC modal ──
  const [showAddUC, setShowAddUC] = useState(false)
  const [ucName, setUcName] = useState('')
  const [ucHours, setUcHours] = useState('')
  const [ucOrder, setUcOrder] = useState('')
  const [ucError, setUcError] = useState('')

  function closeAddUC() {
    setShowAddUC(false)
    setUcName('')
    setUcHours('')
    setUcOrder('')
    setUcError('')
  }

  const createUCMutation = useMutation<UC, ApiError, CreateUCBody>({
    mutationFn: (body) => createUC(id!, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', id] })
      closeAddUC()
    },
    onError: (err) => setUcError(err.message ?? 'Erro ao criar UC'),
  })

  function handleCreateUC() {
    if (!ucName.trim() || !ucHours) return
    createUCMutation.mutate({
      name: ucName.trim(),
      total_hours: parseFloat(ucHours),
      ...(ucOrder ? { order: parseInt(ucOrder, 10) } : {}),
    })
  }

  // ── Edit UC modal ──
  const [editUCTarget, setEditUCTarget] = useState<UC | null>(null)
  const [editUCName, setEditUCName] = useState('')
  const [editUCHours, setEditUCHours] = useState('')
  const [editUCOrder, setEditUCOrder] = useState('')
  const [editUCError, setEditUCError] = useState('')

  function openEditUC(uc: UC) {
    setEditUCTarget(uc)
    setEditUCName(uc.name)
    setEditUCHours(String(parseFloat(uc.total_hours)))
    setEditUCOrder(uc.order != null ? String(uc.order) : '')
    setEditUCError('')
  }

  function closeEditUC() {
    setEditUCTarget(null)
    setEditUCError('')
  }

  const updateUCMutation = useMutation<UC, ApiError, UpdateUCBody>({
    mutationFn: (body) => updateUC(id!, editUCTarget!.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', id] })
      closeEditUC()
    },
    onError: (err) => setEditUCError(err.message ?? 'Erro ao editar UC'),
  })

  function handleUpdateUC() {
    if (!editUCName.trim() || !editUCHours) return
    updateUCMutation.mutate({
      name: editUCName.trim(),
      total_hours: parseFloat(editUCHours),
      ...(editUCOrder ? { order: parseInt(editUCOrder, 10) } : {}),
    })
  }

  // ── Delete UC modal ──
  const [deleteUCTarget, setDeleteUCTarget] = useState<UC | null>(null)

  const deleteUCMutation = useMutation<void, ApiError, string>({
    mutationFn: (ucId) => deleteUC(id!, ucId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses', id] })
      setDeleteUCTarget(null)
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!course) {
    return <p className="text-zinc-400">Curso não encontrado.</p>
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link to="/courses" className="text-zinc-400 hover:text-white transition-colors">
          ← Cursos
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-white">{course.name}</h1>
        <Badge variant={course.type === 'FIC' ? 'default' : 'secondary'}>
          {course.type}
        </Badge>
      </div>

      {/* Course info card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-300">Informações do Curso</h2>
          <Button size="sm" variant="ghost" onClick={openEdit}>
            Editar Curso
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-zinc-500">Nome</p>
            <p className="text-white">{course.name}</p>
          </div>
          <div>
            <p className="text-zinc-500">Tipo</p>
            <p className="text-white">{course.type}</p>
          </div>
          <div>
            <p className="text-zinc-500">Carga horária total</p>
            <p className="text-white">
              {course.total_hours != null ? `${Number(course.total_hours)}h` : '—'}
              {course.type === 'REGULAR' && course.total_hours != null && (
                <span className="ml-1.5 text-xs text-zinc-500">(soma das UCs)</span>
              )}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-500">Descrição</p>
            <p className="text-white">{course.description ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* UCs section — only for REGULAR courses */}
      {course.type === 'REGULAR' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Unidades Curriculares</h2>
            <Button size="sm" onClick={() => setShowAddUC(true)}>
              Adicionar UC
            </Button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(course.ucs ?? []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-zinc-500">
                      Nenhuma UC cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  (course.ucs ?? []).map((uc, idx) => (
                    <TableRow key={uc.id}>
                      <TableCell>{uc.order ?? idx + 1}</TableCell>
                      <TableCell className="text-white">{uc.name}</TableCell>
                      <TableCell>{parseFloat(uc.total_hours)}h</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEditUC(uc)}>
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteUCTarget(uc)}
                          >
                            Deletar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      <Dialog open={showEdit} onOpenChange={(open) => { if (!open) setShowEdit(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Curso</DialogTitle>
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Descrição</label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Tipo</label>
              <Select value={editType} onValueChange={(v) => setEditType(v as 'FIC' | 'REGULAR')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FIC">FIC</SelectItem>
                  <SelectItem value="REGULAR">Regular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editType === 'FIC' && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Carga horária total (h)</label>
                <Input
                  type="number"
                  min={1}
                  value={editTotalHours}
                  onChange={(e) => setEditTotalHours(e.target.value)}
                />
              </div>
            )}
            {editError && <p className="text-sm text-red-400">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!editName.trim() || updateCourseMutation.isPending}
              onClick={() =>
                updateCourseMutation.mutate({
                  name: editName.trim(),
                  description: editDesc.trim() || undefined,
                  type: editType,
                  ...(editType === 'FIC' && editTotalHours
                    ? { total_hours: Number(editTotalHours) }
                    : {}),
                })
              }
            >
              {updateCourseMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add UC Modal */}
      <Dialog open={showAddUC} onOpenChange={(open) => { if (!open) closeAddUC() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar UC</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Nome</label>
              <Input
                placeholder="Nome da UC"
                value={ucName}
                onChange={(e) => setUcName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Total de horas</label>
              <Input
                placeholder="Ex: 40"
                type="number"
                value={ucHours}
                onChange={(e) => setUcHours(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Ordem (opcional)</label>
              <Input
                placeholder="Ex: 1"
                type="number"
                value={ucOrder}
                onChange={(e) => setUcOrder(e.target.value)}
              />
            </div>
            {ucError && <p className="text-sm text-red-400">{ucError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeAddUC}>
              Cancelar
            </Button>
            <Button
              disabled={!ucName.trim() || !ucHours || createUCMutation.isPending}
              onClick={handleCreateUC}
            >
              {createUCMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit UC Modal */}
      <Dialog open={!!editUCTarget} onOpenChange={(open) => { if (!open) closeEditUC() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar UC</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Nome</label>
              <Input
                value={editUCName}
                onChange={(e) => setEditUCName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Total de horas</label>
              <Input
                type="number"
                value={editUCHours}
                onChange={(e) => setEditUCHours(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Ordem (opcional)</label>
              <Input
                type="number"
                value={editUCOrder}
                onChange={(e) => setEditUCOrder(e.target.value)}
              />
            </div>
            {editUCError && <p className="text-sm text-red-400">{editUCError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeEditUC}>
              Cancelar
            </Button>
            <Button
              disabled={!editUCName.trim() || !editUCHours || updateUCMutation.isPending}
              onClick={handleUpdateUC}
            >
              {updateUCMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete UC Modal */}
      <Dialog open={!!deleteUCTarget} onOpenChange={(open) => { if (!open) setDeleteUCTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar UC</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-300">
            Tem certeza que deseja deletar{' '}
            <span className="font-semibold text-white">{deleteUCTarget?.name}</span>?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteUCTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUCMutation.isPending}
              onClick={() => deleteUCTarget && deleteUCMutation.mutate(deleteUCTarget.id)}
            >
              {deleteUCMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
