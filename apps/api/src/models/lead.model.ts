import { Schema, model, Document, Types } from 'mongoose';
import { LEAD_STATUSES, LeadStatus, LEAD_PRIORITIES, LeadPriority } from '@agencyos/shared';

export interface ILeadDoc extends Document {
  organizationId: Types.ObjectId;
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city?: string;
  industry?: string;
  website?: string;
  instagramProfile?: string;
  businessCategory?: string;
  interestedService?: string;
  estimatedBudget: number;
  leadSource?: string;
  conversationSummary?: string;
  leadPriority: LeadPriority;
  nextFollowUpDate?: Date;
  assignedTo?: Types.ObjectId;
  status: LeadStatus;
  convertedClientId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const leadSchema = new Schema<ILeadDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    businessName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    city: { type: String, trim: true },
    industry: { type: String, trim: true },
    website: { type: String, trim: true },
    instagramProfile: { type: String, trim: true },
    businessCategory: { type: String, trim: true },
    interestedService: { type: String, trim: true },
    estimatedBudget: { type: Number, default: 0 },
    leadSource: { type: String, trim: true },
    conversationSummary: { type: String },
    leadPriority: { type: String, enum: LEAD_PRIORITIES, default: 'Medium' },
    nextFollowUpDate: { type: Date, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: { type: String, enum: LEAD_STATUSES, default: 'New', index: true },
    convertedClientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

leadSchema.index({ organizationId: 1, phone: 1 });
leadSchema.index({ organizationId: 1, email: 1 });
leadSchema.index({ organizationId: 1, status: 1 });
leadSchema.index({ organizationId: 1, assignedTo: 1 });

export const LeadModel = model<ILeadDoc>('Lead', leadSchema);

