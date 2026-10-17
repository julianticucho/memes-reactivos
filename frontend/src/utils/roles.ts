import type { User } from "../types/users";

export const isStaff = (user: User | null) =>
  user?.role === "moderator" || user?.role === "admin";
