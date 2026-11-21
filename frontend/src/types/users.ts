export type Role = "user" | "moderator" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  // Foto de perfil: data URL base64 o null (fallback /no-avatar.png).
  avatar?: string | null;
}
