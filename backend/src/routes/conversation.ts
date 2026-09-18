import { Router } from 'express';
import { ConversationController } from '../controllers/conversation.controller.js';

const router = Router();
const controller = new ConversationController();

/**
 * GET /api/conversations/:id
 * Get conversation with full case snapshot (CaseSnapshot model)
 */
router.get('/:id', (req, res, next) => controller.getById(req, res, next));

/**
 * GET /api/conversations/:id/messages
 * Get all messages in conversation
 */
router.get('/:id/messages', (req, res, next) => controller.getMessages(req, res, next));

/**
 * GET /api/conversations/:id/actions
 * Get all actions related to conversation
 */
router.get('/:id/actions', (req, res, next) => controller.getActions(req, res, next));

/**
 * GET /api/conversations/:id/escalations
 * Get all escalations related to conversation
 */
router.get('/:id/escalations', (req, res, next) => controller.getEscalations(req, res, next));

/**
 * GET /api/conversations/:id/audit
 * Get audit trail for conversation
 */
router.get('/:id/audit', (req, res, next) => controller.getAudit(req, res, next));

export default router;
