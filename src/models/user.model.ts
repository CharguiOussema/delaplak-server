import mongoose, { Document, Schema, Types } from 'mongoose';
import { USER_ROLES, LANGUAGES } from '../types/consts';

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: USER_ROLES;
  isActive: boolean;
  preferredLanguage: LANGUAGES;
  isDeleted: boolean;
  passwordResetTokenHash?: string | null;
  passwordResetExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(USER_ROLES), default: USER_ROLES.CLIENT },
    isActive: { type: Boolean, default: true },
    preferredLanguage: { type: String, enum: Object.values(LANGUAGES), default: LANGUAGES.en },
    isDeleted: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

export const UserModel = mongoose.model<UserDocument>('User', userSchema);
