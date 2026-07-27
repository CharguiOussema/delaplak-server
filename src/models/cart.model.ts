import mongoose, { Document, Schema, Types } from 'mongoose';

export interface CartItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface CartDocument extends Document {
  _id: Types.ObjectId;
  client: Types.ObjectId;
  items: CartItem[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const cartSchema = new Schema<CartDocument>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CartModel = mongoose.model<CartDocument>('Cart', cartSchema);
