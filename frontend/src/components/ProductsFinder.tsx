import { useState } from "react";
import type { Product } from "../types/products";
import ProductCard from "./ProductCard";

const PER_PAGE = 16;
const FIRST_PAGE = 15;

const CATEGORIES = [
  "Todas",
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Libros",
  "Otros",
];

type PageItem = number | "ellipsis";

function getPageItems(totalPages: number, current: number): PageItem[] {
  if (totalPages <= 9) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages]);
  for (let p = current - 2; p <= current + 2; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  if (current <= 4) {
    for (let p = 1; p <= 5; p++) pages.add(p);
  }
  if (current >= totalPages - 3) {
    for (let p = totalPages - 4; p <= totalPages; p++) {
      if (p >= 1) pages.add(p);
    }
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev !== 0 && p - prev > 1) items.push("ellipsis");
    items.push(p);
    prev = p;
  }
  return items;
}

interface ProductsFinderProps {
  products: Product[];
}

const ProductsFinder = ({ products }: ProductsFinderProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const filtered = products.filter((p) => {
    const matchesName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory
      = selectedCategory === "Todas" || p.category === selectedCategory;
    return matchesName && matchesCategory;
  });

  const ordered = [...filtered].sort((a, b) =>
    sortOrder === "newest"
      ? b.createdAt.localeCompare(a.createdAt)
      : a.createdAt.localeCompare(b.createdAt),
  );

  const totalPages = ordered.length <= FIRST_PAGE
    ? 1
    : 1 + Math.ceil((ordered.length - FIRST_PAGE) / PER_PAGE);
  const current = Math.min(page, totalPages);
  const start = current === 1 ? 0 : FIRST_PAGE + (current - 2) * PER_PAGE;
  const end = current === 1 ? FIRST_PAGE : FIRST_PAGE + (current - 1) * PER_PAGE;
  const visible = ordered.slice(start, end);

  return (
    <>
      <div className="finder-bar">
        <label htmlFor="search">Búsqueda:</label>
        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        <label htmlFor="sort">Orden:</label>
        <select
          id="sort"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
        >
          <option value="newest">Más recientes</option>
          <option value="oldest">Más antiguos</option>
        </select>
        <label htmlFor="category">Filtro:</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="product-grid">
        {visible.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="empty-state">No se encontraron productos.</p>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Paginación">
          <button
            type="button"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            ‹ Anterior
          </button>
          {getPageItems(totalPages, current).map((item, i) =>
            typeof item === "number"
              ? (
                  <button
                    key={i}
                    type="button"
                    className={item === current ? "page-current" : undefined}
                    aria-current={item === current ? "page" : undefined}
                    onClick={() => setPage(item)}
                  >
                    {item}
                  </button>
                )
              : (
                  <span key={i} className="ellipsis" aria-hidden="true">
                    …
                  </span>
                ),
          )}
          <button
            type="button"
            disabled={current === totalPages}
            onClick={() => setPage(current + 1)}
          >
            Siguiente ›
          </button>
        </nav>
      )}
    </>
  );
};

export default ProductsFinder;
