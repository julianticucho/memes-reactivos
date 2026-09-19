import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Home from './pages/Home'
import Profile from './pages/Profile'
import Login from './pages/Login'
import NewProduct from './pages/NewProduct'
import ProductDetail from './pages/ProductDetail'


function App() {
  const [toast, setToast] = useState<{ message: string, severity: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  return (
    <BrowserRouter>
      {toast && (
        <div style={{
          position: 'fixed', top: 16, right: 16, padding: '12px 20px',
          borderRadius: 4, color: '#fff',
          backgroundColor: toast.severity === 'success' ? '#4caf50' : '#f44336',
          zIndex: 1000,
        }}
        >
          {toast.message}
        </div>
      )}
      <nav style={{ padding: '12px 20px', backgroundColor: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Marketplace Beauchef</strong>
        <Link to="/productos" style={{ color: '#fff', textDecoration: 'none' }}>Productos</Link>
      </nav>
      <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Product/New" element={<NewProduct />} />
          <Route path="/Product/:id" element={<ProductDetail />} />
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export default App
