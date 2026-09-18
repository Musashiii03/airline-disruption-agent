/**
 * Orchestrator Service
 * Connects PolicyEngine decisions to ActionService and EscalationService
 * Integrates ConversationStateService to maintain persistent case context
 * CRITICAL: Only ALLOWED decisions execute actions
 * Other decisions (ESCALATE, DENIED_BY_POLICY, etc.) trigger escalations
 */

import { PolicyEngine, PolicyDecision, PolicyEvaluationInput } from '../policy/policy-engine.js';
import { ActionService, ActionExecutionInput } from './action.service.js';
import { EscalationService } from './escalation.service.js';
import { AuditService } from './audit.service.js';
import { ConversationStateService } from './conversation-state.service.js';
import { ActionIdempotencyService } from './action-idempotency.service.js';
import { Customer, Booking, CaseSnapshot } from '../data/types.js';

export interface OrchestratorExecutionInput {
  conversationId: number;
  actionType: string;
  customer: Customer;
  booking?: Booking;
  requestedAmount?: number;
  delayHours?: number;
  parameters?: Record<string, any>;
}

export interface OrchestratorExecutionResult {
  policyDecision: PolicyDecision;
  actionExecuted: boolean;
  actionId?: string;
  escalationId?: string;
  message: string;
  caseSnapshot?: CaseSnapshot;
}

/**
 * Orchestrator Service
 * Controls the flow: PolicyEngine → (ALLOWED → ActionService) OR (non-ALLOWED → EscalationService)
 * Integrates ConversationStateService to manage case context
 */
export class OrchestratorService {
  private policyEngine: PolicyEngine;
  private actionService: ActionService;
  private escalationService: EscalationService;
  private auditService: AuditService;
  private conversationStateService: ConversationStateService;
  private idempotencyService: ActionIdempotencyService;

  constructor() {
    this.policyEngine = new PolicyEngine();
    this.actionService = new ActionService();
    this.escalationService = new EscalationService();
    this.auditService = new AuditService();
    this.conversationStateService = new ConversationStateService();
    this.idempotencyService = new ActionIdempotencyService();
  }

  /**
   * Main orchestration method
   * Evaluates policy → executes action or escalates
   * Updates conversation state throughout the flow
   */
  async execute(input: OrchestratorExecutionInput): Promise<OrchestratorExecutionResult> {
    // Step 0: Load or initialize conversation state
    const conversationState = await this.conversationStateService.getOrCreateState(
      input.conversationId,
      input.customer.id,
      input.booking?.pnr || ''
    );

    // Step 1: Check for duplicate action (idempotency)
    const idempotencyKey = {
      conversationId: input.conversationId,
      customerId: input.customer.id,
      actionType: input.actionType,
      bookingId: input.booking?.id,
    };

    const idempotencyCheck = await this.idempotencyService.checkForDuplicate(idempotencyKey);
    if (idempotencyCheck.isDuplicate && idempotencyCheck.existingAction) {
      // Log duplicate attempt
      await this.auditService.logEvent(
        input.conversationId,
        'DUPLICATE_ACTION_BLOCKED',
        'SYSTEM',
        {
          actionType: input.actionType,
          reason: idempotencyCheck.reason,
          existingActionId: idempotencyCheck.existingAction.id,
        }
      );

      // Return result without re-executing
      const caseSnapshot = await this.conversationStateService.getConversationContext(
        input.conversationId
      );

      return {
        policyDecision: {
          decision: 'ALLOWED', // Technically not evaluated, but action already processed
          reason: idempotencyCheck.reason || 'Action already processed',
          policyIds: [],
        },
        actionExecuted: false,
        actionId: idempotencyCheck.existingAction.id,
        message: `This action has already been processed: ${idempotencyCheck.reason}`,
        caseSnapshot: caseSnapshot || undefined,
      };
    }

    // Step 2: Update conversation state with booking context if provided
    if (input.booking) {
      await this.conversationStateService.updateBookingContext(
        conversationState.id,
        input.booking.id,
        input.booking.segments?.[0]?.flightNumber
      );
    }

    // Step 3: Update intent
    await this.conversationStateService.updateLastIntent(conversationState.id, input.actionType);

    // Step 4: Evaluate policy
    const policyEvaluationInput: PolicyEvaluationInput = {
      actionType: input.actionType,
      customer: input.customer,
      booking: input.booking,
      requestedAmount: input.requestedAmount,
      delayHours: input.delayHours,
    };

    const policyDecision = await this.policyEngine.evaluate(policyEvaluationInput);

    // Step 5: Log policy decision to audit
    await this.auditService.logEvent(
      input.conversationId,
      'POLICY_DECISION',
      'SYSTEM',
      {
        actionType: input.actionType,
        decision: policyDecision.decision,
        reason: policyDecision.reason,
        policyIds: policyDecision.policyIds,
      }
    );

    // Step 6: Route based on decision
    let result: OrchestratorExecutionResult;
    if (policyDecision.decision === 'ALLOWED') {
      // Execute action
      result = await this.executeAllowedAction(input, policyDecision, conversationState.id);
    } else {
      // Escalate or deny
      result = await this.handleNonAllowedDecision(input, policyDecision, conversationState.id);
    }

    // Step 7: Reconstruct and return case snapshot
    const caseSnapshot = await this.conversationStateService.getConversationContext(
      input.conversationId
    );

    return {
      ...result,
      caseSnapshot: caseSnapshot || undefined,
    };
  }

  /**
   * Execute action when policy decision is ALLOWED
   */
  private async executeAllowedAction(
    input: OrchestratorExecutionInput,
    policyDecision: PolicyDecision,
    stateId: string
  ): Promise<OrchestratorExecutionResult> {
    const actionInput: ActionExecutionInput = {
      actionType: input.actionType,
      customerId: input.customer.id,
      bookingId: input.booking?.id,
      conversationId: input.conversationId,
      parameters: input.parameters || {},
      policyDecision: 'ALLOWED',
      policyIds: policyDecision.policyIds,
    };

    const actionResult = await this.actionService.executeAction(actionInput);

    // Record action in conversation state
    if (actionResult.actionId) {
      await this.conversationStateService.recordAction(stateId, actionResult.actionId);
    }

    // Log action execution to audit
    await this.auditService.logEvent(
      input.conversationId,
      'ACTION_EXECUTION',
      'SYSTEM',
      {
        actionType: input.actionType,
        actionId: actionResult.actionId,
        status: actionResult.status,
      }
    );

    return {
      policyDecision,
      actionExecuted: actionResult.success,
      actionId: actionResult.actionId,
      message: actionResult.message,
    };
  }

  /**
   * Handle non-ALLOWED decisions (ESCALATE, DENIED_BY_POLICY, etc.)
   * Creates escalation record instead of executing action
   */
  private async handleNonAllowedDecision(
    input: OrchestratorExecutionInput,
    policyDecision: PolicyDecision,
    stateId: string
  ): Promise<OrchestratorExecutionResult> {
    // Map decision to escalation reason code
    const reasonCode = this.mapDecisionToReasonCode(policyDecision.decision);
    const priority = policyDecision.decision === 'ESCALATE' ? 'HIGH' : 'NORMAL';

    // Create escalation record
    const escalation = await this.escalationService.createEscalation(
      input.conversationId,
      input.customer.id,
      reasonCode,
      `${policyDecision.decision}: ${policyDecision.reason}`,
      undefined, // No action ID since action was not executed
      priority
    );

    // Record escalation in conversation state
    await this.conversationStateService.recordEscalation(stateId, escalation.id);

    // Log escalation to audit
    await this.auditService.logEvent(
      input.conversationId,
      'ESCALATION_CREATED',
      'SYSTEM',
      {
        actionType: input.actionType,
        decision: policyDecision.decision,
        reason: policyDecision.reason,
        escalationId: escalation.id,
        reasonCode,
      }
    );

    return {
      policyDecision,
      actionExecuted: false,
      escalationId: escalation.id,
      message: `Action cannot be executed. ${policyDecision.reason}. Escalation created: ${escalation.id}`,
    };
  }

  /**
   * Map policy decision to escalation reason code
   */
  private mapDecisionToReasonCode(decision: string): string {
    switch (decision) {
      case 'ESCALATE':
        return 'AMOUNT_EXCEEDS_AUTHORITY';
      case 'DENIED_BY_POLICY':
        return 'POLICY_VIOLATION';
      case 'NEEDS_INFORMATION':
        return 'MISSING_INFORMATION';
      case 'UNSUPPORTED':
        return 'UNSUPPORTED_ACTION';
      default:
        return 'OTHER';
    }
  }
}
