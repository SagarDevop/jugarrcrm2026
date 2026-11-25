import { Schema, model, Document, Types } from 'mongoose';

export interface ICommissionDoc extends Document {
  organizationId: Types.ObjectId;
  salesMemberId: Types.ObjectId;
  paymentId: Types.ObjectId;
  clientId: Types.ObjectId;
  dealAmount: number;
  verifiedPaymentAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  calculatedAt: Date;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commissionSchema = new Schema<ICommissionDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    salesMemberId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, unique: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
    dealAmount: { type: Number, default: 0 },
    verifiedPaymentAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Paid', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    calculatedAt: { type: Date, default: Date.now },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

commissionSchema.index({ organizationId: 1, salesMemberId: 1 });

export const CommissionModel = model<ICommissionDoc>('Commission', commissionSchema);

