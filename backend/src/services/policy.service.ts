import { PolicyRepository } from '../repositories/policy.repository.js';
import { Policy, PolicyRule } from '../data/types.js';

export class PolicyService {
  private repository: PolicyRepository;

  constructor() {
    this.repository = new PolicyRepository();
  }

  async getPolicyByCode(code: string): Promise<Policy | null> {
    return this.repository.findByCode(code);
  }

  async getPolicyById(id: number): Promise<Policy | null> {
    return this.repository.findById(id);
  }

  async getAllActivePolicies(): Promise<Policy[]> {
    return this.repository.findAllActive();
  }

  async getPoliciesByCategory(category: string): Promise<Policy[]> {
    return this.repository.findByCategory(category);
  }

  async getRelevantPolicies(status: string): Promise<Policy[]> {
    return this.repository.findRelevantPolicies(status);
  }

  async getRulesByPolicyId(policyId: number): Promise<PolicyRule[]> {
    return this.repository.findRulesByPolicyId(policyId);
  }

  async getRulesByType(ruleType: string): Promise<PolicyRule[]> {
    return this.repository.findRulesByType(ruleType);
  }

  async getAllRules(): Promise<PolicyRule[]> {
    return this.repository.findAllRules();
  }
}
