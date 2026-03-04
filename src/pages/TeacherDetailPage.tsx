import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getTeacher, updateTeacher, type UpdateTeacherBody } from '../api/teachers'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teachers', id],
    queryFn: () => getTeacher(id!),
    enabled: !!id,
  })

  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editRegistration, setEditRegistration] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmploymentType, setEditEmploymentType] = useState('')
  const [editError, setEditError] = useState('')

  function openEdit() {
    if (!teacher) return
    setEditName(teacher.name)
    setEditRegistration(teacher.registration ?? '')
    setEditEmail(teacher.email ?? '')
    setEditPhone(teacher.phone ?? '')
    setEditEmploymentType(teacher.employment_type ?? '')
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
    })
  }

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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        to="/teachers"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Professores
      </Link>

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
            <p className="text-zinc-500">Cadastrado em</p>
            <p className="text-white">
              {new Date(teacher.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      <Dialog open={showEdit} onOpenChange={(open) => { if (!open) setShowEdit(false) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Professor</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Registro</label>
                <Input value={editRegistration} onChange={(e) => setEditRegistration(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Tipo de contrato</label>
                <Input value={editEmploymentType} onChange={(e) => setEditEmploymentType(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">E-mail</label>
                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Telefone</label>
                <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
            </div>
            {editError && <p className="text-sm text-red-400">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEdit(false)}>
              Cancelar
            </Button>
            <Button disabled={!editName.trim() || updateMutation.isPending} onClick={handleUpdate}>
              {updateMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
