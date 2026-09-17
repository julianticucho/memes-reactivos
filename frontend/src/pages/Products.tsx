import { useEffect, useState } from 'react'
import type { Product } from '../types/products'
import productsService from '../services/products'
import ProductCard from '../components/ProductCard'

interface ProductsProps {
  setToast: (toast: { message: string, severity: 'success' | 'error' } | null) => void
}

const CATEGORIES = ['Electrónica', 'Ropa', 'Hogar', 'Deportes', 'Libros', 'Otros']

function Products({ setToast }: ProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [seller, setSeller] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    productsService.getAll()
      .then(data => setProducts(data))
      .catch(() => setToast({ message: 'Error al cargar productos', severity: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    productsService.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      seller: seller.trim(),
      category,
    })
      .then((product) => {
        setProducts(products.concat(product))
        setName('')
        setDescription('')
        setPrice('')
        setSeller('')
        setCategory('')
        setToast({ message: 'Producto publicado', severity: 'success' })
      })
      .catch(() => setToast({ message: 'Error al publicar', severity: 'error' }))
  }

  return (
    <>
      <h1>Productos disponibles</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 32, padding: 16, border: '1px solid #ccc', borderRadius: 4 }}>
        <h3 style={{ margin: '0 0 12px' }}>Nuevo producto</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
          <input placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} />
          <textarea placeholder="Descripción" required rows={2} value={description} onChange={e => setDescription(e.target.value)} />
          <input placeholder="Precio" required type="number" value={price} onChange={e => setPrice(e.target.value)} />
          <input placeholder="Vendedor" required value={seller} onChange={e => setSeller(e.target.value)} />
          <select required value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Categoría</option>
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <button type="submit">Publicar</button>
        </div>
      </form>

      {loading
        ? <p>Cargando...</p>
        : products.length === 0
          ? <p>No hay productos publicados aún.</p>
          : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
    </>
  )
}

export default Products
