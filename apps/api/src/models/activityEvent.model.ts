import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityEventDoc extends Document {
  organizationId: Types.ObjectId;
  entityType: 'lead' | 'client' | 'project' | 'payment';
  entityId: string;
  title: string;
  description: string;
  performedBy: Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const activityEventSchema = new Schema<IActivityEventDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    entityType: {
      type: String,
      enum: ['lead', 'client', 'project', 'payment'],
      required: true,
      index: true,
    },
    entityId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityEventSchema.index({ organizationId: 1, entityId: 1, createdAt: -1 });

export const ActivityEventModel = model<IActivityEventDoc>('ActivityEvent', activityEventSchema);

