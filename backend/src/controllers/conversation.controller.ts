import { Request, Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service.js';
import { ConversationStateService } from '../services/conversation-state.service.js';
import { AuditService } from '../services/audit.service.js';
import { ActionRepository } from '../repositories/action.repository.js';
import { EscalationRepository } from '../repositories/escalation.repository.js';
import { ApiError } from '../middleware/error.js';

export class ConversationController {
  private conversationService: ConversationService;
  private conversationStateService: ConversationStateService;
  private auditService: AuditService;
  private actionRepository: ActionRepository;
  private escalationRepository: EscalationRepository;

  constructor() {
    this.conversationService = new ConversationService();
    this.conversationStateService = new ConversationStateService();
    this.auditService = new AuditService();
    this.actionRepository = new ActionRepository();
    this.escalationRepository = new EscalationRepository();
  }

  /**
   * GET /api/conversations/:id
   * Get conversation with full case snapshot
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id, 10);

      if (isNaN(conversationId)) {
        throw new ApiError('INVALID_REQUEST', 'Valid conversation ID is required', 400);
      }

      const caseSnapshot = await this.conversationStateService.getConversationContext(conversationId);

      if (!caseSnapshot) {
        throw new ApiError('CONVERSATION_NOT_FOUND', `Conversation ${id} not found`, 404);
      }

      res.json({
        success: true,
        data: caseSnapshot,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/conversations/:id/messages
   * Get all messages in a conversation
   */
  async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id, 10);

      if (isNaN(conversationId)) {
        throw new ApiError('INVALID_REQUEST', 'Valid conversation ID is required', 400);
      }

      const messages = await this.conversationService.getMessages(conversationId);

      res.json({
        success: true,
        data: {
          conversationId,
          messages,
          count: messages.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/conversations/:id/actions
   * Get all actions related to a conversation
   */
  async getActions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id, 10);

      if (isNaN(conversationId)) {
        throw new ApiError('INVALID_REQUEST', 'Valid conversation ID is required', 400);
      }

      const actions = await this.actionRepository.findByConversationId(conversationId);

      res.json({
        success: true,
        data: {
          conversationId,
          actions: actions.map((a) => ({
            actionId: a.id,
            actionType: a.actionType,
            status: a.status,
            policyDecision: a.policyDecision,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
          })),
          count: actions.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/conversations/:id/escalations
   * Get all escalations related to a conversation
   */
  async getEscalations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id, 10);

      if (isNaN(conversationId)) {
        throw new ApiError('INVALID_REQUEST', 'Valid conversation ID is required', 400);
      }

      const escalations = await this.escalationRepository.findByConversationId(conversationId);

      res.json({
        success: true,
        data: {
          conversationId,
          escalations: escalations.map((e) => ({
            escalationId: e.id,
            reasonCode: e.reasonCode,
            priority: e.priority,
            status: e.status,
            summary: e.summary,
            createdAt: e.createdAt,
            resolvedAt: e.resolvedAt,
          })),
          count: escalations.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/conversations/:id/audit
   * Get audit trail for conversation
   */
  async getAudit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const conversationId = parseInt(id, 10);

      if (isNaN(conversationId)) {
        throw new ApiError('INVALID_REQUEST', 'Valid conversation ID is required', 400);
      }

      const events = await this.auditService.getByConversationId(conversationId);

      res.json({
        success: true,
        data: {
          conversationId,
          events: events.map((e) => ({
            eventId: e.id,
            eventType: e.eventType,
            actor: e.actor,
            timestamp: e.createdAt,
            metadata: e.metadataJson,
          })),
          count: events.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
