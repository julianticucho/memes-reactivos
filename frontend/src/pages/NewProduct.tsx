import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import productsService from "../services/products";
import type { Product } from "../types/products";
import FileUploader from "../components/FileUploader";
import type { UploaderFile } from "../components/FileUploader";
import ModalWindow from "../components/ModalWindow";

const CATEGORIES = [
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Libros",
  "Otros",
];

/* Las imagenes guardadas son data URLs (Product.image: string[]); el
   uploader trabaja con UploaderFile, asi que al abrirlas les derivamos
   tipo MIME y extension del propio data URL. */
const mimeFromDataUrl = (url: string): string => {
  if (!url.startsWith("data:")) return "";
  const end = url.indexOf(";");
  return end === -1 ? "" : url.slice(5, end);
};

const MIME_EXT: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

const toUploaderFiles = (urls: string[]): UploaderFile[] =>
  urls.map((url, idx) => {
    const type = mimeFromDataUrl(url);
    return {
      name: `image-${idx + 1}${MIME_EXT[type] ?? ""}`,
      type,
      url,
    };
  });

interface NewProductProps {
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
  product?: Product;
}

const NewProduct = ({ setToast, product }: NewProductProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState(product?.category ?? "");

  // Images are base64 data URLs, we save that as a string. The uploader
  // works with UploaderFile, so they get converted on both edges.
  const [images, setImages] = useState<UploaderFile[]>(
    toUploaderFiles(product?.image ?? []),
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const data = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      image: images.length > 0 ? images.map((file) => file.url) : null,
    };
    const request = product
      ? productsService.update(product._id, data)
      : productsService.create(data);
    request
      .then((saved) => {
        const inReview = saved.status === "pending";
        if (product) {
          setToast({
            message: inReview
              ? "Producto actualizado. Tu publicación está siendo revisada."
              : "Producto actualizado",
            severity: "success",
          });
          navigate(`/product/${saved._id}`);
        } else if (inReview) {
          setToast({
            message:
              "Tu publicación está siendo revisada. Se publicará cuando sea aprobada.",
            severity: "success",
          });
          navigate("/profile");
        } else {
          setToast({ message: "Producto publicado", severity: "success" });
          navigate("/");
        }
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.error ||
          (product
            ? "Error al actualizar (¿sesión expirada?)"
            : "Error al publicar (¿sesión expirada?)");
        setToast({ message: msg, severity: "error" });
      });
  };

  // Cerrar la ventana vuelve al catalogo, o a la publicacion si se estaba
  // editando (mismo cierre que el botón Close de ProductDetail).
  const handleClose = () => navigate(product ? `/product/${product._id}` : "/");

  return (
    <ModalWindow
      title={product ? "Editar producto" : "Publicar producto"}
      className="detail-window"
      size={460}
      onClose={handleClose}
    >
      <div className="form-panel">
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <input
            placeholder="Nombre"
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Descripción"
            required
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            placeholder="Precio"
            required
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <FileUploader value={images} onChange={setImages} accept="image/*" />

          <div className="dialog-buttons">
            <button type="button" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit">
              {product ? "Guardar cambios" : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </ModalWindow>
  );
};

export default NewProduct;
