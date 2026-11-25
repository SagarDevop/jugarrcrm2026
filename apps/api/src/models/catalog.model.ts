import { Schema, model, Document, Types } from 'mongoose';

export interface CatalogDocument extends Document {
  organizationId: Types.ObjectId;
  title: string;
  category: string;
  description: string;
  pricingType: 'Fixed' | 'Range' | 'Starting At';
  basePrice: number;
  maxPrice?: number;
  deliveryDays: number;
  timeline: string;
  deliverables: string[];
  techStack: string[];
  imageUrl?: string;
  targetClient?: string;
  pitchTips?: string;
  isActive: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const catalogSchema = new Schema<CatalogDocument>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Web Development',
    },
    description: {
      type: String,
      default: '',
    },
    pricingType: {
      type: String,
      enum: ['Fixed', 'Range', 'Starting At'],
      default: 'Starting At',
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPrice: {
      type: Number,
      min: 0,
    },
    deliveryDays: {
      type: Number,
      default: 21,
    },
    timeline: {
      type: String,
      default: '3 - 4 Weeks',
    },
    deliverables: {
      type: [String],
      default: [],
    },
    techStack: {
      type: [String],
      default: [],
    },
    imageUrl: {
      type: String,
      default: '',
    },
    targetClient: {
      type: String,
      default: '',
    },
    pitchTips: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CatalogModel = model<CatalogDocument>('ServiceCatalog', catalogSchema);
