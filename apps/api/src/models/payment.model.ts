import { Schema, model, Document, Types } from 'mongoose';
import { PAYMENT_STATUSES, PaymentStatus, PAYMENT_METHODS, PaymentMethod, PAYMENT_CATEGORIES, PaymentCategory } from '@agencyos/shared';

export interface IPaymentDoc extends Document {
  organizationId: Types.ObjectId;
  clientId: Types.ObjectId;
  projectId?: Types.ObjectId;
  retainerId?: Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  category: PaymentCategory;
  status: PaymentStatus;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  notes?: string;
  receiptUrl?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    retainerId: { type: Schema.Types.ObjectId, ref: 'Retainer', index: true },
    amount: { type: Number, required: true, min: 0.01 },
    paymentDate: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    transactionReference: { type: String, required: true, trim: true },
    category: { type: String, enum: PAYMENT_CATEGORIES, required: true },
    status: { type: String, enum: PAYMENT_STATUSES, default: 'Pending', index: true },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    notes: { type: String },
    receiptUrl: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

paymentSchema.index({ organizationId: 1, status: 1 });
paymentSchema.index({ organizationId: 1, paymentDate: 1 });
paymentSchema.index({ organizationId: 1, clientId: 1 });

export const PaymentModel = model<IPaymentDoc>('Payment', paymentSchema);

