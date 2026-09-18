import { JsonStore } from '../data/json-store.js';
import { Policy, PolicyRule } from '../data/types.js';

export class PolicyRepository {
  private policyStore: JsonStore<Policy>;
  private ruleStore: JsonStore<PolicyRule>;

  constructor() {
    this.policyStore = new JsonStore<Policy>('policies');
    this.ruleStore = new JsonStore<PolicyRule>('policy-rules');
  }

  async findById(id: number): Promise<Policy | null> {
    return this.policyStore.findById(id);
  }

  async findByCode(code: string): Promise<Policy | null> {
    return this.policyStore.findOne((p) => p.code === code);
  }

  async findAllActive(): Promise<Policy[]> {
    return this.policyStore.findMany((p) => p.active);
  }

  async findByCategory(category: string): Promise<Policy[]> {
    return this.policyStore.findMany((p) => p.category === category && p.active);
  }

  async findAll(): Promise<Policy[]> {
    return this.policyStore.all();
  }

  async findRulesByPolicyId(policyId: number): Promise<PolicyRule[]> {
    return this.ruleStore.findMany((r) => r.policyId === policyId && r.active);
  }

  async findRulesByType(ruleType: string): Promise<PolicyRule[]> {
    return this.ruleStore.findMany((r) => r.ruleType === ruleType && r.active);
  }

  async findAllRules(): Promise<PolicyRule[]> {
    return this.ruleStore.all();
  }

  /**
   * Get relevant policies based on disruption status
   */
  async findRelevantPolicies(status: string): Promise<Policy[]> {
    const activePolicy = await this.policyStore.findMany((p) => p.active);

    if (status === 'CANCELLED') {
      return activePolicy.filter((p) =>
        ['cancellation', 'refund'].includes(p.category)
      );
    }

    if (status === 'DELAYED') {
      return activePolicy.filter((p) =>
        ['delay', 'fare_difference', 'loyalty'].includes(p.category)
      );
    }

    return activePolicy;
  }
}
