import { Schema, model, Document, Types } from 'mongoose';
import { LEAD_PRIORITIES, LeadPriority } from '@agencyos/shared';

export interface IFollowUpDoc extends Document {
  organizationId: Types.ObjectId;
  clientId?: Types.ObjectId;
  leadId?: Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  priority: LeadPriority;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';
  completedAt?: Date;
  assignedTo: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUpDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', index: true },
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    dueDate: { type: Date, required: true, index: true },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'Medium' },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Overdue', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    completedAt: { type: Date },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

followUpSchema.index({ organizationId: 1, assignedTo: 1, status: 1 });
followUpSchema.index({ organizationId: 1, dueDate: 1 });

export const FollowUpModel = model<IFollowUpDoc>('FollowUp', followUpSchema);

