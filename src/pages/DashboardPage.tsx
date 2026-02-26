import { Button, Chip } from '@heroui/react'
import { useAuth } from '../auth/AuthContext'

const roleLabels: Record<string, string> = {
  COORDINATOR: 'Coordenador',
  OPP: 'OPP',
}

export function DashboardPage() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-primary">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Gestão de Escala</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">{user?.name}</span>
            <Chip size="sm" color="primary" variant="flat">
              {roleLabels[user?.role ?? ''] ?? user?.role}
            </Chip>
            <Button size="sm" variant="flat" color="danger" onPress={logout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 p-6">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-white">Dashboard</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Bem-vindo, <span className="text-white">{user?.name}</span>. O sistema está em construção.
          </p>
        </div>
      </main>
    </div>
  )
}
