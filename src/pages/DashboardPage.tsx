import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const NAV_CARDS = [
  {
    to: '/courses',
    label: 'Cursos',
    description: 'Gerencie cursos FIC e Regulares e suas UCs.',
  },
  {
    to: '/teachers',
    label: 'Professores',
    description: 'Cadastre e gerencie os professores e suas escalas.',
  },
  {
    to: '/rooms',
    label: 'Salas',
    description: 'Cadastre e gerencie as salas de aula disponíveis.',
  },
  {
    to: '/calendar',
    label: 'Calendário',
    description: 'Visualize a agenda de aulas e gerencie o calendário letivo.',
  },
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-semibold text-white">Dashboard</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Bem-vindo, <span className="text-white">{user?.name}</span>. O sistema está em construção.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            <p className="text-sm font-semibold text-white group-hover:text-zinc-100">
              {card.label}
            </p>
            <p className="mt-1 text-xs text-zinc-500 group-hover:text-zinc-400">
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
