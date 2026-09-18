import { describe, it, expect, beforeAll } from 'vitest';
import { PolicyEngine } from './policy-engine.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;
  let customerRepo: CustomerRepository;
  let bookingRepo: BookingRepository;

  beforeAll(async () => {
    engine = new PolicyEngine();
    customerRepo = new CustomerRepository();
    bookingRepo = new BookingRepository();
  });

  describe('TEST 1 — Valid airline cancellation refund', () => {
    it('should ALLOW refund for Priya cancelled flight', async () => {
      const priya = await customerRepo.findByPnr('SK4821X');
      const booking = await bookingRepo.findByPnr('SK4821X');

      expect(priya).toBeDefined();
      expect(booking).toBeDefined();

      const result = await engine.evaluate({
        actionType: 'FULL_REFUND',
        customer: priya!,
        booking: booking!,
      });

      expect(result.decision).toBe('ALLOWED');
      expect(result.reason).toContain('cancelled');
      expect(result.policyIds.length).toBeGreaterThan(0);
    });
  });

  describe('TEST 2 — Priya business-class upgrade', () => {
    it('should NOT automatically approve business-class upgrade', async () => {
      const priya = await customerRepo.findByPnr('SK4821X');
      const booking = await bookingRepo.findByPnr('SK4821X');

      const result = await engine.evaluate({
        actionType: 'BUSINESS_CLASS_UPGRADE',
        customer: priya!,
        booking: booking!,
      });

      // Must NOT be ALLOWED without explicit policy
      expect(result.decision).not.toBe('ALLOWED');
      expect(result.decision).toBe('UNSUPPORTED');
    });
  });

  describe('TEST 3 — Arvind 4-hour delay', () => {
    it('should evaluate delay assistance for 4-hour delay', async () => {
      const arvind = await customerRepo.findByPnr('TR1190B');
      const booking = await bookingRepo.findByPnr('TR1190B');

      expect(arvind).toBeDefined();
      expect(booking).toBeDefined();
      expect(booking?.status).toBe('DELAYED');

      const result = await engine.evaluate({
        actionType: 'DELAY_COMPENSATION',
        customer: arvind!,
        booking: booking!,
      });

      expect(result.decision).toBe('ALLOWED');
      expect(result.reason).toContain('delay');
    });
  });

  describe('TEST 4 — Meher hotel accommodation', () => {
    it('should ALLOW hotel for Meher 6-hour delay', async () => {
      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      expect(meher).toBeDefined();
      expect(booking).toBeDefined();
      expect(booking?.status).toBe('DELAYED');

      const result = await engine.evaluate({
        actionType: 'HOTEL_ACCOMMODATION',
        customer: meher!,
        booking: booking!,
      });

      expect(result.decision).toBe('ALLOWED');
      expect(result.reason).toContain('delay');
    });
  });

  describe('TEST 5 — CRITICAL: Meher ₹2,000 fare difference', () => {
    it('should ESCALATE for ₹2,000 when authority limit is ₹1,500', async () => {
      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      const result = await engine.evaluate({
        actionType: 'HIGHER_FARE_REBOOK',
        customer: meher!,
        booking: booking!,
        requestedAmount: 2000,
      });

      // CRITICAL TEST: Must escalate, not allow
      expect(result.decision).toBe('ESCALATE');
      expect(result.reason).toContain('2000');
      expect(result.reason).toContain('1500');
      expect(result.agentApprovalLimit).toBe(1500);
    });
  });

  describe('TEST 6 — Fare difference exactly at authority limit', () => {
    it('should ALLOW ₹1,500 fare difference', async () => {
      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      const result = await engine.evaluate({
        actionType: 'HIGHER_FARE_REBOOK',
        customer: meher!,
        booking: booking!,
        requestedAmount: 1500,
      });

      expect(result.decision).toBe('ALLOWED');
      expect(result.reason).toContain('within');
    });
  });

  describe('TEST 7 — Fare difference below authority', () => {
    it('should ALLOW ₹1,000 fare difference', async () => {
      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      const result = await engine.evaluate({
        actionType: 'HIGHER_FARE_REBOOK',
        customer: meher!,
        booking: booking!,
        requestedAmount: 1000,
      });

      expect(result.decision).toBe('ALLOWED');
      expect(result.agentApprovalLimit).toBe(1500);
    });
  });

  describe('TEST 8 — Missing fare difference', () => {
    it('should return NEEDS_INFORMATION when fare difference is missing', async () => {
      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      const result = await engine.evaluate({
        actionType: 'HIGHER_FARE_REBOOK',
        customer: meher!,
        booking: booking!,
        requestedAmount: undefined,
      });

      expect(result.decision).toBe('NEEDS_INFORMATION');
      expect(result.reason).toContain('amount');
    });
  });

  describe('TEST 9 — Unsupported action', () => {
    it('should return UNSUPPORTED for unknown action type', async () => {
      const priya = await customerRepo.findByPnr('SK4821X');
      const booking = await bookingRepo.findByPnr('SK4821X');

      const result = await engine.evaluate({
        actionType: 'UNKNOWN_BENEFIT',
        customer: priya!,
        booking: booking!,
      });

      expect(result.decision).toBe('UNSUPPORTED');
    });
  });

  describe('TEST 10 — Explicitly prohibited request', () => {
    it('should DENY refund for non-cancelled flight', async () => {
      const arvind = await customerRepo.findByPnr('TR1190B');
      const booking = await bookingRepo.findByPnr('TR1190B');

      // Arvind's flight is DELAYED, not CANCELLED
      expect(booking?.status).toBe('DELAYED');

      const result = await engine.evaluate({
        actionType: 'FULL_REFUND',
        customer: arvind!,
        booking: booking!,
      });

      expect(result.decision).toBe('DENIED_BY_POLICY');
      expect(result.reason).toContain('cancelled');
    });
  });

  describe('TEST 27 — CRITICAL SECURITY: LLM cannot override policy', () => {
    it('should ignore LLM decision field and independently evaluate', async () => {
      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      // Simulating LLM returning with a decision field
      const contextWithLLMDecision = {
        actionType: 'HIGHER_FARE_REBOOK',
        customer: meher!,
        booking: booking!,
        requestedAmount: 2000,
        llmDecision: 'ALLOWED', // LLM thinks it's allowed
      };

      const result = await engine.evaluate(contextWithLLMDecision as any);

      // Engine must NOT trust llmDecision field
      // Must independently evaluate and ESCALATE
      expect(result.decision).toBe('ESCALATE');
      expect(result.decision).not.toBe('ALLOWED');
    });
  });

  describe('Multiple Actions', () => {
    it('should evaluate actions independently', async () => {
      const priya = await customerRepo.findByPnr('SK4821X');
      const booking = await bookingRepo.findByPnr('SK4821X');

      const refundResult = await engine.evaluate({
        actionType: 'FULL_REFUND',
        customer: priya!,
        booking: booking!,
      });

      const upgradeResult = await engine.evaluate({
        actionType: 'BUSINESS_CLASS_UPGRADE',
        customer: priya!,
        booking: booking!,
      });

      // First action allowed
      expect(refundResult.decision).toBe('ALLOWED');

      // Second action not automatically approved
      expect(upgradeResult.decision).toBe('UNSUPPORTED');
      expect(upgradeResult.decision).not.toBe('ALLOWED');
    });
  });

  describe('Policy References', () => {
    it('should include policy references in result', async () => {
      const priya = await customerRepo.findByPnr('SK4821X');
      const booking = await bookingRepo.findByPnr('SK4821X');

      const result = await engine.evaluate({
        actionType: 'FULL_REFUND',
        customer: priya!,
        booking: booking!,
      });

      expect(result.policyIds).toBeDefined();
      expect(Array.isArray(result.policyIds)).toBe(true);
      expect(result.policyIds.length).toBeGreaterThan(0);
    });
  });

  describe('No Customer-Specific Branching', () => {
    it('should not contain hardcoded customer names or PNRs', async () => {
      // This test verifies by inspection that policy-engine.ts
      // does not contain customer-specific logic
      // The test passes if the engine operates generically

      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      const result = await engine.evaluate({
        actionType: 'HIGHER_FARE_REBOOK',
        customer: meher!,
        booking: booking!,
        requestedAmount: 2000,
      });

      // Decision should be based on amount vs authority,
      // not on who the customer is
      expect(result.decision).toBe('ESCALATE');

      // If customer was Arvind with same request
      const arvind = await customerRepo.findByPnr('TR1190B');
      const booking2 = await bookingRepo.findByPnr('TR1190B');

      const result2 = await engine.evaluate({
        actionType: 'HIGHER_FARE_REBOOK',
        customer: arvind!,
        booking: booking2!,
        requestedAmount: 2000,
      });

      // Same decision regardless of customer
      expect(result2.decision).toBe('ESCALATE');
    });
  });

  describe('Deterministic Evaluation', () => {
    it('should produce same result for same input', async () => {
      const meher = await customerRepo.findByPnr('WL7742');
      const booking = await bookingRepo.findByPnr('WL7742');

      const input = {
        actionType: 'HIGHER_FARE_REBOOK',
        customer: meher!,
        booking: booking!,
        requestedAmount: 2000,
      };

      const result1 = await engine.evaluate(input);
      const result2 = await engine.evaluate(input);

      expect(result1.decision).toBe(result2.decision);
      expect(result1.reason).toBe(result2.reason);
      expect(result1.policyIds).toEqual(result2.policyIds);
    });
  });
});
