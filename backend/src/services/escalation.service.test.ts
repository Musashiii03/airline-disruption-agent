/**
 * Escalation Service Tests
 * Tests for escalation record creation and management
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { EscalationService } from './escalation.service.js';
import { EscalationRepository } from '../repositories/escalation.repository.js';

describe('EscalationService', () => {
  let escalationService: EscalationService;
  let escalationRepo: EscalationRepository;

  beforeAll(() => {
    escalationService = new EscalationService();
    escalationRepo = new EscalationRepository();
  });

  describe('TEST 1 — Create Escalation with Default Priority', () => {
    it('should create escalation with NORMAL priority', async () => {
      const escalation = await escalationService.createEscalation(
        201,
        1,
        'AMOUNT_EXCEEDS_AUTHORITY',
        'Fare difference exceeds agent limit'
      );

      expect(escalation).toBeDefined();
      expect(escalation.id).toBeDefined();
      expect(escalation.conversationId).toBe(201);
      expect(escalation.customerId).toBe(1);
      expect(escalation.reasonCode).toBe('AMOUNT_EXCEEDS_AUTHORITY');
      expect(escalation.priority).toBe('NORMAL');
      expect(escalation.status).toBe('OPEN');
    });
  });

  describe('TEST 2 — Create Escalation with HIGH Priority', () => {
    it('should create escalation with HIGH priority', async () => {
      const escalation = await escalationService.createEscalation(
        202,
        2,
        'AMOUNT_EXCEEDS_AUTHORITY',
        'Meher ₹2,000 exceeds limit',
        undefined,
        'HIGH'
      );

      expect(escalation.priority).toBe('HIGH');
      expect(escalation.status).toBe('OPEN');
    });
  });

  describe('TEST 3 — Get Escalation by ID', () => {
    it('should retrieve escalation by ID', async () => {
      const created = await escalationService.createEscalation(
        203,
        3,
        'POLICY_VIOLATION',
        'Policy violation'
      );

      const retrieved = await escalationService.getById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.reasonCode).toBe('POLICY_VIOLATION');
    });
  });

  describe('TEST 4 — Get Escalations by Conversation ID', () => {
    it('should retrieve all escalations for conversation', async () => {
      const conversationId = 204;

      // Create multiple escalations
      await escalationService.createEscalation(
        conversationId,
        4,
        'AMOUNT_EXCEEDS_AUTHORITY'
      );
      await escalationService.createEscalation(
        conversationId,
        4,
        'POLICY_VIOLATION'
      );

      const escalations = await escalationService.getByConversationId(conversationId);

      expect(escalations.length).toBeGreaterThanOrEqual(2);
      expect(escalations.every((e) => e.conversationId === conversationId)).toBe(true);
    });
  });

  describe('TEST 5 — Get Escalations by Status', () => {
    it('should retrieve escalations by status', async () => {
      const created = await escalationService.createEscalation(
        205,
        5,
        'UNSUPPORTED_ACTION'
      );

      const escalations = await escalationService.getByStatus('OPEN');

      expect(escalations.length).toBeGreaterThan(0);
      expect(escalations.some((e) => e.id === created.id)).toBe(true);
    });
  });

  describe('TEST 6 — Update Escalation', () => {
    it('should update escalation record', async () => {
      const created = await escalationService.createEscalation(
        206,
        6,
        'AMOUNT_EXCEEDS_AUTHORITY'
      );

      const updated = await escalationService.updateEscalation(created.id, {
        summary: 'Updated summary',
        priority: 'HIGH',
      });

      expect(updated?.summary).toBe('Updated summary');
      expect(updated?.priority).toBe('HIGH');
    });
  });

  describe('TEST 7 — Resolve Escalation', () => {
    it('should resolve escalation to RESOLVED status', async () => {
      const created = await escalationService.createEscalation(
        207,
        7,
        'AMOUNT_EXCEEDS_AUTHORITY'
      );

      const resolved = await escalationService.resolveEscalation(created.id);

      expect(resolved?.status).toBe('RESOLVED');
    });
  });

  describe('TEST 8 — Escalation Links to Action', () => {
    it('should link escalation to action ID', async () => {
      const escalation = await escalationService.createEscalation(
        208,
        8,
        'AMOUNT_EXCEEDS_AUTHORITY',
        'Escalation for action',
        'ACT-000001'
      );

      expect(escalation.actionId).toBe('ACT-000001');
    });
  });

  describe('TEST 9 — Get All Escalations', () => {
    it('should retrieve all escalations', async () => {
      await escalationService.createEscalation(209, 9, 'OTHER');

      const all = await escalationService.getAll();

      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('TEST 10 — Escalation Reason Codes', () => {
    it('should support various reason codes', async () => {
      const reasons = [
        'AMOUNT_EXCEEDS_AUTHORITY',
        'POLICY_VIOLATION',
        'MISSING_INFORMATION',
        'UNSUPPORTED_ACTION',
        'OTHER',
      ];

      for (let i = 0; i < reasons.length; i++) {
        const escalation = await escalationService.createEscalation(
          210 + i,
          10 + i,
          reasons[i]
        );

        expect(escalation.reasonCode).toBe(reasons[i]);
      }
    });
  });
});
