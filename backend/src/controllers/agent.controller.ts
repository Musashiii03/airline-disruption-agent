/**
 * Agent Controller
 * Handles agent operations including LLM understanding and chat
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LLMService } from '../services/llm.service.js';
import { ConversationService } from '../services/conversation.service.js';
import { ConversationStateService } from '../services/conversation-state.service.js';
import { OrchestratorService } from '../services/orchestrator.service.js';
import { CustomerRepository } from '../repositories/customer.repository.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { ApiError } from '../middleware/error.js';

/**
 * Validation schema for understand message request
 */
const UnderstandMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .optional(),
});

/**
 * Validation schema for chat request
 */
const ChatRequestSchema = z.object({
  conversationId: z.number().optional(),
  message: z.string().min(1, 'Message is required and cannot be empty'),
});

export class AgentController {
  private conversationService: ConversationService;
  private conversationStateService: ConversationStateService;
  private orchestratorService: OrchestratorService;
  private customerRepository: CustomerRepository;
  private bookingRepository: BookingRepository;

  constructor() {
    this.conversationService = new ConversationService();
    this.conversationStateService = new ConversationStateService();
    this.orchestratorService = new OrchestratorService();
    this.customerRepository = new CustomerRepository();
    this.bookingRepository = new BookingRepository();
  }

  /**
   * POST /api/agent/understand
   * Understand a customer message and extract intent/entities
   * @param req Express request
   * @param res Express response
   * @param next Express next function
   */
  async understand(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const { message, history } = UnderstandMessageSchema.parse(req.body);

      // Get LLM provider and process message
      const llmProvider = LLMService.getProvider();
      const understanding = await llmProvider.understandCustomerMessage({
        message,
        history,
      });

      // Return structured understanding
      res.json({
        success: true,
        data: understanding,
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return next(
          new ApiError('VALIDATION_ERROR', 'Invalid request format', 400, error.errors)
        );
      }

      // Handle LLM errors
      if (error instanceof Error) {
        if (error.message.includes('API_KEY') || error.message.includes('invalid')) {
          return next(
            new ApiError(
              'LLM_AUTH_ERROR',
              'Unable to process message: LLM service is not configured',
              503
            )
          );
        }

        if (error.message.includes('Rate limit')) {
          return next(
            new ApiError(
              'LLM_RATE_LIMIT',
              'Too many requests to LLM service. Please try again later.',
              429
            )
          );
        }

        return next(
          new ApiError('LLM_ERROR', `Failed to understand message: ${error.message}`, 500)
        );
      }

      next(error);
    }
  }

  /**
   * POST /api/agent/chat
   * Main chat endpoint - processes customer message and returns assistant response with case context
   * 
   * Flow:
   * 1. Validate request
   * 2. Create or load conversation
   * 3. Save customer message
   * 4. Use LLM to understand intent/entities
   * 5. Identify customer and booking from entities/history
   * 6. Evaluate actions through orchestrator
   * 7. Generate customer-facing response
   * 8. Save assistant message
   * 9. Return response + case snapshot
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request
      const { conversationId, message } = ChatRequestSchema.parse(req.body);

      // Step 1: Create or load conversation
      let conversation;
      if (conversationId) {
        conversation = await this.conversationService.getById(conversationId);
        if (!conversation) {
          throw new ApiError(
            'CONVERSATION_NOT_FOUND',
            `Conversation ${conversationId} not found`,
            404
          );
        }
      } else {
        // Create new conversation - we'll identify customer from LLM understanding
        conversation = null; // Will create after identifying customer
      }

      // Step 2: Save customer message
      if (conversation) {
        await this.conversationService.addMessage(
          conversation.id,
          'USER',
          message
        );
      }

      // Step 3: Use LLM to understand intent/entities
      const llmProvider = LLMService.getProvider();
      const understanding = await llmProvider.understandCustomerMessage({
        message,
        history: conversation
          ? (await this.conversationService.getMessages(conversation.id)).map((m) => ({
              role: m.role === 'USER' ? 'user' : 'assistant',
              content: m.content,
            }))
          : undefined,
      });

      // Step 4: Identify customer and booking
      let customer;
      let booking;
      let pnr = understanding.entities?.pnr;

      // Try to find customer by PNR from understanding
      if (pnr) {
        customer = await this.customerRepository.findByPnr(pnr);
        booking = await this.bookingRepository.findByPnr(pnr);
      }

      // If not found and conversation exists, try existing conversation context
      if (!customer && conversation) {
        customer = await this.customerRepository.findById(conversation.customerId);
        booking = await this.bookingRepository.findById(conversation.id); // Note: simplified; should use state
        pnr = conversation.pnr;
      }

      // If still no customer, return error
      if (!customer) {
        throw new ApiError(
          'CUSTOMER_NOT_FOUND',
          'Unable to identify customer from booking information',
          400
        );
      }

      // Step 5: Create or ensure conversation exists with proper state
      if (!conversation) {
        conversation = await this.conversationService.getOrCreateConversation(
          customer.id,
          pnr || 'UNKNOWN'
        );
        await this.conversationService.addMessage(
          conversation.id,
          'USER',
          message,
          understanding.intent
        );
      } else {
        // Update message with intent
        const messages = await this.conversationService.getMessages(conversation.id);
        if (messages.length > 0) {
          // Note: ideally would update the message, but current repo doesn't support it
        }
      }

      // Step 6: Get or create conversation state
      const conversationState = await this.conversationStateService.getOrCreateState(
        conversation.id,
        customer.id,
        pnr || 'UNKNOWN'
      );

      // Update conversation state with current context
      if (booking) {
        const flightNumber = booking.segments?.[0]?.flightNumber;
        await this.conversationStateService.updateBookingContext(
          conversationState.id,
          booking.id,
          flightNumber
        );
      }

      if (understanding.intent) {
        await this.conversationStateService.updateLastIntent(
          conversationState.id,
          understanding.intent
        );
      }

      if (understanding.customerTone) {
        const validTone = understanding.customerTone as 'FRUSTRATED' | 'NEUTRAL' | 'SATISFIED' | undefined;
        if (validTone) {
          await this.conversationStateService.updateCustomerTone(
            conversationState.id,
            validTone
          );
        }
      }

      // Step 7: Process actions through orchestrator if requested
      let orchestratorResult: any = null;
      const assistantMessage: string[] = [];

      if (understanding.actions && understanding.actions.length > 0) {
        assistantMessage.push(
          this.generateIntentAcknowledgment(
            understanding.intent,
            understanding.customerTone
          )
        );

        for (const action of understanding.actions) {
          try {
            orchestratorResult = await this.orchestratorService.execute({
              conversationId: conversation.id,
              actionType: action.type,
              customer,
              booking: booking || undefined,
              requestedAmount: understanding.entities?.fareDifference || undefined,
              delayHours: understanding.entities?.delayHours || undefined,
              parameters: action.parameters || {},
            });

            // Generate customer-facing response based on orchestrator result
            const actionResponse = this.generateActionResponse(
              action.type,
              orchestratorResult
            );
            assistantMessage.push(actionResponse);
          } catch (actionError) {
            // Log error and continue with safe response
            const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
            assistantMessage.push(
              `I encountered an issue processing your ${action.type} request: ${errorMessage}`
            );
          }
        }
      } else {
        // No specific action, provide helpful response
        assistantMessage.push(
          this.generateHelpfulResponse(understanding, message)
        );
      }

      // Step 8: Save assistant message
      const finalMessage = assistantMessage.join(' ');
      await this.conversationService.addMessage(
        conversation.id,
        'ASSISTANT',
        finalMessage
      );

      // Step 9: Get updated case snapshot
      const caseSnapshot = await this.conversationStateService.getConversationContext(
        conversation.id
      );

      // Return response
      res.json({
        success: true,
        data: {
          conversationId: conversation.id,
          message: {
            role: 'ASSISTANT',
            content: finalMessage,
          },
          case: caseSnapshot,
          orchestratorResult: orchestratorResult || undefined,
        },
      });
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        return next(
          new ApiError('VALIDATION_ERROR', 'Invalid request format', 400, error.errors)
        );
      }

      // Handle API errors
      if (error instanceof ApiError) {
        return next(error);
      }

      // Handle LLM errors
      if (error instanceof Error) {
        if (error.message.includes('API_KEY') || error.message.includes('invalid')) {
          return next(
            new ApiError(
              'LLM_AUTH_ERROR',
              'Unable to process message: LLM service is not configured',
              503
            )
          );
        }

        if (error.message.includes('Rate limit')) {
          return next(
            new ApiError(
              'LLM_RATE_LIMIT',
              'Too many requests to LLM service. Please try again later.',
              429
            )
          );
        }

        return next(
          new ApiError('LLM_ERROR', `Failed to process chat: ${error.message}`, 500)
        );
      }

      next(error);
    }
  }

  /**
   * Generate acknowledgment based on customer's intent
   */
  private generateIntentAcknowledgment(
    intent: string | undefined,
    _tone: string | undefined
  ): string {
    const intentMessages: Record<string, string> = {
      CANCELLATION_REPORT: "I see your flight was cancelled. Let me help you with that.",
      REFUND_REQUEST: "I will help you process a refund.",
      REBOOKING_REQUEST: "I can help you rebook on another flight.",
      HIGHER_FARE_REQUEST: "Let me check if I can help you upgrade to a higher-fare flight.",
      HOTEL_REQUEST: "I can arrange hotel accommodation for you.",
      UPGRADE_REQUEST: "Let me evaluate a business class upgrade for you.",
      DELAY_REPORT: "I understand your flight is delayed. Let me see what I can do.",
    };

    return intentMessages[intent || ''] || "I will help you with your request.";
  }

  /**
   * Generate customer-facing response based on orchestrator/action result
   */
  private generateActionResponse(actionType: string, result: any): string {
    if (!result) {
      return `I'm processing your request for ${actionType}.`;
    }

    const policyDecision = result.policyDecision?.decision;
    const actionExecuted = result.actionExecuted;

    // Map decisions to customer-facing responses
    if (policyDecision === 'ALLOWED' && actionExecuted) {
      const actionMessages: Record<string, string> = {
        FULL_REFUND: "I have processed your full refund. You should see it in 7-10 business days.",
        PARTIAL_REFUND:
          "I have processed your partial refund. You should see it in 7-10 business days.",
        HOTEL_ACCOMMODATION:
          "I have arranged hotel accommodation for you at a nearby property.",
        MEAL_VOUCHER: "I have issued a meal voucher for you.",
        LOUNGE_ACCESS: "I have granted you access to the airport lounge.",
        REBOOK_FLIGHT: "I have rebooked you on an alternative flight.",
        HIGHER_FARE_REBOOK:
          "I have rebooked you on the higher-fare flight. The upgrade cost will be waived.",
        BUSINESS_CLASS_UPGRADE: "I have upgraded you to business class at no additional cost.",
      };
      return (
        actionMessages[actionType] ||
        `Your ${actionType} request has been processed successfully.`
      );
    }

    if (policyDecision === 'ESCALATE' || result.escalationId) {
      return `Your request requires supervisor approval. I have escalated it for review and you will hear from our team shortly. Reference: ${result.escalationId || 'pending'}`;
    }

    if (policyDecision === 'DENIED_BY_POLICY') {
      return `I'm sorry, but your ${actionType} request doesn't qualify under our current policies. ${result.policyDecision?.reason || ''}`;
    }

    if (policyDecision === 'NEEDS_INFORMATION') {
      return `I need some additional information to process your request: ${result.policyDecision?.reason || ''}`;
    }

    if (policyDecision === 'UNSUPPORTED') {
      return `I'm sorry, I'm not able to process ${actionType} requests through this system. Please contact our support team for assistance.`;
    }

    return `I've recorded your ${actionType} request and will follow up with you shortly.`;
  }

  /**
   * Generate helpful response when no specific action is requested
   */
  private generateHelpfulResponse(understanding: any, _originalMessage: string): string {
    const missingInfo = understanding.missingInformation || [];

    if (missingInfo.length > 0) {
      return `To better assist you, I need some information: ${missingInfo.join(', ')}.`;
    }

    // Default helpful response
    return "Thank you for reaching out. I am here to help with flight changes, refunds, or other resolution requests. Could you tell me more about what you need?";
  }
}
