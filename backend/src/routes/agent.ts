/**
 * Agent Routes
 * Routes for agent-related endpoints (LLM understanding, chat)
 */

import { Router } from 'express';
import { AgentController } from '../controllers/agent.controller.js';

const router = Router();
const agentController = new AgentController();

/**
 * POST /api/agent/chat
 * Main chat endpoint - process customer message and return assistant response with case context
 */
router.post('/chat', (req, res, next) =>
  agentController.chat(req, res, next)
);

/**
 * POST /api/agent/understand
 * Understand a customer message and extract intent/entities
 */
router.post('/understand', (req, res, next) =>
  agentController.understand(req, res, next)
);

export default router;
