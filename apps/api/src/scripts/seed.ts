import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // ignore if restricted
}

import { config } from '../config';
import { OrganizationModel } from '../models/organization.model';
import { UserModel } from '../models/user.model';
import { ClientModel } from '../models/client.model';
import { LeadModel } from '../models/lead.model';
import { ProjectModel } from '../models/project.model';
import { RetainerModel } from '../models/retainer.model';
import { PaymentModel } from '../models/payment.model';
import { ExpenseModel } from '../models/expense.model';
import { CallModel } from '../models/call.model';
import { FollowUpModel } from '../models/followup.model';
import { CommissionModel } from '../models/commission.model';
import { KnowledgeResourceModel } from '../models/knowledge.model';
import { ContentItemModel } from '../models/content.model';
import { NotificationModel } from '../models/notification.model';
import { ActivityEventModel } from '../models/activityEvent.model';
import { SettingsModel } from '../models/settings.model';
import { CatalogModel } from '../models/catalog.model';
import { ChatRoomModel } from '../models/chatRoom.model';
import { ChatMessageModel } from '../models/chatMessage.model';
import {
  USER_ROLES,
  DEFAULT_SUPER_ADMIN_PERMISSIONS,
} from '@agencyos/shared';

const seedDatabase = async () => {
  try {
    console.log('[Clean Init] Connecting to database:', config.mongodbUri);
    await mongoose.connect(config.mongodbUri);

    console.log('[Clean Init] Clearing ALL existing demo/fake data from database...');
    await Promise.all([
      OrganizationModel.deleteMany({}),
      UserModel.deleteMany({}),
      ClientModel.deleteMany({}),
      LeadModel.deleteMany({}),
      ProjectModel.deleteMany({}),
      RetainerModel.deleteMany({}),
      PaymentModel.deleteMany({}),
      ExpenseModel.deleteMany({}),
      CallModel.deleteMany({}),
      FollowUpModel.deleteMany({}),
      CommissionModel.deleteMany({}),
      KnowledgeResourceModel.deleteMany({}),
      ContentItemModel.deleteMany({}),
      NotificationModel.deleteMany({}),
      ActivityEventModel.deleteMany({}),
      SettingsModel.deleteMany({}),
      CatalogModel.deleteMany({}),
      ChatRoomModel.deleteMany({}),
      ChatMessageModel.deleteMany({}),
    ]);

    console.log('[Clean Init] Creating Jugarr Agency Organization...');
    const org = await OrganizationModel.create({
      name: 'Jugarr Technologies',
      slug: 'jugarr',
      currency: 'INR',
      fiscalYearStartMonth: 4,
    });

    console.log('[Clean Init] Creating System Settings...');
    await SettingsModel.create({
      organizationId: org._id,
      companyName: org.name,
      currency: 'INR',
    });

    console.log('[Clean Init] Creating Sagar Jugarr Super Admin...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('sagarjugarr2026', salt);

    const superAdmin = await UserModel.create({
      organizationId: org._id,
      name: 'Sagar | Jugarr Founder',
      email: 'sagar@jugarr.in',
      passwordHash,
      role: USER_ROLES.SUPER_ADMIN,
      permissions: DEFAULT_SUPER_ADMIN_PERMISSIONS,
      phone: '+91 9999999999',
      isActive: true,
    });

    console.log('[Clean Init] Creating Official Jugarr Service Catalog Starter Packages...');
    await CatalogModel.create([
      {
        organizationId: org._id,
        title: 'Modern E-Commerce Storefront & Automation',
        category: 'Web Development',
        description: 'High-conversion headless e-commerce store with integrated payment gateway, inventory sync, and WhatsApp order alerts.',
        pricingType: 'Starting At',
        basePrice: 65000,
        maxPrice: 120000,
        deliveryDays: 25,
        timeline: '3 - 4 Weeks',
        deliverables: [
          'Custom Next.js / React UX Design',
          'Razorpay & Stripe Checkout Gateway',
          'Admin Product & Order Management',
          'Abandoned Cart Recovery via WhatsApp',
          'Sub-second 95+ Google Lighthouse Score',
        ],
        techStack: ['Next.js', 'React', 'Tailwind CSS', 'Node.js', 'MongoDB', 'Razorpay'],
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        targetClient: 'D2C Brands, Fashion, Electronics, Gourmet Food Brands scaling beyond Shopify limitations.',
        pitchTips: 'Highlight lost sales from slow templates. Emphasize sub-second checkout speed and automated customer conversion.',
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        organizationId: org._id,
        title: 'High-Converting Corporate Portal & CMS',
        category: 'Web Development',
        description: 'Enterprise grade dynamic brand website with interactive case studies, lead capture funnels, and automated CRM webhook routing.',
        pricingType: 'Fixed',
        basePrice: 45000,
        deliveryDays: 14,
        timeline: '2 Weeks',
        deliverables: [
          'Responsive 8-12 Page Custom Design',
          'Headless CMS for Instant Content Updates',
          'SEO Metadata Architecture & Schema Markup',
          'Lead Capture Forms with Instant Email/WhatsApp Alerts',
          'Interactive Company Presentation & Portfolio',
        ],
        techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        targetClient: 'B2B Consulting, Financial Firms, Real Estate Developers, Tech Consultancies.',
        pitchTips: 'Position this as a 24/7 automated sales asset that establishes credibility for high-ticket deals.',
        isActive: true,
        createdBy: superAdmin._id,
      },
      {
        organizationId: org._id,
        title: 'Social Media Viral Retainer (Growth Tier)',
        category: 'Social Media Marketing',
        description: 'End-to-end short form video production, daily stories, graphic carousels, and community DM engagement.',
        pricingType: 'Starting At',
        basePrice: 35000,
        maxPrice: 60000,
        deliveryDays: 30,
        timeline: 'Monthly Retainer',
        deliverables: [
          '16 High-Engagement Instagram Reels / Shorts',
          '12 Custom Brand Graphic Carousels',
          '25 Interactive Daily Story sequences',
          'Hashtag & Viral Audio Research Matrix',
          'Monthly ROI & Growth Performance Dashboard',
        ],
        techStack: ['Premiere Pro', 'After Effects', 'Figma', 'Meta Business Suite'],
        imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
        targetClient: 'Clinics, Fitness Brands, Restaurants, Real Estate Agents, Coaches.',
        pitchTips: 'Frame this as hiring an entire media production team for less than the cost of one in-house junior intern.',
        isActive: true,
        createdBy: superAdmin._id,
      },
    ]);

    console.log('[Clean Init] Creating Fresh Team Live Chat HQ Channel...');
    const generalRoom = await ChatRoomModel.create({
      organizationId: org._id,
      name: 'General Agency HQ',
      isGroup: true,
      description: 'Official Jugarr Agency company channel for team announcements and collaboration.',
      avatar: '🏢',
      members: [
        {
          userId: superAdmin._id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
          joinedAt: new Date(),
        },
      ],
      lastMessage: {
        text: 'Welcome to Jugarr CRM! The system is fresh, live and ready for business.',
        senderId: superAdmin._id.toString(),
        senderName: superAdmin.name,
        sentAt: new Date(),
      },
      createdBy: superAdmin._id,
    });

    await ChatMessageModel.create({
      organizationId: org._id,
      roomId: generalRoom._id,
      senderId: superAdmin._id,
      senderName: superAdmin.name,
      senderRole: superAdmin.role,
      message: 'Welcome Sagar to your fresh Jugarr Agency CRM! 🚀 All clients, leads, and finances are clean and ready for real business.',
      sentAt: new Date(),
    });

    console.log('[Clean Init] All fake data purged. Fresh production setup completed!');
    console.log('====================================================');
    console.log('Super Admin Name:    Sagar | Jugarr Founder');
    console.log('Super Admin Email:   sagar@jugarr.in');
    console.log('Super Admin Pass:    sagarjugarr2026');
    console.log('Company:             Jugarr Technologies');
    console.log('Clean Status:        0 Fake Clients | 0 Fake Leads | 0 Fake Projects | 0 Fake Expenses');
    console.log('====================================================');

    await mongoose.disconnect();
  } catch (err) {
    console.error('[Clean Init] Error during seeding:', err);
    process.exit(1);
  }
};

seedDatabase();
