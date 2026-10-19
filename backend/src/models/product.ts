import mongoose from "mongoose";

const url =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/marketplace-beauchef";
mongoose.set("strictQuery", false);
mongoose.connect(url).catch(() => {
  console.log("error conectando a mongodb");
});

export type ProductStatus = "active" | "pending";

export interface ProductDocument extends mongoose.Document {
  name: string;
  description: string;
  price: number;
  image: string[] | null;
  seller: string;
  category: string;
  user: mongoose.Types.ObjectId | null;
  status: ProductStatus;
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
