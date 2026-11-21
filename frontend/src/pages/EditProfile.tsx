import { useState } from "react";
import type { FormEvent } from "react";
import usersService from "../services/users";
import type { ProfileUpdate } from "../services/users";
import type { User } from "../types/users";
import FileUploader from "../components/FileUploader";
import type { UploaderFile } from "../components/FileUploader";
import ModalWindow from "../components/ModalWindow";
import useAuthStore from "../store/authStore";
import useUiStore from "../store/uiStore";

interface EditProfileProps {
  /* Cierra el modal: el estado vive en la URL (?edit=...), igual que el
     detalle de producto, así F5 lo mantiene y el botón atrás lo cierra. */
  onClose: () => void;
}

const toUploaderFiles = (avatar: string | null | undefined): UploaderFile[] =>
  avatar ? [{ name: "avatar.png", type: "image/png", url: avatar }] : [];

/* Estilo de error de campo inline (convención del proyecto). */
const fieldErrorStyle = {
  color: "#f44336",
  backgroundColor: "#ffebee",
  padding: "8px 12px",
  borderRadius: 4,
} as const;

const EditProfile = ({ onClose }: EditProfileProps) => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const notify = useUiStore((state) => state.notify);

  const [avatar, setAvatar] = useState<UploaderFile[]>(
    toUploaderFiles(user?.avatar),
  );
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (!user) return null;

  const showError = (
    err: { response?: { data?: { error?: string } } },
    fallback: string,
  ): string => err?.response?.data?.error || fallback;

  const handleSaveAvatar = (next?: UploaderFile[]) => {
    setAvatarError(null);
    const files = next ?? avatar;
    usersService
      .updateAvatar(files[0]?.url ?? null)
      .then((updated: User) => {
        setUser(updated);
        notify("Foto actualizada", "success");
      })
      .catch((err) =>
        setAvatarError(showError(err, "Error al guardar la foto")),
      );
  };

  const handleChangeEmail = (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    const data: ProfileUpdate = {
      email: email.trim(),
      currentPassword: emailPassword,
    };
    usersService
      .updateProfile(data)
      .then((updated: User) => {
        setUser(updated);
        setEmailPassword("");
        notify("Email actualizado", "success");
      })
      .catch((err) =>
        setEmailError(showError(err, "Error al cambiar el email")),
      );
  };

  const handleChangePassword = (e: FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 3) {
      setPasswordError("La contraseña debe tener al menos 3 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return;
    }
    const data: ProfileUpdate = { currentPassword, newPassword };
    usersService
      .updateProfile(data)
      .then(() => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        notify("Contraseña actualizada", "success");
      })
      .catch((err) =>
        setPasswordError(showError(err, "Error al cambiar la contraseña")),
      );
  };

  return (
    <ModalWindow
      title="Editar perfil"
      className="detail-window"
      size={460}
      onClose={onClose}
    >
      <form onSubmit={handleChangeEmail}>
        <fieldset>
          <legend>Foto de perfil</legend>
          <FileUploader
            value={avatar}
            onChange={setAvatar}
            accept="image/*"
            multiple={false}
          />
          {avatarError && <p style={fieldErrorStyle}>{avatarError}</p>}
          <div className="dialog-buttons">
            <button
              type="button"
              onClick={() => {
                setAvatar([]);
                handleSaveAvatar([]);
              }}
            >
              Quitar foto
            </button>
            <button type="button" onClick={() => handleSaveAvatar()}>
              Guardar foto
            </button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Email</legend>
          <input
            placeholder="Email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Contraseña actual"
            required
            type="password"
            autoComplete="current-password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
          />
          {emailError && <p style={fieldErrorStyle}>{emailError}</p>}
          <div className="dialog-buttons">
            <button type="submit">Cambiar email</button>
          </div>
        </fieldset>
      </form>

      <form onSubmit={handleChangePassword}>
        <fieldset>
          <legend>Contraseña</legend>
          <input
            placeholder="Contraseña actual"
            required
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <input
            placeholder="Nueva contraseña"
            required
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <input
            placeholder="Confirmar nueva contraseña"
            required
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {passwordError && <p style={fieldErrorStyle}>{passwordError}</p>}
          <div className="dialog-buttons">
            <button type="submit">Cambiar contraseña</button>
          </div>
        </fieldset>
      </form>
    </ModalWindow>
  );
};

export default EditProfile;
