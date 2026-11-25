import { describe, it, expect } from 'vitest';
import { sanitizeClientForSales } from '../src/modules/clients/client.controller';

describe('RBAC - Client Record Level Sanitization', () => {
  const mockClient = {
    _id: 'client_123',
    clientName: 'Alice Walker',
    businessName: 'Verve Studio',
    phone: '+91 9998887776',
    email: 'alice@vervestudio.com',
    industry: 'Branding',
    totalContractAmount: 200000,
    initialToken: 25000,
    advancePayment: 75000,
    remainingBalance: 100000,
    customQuotation: 200000,
    internalNotes: 'VIP client with 65% internal margin expectation',
  };

  it('strips all sensitive financial data when user lacks finance permission', () => {
    const sanitized = sanitizeClientForSales(mockClient, false);

    expect(sanitized.clientName).toBe('Alice Walker');
    expect(sanitized.businessName).toBe('Verve Studio');
    expect(sanitized.phone).toBe('+91 9998887776');

    // Confirms sensitive fields are completely deleted
    expect(sanitized.totalContractAmount).toBeUndefined();
    expect(sanitized.initialToken).toBeUndefined();
    expect(sanitized.advancePayment).toBeUndefined();
    expect(sanitized.remainingBalance).toBeUndefined();
    expect(sanitized.customQuotation).toBeUndefined();
    expect(sanitized.internalNotes).toBeUndefined();
  });

  it('preserves full financial data when user has finance permission (Super Admin)', () => {
    const fullAccess = sanitizeClientForSales(mockClient, true);

    expect(fullAccess.totalContractAmount).toBe(200000);
    expect(fullAccess.remainingBalance).toBe(100000);
    expect(fullAccess.internalNotes).toBe('VIP client with 65% internal margin expectation');
  });
});
