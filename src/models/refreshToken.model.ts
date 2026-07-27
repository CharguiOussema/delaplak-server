import mongoose, { Document, Schema, Types } from 'mongoose';

export interface RefreshTokenDocument extends Document {
  _id: Types.ObjectId;
  tokenHash: string;
  user: Types.ObjectId;
  family: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    tokenHash: { type: String, required: true, index: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
  },
  { timestamps: true },
);

export const RefreshTokenModel = mongoose.model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema);
