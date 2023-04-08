import { createBrowserRouter } from 'react-router-dom'
import { Table } from '../pages/table'
import { Root } from '../pages/root'
import { Login } from '../pages/login'
import { ProtectedRoute } from '../guard/protected-route'
import { Register } from '../pages/register'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 't/:tableId/:viewId?',
        element: <Table />,
      },
    ],
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
])
