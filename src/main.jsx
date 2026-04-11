import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import './App.css'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import StratsPage from './pages/StratsPage'
import VodPage from './pages/VodPage'

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/strats', element: <StratsPage /> },
      { path: '/vod', element: <VodPage /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
