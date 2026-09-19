import { useParams } from 'react-router-dom'

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()

  return <h1>Detalle del producto {id}</h1>
}

export default ProductDetail