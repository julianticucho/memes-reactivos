export interface Product {
  _id: string
  name: string
  description: string
  price: number
  image: string[] | null
  seller: string
  category: string
  user?: string | null
  status: "active" | "pending"
  createdAt: string
  updatedAt: string
}
