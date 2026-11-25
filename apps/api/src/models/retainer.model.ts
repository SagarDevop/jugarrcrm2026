import { Schema, model, Document, Types } from 'mongoose';
import { RETAINER_STATUSES, RetainerStatus } from '@agencyos/shared';

export interface IRetainerPeriodSubdoc {
  _id?: Types.ObjectId;
  periodNumber: number;
  startDate: Date;
  endDate: Date;
  monthlyFee: number;
  billingStatus: 'Pending' | 'Invoiced' | 'Paid' | 'Overdue';
  tokenAmount: number;
  pendingBalance: number;
  deliverablesStatus: {
    reelsCompleted: number;
    staticPostsCompleted: number;
    graphicsCompleted: number;
    storiesCompleted: number;
    clientApproved: boolean;
  };
  notes?: string;
  archivedAt?: Date;
}

export interface IRetainerDoc extends Document {
  organizationId: Types.ObjectId;
  clientId: Types.ObjectId;
  serviceName: string;
  packageDetails: {
    reelsCount: number;
    staticPostsCount: number;
    graphicDesignsCount: number;
    storiesCount: number;
    customDeliverables: string[];
  };
  monthlyFee: number;
  anchorDateDay: number;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  status: RetainerStatus;
  autoRenew: boolean;
  assignedTeam: Types.ObjectId[];
  currentPeriod: IRetainerPeriodSubdoc;
  historyPeriods: IRetainerPeriodSubdoc[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const retainerPeriodSchema = new Schema<IRetainerPeriodSubdoc>(
  {
    periodNumber: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    monthlyFee: { type: Number, required: true },
    billingStatus: {
      type: String,
      enum: ['Pending', 'Invoiced', 'Paid', 'Overdue'],
      default: 'Pending',
    },
    tokenAmount: { type: Number, default: 0 },
    pendingBalance: { type: Number, default: 0 },
    deliverablesStatus: {
      reelsCompleted: { type: Number, default: 0 },
      staticPostsCompleted: { type: Number, default: 0 },
      graphicsCompleted: { type: Number, default: 0 },
      storiesCompleted: { type: Number, default: 0 },
      clientApproved: { type: Boolean, default: false },
    },
    notes: { type: String },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

const retainerSchema = new Schema<IRetainerDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    serviceName: { type: String, required: true, trim: true },
    packageDetails: {
      reelsCount: { type: Number, default: 0 },
      staticPostsCount: { type: Number, default: 0 },
      graphicDesignsCount: { type: Number, default: 0 },
      storiesCount: { type: Number, default: 0 },
      customDeliverables: [{ type: String }],
    },
    monthlyFee: { type: Number, required: true },
    anchorDateDay: { type: Number, required: true },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    status: { type: String, enum: RETAINER_STATUSES, default: 'Active', index: true },
    autoRenew: { type: Boolean, default: true },
    assignedTeam: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    currentPeriod: { type: retainerPeriodSchema, required: true },
    historyPeriods: [retainerPeriodSchema],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

retainerSchema.index({ organizationId: 1, clientId: 1 });
retainerSchema.index({ organizationId: 1, status: 1 });

export const RetainerModel = model<IRetainerDoc>('Retainer', retainerSchema);

