export interface Product {
  _id: string
  name: string
  description: string
  price: number
  image: string[] | null
  seller: string
  category: string
  createdAt: string
  updatedAt: string
}
