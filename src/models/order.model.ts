import mongoose, { Document, Schema, Types } from 'mongoose';
import { I18nText } from './category.model';
import { ORDER_STATUS } from '../types/consts';

export interface OrderItem {
  product: Types.ObjectId;
  name: I18nText;
  price: number;
  quantity: number;
}

export interface OrderDocument extends Document {
  _id: Types.ObjectId;
  client: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  status: ORDER_STATUS;
  confirmedBy: Types.ObjectId | null;
  confirmedAt: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const i18nTextSchema = new Schema<I18nText>(
  {
    en: { type: String, required: true },
    fr: { type: String, required: true },
    ar: { type: String, required: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema<OrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: i18nTextSchema, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    confirmedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const OrderModel = mongoose.model<OrderDocument>('Order', orderSchema);
