import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteTeacher, getTeachers, type Teacher } from '../api/teachers'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function TeachersPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => getTeachers(),
  })

  const deleteMutation = useMutation<Teacher, ApiError, string>({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      setDeleteTarget(null)
    },
  })

  const teachers = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-xl font-semibold text-white">Professores</h1>
        <Button size="sm" onClick={() => navigate('/teachers/new')}>
          + Novo Professor
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Tipo de Contrato</TableHead>
                <TableHead>H. Semanais</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-zinc-500">
                    Nenhum professor cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="font-medium text-white">{teacher.name}</TableCell>
                    <TableCell>{teacher.registration ?? '—'}</TableCell>
                    <TableCell>{teacher.employment_type ?? '—'}</TableCell>
                    <TableCell>
                      {teacher.weekly_hours_limit != null ? `${teacher.weekly_hours_limit}h` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/teachers/${teacher.id}`)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(teacher)}
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
        )}
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar professor</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-300">
            Tem certeza que deseja deletar{' '}
            <span className="font-semibold text-white">{deleteTarget?.name}</span>?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Deletar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
