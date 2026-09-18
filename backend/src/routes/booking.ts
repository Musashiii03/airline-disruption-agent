import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller.js';

const router = Router();
const controller = new BookingController();

/**
 * GET /api/bookings/:pnr
 * Get booking by PNR
 */
router.get('/:pnr', (req, res, next) => controller.getByPnr(req, res, next));

/**
 * GET /api/bookings
 * Get all bookings
 */
router.get('/', (req, res, next) => controller.getAll(req, res, next));

export default router;
