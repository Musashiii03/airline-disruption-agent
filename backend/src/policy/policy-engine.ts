import { PolicyService } from '../services/policy.service.js';
import { Customer, Booking, Policy } from '../data/types.js';

export interface PolicyEvaluationInput {
  actionType: string;
  customer: Customer;
  booking?: Booking;
  requestedAmount?: number;
  delayHours?: number;
}

export interface PolicyDecision {
  decision: 'ALLOWED' | 'ESCALATE' | 'NEEDS_INFORMATION' | 'UNSUPPORTED' | 'DENIED_BY_POLICY';
  reason: string;
  policyIds: number[];
  agentApprovalLimit?: number;
}

/**
 * Deterministic policy engine
 * Evaluates actions based on supplied policies and rules
 * The LLM cannot override policy decisions
 */
export class PolicyEngine {
  private policyService: PolicyService;

  constructor() {
    this.policyService = new PolicyService();
  }

  /**
   * Main evaluation method
   */
  async evaluate(input: PolicyEvaluationInput): Promise<PolicyDecision> {
    // Determine booking status to find relevant policies
    const bookingStatus = input.booking?.status || 'UNKNOWN';

    // Get relevant policies
    const policies = await this.policyService.getRelevantPolicies(bookingStatus);
    const policyIds: number[] = [];

    // Evaluate specific action types
    if (input.actionType === 'FULL_REFUND') {
      return this.evaluateRefund(input, policies, policyIds);
    }

    if (input.actionType === 'DELAY_COMPENSATION') {
      return this.evaluateDelayCompensation(input, policies, policyIds);
    }

    if (input.actionType === 'HIGHER_FARE_REBOOK') {
      return this.evaluateFareDifference(input, policies, policyIds);
    }

    if (input.actionType === 'BUSINESS_CLASS_UPGRADE') {
      return this.evaluateUpgrade(input, policies, policyIds);
    }

    if (input.actionType === 'HOTEL_ACCOMMODATION') {
      return this.evaluateHotel(input, policies, policyIds);
    }

    // Unknown action type
    return {
      decision: 'UNSUPPORTED',
      reason: `Action type '${input.actionType}' is not supported by current policies.`,
      policyIds,
    };
  }

  /**
   * Evaluate full refund for cancelled flight
   */
  private async evaluateRefund(
    input: PolicyEvaluationInput,
    policies: Policy[],
    policyIds: number[]
  ): Promise<PolicyDecision> {
    if (!input.booking) {
      return {
        decision: 'NEEDS_INFORMATION',
        reason: 'Booking information is required to process refund.',
        policyIds,
      };
    }

    if (input.booking.status !== 'CANCELLED') {
      return {
        decision: 'DENIED_BY_POLICY',
        reason: 'Refunds are only available for cancelled flights.',
        policyIds,
      };
    }

    // Check cancellation and refund policies
    const cancellationPolicy = policies.find((p) => p.code === 'CANCEL_REBOOK_001');
    const refundPolicy = policies.find((p) => p.code === 'REFUND_PROC_001');

    if (!cancellationPolicy || !refundPolicy) {
      return {
        decision: 'UNSUPPORTED',
        reason: 'No refund policy is currently available.',
        policyIds,
      };
    }

    if (cancellationPolicy) policyIds.push(cancellationPolicy.id);
    if (refundPolicy) policyIds.push(refundPolicy.id);

    return {
      decision: 'ALLOWED',
      reason: 'Full refund is available for this cancelled flight.',
      policyIds,
    };
  }

  /**
   * Evaluate delay compensation
   */
  private async evaluateDelayCompensation(
    input: PolicyEvaluationInput,
    policies: Policy[],
    policyIds: number[]
  ): Promise<PolicyDecision> {
    if (!input.booking) {
      return {
        decision: 'NEEDS_INFORMATION',
        reason: 'Booking information is required to process delay compensation.',
        policyIds,
      };
    }

    if (input.booking.status !== 'DELAYED') {
      return {
        decision: 'DENIED_BY_POLICY',
        reason: 'Delay compensation is only available for delayed flights.',
        policyIds,
      };
    }

    const delayPolicy = policies.find((p) => p.code === 'DELAY_COMP_001');
    if (!delayPolicy) {
      return {
        decision: 'UNSUPPORTED',
        reason: 'No delay compensation policy is currently available.',
        policyIds,
      };
    }

    policyIds.push(delayPolicy.id);

    // Check specific delay hours from booking segments
    const segment = input.booking.segments?.[0];
    const delayHours = segment?.delayHours || input.delayHours || 0;

    if (delayHours <= 0) {
      return {
        decision: 'DENIED_BY_POLICY',
        reason: 'Delay compensation requires a documented delay.',
        policyIds,
      };
    }

    return {
      decision: 'ALLOWED',
      reason: `Delay compensation is available for ${delayHours} hour delay.`,
      policyIds,
    };
  }

  /**
   * Evaluate higher-fare rebooking (fare difference)
   */
  private async evaluateFareDifference(
    input: PolicyEvaluationInput,
    policies: Policy[],
    policyIds: number[]
  ): Promise<PolicyDecision> {
    if (!input.booking) {
      return {
        decision: 'NEEDS_INFORMATION',
        reason: 'Booking information is required to process fare difference.',
        policyIds,
      };
    }

    const fareDiffPolicy = policies.find((p) => p.code === 'FARE_DIFF_001');
    if (!fareDiffPolicy) {
      return {
        decision: 'UNSUPPORTED',
        reason: 'No fare difference policy is currently available.',
        policyIds,
      };
    }

    policyIds.push(fareDiffPolicy.id);

    const AGENT_APPROVAL_LIMIT = 1500; // ₹1,500

    if (!input.requestedAmount || input.requestedAmount === undefined) {
      return {
        decision: 'NEEDS_INFORMATION',
        reason: 'Fare difference amount is required.',
        policyIds,
      };
    }

    // Check if amount exceeds agent authority
    if (input.requestedAmount > AGENT_APPROVAL_LIMIT) {
      return {
        decision: 'ESCALATE',
        reason: `Requested fare difference of ₹${input.requestedAmount} exceeds agent approval limit of ₹${AGENT_APPROVAL_LIMIT}. This requires supervisor approval.`,
        policyIds,
        agentApprovalLimit: AGENT_APPROVAL_LIMIT,
      };
    }

    return {
      decision: 'ALLOWED',
      reason: `Fare difference of ₹${input.requestedAmount} is within agent approval limit.`,
      policyIds,
      agentApprovalLimit: AGENT_APPROVAL_LIMIT,
    };
  }

  /**
   * Evaluate business-class upgrade (not in supplied policies)
   */
  private async evaluateUpgrade(
    _input: PolicyEvaluationInput,
    _policies: Policy[],
    policyIds: number[]
  ): Promise<PolicyDecision> {
    // Business-class upgrades are not explicitly provided in the supplied policies
    return {
      decision: 'UNSUPPORTED',
      reason: 'Free business-class upgrades are not provided by current policies.',
      policyIds,
    };
  }

  /**
   * Evaluate hotel accommodation for flight delays
   * DELAY_COMP_001 policy: Delay > 5 hours includes hotel accommodation
   */
  private async evaluateHotel(
    input: PolicyEvaluationInput,
    policies: Policy[],
    policyIds: number[]
  ): Promise<PolicyDecision> {
    if (!input.booking) {
      return {
        decision: 'NEEDS_INFORMATION',
        reason: 'Booking information is required to process hotel accommodation request.',
        policyIds,
      };
    }

    if (input.booking.status !== 'DELAYED') {
      return {
        decision: 'DENIED_BY_POLICY',
        reason: 'Hotel accommodation is only available for delayed flights.',
        policyIds,
      };
    }

    const delayPolicy = policies.find((p) => p.code === 'DELAY_COMP_001');
    if (!delayPolicy) {
      return {
        decision: 'UNSUPPORTED',
        reason: 'No delay compensation policy is currently available.',
        policyIds,
      };
    }

    policyIds.push(delayPolicy.id);

    // Get delay hours from booking segment
    const segment = input.booking.segments?.[0];
    const delayHours = segment?.delayHours || input.delayHours || 0;

    // Policy: Delay > 5 hours includes hotel accommodation
    if (delayHours > 5) {
      return {
        decision: 'ALLOWED',
        reason: `Hotel accommodation is available for the ${delayHours} hour delay.`,
        policyIds,
      };
    }

    return {
      decision: 'DENIED_BY_POLICY',
      reason: `Hotel accommodation is only available for delays exceeding 5 hours. Current delay: ${delayHours} hours.`,
      policyIds,
    };
  }
}
