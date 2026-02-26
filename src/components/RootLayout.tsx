import { Outlet, useNavigate } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'

export function RootLayout() {
  const navigate = useNavigate()
  return (
    <HeroUIProvider navigate={navigate}>
      <Outlet />
    </HeroUIProvider>
  )
}
