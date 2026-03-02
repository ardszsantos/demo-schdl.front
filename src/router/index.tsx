import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from '../components/RootLayout'
import { AppLayout } from '../components/AppLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { PublicOnlyRoute } from '../components/PublicOnlyRoute'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { DashboardPage } from '../pages/DashboardPage'
import { CoursesPage } from '../pages/CoursesPage'
import { CreateCoursePage } from '../pages/CreateCoursePage'
import { CourseDetailPage } from '../pages/CourseDetailPage'
import { RoomsPage } from '../pages/RoomsPage'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/courses', element: <CoursesPage /> },
              { path: '/courses/new', element: <CreateCoursePage /> },
              { path: '/courses/:id', element: <CourseDetailPage /> },
              { path: '/rooms', element: <RoomsPage /> },
            ],
          },
        ],
      },
      { path: '/', element: <Navigate to="/login" replace /> },
      { path: '*', element: <Navigate to="/login" replace /> },
    ],
  },
])
