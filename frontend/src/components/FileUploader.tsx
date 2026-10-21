import { useId, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";

/* Un archivo del uploader. El contenido viaja como data URL en base64,
   igual que Product.image: no hay subida de archivos al backend. */
export interface UploaderFile {
  name: string;
  type: string;
  url: string;
}

/* Familias de icono XP por tipo MIME. Hoy solo resolvemos la familia de
   cada archivo: la lista ya renderiza su slot (file-icon--<familia>),
   los graficos se cargan despues. Sin match, familia generica "file". */
const ICON_FAMILIES: Array<[pattern: RegExp, family: string]> = [
  [/^image\//, "image"],
  [/^video\//, "video"],
  [/^audio\//, "audio"],
  [/^text\//, "text"],
  [/^application\/(pdf|msword|vnd\.openxmlformats)/, "document"],
  [/^application\/(zip|gzip|x-7z|x-rar|x-tar)/, "archive"],
  [/^application\/(x-msdownload|x-msdos-program)/, "program"],
];

const iconFamilyOf = (type: string): string =>
  ICON_FAMILIES.find(([pattern]) => pattern.test(type))?.[1] ?? "file";

/* Solo las imagenes tienen vista previa en el monitor. */
const isImage = (file: UploaderFile): boolean =>
  file.type.startsWith("image/") || file.url.startsWith("data:image/");

const readAsUploaderFile = (file: File): Promise<UploaderFile> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        url: String(reader.result),
      });
    reader.readAsDataURL(file);
  });

interface FileUploaderProps {
  value: UploaderFile[];
  onChange: (files: UploaderFile[]) => void;
  accept?: string;
  multiple?: boolean;
}

/* Selector de "fondo de escritorio" estilo Display Properties de XP:
   arriba un monitor que muestra el archivo seleccionado como fondo, y
   abajo la lista de archivos con su columna de botones Examinar /
   Eliminar. El indice de seleccion es estado interno; si el padre
   recorta la lista se acota en el momento de usarlo (sin efectos). */
const FileUploader = ({
  value,
  onChange,
  accept,
  multiple = true,
}: FileUploaderProps) => {
  const listId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const current = value.length > 0 ? Math.min(selected, value.length - 1) : -1;
  const currentFile = current >= 0 ? value[current] : null;
  const optionId = (idx: number) => `${listId}-option-${idx}`;

  const handleBrowse = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    // Reset para que el mismo archivo se pueda volver a elegir
    e.target.value = "";
    if (picked.length === 0) return;
    try {
      const added = await Promise.all(picked.map(readAsUploaderFile));
      onChange([...value, ...added]);
      // Lo recien agregado queda "encendido" en el monitor
      setSelected(value.length + added.length - 1);
      setError(null);
    } catch {
      setError("No se pudieron leer los archivos seleccionados");
    }
  };

  const handleDelete = () => {
    if (current < 0) return;
    const next = value.filter((_, i) => i !== current);
    onChange(next);
    // La seleccion queda en el mismo lugar (o en el ultimo si se borro
    // el final), como al borrar un archivo en el explorador de XP.
    setSelected(Math.min(current, Math.max(0, next.length - 1)));
  };

  const handleListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const last = value.length - 1;
    if (e.key === "ArrowDown") setSelected(Math.min(current + 1, last));
    else if (e.key === "ArrowUp") setSelected(Math.max(current - 1, 0));
    else if (e.key === "Home") setSelected(0);
    else if (e.key === "End") setSelected(last);
    else if (e.key === "Delete" || e.key === "Backspace") handleDelete();
    else return;
    e.preventDefault();
  };

  let preview = <span className="no-image">Sin archivos</span>;
  if (currentFile && isImage(currentFile)) {
    preview = <img src={currentFile.url} alt={currentFile.name} />;
  } else if (currentFile) {
    preview = <span className="no-image">Vista previa no disponible</span>;
  }

  return (
    <div className="file-uploader">
      <div className="monitor">
        <div className="monitor-screen">{preview}</div>
        <div className="monitor-stand" />
      </div>

      <div className="uploader-body">
        <div className="file-list">
          {value.length === 0 ? (
            <p className="empty-state">Sin archivos</p>
          ) : (
            <ul
              role="listbox"
              aria-label="Archivos"
              aria-activedescendant={optionId(current)}
              tabIndex={0}
              onKeyDown={handleListKeyDown}
            >
              {value.map((file, idx) => (
                <li
                  key={`${file.name}-${idx}`}
                  id={optionId(idx)}
                  role="option"
                  aria-selected={idx === current}
                  className="file-row"
                  onClick={() => setSelected(idx)}
                >
                  <span
                    className={`file-icon file-icon--${iconFamilyOf(file.type)}`}
                    aria-hidden="true"
                  />
                  <span className="file-name">{file.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="uploader-actions">
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            Examinar...
          </button>
          <button type="button" disabled={current < 0} onClick={handleDelete}>
            Eliminar
          </button>
        </div>
      </div>

      {error && (
        <p className="uploader-error" role="alert">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}

        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleBrowse}
        style={{ display: "none" }}
      />
    </div>
  );
};

export default FileUploader;
