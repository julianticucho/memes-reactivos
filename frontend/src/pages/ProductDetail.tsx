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
      {product.image?.map((img, idx) => (
        <img
          key={idx}
          src={img}
          alt={`${product.name} ${idx + 1}`}
          style={{
            width: "100%",
            maxHeight: 400,
            objectFit: "cover",
            borderRadius: 4,
          }}
        />
      ))}
      <p>{product.description}</p>
      <p>
        <strong>Precio:</strong> ${product.price}
      </p>
      <p>
        <strong>Vendedor:</strong>
        {product.seller}
      </p>
      <p>
        <strong>Categoría:</strong>
        {product.category}
      </p>
    </>
  );
};

export default ProductDetail;
