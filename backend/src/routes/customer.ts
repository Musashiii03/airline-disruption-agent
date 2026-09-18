import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller.js';

const router = Router();
const controller = new CustomerController();

/**
 * GET /api/customers/:pnr
 * Get customer by PNR
 */
router.get('/:pnr', (req, res, next) => controller.getByPnr(req, res, next));

/**
 * GET /api/customers
 * Get all customers
 */
router.get('/', (req, res, next) => controller.getAll(req, res, next));

export default router;
