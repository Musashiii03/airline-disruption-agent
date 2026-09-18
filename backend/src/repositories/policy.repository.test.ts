import { describe, it, expect } from 'vitest';
import { PolicyRepository } from './policy.repository.js';

describe('PolicyRepository', () => {
  const repository = new PolicyRepository();

  it('should find policy by code', async () => {
    const policy = await repository.findByCode('CANCEL_REBOOK_001');
    expect(policy).toBeDefined();
    expect(policy?.code).toBe('CANCEL_REBOOK_001');
    expect(policy?.name).toBe('Cancellation Rebooking');
  });

  it('should get all active policies', async () => {
    const policies = await repository.findAllActive();
    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThan(0);
    policies.forEach((p) => expect(p.active).toBe(true));
  });

  it('should find policies by category', async () => {
    const policies = await repository.findByCategory('delay');
    expect(Array.isArray(policies)).toBe(true);
    const delayPolicy = policies.find((p) => p.code === 'DELAY_COMP_001');
    expect(delayPolicy).toBeDefined();
  });

  it('should find relevant policies for cancelled status', async () => {
    const policies = await repository.findRelevantPolicies('CANCELLED');
    expect(Array.isArray(policies)).toBe(true);
    const codes = policies.map((p) => p.code);
    expect(codes).toContain('CANCEL_REBOOK_001');
    expect(codes).toContain('REFUND_PROC_001');
  });

  it('should find relevant policies for delayed status', async () => {
    const policies = await repository.findRelevantPolicies('DELAYED');
    expect(Array.isArray(policies)).toBe(true);
    const codes = policies.map((p) => p.code);
    expect(codes).toContain('DELAY_COMP_001');
  });

  it('should get rules for a policy', async () => {
    const policy = await repository.findByCode('DELAY_COMP_001');
    expect(policy).toBeDefined();
    if (policy) {
      const rules = await repository.findRulesByPolicyId(policy.id);
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBeGreaterThan(0);
    }
  });

  it('should have fare difference threshold rule', async () => {
    const rules = await repository.findRulesByType('fare_diff_threshold');
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThan(0);
  });
});
