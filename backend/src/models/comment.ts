import mongoose from "mongoose";
import type { ModerationStatus } from "../moderation.js";

export interface CommentDocument extends mongoose.Document {
  text: string;
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  username: string;
  status: ModerationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "pending"],
      default: "active",
    },
  },
  { timestamps: true },
);

// Listado de comentarios de un producto, en orden cronologico.
commentSchema.index({ product: 1, createdAt: 1 });

commentSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    const { __v, ...rest } = returnedObject;
    return rest;
  },
});

const Comment = mongoose.model<CommentDocument>("Comment", commentSchema);

export default Comment;
