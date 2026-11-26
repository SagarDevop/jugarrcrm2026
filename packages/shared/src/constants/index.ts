export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  SALES_MEMBER: 'SALES_MEMBER',
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  CLIENT_MANAGER: 'CLIENT_MANAGER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const PERMISSIONS = {
  // Clients
  CLIENTS_VIEW_ALL: 'clients.view_all',
  CLIENTS_VIEW_ASSIGNED: 'clients.view_assigned',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_UPDATE: 'clients.update',
  CLIENTS_DELETE: 'clients.delete',

  // Leads
  LEADS_VIEW_ALL: 'leads.view_all',
  LEADS_VIEW_ASSIGNED: 'leads.view_assigned',
  LEADS_CREATE: 'leads.create',
  LEADS_UPDATE_ASSIGNED: 'leads.update_assigned',
  LEADS_DELETE: 'leads.delete',

  // Calls & Followups
  CALLS_VIEW: 'calls.view',
  CALLS_CREATE: 'calls.create',
  FOLLOWUPS_VIEW: 'followups.view',
  FOLLOWUPS_CREATE: 'followups.create',
  FOLLOWUPS_UPDATE: 'followups.update',

  // Projects & Retainers
  PROJECTS_VIEW: 'projects.view',
  PROJECTS_CREATE: 'projects.create',
  PROJECTS_UPDATE: 'projects.update',
  RETAINERS_VIEW: 'retainers.view',
  RETAINERS_MANAGE: 'retainers.manage',

  // Payments & Finance
  PAYMENTS_VIEW: 'payments.view',
  PAYMENTS_CREATE: 'payments.create',
  PAYMENTS_VERIFY: 'payments.verify',
  PAYMENTS_DELETE: 'payments.delete',
  EXPENSES_VIEW: 'expenses.view',
  EXPENSES_CREATE: 'expenses.create',
  EXPENSES_APPROVE: 'expenses.approve',
  FINANCE_VIEW_REVENUE: 'finance.view_revenue',
  FINANCE_VIEW_EXPENSES: 'finance.view_expenses',
  FINANCE_VIEW_PROFIT: 'finance.view_profit',
  FINANCE_VIEW_MARGINS: 'finance.view_margins',
  FINANCE_VIEW_REPORTS: 'finance.view_reports',

  // Team & Administration
  TEAM_VIEW: 'team.view',
  TEAM_MANAGE: 'team.manage',
  KNOWLEDGE_VIEW: 'knowledge.view',
  KNOWLEDGE_MANAGE: 'knowledge.manage',
  CONTENT_VIEW: 'content.view',
  CONTENT_MANAGE: 'content.manage',
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_VIEW: 'audit.view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

export const DEFAULT_SUPER_ADMIN_PERMISSIONS: Permission[] = [...ALL_PERMISSIONS];

export const DEFAULT_SALES_PERMISSIONS: Permission[] = [
  PERMISSIONS.CLIENTS_VIEW_ALL,
  PERMISSIONS.CLIENTS_CREATE,
  PERMISSIONS.LEADS_VIEW_ASSIGNED,
  PERMISSIONS.LEADS_CREATE,
  PERMISSIONS.LEADS_UPDATE_ASSIGNED,
  PERMISSIONS.CALLS_VIEW,
  PERMISSIONS.CALLS_CREATE,
  PERMISSIONS.FOLLOWUPS_VIEW,
  PERMISSIONS.FOLLOWUPS_CREATE,
  PERMISSIONS.FOLLOWUPS_UPDATE,
  PERMISSIONS.PROJECTS_VIEW,
  PERMISSIONS.KNOWLEDGE_VIEW,
  PERMISSIONS.CONTENT_VIEW,
];

export const LEAD_STATUSES = [
  'New',
  'Contacted',
  'Interested',
  'Meeting Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Converted',
  'Lost',
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const CLIENT_STATUSES = [
  'Lead',
  'Prospect',
  'Active',
  'On Hold',
  'Completed',
  'Lost',
] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'Pending',
  'Verified',
  'Rejected',
  'Refunded',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'UPI',
  'Credit Card',
  'Cash',
  'Stripe',
  'PayPal',
  'Other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_CATEGORIES = [
  'Token',
  'Advance',
  'Milestone',
  'Retainer Monthly',
  'Final Delivery',
  'Maintenance',
  'Other',
] as const;
export type PaymentCategory = (typeof PAYMENT_CATEGORIES)[number];

export const EXPENSE_CATEGORIES = [
  'Hosting',
  'Software Subscriptions',
  'Freelancer Payments',
  'Employee Payments',
  'Marketing',
  'Advertising',
  'Infrastructure',
  'Equipment',
  'Office Expenses',
  'Other',
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const CALL_OUTCOMES = [
  'No Answer',
  'Connected',
  'Interested',
  'Not Interested',
  'Call Back Requested',
  'Meeting Scheduled',
] as const;
export type CallOutcome = (typeof CALL_OUTCOMES)[number];

export const INTEREST_LEVELS = ['Low', 'Medium', 'High'] as const;
export type InterestLevel = (typeof INTEREST_LEVELS)[number];

export const PROJECT_STATUSES = [
  'Planning',
  'In Progress',
  'Review',
  'Completed',
  'On Hold',
  'Cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MILESTONE_STATUSES = [
  'Pending',
  'In Progress',
  'Review',
  'Completed',
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const RETAINER_STATUSES = ['Active', 'Paused', 'Cancelled'] as const;
export type RetainerStatus = (typeof RETAINER_STATUSES)[number];

export const KNOWLEDGE_CATEGORIES = [
  'Sales Pitch Scripts',
  'Objection Handling',
  'Service Catalog',
  'Pricing & Packages',
  'Marketing Strategies',
  'Case Studies',
  'Company Portfolio',
  'Client Success Stories',
  'Sales Training',
  'Company SOPs',
] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export const CONTENT_CATEGORIES = [
  'Content Ideas',
  'Reel Ideas',
  'Video Scripts',
  'Captions',
  'Creative References',
  'Hashtags',
  'Campaign Plans',
] as const;
export type ContentCategory = (typeof CONTENT_CATEGORIES)[number];

export const RESEARCH_CATEGORIES = [
  'Industry Research',
  'Competitor Research',
  'Market Trends',
  'Client Research',
  'Marketing Insights',
] as const;
export type ResearchCategory = (typeof RESEARCH_CATEGORIES)[number];

export const MEDIA_ASSET_TYPES = [
  'Image',
  'Video',
  'Document',
  'Brand Asset',
  'Generated Content',
] as const;
export type MediaAssetType = (typeof MEDIA_ASSET_TYPES)[number];
