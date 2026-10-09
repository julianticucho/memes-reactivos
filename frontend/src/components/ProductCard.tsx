import { useNavigate } from "react-router-dom";
import type { Product } from "../types/products";

interface ProductCardProps {
  product: Product
}

const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product._id}`)}
    >
      <img
        src={product.image?.[0] || "/no-image.avif"}
        alt={product.name}
      />
      <p className="product-name">{product.name}</p>
    </div>
  );
};

export default ProductCard;
