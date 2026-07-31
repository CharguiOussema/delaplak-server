import mongoose, { Document, Schema, Types } from 'mongoose';
import { I18nText } from './category.model';
import { ORDER_STATUS } from '../types/consts';

// Frozen at order time (attribute/option names, like product `name`, may change or be
// deleted later — the order must keep showing what the client actually picked and paid for).
export interface OrderItemSelectedOption {
  attributeName: I18nText;
  optionName: I18nText;
  priceAdjustment: number;
}

export interface OrderItem {
  product: Types.ObjectId;
  name: I18nText;
  price: number;
  currency: string;
  quantity: number;
  selectedOptions: OrderItemSelectedOption[];
}

export interface OrderDocument extends Document {
  _id: Types.ObjectId;
  client: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  status: ORDER_STATUS;
  confirmedBy: Types.ObjectId | null;
  confirmedAt: Date | null;
  cancelledBy: Types.ObjectId | null;
  cancelledAt: Date | null;
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

const orderItemSelectedOptionSchema = new Schema<OrderItemSelectedOption>(
  {
    attributeName: { type: i18nTextSchema, required: true },
    optionName: { type: i18nTextSchema, required: true },
    priceAdjustment: { type: Number, required: true },
  },
  { _id: false },
);

const orderItemSchema = new Schema<OrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: i18nTextSchema, required: true },
    price: { type: Number, required: true },
    currency: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    selectedOptions: { type: [orderItemSelectedOptionSchema], default: [] },
  },
  { _id: false },
);

const orderSchema = new Schema<OrderDocument>(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    totalAmount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING },
    confirmedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    confirmedAt: { type: Date, default: null },
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const OrderModel = mongoose.model<OrderDocument>('Order', orderSchema);
