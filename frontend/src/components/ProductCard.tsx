import { useNavigate } from "react-router-dom";
import type { Product } from "../types/products";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <div className="product-card-icon">
        <img src={product.image?.[0] || "/no-image.avif"} alt={product.name} />
      </div>
      <div className="product-card-label">
        <p className="product-name">{product.name}</p>
        <p className="product-seller">{product.seller}</p>
        <p className="product-price">${product.price}</p>
      </div>
    </div>
  );
};

export default ProductCard;
