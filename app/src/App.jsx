import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { BottomNav } from '@/components/layout/BottomNav'
import Dashboard from '@/pages/Dashboard'
import Produtos from '@/pages/Produtos'
import Vendas from '@/pages/Vendas'
import Relatorios from '@/pages/Relatorios'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
      <Toaster
        position="top-center"
        theme="dark"
        richColors
        toastOptions={{
          style: { fontFamily: 'Inter, system-ui, sans-serif' },
        }}
      />
    </BrowserRouter>
  )
}
