export type Role = "user" | "moderator" | "admin"

export interface User {
  id: string
  username: string
  email: string
  role: Role
}
