/**
 * Policy Tool
 * Provides controlled access to policy information
 */

import { PolicyService } from '../services/policy.service.js';
import { PolicyLookupResult } from './types.js';
import { validatePolicyLookup } from './validation.js';
import { Policy } from '../data/types.js';

export class PolicyTool {
  private policyService: PolicyService;

  constructor(policyService: PolicyService) {
    this.policyService = policyService;
  }

  /**
   * Get relevant policies based on criteria
   * @param input Policy lookup criteria
   * @returns Policies matching criteria
   */
  async getRelevantPolicies(input: unknown): Promise<PolicyLookupResult> {
    try {
      // Validate input
      const validated = validatePolicyLookup(input);

      // Get all policies
      const allPolicies = await this.policyService.getAllActivePolicies();

      if (!allPolicies || allPolicies.length === 0) {
        return {
          policies: [],
        };
      }

      // Filter policies based on criteria
      let filteredPolicies: Policy[] = allPolicies;

      // Filter by action type if provided
      if (validated.actionType) {
        const actionType = validated.actionType.toLowerCase();

        filteredPolicies = filteredPolicies.filter((policy: Policy) => {
          const content = policy.content.toLowerCase();
          const category = policy.category.toLowerCase();

          // Match action type to policy content/category
          if (actionType.includes('refund')) {
            return category.includes('refund') || category.includes('cancel');
          }

          if (actionType.includes('hotel')) {
            return category.includes('delay') || content.includes('hotel');
          }

          if (actionType.includes('delay')) {
            return category.includes('delay');
          }

          if (actionType.includes('fare') || actionType.includes('rebook')) {
            return category.includes('fare');
          }

          if (actionType.includes('upgrade')) {
            return category.includes('loyalty') || category.includes('fare');
          }

          return true;
        });
      }

      // Filter by booking status if provided
      if (validated.bookingStatus) {
        const status = validated.bookingStatus.toLowerCase();

        filteredPolicies = filteredPolicies.filter((policy: Policy) => {
          const content = policy.content.toLowerCase();

          if (status.includes('cancel')) {
            return content.includes('cancel') || content.includes('refund');
          }

          if (status.includes('delay')) {
            return content.includes('delay');
          }

          return true;
        });
      }

      // Filter by delay hours if provided
      if (validated.delayHours !== undefined) {
        const delayHours = validated.delayHours;

        filteredPolicies = filteredPolicies.filter((policy: Policy) => {
          const content = policy.content.toLowerCase();

          // Look for delay thresholds in policy text
          if (delayHours > 5) {
            return content.includes('hotel') || content.includes('5 hours');
          }

          if (delayHours > 3) {
            return content.includes('meal') || content.includes('lounge') || content.includes('3 hours');
          }

          return content.includes('delay');
        });
      }

      return {
        policies: filteredPolicies,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          policies: [],
          error: `Failed to retrieve policies: ${error.message}`,
        };
      }

      return {
        policies: [],
        error: 'Unknown error during policy lookup',
      };
    }
  }

  /**
   * Tool description for orchestrator/LLM
   */
  static getDescription(): string {
    return 'Retrieve airline policy rules relevant to a requested action and booking context.';
  }

  /**
   * Tool schema for orchestrator
   */
  static getSchema() {
    return {
      type: 'object',
      properties: {
        actionType: {
          type: 'string',
          description: 'Type of action (e.g., REFUND, HOTEL, FARE_DIFFERENCE)',
        },
        bookingStatus: {
          type: 'string',
          description: 'Booking status (e.g., CANCELLED, DELAYED)',
        },
        delayHours: {
          type: 'number',
          description: 'Flight delay in hours',
        },
      },
    };
  }
}
