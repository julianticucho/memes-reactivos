import axios from 'axios'
import type { Product } from '../types/products'

const baseUrl = '/api/products'

const getAll = () => {
  return axios.get<Product[]>(baseUrl).then(response => response.data)
}

interface ProductCreateData {
  name: string
  description: string
  price: number
  image?: string | null
  seller: string
  category: string
}

const create = (data: ProductCreateData) => {
  return axios.post<Product>(baseUrl, data).then(response => response.data)
}

export default {
  getAll,
  create,
}
