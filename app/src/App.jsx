import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { BottomNav } from '@/components/layout/BottomNav'
import { CardSkeleton } from '@/components/layout/Skeleton'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Produtos = lazy(() => import('@/pages/Produtos'))
const Vendas = lazy(() => import('@/pages/Vendas'))
const Relatorios = lazy(() => import('@/pages/Relatorios'))

function PageFallback() {
  return (
    <div className="px-4 pt-6 pb-28 space-y-4">
      {[...Array(4)].map((_, i) => <CardSkeleton key={i} lines={2} />)}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <main className="flex-1 overflow-y-auto">
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/relatorios" element={<Relatorios />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
      <Toaster
        position="top-center"
        theme="light"
        richColors
        toastOptions={{
          style: { fontFamily: 'Inter, system-ui, sans-serif' },
        }}
      />
    </BrowserRouter>
  )
}
