import { UserDocument } from '../models/user.model';

export interface UserResponseDTO {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isActive: boolean;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

export function userToResponseDTO(user: UserDocument | (Record<string, any> & { _id: any })): UserResponseDTO {
  return {
    _id: user._id.toString(),
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    preferredLanguage: user.preferredLanguage,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
