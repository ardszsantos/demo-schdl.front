import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTeacher, type CreateTeacherBody, type Teacher } from '../api/teachers'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

export function CreateTeacherPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [registration, setRegistration] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [employmentType, setEmploymentType] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation<Teacher, ApiError, CreateTeacherBody>({
    mutationFn: createTeacher,
    onSuccess: (teacher) => {
      qc.invalidateQueries({ queryKey: ['teachers'] })
      navigate(`/teachers/${teacher.id}`)
    },
    onError: (err) => setError(err.message ?? 'Erro ao criar professor'),
  })

  function handleSubmit() {
    if (!name.trim()) return
    setError('')
    mutation.mutate({
      name: name.trim(),
      ...(registration.trim() ? { registration: registration.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
      ...(employmentType.trim() ? { employment_type: employmentType.trim() } : {}),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Link
          to="/teachers"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Professores
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-white">Novo Professor</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preencha as informações abaixo para cadastrar um novo professor.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Informações básicas
        </h2>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-zinc-400">
            Nome <span className="text-red-400">*</span>
          </label>
          <Input
            placeholder="Nome completo"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Registro</label>
            <Input
              placeholder="Ex: MAT001"
              value={registration}
              onChange={(e) => setRegistration(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Tipo de contrato</label>
            <Input
              placeholder="Ex: CLT, PJ, Horista"
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">E-mail</label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-400">Telefone</label>
            <Input
              placeholder="(XX) XXXXX-XXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-6">
        <Button variant="ghost" asChild>
          <Link to="/teachers">Cancelar</Link>
        </Button>
        <Button
          size="lg"
          disabled={!name.trim() || mutation.isPending}
          onClick={handleSubmit}
          className="px-8"
        >
          {mutation.isPending && <Spinner size="sm" className="mr-1" />}
          Criar Professor
        </Button>
      </div>
    </div>
  )
}
