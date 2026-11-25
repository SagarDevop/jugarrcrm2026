import { Schema, model, Document } from 'mongoose';

export interface IOrganizationDoc extends Document {
  name: string;
  slug: string;
  logo?: string;
  currency: string;
  fiscalYearStartMonth: number;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<IOrganizationDoc>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logo: { type: String },
    currency: { type: String, default: 'INR' },
    fiscalYearStartMonth: { type: Number, default: 4 },
  },
  { timestamps: true }
);

export const OrganizationModel = model<IOrganizationDoc>('Organization', organizationSchema);

