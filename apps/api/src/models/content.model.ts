import { Schema, model, Document, Types } from 'mongoose';
import { CONTENT_CATEGORIES, ContentCategory } from '@agencyos/shared';

export interface IContentItemDoc extends Document {
  organizationId: Types.ObjectId;
  title: string;
  category: ContentCategory;
  content: string;
  targetPlatform: string;
  status: 'Draft' | 'Ready' | 'In Production' | 'Published';
  tags: string[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contentItemSchema = new Schema<IContentItemDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: CONTENT_CATEGORIES, required: true, index: true },
    content: { type: String, required: true },
    targetPlatform: {
      type: String,
      enum: ['Instagram', 'LinkedIn', 'YouTube', 'TikTok', 'Twitter', 'Multi-channel'],
      default: 'Instagram',
    },
    status: {
      type: String,
      enum: ['Draft', 'Ready', 'In Production', 'Published'],
      default: 'Draft',
      index: true,
    },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const ContentItemModel = model<IContentItemDoc>('ContentItem', contentItemSchema);

