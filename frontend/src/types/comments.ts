export interface Comment {
  _id: string;
  text: string;
  product: string;
  user: string;
  username: string;
  status: "active" | "pending";
  createdAt: string;
  updatedAt: string;
}

export interface ModerationComment {
  _id: string;
  text: string;
  product: { _id: string; name: string } | null;
  user: string;
  username: string;
  status: "active" | "pending";
  createdAt: string;
  updatedAt: string;
}
