import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import productsService from '../services/products'

const CATEGORIES = ['Electrónica', 'Ropa', 'Hogar', 'Deportes', 'Libros', 'Otros']

const NewProduct = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [seller, setSeller] = useState('')
  const [category, setCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    productsService.create({
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      seller: seller.trim(),
      category,
    })
      .then(() => navigate('/'))
      .catch(() => alert('Error al publicar'))
  }

  return (
    <>
      <h1>Publicar producto</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input placeholder="Nombre" required value={name} onChange={e => setName(e.target.value)} />
        <textarea placeholder="Descripción" required rows={2} value={description} onChange={e => setDescription(e.target.value)} />
        <input placeholder="Precio" required type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <input placeholder="Vendedor" required value={seller} onChange={e => setSeller(e.target.value)} />
        <select required value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Categoría</option>
          {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button type="submit">Publicar</button>
      </form>
    </>
  )
}

export default NewProduct