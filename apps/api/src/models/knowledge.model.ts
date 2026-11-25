import { Schema, model, Document, Types } from 'mongoose';
import { KNOWLEDGE_CATEGORIES, KnowledgeCategory } from '@agencyos/shared';

export interface IKnowledgeResourceDoc extends Document {
  organizationId: Types.ObjectId;
  title: string;
  description: string;
  category: KnowledgeCategory;
  richContent: string;
  attachments: { name: string; url: string; fileType: string }[];
  externalLinks: { title: string; url: string }[];
  searchTags: string[];
  isPublished: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeResourceSchema = new Schema<IKnowledgeResourceDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: KNOWLEDGE_CATEGORIES, required: true, index: true },
    richContent: { type: String, required: true },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, required: true },
      },
    ],
    externalLinks: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    searchTags: [{ type: String, index: true }],
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

knowledgeResourceSchema.index({ organizationId: 1, title: 'text', description: 'text', searchTags: 'text' });

export const KnowledgeResourceModel = model<IKnowledgeResourceDoc>('KnowledgeResource', knowledgeResourceSchema);

