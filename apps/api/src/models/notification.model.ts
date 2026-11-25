import { Schema, model, Document, Types } from 'mongoose';

export interface INotificationDoc extends Document {
  organizationId: Types.ObjectId;
  recipientId: Types.ObjectId;
  title: string;
  message: string;
  type: 'lead' | 'client' | 'payment' | 'project' | 'followup' | 'system';
  read: boolean;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotificationDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['lead', 'client', 'payment', 'project', 'followup', 'system'],
      default: 'system',
    },
    read: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ organizationId: 1, recipientId: 1, read: 1 });

export const NotificationModel = model<INotificationDoc>('Notification', notificationSchema);

