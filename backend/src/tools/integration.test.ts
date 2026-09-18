/**
 * LLM to Tool Layer Integration Tests
 * Verifies correct data flow from LLM understanding to tool retrieval
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MockLLMProvider } from '../llm/mock-provider.js';
import { CustomerTool } from './customer.tool.js';
import { BookingTool } from './booking.tool.js';
import { PolicyTool } from './policy.tool.js';
import { ToolRegistry } from './registry.js';
import { CustomerService } from '../services/customer.service.js';
import { BookingService } from '../services/booking.service.js';
import { PolicyService } from '../services/policy.service.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { PolicyRepository } from '../repositories/policy.repository.js';

describe('LLM to Tool Integration', () => {
  let llmProvider: MockLLMProvider;
  let customerTool: CustomerTool;
  let bookingTool: BookingTool;
  let policyTool: PolicyTool;

  beforeAll(() => {
    // Initialize LLM provider
    llmProvider = new MockLLMProvider();

    // Initialize repositories
    const customerRepo = new CustomerRepository();
    const bookingRepo = new BookingRepository();
    const policyRepo = new PolicyRepository();

    // Initialize services
    const customerService = new CustomerService(customerRepo);
    const bookingService = new BookingService(bookingRepo);
    const policyService = new PolicyService(policyRepo);

    // Initialize tools
    customerTool = new CustomerTool(customerService);
    bookingTool = new BookingTool(bookingService);
    policyTool = new PolicyTool(policyService);

    // Initialize registry
    ToolRegistry.initialize(customerService, bookingService, policyService);
  });

  describe('TEST 1 — LLM to Customer Tool Boundary', () => {
    it('should use LLM extracted PNR to look up customer', async () => {
      // Step 1: LLM understands customer message
      const llmResult = await llmProvider.understandCustomerMessage({
        message: 'My flight SK-204 was cancelled. My PNR is SK4821X.',
      });

      expect(llmResult.entities.pnr).toBe('SK4821X');

      // Step 2: Use LLM-extracted PNR with tool
      const toolResult = await customerTool.getCustomerByPnr({
        pnr: llmResult.entities.pnr,
      });

      // Step 3: Verify customer retrieved
      expect(toolResult.found).toBe(true);
      expect(toolResult.customer?.name).toBe('Priya Nair');
    });
  });

  describe('TEST 2 — LLM to Booking Tool Boundary', () => {
    it('should use LLM extracted PNR to look up authoritative booking', async () => {
      // Step 1: LLM extracts PNR
      const llmResult = await llmProvider.understandCustomerMessage({
        message: 'My flight has been delayed by 4 hours. My PNR is TR1190B.',
      });

      expect(llmResult.entities.pnr).toBe('TR1190B');

      // Step 2: Use tool to get actual booking status
      const bookingResult = await bookingTool.getBookingByPnr({
        pnr: llmResult.entities.pnr!,
      });

      // Step 3: Verify tool returns actual authoritative data
      expect(bookingResult.found).toBe(true);
      expect(bookingResult.booking).toBeDefined();
      expect(bookingResult.booking?.status).toBe('DELAYED');
      expect(bookingResult.booking?.segments?.[0]?.delayHours).toBe(4);
    });
  });

  describe('TEST 3 — CRITICAL: Trust Backend Data Over LLM Claims', () => {
    it('should not trust LLM status claims over tool data', async () => {
      // Simulate scenario where LLM claims booking is CONFIRMED
      // but actual data shows DELAYED

      const llmClaim = {
        pnr: 'TR1190B',
        bookingStatus: 'CONFIRMED', // LLM incorrectly claims this
      };

      // Use tool to get authoritative data
      const toolResult = await bookingTool.getBookingByPnr({
        pnr: llmClaim.pnr,
      });

      // Tool returns actual status from backend
      expect(toolResult.booking?.status).toBe('DELAYED');

      // Should NOT be what LLM claimed
      expect(toolResult.booking?.status).not.toBe(llmClaim.bookingStatus);

      // This proves: LLM claims ≠ Authoritative backend data
      expect(toolResult.booking?.status).toBe('DELAYED');
    });
  });

  describe('TEST 4 — LLM to Policy Tool Boundary', () => {
    it('should use LLM intent to find relevant policies', async () => {
      // Step 1: LLM extracts intent and action type
      const llmResult = await llmProvider.understandCustomerMessage({
        message: 'My flight was cancelled. I want a full refund.',
      });

      expect(llmResult.intent).toBe('REFUND_REQUEST');
      expect(llmResult.actions[0].type).toBe('FULL_REFUND');

      // Step 2: Use policy tool with LLM-extracted action
      const policyResult = await policyTool.getRelevantPolicies({
        actionType: 'FULL_REFUND',
        bookingStatus: 'CANCELLED',
      });

      // Step 3: Verify policies retrieved
      expect(policyResult.policies.length).toBeGreaterThan(0);

      // Step 4: Should NOT make authorization (that's Policy Engine's job)
      // @ts-expect-error - Verify no 'decision' field
      expect(policyResult.decision).toBeUndefined();
    });
  });

  describe('TEST 5 — Multi-Action LLM to Tool Flow', () => {
    it('should handle multiple LLM actions with separate tool calls', async () => {
      // Step 1: LLM extracts multiple actions
      const llmResult = await llmProvider.understandCustomerMessage({
        message:
          'My flight SK-204 was cancelled. My PNR is SK4821X. I want a full refund and a business class upgrade.',
      });

      expect(llmResult.actions).toHaveLength(2);
      const actionTypes = llmResult.actions.map((a) => a.type);
      expect(actionTypes).toContain('FULL_REFUND');
      expect(actionTypes).toContain('BUSINESS_CLASS_UPGRADE');

      // Step 2: Use PNR to look up customer and booking
      const customerResult = await customerTool.getCustomerByPnr({
        pnr: llmResult.entities.pnr!,
      });

      const bookingResult = await bookingTool.getBookingByPnr({
        pnr: llmResult.entities.pnr!,
      });

      // Step 3: Verify authoritative data retrieved
      expect(customerResult.found).toBe(true);
      expect(bookingResult.found).toBe(true);
      expect(bookingResult.booking?.status).toBe('CANCELLED');

      // Step 4: Get policies for each action
      const refundPolicies = await policyTool.getRelevantPolicies({
        actionType: 'FULL_REFUND',
      });

      const upgradePolicies = await policyTool.getRelevantPolicies({
        actionType: 'BUSINESS_CLASS_UPGRADE',
      });

      expect(refundPolicies.policies.length).toBeGreaterThan(0);
      expect(upgradePolicies.policies.length).toBeGreaterThan(0);
    });
  });

  describe('TEST 6 — Missing Information Handled by Tool', () => {
    it('should identify missing PNR and allow tool to return not-found', async () => {
      // Step 1: LLM identifies missing PNR
      const llmResult = await llmProvider.understandCustomerMessage({
        message: 'I want a hotel because my flight is delayed.',
      });

      expect(llmResult.missingInformation).toContain('pnr');
      expect(llmResult.entities.pnr ?? null).toBeNull();

      // Step 2: Tool gracefully handles missing PNR
      if (!llmResult.entities.pnr) {
        const toolResult = await customerTool.getCustomerByPnr({
          pnr: 'UNKNOWN',
        });

        // Should return not-found, not error
        expect(toolResult.found).toBe(false);
        expect(toolResult.customer).toBeNull();
      }
    });
  });

  describe('TEST 7 — Tool Does Not Make Policy Decisions', () => {
    it('should retrieve policies without deciding if allowed', async () => {
      // LLM extracts action with fare difference
      const llmResult = await llmProvider.understandCustomerMessage({
        message: 'I want to take a higher-fare flight. The fare difference is ₹2,000.',
      });

      expect(llmResult.entities.fareDifference).toBe(2000);
      expect(llmResult.actions[0].type).toBe('HIGHER_FARE_REBOOK');

      // Tool retrieves POLICIES ONLY
      const policyResult = await policyTool.getRelevantPolicies({
        actionType: 'HIGHER_FARE_REBOOK',
      });

      expect(policyResult.policies.length).toBeGreaterThan(0);

      // IMPORTANT: Tool does NOT decide if ₹2,000 > ₹1,500 is allowed
      // @ts-expect-error
      expect(policyResult.decision).toBeUndefined();
      // @ts-expect-error
      expect(policyResult.approved).toBeUndefined();

      // Policy Engine will make that decision later
    });
  });

  describe('TEST 8 — Tool Registry Provides Controlled Access', () => {
    it('should access tools through registry, not directly import modules', async () => {
      const registry = ToolRegistry.getInstance();

      // Access tools through registry
      const customerToolFromRegistry = registry.getTool('customer');
      const bookingToolFromRegistry = registry.getTool('booking');
      const policyToolFromRegistry = registry.getTool('policy');

      // Verify tools work through registry access
      const customerResult = await customerToolFromRegistry.getCustomerByPnr({
        pnr: 'SK4821X',
      });

      expect(customerResult.found).toBe(true);

      const bookingResult = await bookingToolFromRegistry.getBookingByPnr({
        pnr: 'SK4821X',
      });

      expect(bookingResult.found).toBe(true);

      const policyResult = await policyToolFromRegistry.getRelevantPolicies({});

      expect(policyResult.policies.length).toBeGreaterThan(0);
    });
  });

  describe('TEST 9 — Data Flows Through Proper Layers', () => {
    it('should verify Tool → Service → Repository → JSON chain', async () => {
      // Call tool
      const result = await customerTool.getCustomerByPnr({ pnr: 'WL7742' });

      // If this succeeds, data came from:
      // Tool → CustomerService → CustomerRepository → JSON file
      expect(result.found).toBe(true);
      expect(result.customer?.pnr).toBe('WL7742');
      expect(result.customer?.name).toBe('Meher Kaur');

      // Verify we got actual data, not hardcoded in tool
      expect(result.customer?.loyaltyTier).toBe('Platinum');
    });
  });

  describe('TEST 10 — No LLM Authorization in Tool Output', () => {
    it('should verify tools never include authorization decisions', async () => {
      // Get all types of tool results
      const customerResult = await customerTool.getCustomerByPnr({
        pnr: 'SK4821X',
      });

      const bookingResult = await bookingTool.getBookingByPnr({
        pnr: 'SK4821X',
      });

      const policyResult = await policyTool.getRelevantPolicies({
        actionType: 'FULL_REFUND',
      });

      // None should have authorization fields
      // @ts-expect-error
      expect(customerResult.approved).toBeUndefined();
      // @ts-expect-error
      expect(bookingResult.allowed).toBeUndefined();
      // @ts-expect-error
      expect(policyResult.decision).toBeUndefined();

      // Tools are for data retrieval only
      // Authorization happens in Policy Engine (separate phase)
    });
  });
});
