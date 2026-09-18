/**
 * Customer Tool
 * Provides controlled access to customer information
 */

import { CustomerService } from '../services/customer.service.js';
import { CustomerLookupResult } from './types.js';
import { validateCustomerLookup } from './validation.js';

export class CustomerTool {
  private customerService: CustomerService;

  constructor(customerService: CustomerService) {
    this.customerService = customerService;
  }

  /**
   * Look up customer by PNR
   * @param input Customer lookup input with PNR
   * @returns Result with customer data or not found
   */
  async getCustomerByPnr(input: unknown): Promise<CustomerLookupResult> {
    try {
      // Validate input
      const validated = validateCustomerLookup(input);

      // Look up customer via service
      const customer = await this.customerService.getByPnr(validated.pnr);

      if (!customer) {
        return {
          found: false,
          customer: null,
        };
      }

      return {
        found: true,
        customer,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          found: false,
          customer: null,
          error: `Failed to lookup customer: ${error.message}`,
        };
      }

      return {
        found: false,
        customer: null,
        error: 'Unknown error during customer lookup',
      };
    }
  }

  /**
   * Tool description for orchestrator/LLM
   */
  static getDescription(): string {
    return 'Find the customer associated with a supplied airline PNR.';
  }

  /**
   * Tool schema for orchestrator
   */
  static getSchema() {
    return {
      type: 'object',
      properties: {
        pnr: {
          type: 'string',
          description: 'Airline PNR (e.g., SK4821X)',
        },
      },
      required: ['pnr'],
    };
  }
}
