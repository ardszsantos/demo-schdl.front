import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCourse, getCourses, type Course } from '../api/courses'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function CoursesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page],
    queryFn: () => getCourses(page, 20),
  })

  const deleteMutation = useMutation<void, ApiError, string>({
    mutationFn: deleteCourse,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] })
      setDeleteTarget(null)
    },
  })

  const courses = data?.data ?? []
  const totalPages = Math.ceil((data?.total ?? 0) / 20) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-xl font-semibold text-white">Cursos</h1>
        <Button size="sm" onClick={() => navigate('/courses/new')}>
          + Novo Curso
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
                <TableHead>Tipo</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-zinc-500">
                    Nenhum curso cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell className="font-medium text-white">{course.name}</TableCell>
                    <TableCell>
                      <Badge variant={course.type === 'FIC' ? 'default' : 'secondary'}>
                        {course.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(course.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(course)}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Anterior
          </Button>
          <span className="text-sm text-zinc-400">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próximo →
          </Button>
        </div>
      )}

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar curso</DialogTitle>
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
