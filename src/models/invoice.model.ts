import mongoose, { Document, Schema, Types } from 'mongoose';

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Currency is invoice-level, not per-line: an order (and therefore its invoice) always
// snapshots one currency from checkout, per the single-vendor-cart assumption.

export interface InvoiceDocument extends Document {
  _id: Types.ObjectId;
  order: Types.ObjectId;
  client: Types.ObjectId;
  number: string;
  lines: InvoiceLine[];
  subtotal: number;
  total: number;
  currency: string;
  pdfPath: string;
  issuedAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceLineSchema = new Schema<InvoiceLine>(
  {
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    number: { type: String, required: true, unique: true },
    lines: { type: [invoiceLineSchema], default: [] },
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, required: true },
    pdfPath: { type: String, required: true },
    issuedAt: { type: Date, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const InvoiceModel = mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);
