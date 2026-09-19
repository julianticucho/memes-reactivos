import { useState } from 'react'
import type { Product } from '../types/products'
import ProductCard from './ProductCard'

const CATEGORIES = ['Todas', 'Electrónica', 'Ropa', 'Hogar', 'Deportes', 'Libros', 'Otros']

interface ProductsFinderProps {
  products: Product[]
}

const ProductsFinder = ({ products }: ProductsFinderProps) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todas')

  const filtered = products.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory
    return matchesName && matchesCategory
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ padding: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <div
          onClick={() => window.location.href = '/Product/New'}
          style={{
            border: '2px dashed #ccc',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 260,
            cursor: 'pointer',
            fontSize: 18,
            color: '#888',
          }}
        >
          + Publicar un producto
        </div>
        {filtered.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </>
  )
}

export default ProductsFinder