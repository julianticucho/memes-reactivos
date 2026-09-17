import type { Product } from '../types/products'

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 16 }}>
      <h3 style={{ margin: '0 0 4px' }}>{product.name}</h3>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>
        $
        {product.price.toLocaleString('es-CL')}
      </p>
      <p style={{ margin: '0 0 8px', color: '#555' }}>{product.description}</p>
      <small style={{ color: '#888' }}>
        {product.seller}
        {' '}
        ·
        {' '}
        {product.category}
      </small>
    </div>
  )
}

export default ProductCard
