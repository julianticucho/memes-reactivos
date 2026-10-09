import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Product } from "../types/products";
import ProductCard from "./ProductCard";

const CATEGORIES = [
  "Todas",
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Libros",
  "Otros",
];

interface ProductsFinderProps {
  products: Product[];
}

const ProductsFinder = ({ products }: ProductsFinderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const navigate = useNavigate();

  const filtered = products.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory
      = selectedCategory === "Todas" || p.category === selectedCategory;
    return matchesName && matchesCategory;
  });

  return (
    <>
      <fieldset>
        <legend>Buscar</legend>
        <div className="field-row">
          <label htmlFor="search">Nombre:</label>
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1 }}
          />
          <label htmlFor="category">Categoría:</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="product-grid">
        <div className="product-new" onClick={() => navigate("/product/new")}>
          + Publicar un producto
        </div>
        {filtered.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </>
  );
};

export default ProductsFinder;
