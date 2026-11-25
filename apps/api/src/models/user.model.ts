import { Schema, model, Document, Types } from 'mongoose';
import { USER_ROLES, UserRole, Permission } from '@agencyos/shared';

export interface IUserDoc extends Document {
  organizationId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  permissions: Permission[];
  phone?: string;
  avatar?: string;
  isActive: boolean;
  salesTarget: number;
  commissionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      default: USER_ROLES.SALES_MEMBER,
      required: true,
      index: true,
    },
    permissions: [{ type: String }],
    phone: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    salesTarget: { type: Number, default: 50000 },
    commissionPercentage: { type: Number, default: 10 },
  },
  { timestamps: true }
);

userSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export const UserModel = model<IUserDoc>('User', userSchema);
