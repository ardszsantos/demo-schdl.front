import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createCourse, type Course, type CreateCourseBody } from '../api/courses'
import type { ApiError } from '../api/auth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'

const TYPE_OPTIONS = [
  {
    value: 'FIC' as const,
    label: 'FIC',
    title: 'Formação Inicial e Continuada',
    description: 'Cursos de curta duração voltados para qualificação profissional básica e continuada.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    activeRing: 'ring-2 ring-blue-500',
    activeBg: 'bg-blue-500/8',
    iconBg: 'bg-blue-500/15 text-blue-400',
    iconBgInactive: 'bg-zinc-700/80 text-zinc-400',
    badge: 'text-blue-400',
    badgeVariant: 'default' as const,
  },
  {
    value: 'REGULAR' as const,
    label: 'Regular',
    title: 'Curso Técnico Regular',
    description: 'Cursos técnicos de nível médio com carga horária extensa e habilitação profissional.',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-1.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    activeRing: 'ring-2 ring-purple-500',
    activeBg: 'bg-purple-500/8',
    iconBg: 'bg-purple-500/15 text-purple-400',
    iconBgInactive: 'bg-zinc-700/80 text-zinc-400',
    badge: 'text-purple-400',
    badgeVariant: 'secondary' as const,
  },
] as const

export function CreateCoursePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<'FIC' | 'REGULAR'>('FIC')
  const [totalHours, setTotalHours] = useState('')
  const [error, setError] = useState('')

  const mutation = useMutation<Course, ApiError, CreateCourseBody>({
    mutationFn: createCourse,
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: ['courses'] })
      navigate(`/courses/${course.id}`)
    },
    onError: (err) => setError(err.message ?? 'Erro ao criar curso'),
  })

  function handleSubmit() {
    if (!name.trim()) return
    if (type === 'FIC' && !totalHours) return
    setError('')
    mutation.mutate({
      name: name.trim(),
      ...(desc.trim() ? { description: desc.trim() } : {}),
      type,
      ...(type === 'FIC' ? { total_hours: Number(totalHours) } : {}),
    })
  }

  const selectedOpt = TYPE_OPTIONS.find((o) => o.value === type)!

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page header */}
      <div>
        <Link
          to="/courses"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Cursos
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-white">Novo Curso</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Preencha as informações abaixo para cadastrar um novo curso no sistema.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* ── Left: form ── */}
        <div className="space-y-5 lg:col-span-2">

          {/* Basic info section */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Informações básicas
            </h2>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">
                  Nome do curso <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="Ex: Eletricista Industrial"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError('') }}
                />
                <p className="text-xs text-zinc-600">Dê um nome claro e objetivo ao curso.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-zinc-400">Descrição</label>
                <Textarea
                  placeholder="Descreva o objetivo, público-alvo ou informações relevantes sobre o curso (opcional)"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={4}
                />
              </div>

              {type === 'FIC' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-400">
                    Carga horária total (h) <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Ex: 40"
                    value={totalHours}
                    onChange={(e) => setTotalHours(e.target.value)}
                  />
                  <p className="text-xs text-zinc-600">
                    Para cursos REGULAR, as horas são calculadas automaticamente pela soma das UCs.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Type section */}
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Tipo de curso
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TYPE_OPTIONS.map((opt) => {
                const isActive = type === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`rounded-xl border p-4 text-left transition-all duration-150 ${
                      isActive
                        ? `border-transparent ${opt.activeRing} ${opt.activeBg}`
                        : 'border-zinc-700/80 bg-zinc-800/40 hover:border-zinc-600 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 shrink-0 rounded-lg p-2 transition-colors ${
                        isActive ? opt.iconBg : opt.iconBgInactive
                      }`}>
                        {opt.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-white">{opt.title}</span>
                          {isActive && (
                            <span className={`text-xs font-medium ${opt.badge}`}>✓ Selecionado</span>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                          {opt.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── Right: preview ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Prévia
              </h2>
              <div className="rounded-xl border border-zinc-700/60 bg-zinc-800/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className={`text-sm font-medium leading-snug ${name.trim() ? 'text-white' : 'italic text-zinc-600'}`}>
                    {name.trim() || 'Nome do curso'}
                  </p>
                  <Badge variant={type === 'FIC' ? 'default' : 'secondary'} className="shrink-0">
                    {type}
                  </Badge>
                </div>
                {desc.trim() && (
                  <p className="mt-2 line-clamp-3 text-xs text-zinc-500">{desc}</p>
                )}
                <p className="mt-3 text-xs text-zinc-700">
                  Criado em {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="mt-4 space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-xs font-medium text-zinc-500">Resumo</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Tipo</span>
                    <span className={`font-medium ${selectedOpt.badge}`}>{selectedOpt.title}</span>
                  </div>
                  {type === 'FIC' ? (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Horas</span>
                      <span className="text-zinc-400">{totalHours ? `${totalHours}h` : '—'}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-zinc-600">UCs</span>
                      <span className="text-zinc-400">0 cadastradas</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <p className="px-1 text-xs text-zinc-600">
              Após criar o curso você será redirecionado para a página de detalhes, onde pode adicionar as Unidades Curriculares.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-6">
        <Button variant="ghost" asChild>
          <Link to="/courses">Cancelar</Link>
        </Button>
        <Button
          size="lg"
          disabled={!name.trim() || (type === 'FIC' && !totalHours) || mutation.isPending}
          onClick={handleSubmit}
          className="px-8"
        >
          {mutation.isPending && <Spinner size="sm" className="mr-1" />}
          Criar Curso
        </Button>
      </div>
    </div>
  )
}
