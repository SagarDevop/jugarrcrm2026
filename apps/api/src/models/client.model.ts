import { Schema, model, Document, Types } from 'mongoose';
import { CLIENT_STATUSES, ClientStatus, LEAD_PRIORITIES, LeadPriority } from '@agencyos/shared';

export interface IClientDoc extends Document {
  organizationId: Types.ObjectId;
  clientName: string;
  businessName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  description?: string;
  requirements?: string;
  serviceCategory?: string;
  selectedPackage?: string;
  customQuotation?: number;
  startDate?: Date;
  expectedDeliveryDate?: Date;
  assignedProjectManager?: Types.ObjectId;
  assignedSalesMember?: Types.ObjectId;
  totalContractAmount: number;
  initialToken: number;
  advancePayment: number;
  remainingBalance: number;
  paymentTerms?: string;
  clientSource?: string;
  leadReference?: string;
  internalNotes?: string;
  status: ClientStatus;
  priority: LeadPriority;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClientDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientName: { type: String, required: true, trim: true },
    businessName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    whatsapp: { type: String, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    address: { type: String },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    instagramUrl: { type: String, trim: true },
    facebookUrl: { type: String, trim: true },
    description: { type: String },
    requirements: { type: String },
    serviceCategory: { type: String },
    selectedPackage: { type: String },
    customQuotation: { type: Number, default: 0 },
    startDate: { type: Date },
    expectedDeliveryDate: { type: Date },
    assignedProjectManager: { type: Schema.Types.ObjectId, ref: 'User' },
    assignedSalesMember: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    totalContractAmount: { type: Number, default: 0 },
    initialToken: { type: Number, default: 0 },
    advancePayment: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    paymentTerms: { type: String },
    clientSource: { type: String },
    leadReference: { type: String },
    internalNotes: { type: String },
    status: { type: String, enum: CLIENT_STATUSES, default: 'Active', index: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'Medium' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

clientSchema.index({ organizationId: 1, phone: 1 });
clientSchema.index({ organizationId: 1, email: 1 });
clientSchema.index({ organizationId: 1, status: 1 });

export const ClientModel = model<IClientDoc>('Client', clientSchema);

