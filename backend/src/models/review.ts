import mongoose from "mongoose";

export interface ReviewDocument extends mongoose.Document {
  text: string | null;
  vote: 1 | -1;
  reviewedUser: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  username: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      default: null,
      minlength: 1,
      maxlength: 500,
    },
    vote: {
      type: Number,
      required: true,
      enum: [1, -1],
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  },
  { timestamps: true },
);

// Una cuenta solo puede dejar una reseña por perfil.
reviewSchema.index({ user: 1, reviewedUser: 1 }, { unique: true });

reviewSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    const { __v, ...rest } = returnedObject;
    return rest;
  },
});

const Review = mongoose.model<ReviewDocument>("Review", reviewSchema);

export default Review;
