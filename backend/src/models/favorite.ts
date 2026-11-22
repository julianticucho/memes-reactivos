import mongoose from "mongoose";

// Favorito como documento propio: un par (usuario, producto) por fila.
// El contador desnormalizado vive en Product.favoriteCount y lo mantienen
// los endpoints de controllers/users.ts.
export interface FavoriteDocument extends mongoose.Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  createdAt: Date;
}

const favoriteSchema = new mongoose.Schema<FavoriteDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

// Unico compuesto: garantiza un favorito por usuario/producto y acelera
// las busquedas por usuario.
favoriteSchema.index({ user: 1, product: 1 }, { unique: true });
// Listar los favoritos de un usuario ordenados por fecha de marcado.
favoriteSchema.index({ user: 1, createdAt: -1 });

favoriteSchema.set("toJSON", {
  transform: (
    _document,
    returnedObject: {
      id?: string;
      _id?: mongoose.Types.ObjectId;
      __v?: number;
    },
  ) => {
    returnedObject.id = returnedObject._id?.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Favorite = mongoose.model<FavoriteDocument>("Favorite", favoriteSchema);

export default Favorite;
