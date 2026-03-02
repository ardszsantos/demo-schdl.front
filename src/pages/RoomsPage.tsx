import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRoom,
  deleteRoom,
  getRooms,
  updateRoom,
  type CreateRoomBody,
  type Room,
  type UpdateRoomBody,
} from '../api/rooms'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function RoomsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', page],
    queryFn: () => getRooms(page, 20),
  })

  const rooms = data?.data ?? []
  const totalPages = Math.ceil((data?.total ?? 0) / 20) || 1

  // ── Create modal ──
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createCapacity, setCreateCapacity] = useState('')
  const [createError, setCreateError] = useState('')

  function closeCreate() {
    setShowCreate(false)
    setCreateName('')
    setCreateCapacity('')
    setCreateError('')
  }

  const createMutation = useMutation<Room, ApiError, CreateRoomBody>({
    mutationFn: createRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      closeCreate()
    },
    onError: (err) => setCreateError(err.message ?? 'Erro ao criar sala'),
  })

  // ── Edit modal ──
  const [editTarget, setEditTarget] = useState<Room | null>(null)
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState('')
  const [editError, setEditError] = useState('')

  function openEdit(room: Room) {
    setEditTarget(room)
    setEditName(room.name)
    setEditCapacity(room.capacity != null ? String(room.capacity) : '')
    setEditError('')
  }

  function closeEdit() {
    setEditTarget(null)
    setEditError('')
  }

  const updateMutation = useMutation<Room, ApiError, UpdateRoomBody>({
    mutationFn: (body) => updateRoom(editTarget!.id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      closeEdit()
    },
    onError: (err) => setEditError(err.message ?? 'Erro ao editar sala'),
  })

  // ── Delete modal ──
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)

  const deleteMutation = useMutation<void, ApiError, string>({
    mutationFn: deleteRoom,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rooms'] })
      setDeleteTarget(null)
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-2">
        <h1 className="text-xl font-semibold text-white">Salas</h1>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          + Nova Sala
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
                <TableHead>Capacidade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-zinc-500">
                    Nenhuma sala cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium text-white">{room.name}</TableCell>
                    <TableCell>
                      {room.capacity != null ? `${room.capacity} alunos` : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(room)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(room)}>
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
          <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            ← Anterior
          </Button>
          <span className="text-sm text-zinc-400">{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
            Próximo →
          </Button>
        </div>
      )}

      {/* Create modal */}
      <Dialog open={showCreate} onOpenChange={(open) => { if (!open) closeCreate() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sala</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Nome</label>
              <Input
                placeholder="Ex: Sala 01"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-400">Capacidade (opcional)</label>
              <Input
                placeholder="Ex: 30"
                type="number"
                value={createCapacity}
                onChange={(e) => setCreateCapacity(e.target.value)}
              />
            </div>
            {createError && <p className="text-sm text-red-400">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeCreate}>Cancelar</Button>
            <Button
              disabled={!createName.trim() || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  name: createName.trim(),
                  ...(createCapacity ? { capacity: parseInt(createCapacity, 10) } : {}),
                })
              }
            >
              {createMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) closeEdit() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sala</DialogTitle>
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
              <label className="text-sm font-medium text-zinc-400">Capacidade (opcional)</label>
              <Input
                type="number"
                value={editCapacity}
                onChange={(e) => setEditCapacity(e.target.value)}
              />
            </div>
            {editError && <p className="text-sm text-red-400">{editError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeEdit}>Cancelar</Button>
            <Button
              disabled={!editName.trim() || updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  name: editName.trim(),
                  ...(editCapacity ? { capacity: parseInt(editCapacity, 10) } : {}),
                })
              }
            >
              {updateMutation.isPending && <Spinner size="sm" className="mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Sala</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-300">
            Tem certeza que deseja deletar{' '}
            <span className="font-semibold text-white">{deleteTarget?.name}</span>?
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
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
