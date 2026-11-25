import { describe, it, expect } from 'vitest';
import { calculateAnchorPeriod } from '../src/modules/retainers/retainer.controller';

describe('Retainer Engine - Anchor Date Preservation', () => {
  it('should maintain anchor day 20 across consecutive months without date drift', () => {
    const period1Start = new Date('2026-09-20T00:00:00.000Z');
    const { start: p1Start, end: p1End } = calculateAnchorPeriod(period1Start, 20);

    expect(p1End.getUTCDate()).toBe(20);
    expect(p1End.getUTCMonth()).toBe(9); // October (0-indexed: 9 = Oct)

    // Period 2: from Period 1 End
    const { start: p2Start, end: p2End } = calculateAnchorPeriod(p1End, 20);
    expect(p2End.getUTCDate()).toBe(20);
    expect(p2End.getUTCMonth()).toBe(10); // November

    // Period 3: from Period 2 End
    const { start: p3Start, end: p3End } = calculateAnchorPeriod(p2End, 20);
    expect(p3End.getUTCDate()).toBe(20);
    expect(p3End.getUTCMonth()).toBe(11); // December
  });

  it('should safely handle month-end edge cases (e.g. anchor day 31)', () => {
    // Starting on January 31st
    const jan31 = new Date('2026-01-31T00:00:00.000Z');
    const { end: febEnd } = calculateAnchorPeriod(jan31, 31);

    // February 2026 has 28 days: should snap to 28 without overflowing into March
    expect(febEnd.getUTCDate()).toBe(28);
    expect(febEnd.getUTCMonth()).toBe(1); // Feb

    // Next period from Feb 28 back to 31st: March has 31 days, so snaps back to 31
    const { end: marEnd } = calculateAnchorPeriod(febEnd, 31);
    expect(marEnd.getUTCDate()).toBe(31);
    expect(marEnd.getUTCMonth()).toBe(2); // March
  });
});
