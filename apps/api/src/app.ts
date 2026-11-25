import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import teamRoutes from './modules/team/team.routes';
import leadRoutes from './modules/leads/lead.routes';
import clientRoutes from './modules/clients/client.routes';
import projectRoutes from './modules/projects/project.routes';
import retainerRoutes from './modules/retainers/retainer.routes';
import paymentRoutes from './modules/payments/payment.routes';
import expenseRoutes from './modules/expenses/expense.routes';
import financeRoutes from './modules/finance/finance.routes';
import salesRoutes from './modules/sales/sales.routes';
import callRoutes from './modules/calls/call.routes';
import followupRoutes from './modules/followups/followup.routes';
import commissionRoutes from './modules/commissions/commission.routes';
import knowledgeRoutes from './modules/knowledge/knowledge.routes';
import contentRoutes from './modules/content/content.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import auditRoutes from './modules/audit/audit.routes';
import catalogRoutes from './modules/catalog/catalog.routes';
import chatRoutes from './modules/chat/chat.routes';

export const createApp = (): Application => {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(
    cors({
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  if (config.env !== 'test') {
    app.use(morgan('dev'));
  }

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      product: 'AgencyOS',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API modules
  app.use('/api/auth', authRoutes);
  app.use('/api/team', teamRoutes);
  app.use('/api/leads', leadRoutes);
  app.use('/api/clients', clientRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/retainers', retainerRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/expenses', expenseRoutes);
  app.use('/api/finance', financeRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/calls', callRoutes);
  app.use('/api/followups', followupRoutes);
  app.use('/api/commissions', commissionRoutes);
  app.use('/api/knowledge', knowledgeRoutes);
  app.use('/api/content', contentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/audit', auditRoutes);
  app.use('/api/catalog', catalogRoutes);
  app.use('/api/chat', chatRoutes);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
