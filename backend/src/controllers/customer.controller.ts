import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customer.service.js';
import { ApiError } from '../middleware/error.js';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  /**
   * GET /api/customers/:pnr
   * Get customer by PNR
   */
  async getByPnr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pnr } = req.params;

      if (!pnr) {
        throw new ApiError('INVALID_REQUEST', 'PNR is required', 400);
      }

      const customer = await this.customerService.getByPnr(pnr);

      if (!customer) {
        throw new ApiError('CUSTOMER_NOT_FOUND', `Customer with PNR ${pnr} not found`, 404);
      }

      res.json({
        success: true,
        data: customer,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/customers
   * Get all customers
   */
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customers = await this.customerService.getAll();

      res.json({
        success: true,
        data: customers,
      });
    } catch (error) {
      next(error);
    }
  }
}
