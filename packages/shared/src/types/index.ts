import {
  UserRole,
  Permission,
  LeadStatus,
  LeadPriority,
  ClientStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentCategory,
  ExpenseCategory,
  CallOutcome,
  InterestLevel,
  ProjectStatus,
  MilestoneStatus,
  RetainerStatus,
  KnowledgeCategory,
  ContentCategory,
  ResearchCategory,
  MediaAssetType,
} from '../constants';

export interface BaseEntity {
  _id: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  currency: string;
  fiscalYearStartMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  phone?: string;
  avatar?: string;
  isActive: boolean;
  salesTarget?: number;
  commissionPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  organization: Organization;
  accessToken: string;
}

export interface Client extends BaseEntity {
  clientName: string;
  businessName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  website?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  description?: string;
  requirements?: string;
  serviceCategory?: string;
  selectedPackage?: string;
  customQuotation?: number;
  startDate?: string;
  expectedDeliveryDate?: string;
  assignedProjectManager?: string | User;
  assignedSalesMember?: string | User;
  totalContractAmount: number;
  initialToken: number;
  advancePayment: number;
  remainingBalance: number;
  paymentTerms?: string;
  clientSource?: string;
  leadReference?: string;
  internalNotes?: string;
  status: ClientStatus;
  priority: LeadPriority;
  createdBy: string | User;
}

export interface Lead extends BaseEntity {
  businessName: string;
  contactPerson: string;
  phone: string;
  email: string;
  city?: string;
  industry?: string;
  website?: string;
  instagramProfile?: string;
  businessCategory?: string;
  interestedService?: string;
  estimatedBudget?: number;
  leadSource?: string;
  conversationSummary?: string;
  leadPriority: LeadPriority;
  nextFollowUpDate?: string;
  assignedTo?: string | User;
  status: LeadStatus;
  convertedClientId?: string;
  createdBy: string | User;
}

export interface Milestone {
  _id?: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  dueDate?: string;
  completionDate?: string;
  assignedPerson?: string;
  notes?: string;
  deliverables?: string[];
}

export interface Project extends BaseEntity {
  clientId: string | Client;
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
  paymentStructure: 'advance_milestone_final' | 'custom_installments';
  milestones: Milestone[];
  assetLinks: {
    figma?: string;
    github?: string;
    stagingWebsite?: string;
    productionWebsite?: string;
    googleDrive?: string;
    other?: string;
  };
  assignedMembers: string[];
  startDate?: string;
  targetDeliveryDate?: string;
  completionDate?: string;
  createdBy: string | User;
}

export interface RetainerPeriod {
  _id?: string;
  periodNumber: number;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  billingStatus: 'Pending' | 'Invoiced' | 'Paid' | 'Overdue';
  tokenAmount: number;
  pendingBalance: number;
  deliverablesStatus: {
    reelsCompleted: number;
    staticPostsCompleted: number;
    graphicsCompleted: number;
    storiesCompleted: number;
    clientApproved: boolean;
  };
  notes?: string;
  archivedAt?: string;
}

export interface Retainer extends BaseEntity {
  clientId: string | Client;
  serviceName: string;
  packageDetails: {
    reelsCount: number;
    staticPostsCount: number;
    graphicDesignsCount: number;
    storiesCount: number;
    customDeliverables?: string[];
  };
  monthlyFee: number;
  anchorDateDay: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  status: RetainerStatus;
  autoRenew: boolean;
  assignedTeam: string[];
  currentPeriod: RetainerPeriod;
  historyPeriods: RetainerPeriod[];
  createdBy: string | User;
}

export interface Payment extends BaseEntity {
  clientId: string | Client;
  projectId?: string | Project;
  retainerId?: string | Retainer;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  category: PaymentCategory;
  status: PaymentStatus;
  verifiedBy?: string | User;
  verifiedAt?: string;
  notes?: string;
  receiptUrl?: string;
  recordedBy: string | User;
}

export interface Expense extends BaseEntity {
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: string;
  description?: string;
  receiptAttachment?: string;
  recordedBy: string | User;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string | User;
  approvedAt?: string;
}

export interface Call extends BaseEntity {
  clientId?: string;
  leadId?: string;
  clientName: string;
  callDate: string;
  durationMinutes: number;
  outcome: CallOutcome;
  conversationNotes: string;
  interestLevel: InterestLevel;
  nextAction?: string;
  followUpDate?: string;
  recordedBy: string | User;
}

export interface FollowUp extends BaseEntity {
  clientId?: string;
  leadId?: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: LeadPriority;
  status: 'Pending' | 'Completed' | 'Overdue' | 'Cancelled';
  completedAt?: string;
  assignedTo: string | User;
  createdBy: string | User;
}

export interface Commission extends BaseEntity {
  salesMemberId: string | User;
  paymentId: string | Payment;
  clientId: string | Client;
  dealAmount: number;
  verifiedPaymentAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'Pending' | 'Approved' | 'Paid' | 'Rejected';
  calculatedAt: string;
  approvedBy?: string | User;
  approvedAt?: string;
  paidAt?: string;
}

export interface KnowledgeResource extends BaseEntity {
  title: string;
  description: string;
  category: KnowledgeCategory;
  richContent: string;
  attachments: { name: string; url: string; fileType: string }[];
  externalLinks: { title: string; url: string }[];
  searchTags: string[];
  isPublished: boolean;
  createdBy: string | User;
}

export interface ResearchDocument extends BaseEntity {
  title: string;
  category: ResearchCategory;
  content: string;
  tags: string[];
  attachments: string[];
  createdBy: string | User;
}

export interface ContentItem extends BaseEntity {
  title: string;
  category: ContentCategory;
  content: string;
  targetPlatform: 'Instagram' | 'LinkedIn' | 'YouTube' | 'TikTok' | 'Twitter' | 'Multi-channel';
  status: 'Draft' | 'Ready' | 'In Production' | 'Published';
  tags: string[];
  createdBy: string | User;
}

export interface MediaAsset extends BaseEntity {
  title: string;
  assetType: MediaAssetType;
  fileUrl: string;
  thumbnailUrl?: string;
  fileSize?: number;
  mimeType?: string;
  tags: string[];
  createdBy: string | User;
}

export interface Notification {
  _id: string;
  organizationId: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'lead' | 'client' | 'payment' | 'project' | 'followup' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ActivityEvent {
  _id: string;
  organizationId: string;
  entityType: 'lead' | 'client' | 'project' | 'payment';
  entityId: string;
  title: string;
  description: string;
  performedBy: string | User;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AdminDashboardKPIs {
  totalClients: number;
  activeClients: number;
  activeProjects: number;
  activeRetainers: number;
  totalLifetimeIncome: number;
  monthlyRevenue: number;
  monthlyRecurringRevenue: number;
  pendingReceivables: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  revenueVsExpenses: { month: string; revenue: number; expenses: number }[];
  profitTrends: { month: string; profit: number }[];
  clientAcquisitionTrends: { month: string; count: number }[];
  serviceRevenueBreakdown: { service: string; amount: number }[];
  salesPerformance: { name: string; revenue: number; leads: number; conversions: number }[];
  projectStatusDistribution: { status: string; count: number }[];
}

export interface SalesDashboardKPIs {
  myTotalLeads: number;
  myActiveLeads: number;
  myConvertedClients: number;
  myLostLeads: number;
  totalCalls: number;
  upcomingFollowUps: number;
  monthlyTarget: number;
  attributedRevenue: number;
  commissionEarned: number;
  conversionRate: number;
  leadStageBreakdown: { stage: string; count: number }[];
  recentActivity: ActivityEvent[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ServiceCatalogItem extends BaseEntity {
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
  createdBy: string | User;
}

export interface ChatRoom extends BaseEntity {
  name: string;
  isGroup: boolean;
  description?: string;
  avatar?: string;
  members: {
    userId: string | User;
    name: string;
    email: string;
    role: string;
    joinedAt: string;
  }[];
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    sentAt: string;
  };
  createdBy: string | User;
}

export interface ChatMessage extends BaseEntity {
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachments?: string[];
  readBy?: {
    userId: string;
    name: string;
    readAt: string;
  }[];
  sentAt: string;
}
