/**
 * ActionIdempotencyService
 * Prevents duplicate action execution within a conversation
 * Ensures that repeating the same request doesn't create multiple actions
 */

import { ActionRepository } from '../repositories/action.repository.js';
import { Action } from '../data/types.js';

export interface ActionIdempotencyKey {
  conversationId: number;
  customerId: number;
  actionType: string;
  bookingId?: number;
}

export interface IdempotencyCheckResult {
  isDuplicate: boolean;
  existingAction?: Action;
  reason?: string;
}

/**
 * ActionIdempotencyService
 * Uses action history to detect duplicate requests
 */
export class ActionIdempotencyService {
  private actionRepository: ActionRepository;

  constructor() {
    this.actionRepository = new ActionRepository();
  }

  /**
   * Check if this action has already been requested/executed in this conversation
   * Returns existing action if duplicate found, null otherwise
   */
  async checkForDuplicate(key: ActionIdempotencyKey): Promise<IdempotencyCheckResult> {
    // Get all actions in the conversation
    const conversationActions = await this.actionRepository.findByConversationId(
      key.conversationId
    );

    // Look for matching action (same type, booking, customer)
    const existingAction = conversationActions.find(
      (a) =>
        a.actionType === key.actionType &&
        a.customerId === key.customerId &&
        (key.bookingId ? a.bookingId === key.bookingId : !a.bookingId)
    );

    // If found and it's not failed or denied, consider it a duplicate
    if (existingAction) {
      // Allow retry if action failed or was explicitly denied
      if (existingAction.status === 'FAILED' || existingAction.status === 'DENIED') {
        return {
          isDuplicate: false,
          reason: `Previous attempt ${existingAction.status}; allowing retry`,
        };
      }

      // Block if action was already executed, escalated, or requested
      if (
        existingAction.status === 'EXECUTED' ||
        existingAction.status === 'ESCALATED' ||
        existingAction.status === 'REQUESTED'
      ) {
        return {
          isDuplicate: true,
          existingAction,
          reason: `${key.actionType} action already ${existingAction.status.toLowerCase()} in conversation (Action ID: ${existingAction.id})`,
        };
      }
    }

    return {
      isDuplicate: false,
    };
  }

  /**
   * Get the most recent action of a given type in a conversation
   */
  async getMostRecentAction(
    conversationId: number,
    actionType: string
  ): Promise<Action | null> {
    const conversationActions = await this.actionRepository.findByConversationId(
      conversationId
    );

    const matching = conversationActions.filter((a) => a.actionType === actionType);

    if (matching.length === 0) {
      return null;
    }

    // Return the most recent
    return matching.reduce((latest, current) => {
      return new Date(current.createdAt) > new Date(latest.createdAt) ? current : latest;
    });
  }

  /**
   * Get all actions for a specific booking in a conversation
   */
  async getBookingActions(conversationId: number, bookingId: number): Promise<Action[]> {
    const conversationActions = await this.actionRepository.findByConversationId(
      conversationId
    );

    return conversationActions.filter((a) => a.bookingId === bookingId);
  }

  /**
   * Check if an action type has been successfully executed in conversation
   */
  async hasExecutedAction(conversationId: number, actionType: string): Promise<boolean> {
    const conversationActions = await this.actionRepository.findByConversationId(
      conversationId
    );

    return conversationActions.some(
      (a) => a.actionType === actionType && a.status === 'EXECUTED'
    );
  }

  /**
   * Check if there are any pending (non-resolved) actions in conversation
   */
  async hasPendingActions(conversationId: number): Promise<boolean> {
    const conversationActions = await this.actionRepository.findByConversationId(
      conversationId
    );

    return conversationActions.some(
      (a) =>
        a.status === 'REQUESTED' ||
        (a.status === 'ESCALATED' && !a.updatedAt) // Escalations without resolution
    );
  }
}
