import { Schema, model, Document, Types } from 'mongoose';
import { PROJECT_STATUSES, ProjectStatus, MILESTONE_STATUSES, MilestoneStatus } from '@agencyos/shared';

export interface IMilestoneSubdoc {
  _id?: Types.ObjectId;
  title: string;
  description?: string;
  status: MilestoneStatus;
  dueDate?: Date;
  completionDate?: Date;
  assignedPerson?: string;
  notes?: string;
  deliverables?: string[];
}

export interface IProjectDoc extends Document {
  organizationId: Types.ObjectId;
  clientId: Types.ObjectId;
  name: string;
  category: string;
  status: ProjectStatus;
  quotationBreakdown: {
    frontendDev: number;
    backendDev: number;
    ecommerce: number;
    domain: number;
    hosting: number;
    maintenance: number;
    additional: number;
  };
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStructure: string;
  milestones: IMilestoneSubdoc[];
  assetLinks: {
    figma?: string;
    github?: string;
    stagingWebsite?: string;
    productionWebsite?: string;
    googleDrive?: string;
    other?: string;
  };
  assignedMembers: Types.ObjectId[];
  startDate?: Date;
  targetDeliveryDate?: Date;
  completionDate?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const milestoneSchema = new Schema<IMilestoneSubdoc>(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: MILESTONE_STATUSES, default: 'Pending' },
    dueDate: { type: Date },
    completionDate: { type: Date },
    assignedPerson: { type: String },
    notes: { type: String },
    deliverables: [{ type: String }],
  },
  { timestamps: true }
);

const projectSchema = new Schema<IProjectDoc>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Web Development' },
    status: { type: String, enum: PROJECT_STATUSES, default: 'Planning', index: true },
    quotationBreakdown: {
      frontendDev: { type: Number, default: 0 },
      backendDev: { type: Number, default: 0 },
      ecommerce: { type: Number, default: 0 },
      domain: { type: Number, default: 0 },
      hosting: { type: Number, default: 0 },
      maintenance: { type: Number, default: 0 },
      additional: { type: Number, default: 0 },
    },
    totalAmount: { type: Number, required: true, default: 0 },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    paymentStructure: { type: String, default: 'advance_milestone_final' },
    milestones: [milestoneSchema],
    assetLinks: {
      figma: { type: String },
      github: { type: String },
      stagingWebsite: { type: String },
      productionWebsite: { type: String },
      googleDrive: { type: String },
      other: { type: String },
    },
    assignedMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    startDate: { type: Date },
    targetDeliveryDate: { type: Date },
    completionDate: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

projectSchema.index({ organizationId: 1, clientId: 1 });
projectSchema.index({ organizationId: 1, status: 1 });

export const ProjectModel = model<IProjectDoc>('Project', projectSchema);

