import { ActionRepository } from '../repositories/action.repository.js';
import { Action } from '../data/types.js';

/**
 * Action execution input with authorization requirement
 * CRITICAL: policyDecision is required - only ALLOWED executes
 */
export interface ActionExecutionInput {
  actionType: string;
  customerId: number;
  bookingId?: number;
  conversationId: number;
  parameters: Record<string, any>;
  policyDecision: 'ALLOWED' | 'ESCALATE' | 'DENIED_BY_POLICY' | 'NEEDS_INFORMATION' | 'UNSUPPORTED';
  policyIds?: number[];
}

/**
 * Action execution result
 */
export interface ActionExecutionResult {
  success: boolean;
  status: 'EXECUTED' | 'ESCALATED' | 'DENIED' | 'FAILED' | 'UNSUPPORTED';
  mode?: string;
  message: string;
  actionId?: string;
}

export class ActionService {
  private repository: ActionRepository;

  constructor() {
    this.repository = new ActionRepository();
  }

  async getById(id: string): Promise<Action | null> {
    return this.repository.findById(id);
  }

  async getByConversationId(conversationId: number): Promise<Action[]> {
    return this.repository.findByConversationId(conversationId);
  }

  async getAll(): Promise<Action[]> {
    return this.repository.findAll();
  }

  async createAction(
    action: Omit<Action, 'createdAt' | 'updatedAt'>
  ): Promise<Action> {
    return this.repository.create(action);
  }

  async updateAction(
    id: string,
    updates: Partial<Omit<Action, 'id' | 'createdAt'>>
  ): Promise<Action | null> {
    return this.repository.update(id, updates);
  }

  async addPolicyReference(actionId: string, policyId: number): Promise<void> {
    return this.repository.addPolicyReference(actionId, policyId);
  }

  async getPolicyReferences(actionId: string) {
    return this.repository.getPolicyReferences(actionId);
  }

  /**
   * CRITICAL AUTHORIZATION GATE: Execute action only if policy decision is ALLOWED
   * This is the critical security boundary - no execution for other decisions
   */
  async executeAction(input: ActionExecutionInput): Promise<ActionExecutionResult> {
    // AUTHORIZATION GATE: Only ALLOWED decisions may execute
    if (input.policyDecision !== 'ALLOWED') {
      // Map decision to appropriate status
      const status = this.mapDecisionToStatus(input.policyDecision);
      
      // Generate action ID
      const actionId = await this.generateActionId();

      // Create action record with appropriate status (no execution)
      const action = await this.createAction({
        id: actionId,
        conversationId: input.conversationId,
        customerId: input.customerId,
        bookingId: input.bookingId,
        actionType: input.actionType,
        status,
        requestedData: input.parameters,
        policyDecision: input.policyDecision,
      });

      return {
        success: false,
        status,
        message: `Action cannot be executed. Policy decision: ${input.policyDecision}`,
        actionId: action.id,
      };
    }

    try {
      // Generate action ID
      const actionId = await this.generateActionId();

      // Create action record
      const action = await this.createAction({
        id: actionId,
        conversationId: input.conversationId,
        customerId: input.customerId,
        bookingId: input.bookingId,
        actionType: input.actionType,
        status: 'REQUESTED',
        requestedData: input.parameters,
        policyDecision: input.policyDecision,
      });

      // Add policy references if provided
      if (input.policyIds && input.policyIds.length > 0) {
        for (const policyId of input.policyIds) {
          await this.addPolicyReference(action.id, policyId);
        }
      }

      // Execute action based on type
      const executionResult = await this.executeActionHandler(input);

      // Update action with result
      await this.updateAction(action.id, {
        resultData: {
          mode: 'PROTOTYPE',
          ...executionResult,
        },
        status: executionResult.success ? 'EXECUTED' : 'FAILED',
      });

      return {
        success: true,
        status: 'EXECUTED',
        mode: 'PROTOTYPE',
        message: executionResult.message,
        actionId: action.id,
      };
    } catch (error) {
      return {
        success: false,
        status: 'FAILED',
        message: `Action execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Map policy decision to action status
   */
  private mapDecisionToStatus(decision: string): 'ESCALATED' | 'DENIED' | 'FAILED' {
    switch (decision) {
      case 'ESCALATE':
        return 'ESCALATED';
      case 'DENIED_BY_POLICY':
        return 'DENIED';
      case 'NEEDS_INFORMATION':
      case 'UNSUPPORTED':
      default:
        return 'FAILED';
    }
  }

  /**
   * Execute action handler based on action type
   */
  private async executeActionHandler(
    input: ActionExecutionInput
  ): Promise<{ success: boolean; message: string }> {
    switch (input.actionType) {
      case 'FULL_REFUND':
        return this.handleRefund(input);
      case 'HOTEL_ACCOMMODATION':
        return this.handleHotel(input);
      case 'MEAL_VOUCHER':
        return this.handleMealVoucher(input);
      case 'LOUNGE_ACCESS':
        return this.handleLoungeAccess(input);
      case 'HIGHER_FARE_REBOOK':
      case 'REBOOK_FLIGHT':
        return this.handleRebooking(input);
      case 'BUSINESS_CLASS_UPGRADE':
        return this.handleUpgrade(input);
      default:
        return {
          success: false,
          message: `Unsupported action type: ${input.actionType}`,
        };
    }
  }

  /**
   * Handle FULL_REFUND action (prototype execution)
   */
  private async handleRefund(_input: ActionExecutionInput): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Full refund action recorded successfully in prototype mode.',
    };
  }

  /**
   * Handle HOTEL_ACCOMMODATION action (prototype execution)
   */
  private async handleHotel(_input: ActionExecutionInput): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Hotel accommodation request recorded successfully in prototype mode.',
    };
  }

  /**
   * Handle MEAL_VOUCHER action (prototype execution)
   */
  private async handleMealVoucher(_input: ActionExecutionInput): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Meal voucher action recorded successfully in prototype mode.',
    };
  }

  /**
   * Handle LOUNGE_ACCESS action (prototype execution)
   */
  private async handleLoungeAccess(_input: ActionExecutionInput): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Lounge access request recorded successfully in prototype mode.',
    };
  }

  /**
   * Handle REBOOK_FLIGHT/HIGHER_FARE_REBOOK action (prototype execution)
   */
  private async handleRebooking(_input: ActionExecutionInput): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Rebooking request recorded successfully in prototype mode.',
    };
  }

  /**
   * Handle BUSINESS_CLASS_UPGRADE action (prototype execution)
   */
  private async handleUpgrade(_input: ActionExecutionInput): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Business class upgrade request recorded successfully in prototype mode.',
    };
  }

  /**
   * Generate next action ID
   */
  async generateActionId(): Promise<string> {
    const actions = await this.repository.findAll();
    const actionCount = actions.length;
    return `ACT-${String(actionCount + 1).padStart(6, '0')}`;
  }
}
