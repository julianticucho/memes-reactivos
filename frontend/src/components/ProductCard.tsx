import { useNavigate } from 'react-router-dom'
import type { Product } from '../types/products'

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/Product/${product._id}`)}
      style={{
        border: '1px solid #ccc',
        borderRadius: 4,
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      <img
        src={product.image?.[0] || '/no-image.avif'}
        alt={product.name}
        style={{ width: '100%', height: 200, objectFit: 'cover' }}
      />
      <div style={{ padding: 12 }}>
        <h3 style={{ margin: 0 }}>{product.name}</h3>
      </div>
    </div>
  )
}

export default ProductCard