import { Router } from 'express';
import healthRoutes from './health.js';
import customerRoutes from './customer.js';
import bookingRoutes from './booking.js';
import conversationRoutes from './conversation.js';
import agentRoutes from './agent.js';

const router = Router();

/**
 * Health check
 */
router.use('/health', healthRoutes);

/**
 * API routes
 */
router.use('/api/customers', customerRoutes);
router.use('/api/bookings', bookingRoutes);
router.use('/api/conversations', conversationRoutes);
router.use('/api/agent', agentRoutes);

export default router;
