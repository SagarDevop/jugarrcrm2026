import { z } from 'zod';
import {
  USER_ROLES,
  LEAD_STATUSES,
  LEAD_PRIORITIES,
  CLIENT_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_CATEGORIES,
  EXPENSE_CATEGORIES,
  CALL_OUTCOMES,
  INTEREST_LEVELS,
  PROJECT_STATUSES,
  MILESTONE_STATUSES,
  RETAINER_STATUSES,
  KNOWLEDGE_CATEGORIES,
  CONTENT_CATEGORIES,
  RESEARCH_CATEGORIES,
  MEDIA_ASSET_TYPES,
} from '../constants';

// Authentication
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organizationName: z.string().min(2, 'Organization name must be at least 2 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const resetPasswordSchema = z.object({
  userId: z.string(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Lead Validation
export const createLeadSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  phone: z.string().min(7, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  city: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  instagramProfile: z.string().optional(),
  businessCategory: z.string().optional(),
  interestedService: z.string().optional(),
  estimatedBudget: z.number().min(0).optional(),
  leadSource: z.string().optional(),
  conversationSummary: z.string().optional(),
  leadPriority: z.enum(LEAD_PRIORITIES).default('Medium'),
  nextFollowUpDate: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(LEAD_STATUSES).default('New'),
});
export type CreateLeadInput = z.infer<typeof createLeadSchema>;

export const updateLeadSchema = createLeadSchema.partial();
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;

// Client Validation
export const createClientSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  businessName: z.string().min(1, 'Business name is required'),
  phone: z.string().min(7, 'Phone number is required'),
  whatsapp: z.string().optional(),
  email: z.string().email('Valid email is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  serviceCategory: z.string().optional(),
  selectedPackage: z.string().optional(),
  customQuotation: z.number().min(0).optional(),
  startDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  assignedProjectManager: z.string().optional(),
  assignedSalesMember: z.string().optional(),
  totalContractAmount: z.number().min(0, 'Total contract amount must be non-negative'),
  initialToken: z.number().min(0).default(0),
  advancePayment: z.number().min(0).default(0),
  remainingBalance: z.number().min(0).default(0),
  paymentTerms: z.string().optional(),
  clientSource: z.string().optional(),
  leadReference: z.string().optional(),
  internalNotes: z.string().optional(),
  status: z.enum(CLIENT_STATUSES).default('Active'),
  priority: z.enum(LEAD_PRIORITIES).default('Medium'),
});
export type CreateClientInput = z.infer<typeof createClientSchema>;

export const updateClientSchema = createClientSchema.partial();
export type UpdateClientInput = z.infer<typeof updateClientSchema>;

// Project Validation
export const createProjectSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  name: z.string().min(1, 'Project name is required'),
  category: z.string().default('Web Development'),
  status: z.enum(PROJECT_STATUSES).default('Planning'),
  quotationBreakdown: z.object({
    frontendDev: z.number().min(0).default(0),
    backendDev: z.number().min(0).default(0),
    ecommerce: z.number().min(0).default(0),
    domain: z.number().min(0).default(0),
    hosting: z.number().min(0).default(0),
    maintenance: z.number().min(0).default(0),
    additional: z.number().min(0).default(0),
  }).default({
    frontendDev: 0,
    backendDev: 0,
    ecommerce: 0,
    domain: 0,
    hosting: 0,
    maintenance: 0,
    additional: 0,
  }),
  totalAmount: z.number().min(0),
  paymentStructure: z.enum(['advance_milestone_final', 'custom_installments']).default('advance_milestone_final'),
  milestones: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      status: z.enum(MILESTONE_STATUSES).default('Pending'),
      dueDate: z.string().optional(),
      completionDate: z.string().optional(),
      assignedPerson: z.string().optional(),
      notes: z.string().optional(),
    })
  ).default([]),
  assetLinks: z.object({
    figma: z.string().optional(),
    github: z.string().optional(),
    stagingWebsite: z.string().optional(),
    productionWebsite: z.string().optional(),
    googleDrive: z.string().optional(),
    other: z.string().optional(),
  }).default({}),
  assignedMembers: z.array(z.string()).default([]),
  startDate: z.string().optional(),
  targetDeliveryDate: z.string().optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Retainer Validation
export const createRetainerSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  serviceName: z.string().min(1, 'Service name is required'),
  packageDetails: z.object({
    reelsCount: z.number().min(0).default(0),
    staticPostsCount: z.number().min(0).default(0),
    graphicDesignsCount: z.number().min(0).default(0),
    storiesCount: z.number().min(0).default(0),
    customDeliverables: z.array(z.string()).default([]),
  }),
  monthlyFee: z.number().min(0, 'Monthly fee must be positive'),
  anchorDateDay: z.number().min(1).max(31),
  startDate: z.string(),
  autoRenew: z.boolean().default(true),
  assignedTeam: z.array(z.string()).default([]),
});
export type CreateRetainerInput = z.infer<typeof createRetainerSchema>;

// Payment Validation
export const createPaymentSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  projectId: z.string().optional(),
  retainerId: z.string().optional(),
  amount: z.number().positive('Payment amount must be greater than 0'),
  paymentDate: z.string().default(() => new Date().toISOString()),
  paymentMethod: z.enum(PAYMENT_METHODS),
  transactionReference: z.string().min(1, 'Transaction reference is required'),
  category: z.enum(PAYMENT_CATEGORIES),
  notes: z.string().optional(),
  receiptUrl: z.string().optional(),
  status: z.enum(PAYMENT_STATUSES).default('Pending'),
});
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const verifyPaymentSchema = z.object({
  status: z.enum(['Verified', 'Rejected', 'Refunded']),
  notes: z.string().optional(),
});
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

// Expense Validation
export const createExpenseSchema = z.object({
  title: z.string().min(1, 'Expense title is required'),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive('Expense amount must be greater than 0'),
  date: z.string().default(() => new Date().toISOString()),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  description: z.string().optional(),
  receiptAttachment: z.string().optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// Call & Followup Validation
export const createCallSchema = z.object({
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  clientName: z.string().min(1, 'Client or lead name is required'),
  callDate: z.string().default(() => new Date().toISOString()),
  durationMinutes: z.number().min(0).default(0),
  outcome: z.enum(CALL_OUTCOMES),
  conversationNotes: z.string().min(1, 'Call notes are required'),
  interestLevel: z.enum(INTEREST_LEVELS).default('Medium'),
  nextAction: z.string().optional(),
  followUpDate: z.string().optional(),
});
export type CreateCallInput = z.infer<typeof createCallSchema>;

export const createFollowUpSchema = z.object({
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  title: z.string().min(1, 'Follow-up title is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(LEAD_PRIORITIES).default('Medium'),
  assignedTo: z.string().optional(),
});
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;

// Knowledge Resource Validation
export const createKnowledgeResourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.enum(KNOWLEDGE_CATEGORIES),
  richContent: z.string().min(1, 'Content is required'),
  attachments: z.array(z.object({ name: z.string(), url: z.string(), fileType: z.string() })).default([]),
  externalLinks: z.array(z.object({ title: z.string(), url: z.string() })).default([]),
  searchTags: z.array(z.string()).default([]),
  isPublished: z.boolean().default(true),
});
export type CreateKnowledgeResourceInput = z.infer<typeof createKnowledgeResourceSchema>;

// Team Member Creation Validation
export const createSalesMemberSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  salesTarget: z.number().min(0).default(50000),
  commissionPercentage: z.number().min(0).max(100).default(10),
  permissions: z.array(z.string()).optional(),
});
export type CreateSalesMemberInput = z.infer<typeof createSalesMemberSchema>;
