import mongoose, { Document, Schema, Types } from 'mongoose';

export interface CartItemSelectedOption {
  attribute: Types.ObjectId;
  option: Types.ObjectId;
}

export interface CartItem {
  // A product can appear as several lines (one per distinct option combination), so each
  // line needs its own stable id — quantity/removal target this, not the product id.
  _id: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number;
  // Normalized (sorted by attribute id) at write time so two adds of the same options
  // always match the same cart line — see helpers/productAttributeSelection.helper.ts.
  selectedOptions: CartItemSelectedOption[];
}

export interface CartDocument extends Document {
  _id: Types.ObjectId;
  client: Types.ObjectId;
  items: Types.DocumentArray<CartItem>;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSelectedOptionSchema = new Schema<CartItemSelectedOption>(
  {
    attribute: { type: Schema.Types.ObjectId, ref: 'ProductAttribute', required: true },
    option: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false },
);

const cartItemSchema = new Schema<CartItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedOptions: { type: [cartItemSelectedOptionSchema], default: [] },
});

const cartSchema = new Schema<CartDocument>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CartModel = mongoose.model<CartDocument>('Cart', cartSchema);
