import mongoose from "mongoose";
import type { ModerationStatus } from "../moderation.js";

// Con NODE_ENV=test (npm run start:test) se usa una base de datos aparte,
// para que los tests E2E puedan borrarla sin tocar los datos de desarrollo.
const url =
  process.env.NODE_ENV === "test"
    ? process.env.MONGODB_URI_TEST ||
      "mongodb://127.0.0.1:27017/marketplace-beauchef-test"
    : process.env.MONGODB_URI ||
      "mongodb://127.0.0.1:27017/marketplace-beauchef";
mongoose.set("strictQuery", false);
mongoose.connect(url).catch(() => {
  console.log("error conectando a mongodb");
});

export type ProductStatus = ModerationStatus;

export interface ProductDocument extends mongoose.Document {
  name: string;
  description: string;
  price: number;
  image: string[] | null;
  seller: string;
  category: string;
  user: mongoose.Types.ObjectId | null;
  status: ProductStatus;
  favoriteCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: [String],
      default: null,
    },
    seller: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: "active",
    },
    // Contador desnormalizado: se incrementa/decrementa atomicamente al
    // marcar/desmarcar un favorito (ver controllers/users.ts).
    favoriteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

productSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    const { __v, ...rest } = returnedObject;
    return rest;
  },
});

const Product = mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
