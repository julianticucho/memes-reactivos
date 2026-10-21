import type { CSSProperties, ReactNode } from "react";

interface WindowProps {
  title: string;
  /* Ancho de la ventana: number se interpreta como px, string acepta
     cualquier unidad CSS ("360px", "20rem", ...). Si se omite, la
     ventana se dimensiona por su contenido (fit-content). */
  size?: number | string;
  /* Estilo inline extra (margin, position, ...) aplicado al marco. */
  style?: CSSProperties;
  /* Variante visual de la ventana: detail-window, confirm-window, ...
     define el color del cuerpo, la sombra, el max-width, etc. */
  className?: string;
  /* Anuncia la ventana como dialogo modal (role=dialog + aria-modal). */
  dialog?: boolean;
  /* Si se pasa, dibuja el boton Close de la barra de titulo. */
  onClose?: () => void;
  children: ReactNode;
}

/* La ventana XP por defecto: el marco .window de XP.css con su barra de
   titulo (texto + controles) y el window-body. Representa cualquier
   ventana de la app; la variante la define className y el ancho el prop
   size (estilo inline), o el contenido si size no se pasa. */
const Window = ({
  title,
  size,
  style,
  className,
  dialog,
  onClose,
  children,
}: WindowProps) => {
  return (
    <div
      className={className ? `window ${className}` : "window"}
      style={{ width: size ?? "fit-content", ...style }}
      role={dialog ? "dialog" : undefined}
      aria-modal={dialog || undefined}
      aria-label={dialog ? title : undefined}
    >
      <div className="title-bar">
        <div className="title-bar-text">{title}</div>
        {onClose && (
          <div className="title-bar-controls">
            <button type="button" aria-label="Close" onClick={onClose} />
          </div>
        )}
      </div>
      <div className="window-body">{children}</div>
    </div>
  );
};

export default Window;
