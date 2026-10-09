import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { Product } from "../types/products";
import productsService from "../services/products";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    productsService
      .getById(id)
      .then(setProduct)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Cargando...</p>;
  if (!product) return <p>Producto no encontrado</p>;

  return (
    <>
      <h1>{product.name}</h1>
      {product.image && product.image.length > 0 && (
        <div className="detail-images">
          {product.image.map((img, idx) => (
            <img key={idx} src={img} alt={`${product.name} ${idx + 1}`} />
          ))}
        </div>
      )}
      <fieldset>
        <legend>Detalles</legend>
        <p>{product.description}</p>
        <div className="field-row">
          <label>Precio:</label>
          <span>${product.price}</span>
        </div>
        <div className="field-row">
          <label>Vendedor:</label>
          <span>{product.seller}</span>
        </div>
        <div className="field-row">
          <label>Categoría:</label>
          <span>{product.category}</span>
        </div>
      </fieldset>
    </>
  );
};

export default ProductDetail;
