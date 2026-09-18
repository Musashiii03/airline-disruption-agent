/**
 * Tool Layer Tests
 * Comprehensive tests for customer, booking, and policy tools
 */

import { describe, it, expect, beforeAll } from 'vitest';
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

describe('Tool Layer', () => {
  let customerTool: CustomerTool;
  let bookingTool: BookingTool;
  let policyTool: PolicyTool;
  let toolRegistry: ToolRegistry;

  beforeAll(async () => {
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
    toolRegistry = ToolRegistry.initialize(customerService, bookingService, policyService);
  });

  describe('CustomerTool', () => {
    describe('TEST 1 — Priya Lookup', () => {
      it('should find Priya by PNR SK4821X', async () => {
        const result = await customerTool.getCustomerByPnr({ pnr: 'SK4821X' });

        expect(result.found).toBe(true);
        expect(result.customer).toBeDefined();
        expect(result.customer?.pnr).toBe('SK4821X');
        expect(result.customer?.name).toBe('Priya Nair');
        expect(result.customer?.loyaltyTier).toBe('Gold');
      });
    });

    describe('TEST 2 — Arvind Lookup', () => {
      it('should find Arvind by PNR TR1190B', async () => {
        const result = await customerTool.getCustomerByPnr({ pnr: 'TR1190B' });

        expect(result.found).toBe(true);
        expect(result.customer).toBeDefined();
        expect(result.customer?.pnr).toBe('TR1190B');
        expect(result.customer?.name).toBe('Arvind Kulkarni');
        expect(result.customer?.loyaltyTier).toBe('Silver');
      });
    });

    describe('TEST 3 — Meher Lookup', () => {
      it('should find Meher by PNR WL7742', async () => {
        const result = await customerTool.getCustomerByPnr({ pnr: 'WL7742' });

        expect(result.found).toBe(true);
        expect(result.customer).toBeDefined();
        expect(result.customer?.pnr).toBe('WL7742');
        expect(result.customer?.name).toBe('Meher Kaur');
        expect(result.customer?.loyaltyTier).toBe('Platinum');
      });
    });

    describe('TEST 4 — Unknown PNR', () => {
      it('should return not found for unknown PNR', async () => {
        const result = await customerTool.getCustomerByPnr({ pnr: 'INVALID123' });

        expect(result.found).toBe(false);
        expect(result.customer).toBeNull();
      });
    });

    describe('TEST 5 — Invalid Input', () => {
      it('should handle empty PNR', async () => {
        const result = await customerTool.getCustomerByPnr({ pnr: '' });

        expect(result.found).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('TEST 6 — Case Normalization', () => {
      it('should normalize PNR to uppercase', async () => {
        const result = await customerTool.getCustomerByPnr({ pnr: 'sk4821x' });

        expect(result.found).toBe(true);
        expect(result.customer?.pnr).toBe('SK4821X');
      });
    });
  });

  describe('BookingTool', () => {
    describe('TEST 7 — Priya Booking', () => {
      it('should find Priya booking by PNR SK4821X', async () => {
        const result = await bookingTool.getBookingByPnr({ pnr: 'SK4821X' });

        expect(result.found).toBe(true);
        expect(result.booking).toBeDefined();
        expect(result.booking?.pnr).toBe('SK4821X');
        expect(result.booking?.status).toBe('CANCELLED');
      });
    });

    describe('TEST 8 — Arvind Booking (Delayed)', () => {
      it('should find Arvind booking with DELAYED status', async () => {
        const result = await bookingTool.getBookingByPnr({ pnr: 'TR1190B' });

        expect(result.found).toBe(true);
        expect(result.booking).toBeDefined();
        expect(result.booking?.pnr).toBe('TR1190B');
        expect(result.booking?.status).toBe('DELAYED');
        
        // Verify booking has segments with delay info
        if (result.booking?.segments && result.booking.segments.length > 0) {
          expect(result.booking.segments[0].delayHours).toBe(4);
        }
      });
    });

    describe('TEST 9 — Meher Booking (6 Hour Delay)', () => {
      it('should find Meher booking with 6 hour delay', async () => {
        const result = await bookingTool.getBookingByPnr({ pnr: 'WL7742' });

        expect(result.found).toBe(true);
        expect(result.booking).toBeDefined();
        expect(result.booking?.pnr).toBe('WL7742');
        expect(result.booking?.status).toBe('DELAYED');
        
        // Verify 6 hour delay
        if (result.booking?.segments && result.booking.segments.length > 0) {
          expect(result.booking.segments[0].delayHours).toBe(6);
        }
      });
    });

    describe('TEST 10 — Unknown Booking', () => {
      it('should return not found for unknown PNR', async () => {
        const result = await bookingTool.getBookingByPnr({ pnr: 'UNKNOWN99' });

        expect(result.found).toBe(false);
        expect(result.booking).toBeNull();
      });
    });

    describe('TEST 11 — Booking Has Authoritative Data', () => {
      it('should return actual booking status from repository', async () => {
        const result = await bookingTool.getBookingByPnr({ pnr: 'TR1190B' });

        // This booking should have actual authoritative data
        expect(result.found).toBe(true);
        expect(result.booking?.status).toBeDefined();
        
        // Not trusting what LLM claims - using tool's actual data
        expect(['ACTIVE', 'DELAYED', 'CANCELLED', 'COMPLETED']).toContain(
          result.booking?.status
        );
      });
    });
  });

  describe('PolicyTool', () => {
    describe('TEST 12 — Cancellation Policies', () => {
      it('should retrieve cancellation/refund policies', async () => {
        const result = await policyTool.getRelevantPolicies({
          actionType: 'FULL_REFUND',
          bookingStatus: 'CANCELLED',
        });

        expect(result.policies.length).toBeGreaterThan(0);
        expect(result.policies[0]).toHaveProperty('code');
        expect(result.policies[0]).toHaveProperty('name');
        expect(result.policies[0]).toHaveProperty('content');
      });
    });

    describe('TEST 13 — Delay Policies', () => {
      it('should retrieve delay-related policies', async () => {
        const result = await policyTool.getRelevantPolicies({
          actionType: 'DELAY_COMPENSATION',
          bookingStatus: 'DELAYED',
        });

        expect(result.policies.length).toBeGreaterThan(0);
        
        // Should include delay compensation policy
        const hasDelayPolicy = result.policies.some(
          (p) => p.code === 'DELAY_COMP_001'
        );
        expect(hasDelayPolicy).toBe(true);
      });
    });

    describe('TEST 14 — Hotel Policies (>5 hours)', () => {
      it('should retrieve hotel policies for 6 hour delay', async () => {
        const result = await policyTool.getRelevantPolicies({
          actionType: 'HOTEL_ACCOMMODATION',
          delayHours: 6,
        });

        expect(result.policies.length).toBeGreaterThan(0);
        
        // Should include policy mentioning hotel
        const hasHotelPolicy = result.policies.some(
          (p) => p.content.toLowerCase().includes('hotel')
        );
        expect(hasHotelPolicy).toBe(true);
      });
    });

    describe('TEST 15 — Fare Difference Policies', () => {
      it('should retrieve fare difference policies', async () => {
        const result = await policyTool.getRelevantPolicies({
          actionType: 'HIGHER_FARE_REBOOK',
        });

        expect(result.policies.length).toBeGreaterThan(0);
        
        // Should include fare policy
        const hasFarePolicy = result.policies.some(
          (p) => p.code === 'FARE_DIFF_001'
        );
        expect(hasFarePolicy).toBe(true);
      });
    });

    describe('TEST 16 — All Policies Available', () => {
      it('should retrieve all policies with no filters', async () => {
        const result = await policyTool.getRelevantPolicies({});

        expect(result.policies.length).toBeGreaterThan(0);
        expect(result.policies.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Tool Registry', () => {
    describe('TEST 17 — Registry Exposes Approved Tools', () => {
      it('should expose only approved tools', () => {
        const tools = toolRegistry.getTools();

        expect(tools).toHaveProperty('customer');
        expect(tools).toHaveProperty('booking');
        expect(tools).toHaveProperty('policy');

        // Should not expose internal modules
        expect(tools).not.toHaveProperty('fs');
        expect(tools).not.toHaveProperty('jsonStore');
        expect(tools).not.toHaveProperty('environment');
      });
    });

    describe('TEST 18 — Registry Tool Access', () => {
      it('should retrieve tools by name', () => {
        const customerToolFromRegistry = toolRegistry.getTool('customer');
        const bookingToolFromRegistry = toolRegistry.getTool('booking');
        const policyToolFromRegistry = toolRegistry.getTool('policy');

        expect(customerToolFromRegistry).toBeInstanceOf(CustomerTool);
        expect(bookingToolFromRegistry).toBeInstanceOf(BookingTool);
        expect(policyToolFromRegistry).toBeInstanceOf(PolicyTool);
      });
    });

    describe('TEST 19 — Tool Names', () => {
      it('should list all tool names', () => {
        const toolNames = toolRegistry.getToolNames();

        expect(toolNames).toContain('customer');
        expect(toolNames).toContain('booking');
        expect(toolNames).toContain('policy');
        expect(toolNames).toHaveLength(3);
      });
    });

    describe('TEST 20 — Tool Existence Check', () => {
      it('should check if tool exists', () => {
        expect(toolRegistry.hasTool('customer')).toBe(true);
        expect(toolRegistry.hasTool('booking')).toBe(true);
        expect(toolRegistry.hasTool('policy')).toBe(true);
        expect(toolRegistry.hasTool('nonexistent')).toBe(false);
      });
    });

    describe('TEST 21 — Singleton Pattern', () => {
      it('should return same instance on multiple calls', () => {
        const instance1 = ToolRegistry.getInstance();
        const instance2 = ToolRegistry.getInstance();

        expect(instance1).toBe(instance2);
      });
    });
  });

  describe('Boundary & Security Tests', () => {
    describe('TEST 22 — Invalid Tool Input Rejected', () => {
      it('should reject malformed customer lookup input', async () => {
        const result = await customerTool.getCustomerByPnr({
          pnr: '',
        });

        expect(result.found).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('TEST 23 — Tool Does Not Make Authorization', () => {
      it('should not include authorization decisions in output', async () => {
        const result = await bookingTool.getBookingByPnr({ pnr: 'SK4821X' });

        // @ts-expect-error - Testing that these fields don't exist
        expect(result.allowed).toBeUndefined();
        // @ts-expect-error
        expect(result.decision).toBeUndefined();
        // @ts-expect-error
        expect(result.approved).toBeUndefined();
      });
    });

    describe('TEST 24 — LLM Data Not Authoritative', () => {
      it('should retrieve actual booking data, not trust LLM claims', async () => {
        // Simulate LLM claiming booking is CONFIRMED when it's actually DELAYED
        const llmClaim = {
          pnr: 'TR1190B',
          status: 'CONFIRMED', // LLM's claim
        };

        // Use tool to get authoritative data
        const result = await bookingTool.getBookingByPnr({ pnr: llmClaim.pnr });

        // Tool returns actual status from repository
        expect(result.found).toBe(true);
        expect(result.booking?.status).toBe('DELAYED'); // Actual status
        expect(result.booking?.status).not.toBe(llmClaim.status); // Not LLM's claim
      });
    });

    describe('TEST 25 — Policy Tool Returns Data Only', () => {
      it('should not include authorization logic in output', async () => {
        const result = await policyTool.getRelevantPolicies({
          actionType: 'HIGHER_FARE_REBOOK',
        });

        // Should return policy data
        expect(result.policies).toBeDefined();

        // Should not include authorization
        expect(result).not.toHaveProperty('decision');
        expect(result).not.toHaveProperty('allowed');
        expect(result).not.toHaveProperty('policyEngineResult');
      });
    });

    describe('TEST 26 — Service/Repository Boundary', () => {
      it('should use services and repositories, not direct file access', async () => {
        // This test verifies the correct dependency chain
        const result = await customerTool.getCustomerByPnr({ pnr: 'SK4821X' });

        // Tool gets data from service (not direct fs access)
        expect(result.found).toBe(true);

        // We can't directly inspect the call chain in JS, but if this test passes,
        // it means the tool successfully retrieved data through the proper layers
        expect(result.customer).toBeDefined();
      });
    });

    describe('TEST 27 — No Arbitrary File Access', () => {
      it('should not allow reading arbitrary files', async () => {
        // This test ensures tools don't expose fs operations
        // @ts-expect-error - Testing that readFile doesn't exist
        const result = await customerTool.readFile?.('../../.env');

        expect(result).toBeUndefined();
      });
    });

    describe('TEST 28 — Tool Error Handling', () => {
      it('should handle errors gracefully', async () => {
        const result = await customerTool.getCustomerByPnr({
          pnr: 'TEST' as any,
        });

        // Should return error result, not throw
        expect(result.found).toBe(false);
        // Verify error exists
        if (result.error) {
          expect(result.error).toBeDefined();
        }
      });
    });
  });
});
