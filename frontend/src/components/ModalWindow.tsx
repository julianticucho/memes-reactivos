import { useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";
import Window from "./Window";

interface ModalWindowProps {
  title: string;
  /* Ancho (number = px, string = cualquier unidad). Sin size, la
     ventana se dimensiona por su contenido. */
  size?: number | string;
  /* Estilo inline extra aplicado al marco de la ventana. */
  style?: CSSProperties;
  /* Variante visual: detail-window, confirm-window, ... */
  className?: string;
  onClose: () => void;
  children: ReactNode;
}

/* Ventana XP montada sobre un overlay oscuro: el modal por defecto de la
   app. Siempre es dialogo modal (role=dialog + aria-modal via Window) y
   se cierra con el boton Close, con Escape o clickeando el fondo. */
const ModalWindow = ({
  title,
  size,
  style,
  className,
  onClose,
  children,
}: ModalWindowProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        // Solo un clic que nace en el fondo cierra; el del interior
        // burbuja hasta aca pero su origen no es el overlay.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Window
        title={title}
        size={size}
        style={style}
        className={className}
        dialog
        onClose={onClose}
      >
        {children}
      </Window>
    </div>
  );
};

export default ModalWindow;
