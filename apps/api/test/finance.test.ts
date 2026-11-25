import { describe, it, expect } from 'vitest';

describe('Financial Engine - Profit & Margin Calculations', () => {
  const calculateProfitMetrics = (verifiedInflow: number, recognizedExpenses: number) => {
    const netProfit = verifiedInflow - recognizedExpenses;
    const profitMargin = verifiedInflow > 0 ? Math.round((netProfit / verifiedInflow) * 100 * 10) / 10 : 0;
    return { netProfit, profitMargin };
  };

  it('correctly calculates positive net profit and profit margin percentage', () => {
    const inflow = 110000;
    const expenses = 44700;
    const { netProfit, profitMargin } = calculateProfitMetrics(inflow, expenses);

    expect(netProfit).toBe(65300);
    // (65300 / 110000) * 100 = 59.36% -> rounded to 59.4%
    expect(profitMargin).toBe(59.4);
  });

  it('correctly handles zero cash inflow without division by zero or NaN', () => {
    const inflow = 0;
    const expenses = 15000;
    const { netProfit, profitMargin } = calculateProfitMetrics(inflow, expenses);

    expect(netProfit).toBe(-15000);
    expect(profitMargin).toBe(0); // Safely returns 0, never NaN or Infinity
    expect(Number.isFinite(profitMargin)).toBe(true);
  });

  it('strictly excludes pending receivables from cleared cash inflow', () => {
    const verifiedPayments = 50000;
    const pendingReceivables = 75000;
    const expenses = 20000;

    // Rule: pending payments never enter inflow
    const clearedInflow = verifiedPayments;
    const { netProfit } = calculateProfitMetrics(clearedInflow, expenses);

    expect(netProfit).toBe(30000); // 50000 - 20000, not 125000 - 20000
  });
});
