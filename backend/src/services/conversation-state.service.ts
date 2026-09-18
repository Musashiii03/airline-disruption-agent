/**
 * ConversationStateService
 * Manages persistent conversation context and case history
 * Handles state creation, updates, and context reconstruction
 */

import { ConversationStateRepository } from '../repositories/conversation-state.repository.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ActionRepository } from '../repositories/action.repository.js';
import { EscalationRepository } from '../repositories/escalation.repository.js';
import { AuditRepository } from '../repositories/audit.repository.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { ConversationState, CaseSnapshot, Conversation } from '../data/types.js';

export class ConversationStateService {
  private stateRepository: ConversationStateRepository;
  private conversationRepository: ConversationRepository;
  private actionRepository: ActionRepository;
  private escalationRepository: EscalationRepository;
  private auditRepository: AuditRepository;
  private customerRepository: CustomerRepository;
  private bookingRepository: BookingRepository;

  constructor() {
    this.stateRepository = new ConversationStateRepository();
    this.conversationRepository = new ConversationRepository();
    this.actionRepository = new ActionRepository();
    this.escalationRepository = new EscalationRepository();
    this.auditRepository = new AuditRepository();
    this.customerRepository = new CustomerRepository();
    this.bookingRepository = new BookingRepository();
  }

  /**
   * Create a new conversation state for a conversation
   */
  async createState(conversationId: number, customerId: number, pnr: string): Promise<ConversationState> {
    return this.stateRepository.create({
      conversationId,
      customerId,
      pnr,
      pendingInformation: [] as string[],
      activeActionIds: [] as string[],
      activeEscalationIds: [] as string[],
    });
  }

  /**
   * Get or create conversation state
   */
  async getOrCreateState(conversationId: number, customerId: number, pnr: string): Promise<ConversationState> {
    const existing = await this.stateRepository.findByConversationId(conversationId);
    if (existing) {
      return existing;
    }
    return this.createState(conversationId, customerId, pnr);
  }

  /**
   * Get conversation state by ID
   */
  async getStateById(stateId: string): Promise<ConversationState | null> {
    return this.stateRepository.findById(stateId);
  }

  /**
   * Get conversation state by conversation ID
   */
  async getStateByConversationId(conversationId: number): Promise<ConversationState | null> {
    return this.stateRepository.findByConversationId(conversationId);
  }

  /**
   * Update conversation state with booking context
   */
  async updateBookingContext(stateId: string, bookingId: number, flightNumber?: string): Promise<ConversationState | null> {
    return this.stateRepository.update(stateId, {
      bookingId,
      flightNumber,
    });
  }

  /**
   * Update last intent
   */
  async updateLastIntent(stateId: string, intent: string): Promise<ConversationState | null> {
    return this.stateRepository.update(stateId, {
      lastIntent: intent,
    });
  }

  /**
   * Update customer tone
   */
  async updateCustomerTone(stateId: string, tone: 'FRUSTRATED' | 'NEUTRAL' | 'SATISFIED'): Promise<ConversationState | null> {
    return this.stateRepository.update(stateId, {
      lastCustomerTone: tone,
    });
  }

  /**
   * Add pending information requirement
   */
  async addPendingInformation(stateId: string, item: string): Promise<ConversationState | null> {
    return this.stateRepository.addPendingInformation(stateId, item);
  }

  /**
   * Remove pending information when provided
   */
  async removePendingInformation(stateId: string, item: string): Promise<ConversationState | null> {
    return this.stateRepository.removePendingInformation(stateId, item);
  }

  /**
   * Record an active action
   */
  async recordAction(stateId: string, actionId: string): Promise<ConversationState | null> {
    return this.stateRepository.addActiveAction(stateId, actionId);
  }

  /**
   * Clear action when completed/failed
   */
  async clearAction(stateId: string, actionId: string): Promise<ConversationState | null> {
    return this.stateRepository.removeActiveAction(stateId, actionId);
  }

  /**
   * Record an active escalation
   */
  async recordEscalation(stateId: string, escalationId: string): Promise<ConversationState | null> {
    return this.stateRepository.addActiveEscalation(stateId, escalationId);
  }

  /**
   * Clear escalation when resolved
   */
  async clearEscalation(stateId: string, escalationId: string): Promise<ConversationState | null> {
    return this.stateRepository.removeActiveEscalation(stateId, escalationId);
  }

  /**
   * Reconstruct full case context for a conversation
   * Returns CaseSnapshot with all relevant information
   * CRITICAL: Does NOT include internal reasoning, only observable facts
   */
  async getConversationContext(conversationId: number): Promise<CaseSnapshot | null> {
    // Load conversation
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      return null;
    }

    // Load state
    const state = await this.stateRepository.findByConversationId(conversationId);

    // Load customer
    let customer: { id: number; name: string; loyaltyTier?: string } | undefined;
    const customerRecord = await this.customerRepository.findById(conversation.customerId);
    if (customerRecord) {
      customer = {
        id: customerRecord.id,
        name: customerRecord.name,
        loyaltyTier: customerRecord.loyaltyTier,
      };
    }

    // Load booking
    let booking: any;
    if (state?.bookingId) {
      const bookingRecord = await this.bookingRepository.findById(state.bookingId);
      if (bookingRecord) {
        booking = {
          id: bookingRecord.id,
          pnr: bookingRecord.pnr,
          flightNumber: state.flightNumber,
          status: bookingRecord.status,
          segments: bookingRecord.segments,
        };

        // Calculate delay hours from first segment
        if (bookingRecord.segments && bookingRecord.segments.length > 0) {
          booking.delayHours = bookingRecord.segments[0].delayHours || 0;
        }
      }
    }

    // Load recent messages (last 10)
    const messages = await this.conversationRepository.getMessages(conversationId);
    const recentMessages = messages.slice(-10).map((m) => ({
      messageId: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.createdAt,
    }));

    // Load active actions
    const actionRecords = await this.actionRepository.findByConversationId(conversationId);
    const actions = actionRecords
      .filter((a) => state?.activeActionIds?.includes(a.id))
      .map((a) => ({
        actionId: a.id,
        actionType: a.actionType,
        status: a.status,
        createdAt: a.createdAt,
      }));

    // Load active escalations
    const escalationRecords = await this.escalationRepository.findByConversationId(conversationId);
    const escalations = escalationRecords
      .filter((e) => state?.activeEscalationIds?.includes(e.id))
      .map((e) => ({
        escalationId: e.id,
        reasonCode: e.reasonCode,
        priority: e.priority,
        status: e.status,
        createdAt: e.createdAt,
      }));

    // Load audit timeline
    const auditEvents = await this.auditRepository.findByConversationId(conversationId);
    const auditTimeline = auditEvents.slice(-20).map((e) => ({
      eventId: e.id,
      eventType: e.eventType,
      timestamp: e.createdAt,
      summary: this.summarizeAuditEvent(e),
    }));

    // Build case snapshot
    const snapshot: CaseSnapshot = {
      conversationId,
      status: conversation.status,
      customer,
      booking,
      pendingInformation: state?.pendingInformation || [],
      actions,
      escalations,
      recentMessages,
      auditTimeline,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return snapshot;
  }

  /**
   * Summarize audit event for display (without exposing internal reasoning)
   */
  private summarizeAuditEvent(event: any): string | undefined {
    switch (event.eventType) {
      case 'POLICY_DECISION':
        const metadata = event.metadataJson || {};
        return `Policy evaluated: ${metadata.actionType} → ${metadata.decision}`;
      case 'ACTION_EXECUTION':
        return `Action executed: ${event.metadataJson?.actionType}`;
      case 'ESCALATION_CREATED':
        return `Escalation created: ${event.metadataJson?.reasonCode}`;
      case 'MESSAGE_RECEIVED':
        return 'Customer message received';
      case 'CONVERSATION_CREATED':
        return 'Conversation started';
      case 'CONVERSATION_STATUS_CHANGED':
        return `Status changed to ${event.metadataJson?.newStatus}`;
      default:
        return undefined;
    }
  }

  /**
   * Get recent conversations for a customer
   */
  async getCustomerConversations(customerId: number, limit: number = 10): Promise<Conversation[]> {
    const conversations = await this.conversationRepository.findByCustomerId(customerId);
    return conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, limit);
  }
}
