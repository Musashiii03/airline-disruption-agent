/**
 * Tool Registry
 * Centralized registry for all available tools
 */

import { CustomerTool } from './customer.tool.js';
import { BookingTool } from './booking.tool.js';
import { PolicyTool } from './policy.tool.js';
import { CustomerService } from '../services/customer.service.js';
import { BookingService } from '../services/booking.service.js';
import { PolicyService } from '../services/policy.service.js';

/**
 * Registered tools available to orchestrator
 */
export interface RegisteredTools {
  customer: CustomerTool;
  booking: BookingTool;
  policy: PolicyTool;
}

/**
 * Tool registry - provides controlled access to approved tools
 */
export class ToolRegistry {
  private static instance: ToolRegistry | null = null;
  private tools: RegisteredTools;

  private constructor(
    customerService: CustomerService,
    bookingService: BookingService,
    policyService: PolicyService
  ) {
    this.tools = {
      customer: new CustomerTool(customerService),
      booking: new BookingTool(bookingService),
      policy: new PolicyTool(policyService),
    };
  }

  /**
   * Get or create tool registry singleton
   */
  static initialize(
    customerService: CustomerService,
    bookingService: BookingService,
    policyService: PolicyService
  ): ToolRegistry {
    if (!this.instance) {
      this.instance = new ToolRegistry(customerService, bookingService, policyService);
    }

    return this.instance;
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ToolRegistry {
    if (!this.instance) {
      throw new Error(
        'ToolRegistry not initialized. Call ToolRegistry.initialize() first.'
      );
    }

    return this.instance;
  }

  /**
   * Get all registered tools
   */
  getTools(): RegisteredTools {
    return this.tools;
  }

  /**
   * Get specific tool by name
   */
  getTool(name: keyof RegisteredTools) {
    const tool = this.tools[name];

    if (!tool) {
      throw new Error(`Tool '${name}' not found in registry.`);
    }

    return tool;
  }

  /**
   * Get tool names
   */
  getToolNames(): string[] {
    return Object.keys(this.tools);
  }

  /**
   * Check if tool exists
   */
  hasTool(name: string): boolean {
    return name in this.tools;
  }

  /**
   * Reset instance (for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
