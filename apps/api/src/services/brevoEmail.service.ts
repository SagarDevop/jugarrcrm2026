import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export interface SendEmailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class BrevoEmailService {
  private static getApiKey(): string | undefined {
    return process.env.BREVO_API_KEY || process.env.BRAVO_API_KEY;
  }

  private static getSender(): { name: string; email: string } {
    return {
      name: process.env.BREVO_SENDER_NAME || process.env.BRAVO_SENDER_NAME || 'Jugarr Technologies',
      email: process.env.BREVO_SENDER_EMAIL || process.env.BRAVO_SENDER_EMAIL || 'sagar@jugarr.in',
    };
  }

  public static isConfigured(): boolean {
    return !!this.getApiKey();
  }

  public static getStatus() {
    const sender = this.getSender();
    return {
      configured: this.isConfigured(),
      senderName: sender.name,
      senderEmail: sender.email,
    };
  }

  /**
   * Sends transactional email using Brevo (Bravo) REST API v3
   */
  public static async sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new AppError(
        'Brevo (Bravo) API key is not configured. Please add BREVO_API_KEY to your Render / environment variables.',
        400
      );
    }

    const sender = this.getSender();

    const payload = {
      sender,
      to: [
        {
          email: options.toEmail,
          name: options.toName,
        },
      ],
      subject: options.subject,
      htmlContent: options.htmlContent,
      ...(options.textContent ? { textContent: options.textContent } : {}),
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey.trim(),
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = data?.message || response.statusText || 'Unknown Brevo API error';
        logger.error(`[BrevoEmailService] Failed to send email to ${options.toEmail}: ${errorMsg}`, data);
        throw new AppError(`Brevo Email Error: ${errorMsg}`, response.status === 401 ? 401 : 400);
      }

      logger.info(`[BrevoEmailService] Email sent successfully to ${options.toEmail} (ID: ${data?.messageId})`);
      return { success: true, messageId: data?.messageId };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      logger.error(`[BrevoEmailService] Network/Request error: ${error.message}`);
      throw new AppError(`Failed to send email via Brevo: ${error.message}`, 502);
    }
  }

  /**
   * Professional HTML Receipt Email Template for Payments
   */
  public static generatePaymentReceiptHtml(params: {
    clientName: string;
    businessName: string;
    amount: number;
    transactionReference: string;
    paymentDate: string;
    paymentMethod: string;
    category: string;
    remainingBalance: number;
    notes?: string;
  }): string {
    const formattedAmount = `₹${params.amount.toLocaleString('en-IN')}`;
    const formattedRemaining = `₹${params.remainingBalance.toLocaleString('en-IN')}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Receipt - Jugarr Technologies</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F6F8; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .header { background: #991B1B; padding: 28px 32px; color: #FFFFFF; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px; }
    .badge { display: inline-block; padding: 4px 12px; background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; border-radius: 999px; font-size: 11px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
    .amount-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
    .amount-box .label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748B; margin-bottom: 4px; }
    .amount-box .val { font-size: 32px; font-weight: 800; color: #047857; margin: 0; }
    .details-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; }
    .details-table td.label { font-weight: 600; color: #64748B; width: 40%; }
    .details-table td.val { font-weight: 700; color: #0F172A; text-align: right; }
    .footer { background: #F8FAFC; padding: 20px 32px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer a { color: #991B1B; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Jugarr Technologies</h1>
      <p>Official Payment Inflow Receipt & Confirmation</p>
    </div>
    <div class="content">
      <div class="badge">✓ Payment Verified & Recorded</div>
      <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5;">
        Dear <strong>${params.clientName}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; font-size: 13px; color: #475569; line-height: 1.6;">
        We have received and verified your payment on our central ledger. Below are the audited transaction details:
      </p>

      <div class="amount-box">
        <div class="label">Amount Received</div>
        <div class="val">${formattedAmount}</div>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Business / Account</td>
          <td class="val">${params.businessName}</td>
        </tr>
        <tr>
          <td class="label">Transaction Ref / UTR</td>
          <td class="val"><code style="background:#F1F5F9; padding:2px 6px; border-radius:4px; font-size:12px;">${params.transactionReference}</code></td>
        </tr>
        <tr>
          <td class="label">Payment Date</td>
          <td class="val">${params.paymentDate}</td>
        </tr>
        <tr>
          <td class="label">Category</td>
          <td class="val">${params.category}</td>
        </tr>
        <tr>
          <td class="label">Payment Method</td>
          <td class="val">${params.paymentMethod}</td>
        </tr>
        <tr>
          <td class="label">Remaining Balance Due</td>
          <td class="val" style="color: ${params.remainingBalance > 0 ? '#B91C1C' : '#047857'}; font-weight: 800;">${formattedRemaining}</td>
        </tr>
        ${
          params.notes
            ? `
        <tr>
          <td class="label">Notes / Remarks</td>
          <td class="val" style="font-weight: 500; color: #475569;">${params.notes}</td>
        </tr>`
            : ''
        }
      </table>

      <p style="margin-top: 24px; font-size: 12px; color: #64748B; line-height: 1.5;">
        If you have any questions or require updated invoices, feel free to reply directly to this email.
      </p>
    </div>
    <div class="footer">
      Jugarr Technologies Executive Portal • <a href="https://vinsan.jugarr.in">vinsan.jugarr.in</a><br/>
      Need support? Contact us at sagar@jugarr.in
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Branded Custom Client Message Email Template
   */
  public static generateCustomMessageHtml(params: {
    clientName: string;
    businessName: string;
    subject: string;
    message: string;
  }): string {
    const formattedMessage = params.message.replace(/\n/g, '<br/>');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${params.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F6F8; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
    .header { background: #991B1B; padding: 24px 32px; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px; }
    .message-body { font-size: 14px; line-height: 1.7; color: #334155; margin-top: 16px; }
    .footer { background: #F8FAFC; padding: 20px 32px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; }
    .footer a { color: #991B1B; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Jugarr Technologies</h1>
      <p>${params.businessName}</p>
    </div>
    <div class="content">
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0F172A;">
        Dear ${params.clientName},
      </p>

      <div class="message-body">
        ${formattedMessage}
      </div>

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #F1F5F9; font-size: 13px; color: #475569;">
        Warm regards,<br/>
        <strong>Sagar & The Jugarr Technologies Team</strong><br/>
        <span style="font-size: 11px; color: #94A3B8;">sagar@jugarr.in • vinsan.jugarr.in</span>
      </div>
    </div>
    <div class="footer">
      Jugarr Technologies Executive Portal • <a href="https://vinsan.jugarr.in">vinsan.jugarr.in</a>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Retainer Cycle Renewal / Reminder Template
   */
  public static generateRetainerReminderHtml(params: {
    clientName: string;
    businessName: string;
    periodLabel: string;
    monthlyFee: number;
    advancePaid: number;
    pendingBalance: number;
    notes?: string;
  }): string {
    const feeStr = `₹${params.monthlyFee.toLocaleString('en-IN')}`;
    const advanceStr = `₹${params.advancePaid.toLocaleString('en-IN')}`;
    const pendingStr = `₹${params.pendingBalance.toLocaleString('en-IN')}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monthly Retainer Cycle Update - Jugarr Technologies</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F5F6F8; margin: 0; padding: 24px; color: #1E293B; }
    .container { max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 14px; overflow: hidden; border: 1px solid #E2E8F0; }
    .header { background: #991B1B; padding: 24px 32px; color: #FFFFFF; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; }
    .content { padding: 32px; }
    .table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    .table td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; }
    .table td.label { font-weight: 600; color: #64748B; width: 45%; }
    .table td.val { font-weight: 700; color: #0F172A; text-align: right; }
    .footer { background: #F8FAFC; padding: 20px 32px; font-size: 11px; color: #94A3B8; text-align: center; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Jugarr Technologies</h1>
      <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Monthly Retainer Billing Cycle Update</p>
    </div>
    <div class="content">
      <p style="margin: 0 0 16px 0; font-size: 14px;">
        Dear <strong>${params.clientName}</strong> (${params.businessName}),
      </p>
      <p style="font-size: 13px; color: #475569; line-height: 1.6;">
        Here is the billing statement for your active monthly social media retainer cycle:
      </p>

      <table class="table">
        <tr>
          <td class="label">Cycle Period</td>
          <td class="val">${params.periodLabel}</td>
        </tr>
        <tr>
          <td class="label">Period Fee</td>
          <td class="val">${feeStr}</td>
        </tr>
        <tr>
          <td class="label">Advance / Paid Received</td>
          <td class="val" style="color: #047857;">${advanceStr}</td>
        </tr>
        <tr>
          <td class="label">Is Mahine Baki (Due)</td>
          <td class="val" style="color: ${params.pendingBalance > 0 ? '#B91C1C' : '#047857'}; font-size: 15px;">${pendingStr}</td>
        </tr>
      </table>

      ${
        params.notes
          ? `<p style="margin-top: 16px; font-size: 12px; color: #64748B;"><em>${params.notes}</em></p>`
          : ''
      }

      <p style="margin-top: 24px; font-size: 12px; color: #64748B;">
        For UPI / Bank transfer payments, please transfer to our registered account and share the reference with us.
      </p>
    </div>
    <div class="footer">
      Jugarr Technologies • Executive Billing Management • sagar@jugarr.in
    </div>
  </div>
</body>
</html>
    `.trim();
  }
}
