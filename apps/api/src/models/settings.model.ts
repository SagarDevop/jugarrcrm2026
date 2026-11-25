import { Schema, model, Document, Types } from 'mongoose';

export interface ISettingsDoc extends Document {
  organizationId: Types.ObjectId;
  companyName: string;
  currency: string;
  fiscalYearStart: string;
  invoicePrefix: string;
  paymentTermsDefault: string;
  videoApiConfig: {
    enabled: boolean;
    provider?: string;
    apiKeyConfigured?: boolean;
  };
  emailNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettingsDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, unique: true, index: true },
    companyName: { type: String, default: 'AgencyOS' },
    currency: { type: String, default: 'INR' },
    fiscalYearStart: { type: String, default: '04-01' },
    invoicePrefix: { type: String, default: 'INV' },
    paymentTermsDefault: { type: String, default: 'Net 15' },
    videoApiConfig: {
      enabled: { type: Boolean, default: false },
      provider: { type: String, default: 'mock' },
      apiKeyConfigured: { type: Boolean, default: false },
    },
    emailNotificationsEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SettingsModel = model<ISettingsDoc>('Settings', settingsSchema);

