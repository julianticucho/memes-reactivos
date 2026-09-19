import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import productsService from "../services/products";

const CATEGORIES = [
  "Electrónica",
  "Ropa",
  "Hogar",
  "Deportes",
  "Libros",
  "Otros",
];

const NewProduct = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [seller, setSeller] = useState("");
  const [category, setCategory] = useState("");

  // Images are base64 data URLs, we save that as a string.
  const [images, setImages] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImages((prev) => {
        const next = [...prev, reader.result as string];
        setSelectedIdx(next.length - 1);
        return next;
      });
    };
    reader.readAsDataURL(file);

    // Reset so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemoveImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setSelectedIdx((current) => {
        if (current >= next.length) return Math.max(0, next.length - 1);
        if (current > idx) return current - 1;
        return current;
      });
      return next;
    });
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    productsService
      .create({
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        seller: seller.trim(),
        category,
        image: images.length > 0 ? images[selectedIdx] : null,
      })
      .then(() => navigate("/"))
      .catch(() => alert("Error al publicar"));
  };

  const selectedImage = images[selectedIdx] ?? null;

  let imagePreview = <span style={{ color: "#888" }}>Sin imagen</span>;
  if (selectedImage) {
    imagePreview = (
      <img
        src={selectedImage}
        alt="Preview"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }

  return (
    <>
      <h1>Publicar producto</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <input
          placeholder="Nombre"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          placeholder="Descripción"
          required
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          placeholder="Vendedor"
          required
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
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

        <div style={{ maxWidth: 400, marginBottom: 16 }}>
          <div
            style={{
              width: "100%",
              height: 300,
              borderRadius: 0,
              border: "1px solid #ccc",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f5f5f5",
            }}
          >
            {imagePreview}
          </div>

          <div
            style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto" }}
          >
            {images.map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  flexShrink: 0,
                  cursor: "pointer",
                  borderRadius: 4,
                  border:
                    idx === selectedIdx
                      ? "2px solid #a11"
                      : "2px solid transparent",
                }}
                onClick={() => setSelectedIdx(idx)}
              >
                <img
                  src={img}
                  alt={`Miniatura ${idx + 1}`}
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(idx);
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 18,
                    height: 18,
                    border: "none",
                    backgroundColor: "#a11",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: "bold",
                    lineHeight: "18px",
                    textAlign: "center",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                flexShrink: 0,
                width: 64,
                height: 64,
                border: "2px dashed #999",
                backgroundColor: "transparent",
                fontSize: 24,
                color: "#999",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              +
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAddImage}
              style={{ display: "none" }}
            />
          </div>
        </div>

        <button type="submit">Publicar</button>
      </form>
    </>
  );
};

export default NewProduct;
