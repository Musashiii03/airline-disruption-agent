/**
 * Action Service Tests
 * Tests for action execution with authorization gates
 * CRITICAL: Only ALLOWED actions execute
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { ActionService, ActionExecutionInput } from './action.service.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';

describe('ActionService', () => {
  let actionService: ActionService;
  let customerRepo: CustomerRepository;
  let bookingRepo: BookingRepository;
  let customerId: number;
  let bookingId: number;

  beforeAll(async () => {
    actionService = new ActionService();
    customerRepo = new CustomerRepository();
    bookingRepo = new BookingRepository();

    // Get test customer and booking
    const customer = await customerRepo.findByPnr('SK4821X');
    const booking = await bookingRepo.findByPnr('SK4821X');

    if (customer && booking) {
      customerId = customer.id;
      bookingId = booking.id;
    }
  });

  describe('TEST 1 — Allowed Refund Executes', () => {
    it('should execute FULL_REFUND when decision is ALLOWED', async () => {
      const input: ActionExecutionInput = {
        actionType: 'FULL_REFUND',
        customerId,
        bookingId,
        conversationId: 1,
        parameters: {},
        policyDecision: 'ALLOWED',
        policyIds: [2],
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(true);
      expect(result.status).toBe('EXECUTED');
      expect(result.mode).toBe('PROTOTYPE');
      expect(result.actionId).toBeDefined();
      expect(result.message).toContain('prototype mode');
    });
  });

  describe('TEST 2 — Escalated Action Does Not Execute', () => {
    it('should NOT execute when decision is ESCALATE', async () => {
      const input: ActionExecutionInput = {
        actionType: 'HIGHER_FARE_REBOOK',
        customerId,
        bookingId,
        conversationId: 2,
        parameters: { fareDifference: 2000 },
        policyDecision: 'ESCALATE',
        policyIds: [4],
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(false);
      expect(result.status).toBe('ESCALATED');
      expect(result.message).toContain('cannot be executed');
      expect(result.message).toContain('ESCALATE');
    });
  });

  describe('TEST 3 — Denied Action Does Not Execute', () => {
    it('should NOT execute when decision is DENIED_BY_POLICY', async () => {
      const input: ActionExecutionInput = {
        actionType: 'HOTEL_ACCOMMODATION',
        customerId,
        bookingId,
        conversationId: 3,
        parameters: {},
        policyDecision: 'DENIED_BY_POLICY',
        policyIds: [3],
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED');
      expect(result.message).toContain('cannot be executed');
    });
  });

  describe('TEST 4 — Missing Information Does Not Execute', () => {
    it('should NOT execute when decision is NEEDS_INFORMATION', async () => {
      const input: ActionExecutionInput = {
        actionType: 'REBOOK_FLIGHT',
        customerId,
        bookingId,
        conversationId: 4,
        parameters: {},
        policyDecision: 'NEEDS_INFORMATION',
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
    });
  });

  describe('TEST 5 — Unsupported Action Does Not Execute', () => {
    it('should NOT execute when decision is UNSUPPORTED', async () => {
      const input: ActionExecutionInput = {
        actionType: 'BUSINESS_CLASS_UPGRADE',
        customerId,
        bookingId,
        conversationId: 5,
        parameters: { cabin: 'BUSINESS' },
        policyDecision: 'UNSUPPORTED',
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(false);
      expect(result.status).toBe('FAILED');
    });
  });

  describe('TEST 6 — Hotel Action Executes When Allowed', () => {
    it('should execute HOTEL_ACCOMMODATION when decision is ALLOWED', async () => {
      const input: ActionExecutionInput = {
        actionType: 'HOTEL_ACCOMMODATION',
        customerId,
        bookingId,
        conversationId: 6,
        parameters: {},
        policyDecision: 'ALLOWED',
        policyIds: [3],
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(true);
      expect(result.status).toBe('EXECUTED');
      expect(result.mode).toBe('PROTOTYPE');
      expect(result.message).toContain('Hotel accommodation');
    });
  });

  describe('TEST 7 — Meal Voucher Executes When Allowed', () => {
    it('should execute MEAL_VOUCHER when decision is ALLOWED', async () => {
      const input: ActionExecutionInput = {
        actionType: 'MEAL_VOUCHER',
        customerId,
        bookingId,
        conversationId: 7,
        parameters: {},
        policyDecision: 'ALLOWED',
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(true);
      expect(result.status).toBe('EXECUTED');
      expect(result.message).toContain('Meal voucher');
    });
  });

  describe('TEST 8 — Lounge Access Executes When Allowed', () => {
    it('should execute LOUNGE_ACCESS when decision is ALLOWED', async () => {
      const input: ActionExecutionInput = {
        actionType: 'LOUNGE_ACCESS',
        customerId,
        bookingId,
        conversationId: 8,
        parameters: {},
        policyDecision: 'ALLOWED',
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(true);
      expect(result.status).toBe('EXECUTED');
      expect(result.message).toContain('Lounge access');
    });
  });

  describe('TEST 9 — Rebooking Executes When Allowed', () => {
    it('should execute REBOOK_FLIGHT when decision is ALLOWED', async () => {
      const input: ActionExecutionInput = {
        actionType: 'REBOOK_FLIGHT',
        customerId,
        bookingId,
        conversationId: 9,
        parameters: {},
        policyDecision: 'ALLOWED',
      };

      const result = await actionService.executeAction(input);

      expect(result.success).toBe(true);
      expect(result.status).toBe('EXECUTED');
      expect(result.message).toContain('Rebooking');
    });
  });

  describe('TEST 10 — CRITICAL: Authorization Gate Enforced', () => {
    it('should enforce authorization gate - NO execution without ALLOWED decision', async () => {
      const decisions: Array<ActionExecutionInput['policyDecision']> = [
        'ESCALATE',
        'DENIED_BY_POLICY',
        'NEEDS_INFORMATION',
        'UNSUPPORTED',
      ];

      for (const decision of decisions) {
        const input: ActionExecutionInput = {
          actionType: 'FULL_REFUND',
          customerId,
          bookingId,
          conversationId: 10,
          parameters: {},
          policyDecision: decision,
        };

        const result = await actionService.executeAction(input);

        // CRITICAL: No execution for non-ALLOWED decisions
        expect(result.success).toBe(false);
        expect(result.status).not.toBe('EXECUTED');
        expect(result.message).toContain('cannot be executed');
      }
    });
  });

  describe('TEST 11 — Action Record Persists', () => {
    it('should persist action record to repository', async () => {
      const input: ActionExecutionInput = {
        actionType: 'FULL_REFUND',
        customerId,
        bookingId,
        conversationId: 11,
        parameters: { test: true },
        policyDecision: 'ALLOWED',
      };

      const result = await actionService.executeAction(input);

      expect(result.actionId).toBeDefined();

      // Retrieve action to verify persistence
      const action = await actionService.getById(result.actionId!);

      expect(action).toBeDefined();
      expect(action?.actionType).toBe('FULL_REFUND');
      expect(action?.status).toBe('EXECUTED');
      expect(action?.policyDecision).toBe('ALLOWED');
      expect(action?.requestedData).toEqual({ test: true });
    });
  });

  describe('TEST 12 — Policy References Stored', () => {
    it('should store policy references with action', async () => {
      const policyIds = [1, 2];
      const input: ActionExecutionInput = {
        actionType: 'FULL_REFUND',
        customerId,
        bookingId,
        conversationId: 12,
        parameters: {},
        policyDecision: 'ALLOWED',
        policyIds,
      };

      const result = await actionService.executeAction(input);

      expect(result.actionId).toBeDefined();

      // Verify policy references
      const references = await actionService.getPolicyReferences(result.actionId!);
      expect(references).toBeDefined();
      expect(references.length).toBeGreaterThan(0);
    });
  });
});
