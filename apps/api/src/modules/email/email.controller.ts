import { Request, Response, NextFunction } from 'express';
import { BrevoEmailService } from '../../services/brevoEmail.service';
import { ClientModel } from '../../models/client.model';
import { PaymentModel } from '../../models/payment.model';
import { RetainerModel } from '../../models/retainer.model';
import { ApiResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';
import { logAudit } from '../../middleware/audit.middleware';

export class EmailController {
  /**
   * Get Brevo configuration status
   */
  static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = BrevoEmailService.getStatus();
      return ApiResponse.success(res, status);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send custom email or account statement to a client
   */
  static async sendClientEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { clientId, subject, message, emailType = 'custom', periodLabel } = req.body;

      if (!clientId) throw new AppError('Client ID is required.', 400);
      if (!subject || !subject.trim()) throw new AppError('Subject is required.', 400);

      const client = await ClientModel.findOne({ _id: clientId, organizationId: user.organizationId });
      if (!client) throw new AppError('Client not found.', 404);
      if (!client.email) throw new AppError('Client does not have an email address configured.', 400);

      let htmlContent = '';

      if (emailType === 'reminder') {
        const retainer = await RetainerModel.findOne({ clientId: client._id, organizationId: user.organizationId });
        htmlContent = BrevoEmailService.generateRetainerReminderHtml({
          clientName: client.clientName,
          businessName: client.businessName,
          periodLabel: periodLabel || 'Current Active Period',
          monthlyFee: retainer?.currentPeriod?.monthlyFee || retainer?.monthlyFee || 3000,
          advancePaid: retainer?.currentPeriod?.tokenAmount || 0,
          pendingBalance: retainer?.currentPeriod?.pendingBalance ?? client.remainingBalance,
          notes: message,
        });
      } else {
        htmlContent = BrevoEmailService.generateCustomMessageHtml({
          clientName: client.clientName,
          businessName: client.businessName,
          subject,
          message: message || 'Please review your account details.',
        });
      }

      const result = await BrevoEmailService.sendEmail({
        toEmail: client.email,
        toName: client.clientName,
        subject,
        htmlContent,
      });

      await logAudit({
        organizationId: user.organizationId,
        userId: user._id,
        userEmail: user.email,
        action: 'EMAIL_SENT',
        entityType: 'Client',
        entityId: client._id.toString(),
        changes: { subject, recipient: client.email, emailType },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, result, `Email sent successfully to ${client.email}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * One-click send official payment receipt to client via Brevo
   */
  static async sendPaymentReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { paymentId } = req.params;

      const payment = await PaymentModel.findOne({ _id: paymentId, organizationId: user.organizationId })
        .populate('clientId', 'clientName businessName email phone remainingBalance');

      if (!payment) throw new AppError('Payment not found.', 404);

      const client: any = payment.clientId;
      if (!client || !client.email) {
        throw new AppError('Client email address not found on this payment record.', 400);
      }

      const paymentDateFormatted = new Date(payment.paymentDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const htmlContent = BrevoEmailService.generatePaymentReceiptHtml({
        clientName: client.clientName,
        businessName: client.businessName,
        amount: payment.amount,
        transactionReference: payment.transactionReference,
        paymentDate: paymentDateFormatted,
        paymentMethod: payment.paymentMethod,
        category: payment.category,
        remainingBalance: client.remainingBalance || 0,
        notes: payment.notes,
      });

      const subject = `Payment Receipt [₹${payment.amount.toLocaleString('en-IN')}] - ${client.businessName} - Jugarr Technologies`;

      const result = await BrevoEmailService.sendEmail({
        toEmail: client.email,
        toName: client.clientName,
        subject,
        htmlContent,
      });

      await logAudit({
        organizationId: user.organizationId,
        userId: user._id,
        userEmail: user.email,
        action: 'RECEIPT_EMAIL_SENT',
        entityType: 'Payment',
        entityId: payment._id.toString(),
        changes: { recipient: client.email, amount: payment.amount },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      return ApiResponse.success(res, result, `Payment receipt sent to ${client.email}`);
    } catch (error) {
      next(error);
    }
  }
}
