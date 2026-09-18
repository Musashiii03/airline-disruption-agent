import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service.js';
import { ApiError } from '../middleware/error.js';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  /**
   * GET /api/bookings/:pnr
   * Get booking by PNR
   */
  async getByPnr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pnr } = req.params;

      if (!pnr) {
        throw new ApiError('INVALID_REQUEST', 'PNR is required', 400);
      }

      const booking = await this.bookingService.getByPnr(pnr);

      if (!booking) {
        throw new ApiError('BOOKING_NOT_FOUND', `Booking with PNR ${pnr} not found`, 404);
      }

      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/bookings
   * Get all bookings
   */
  async getAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookings = await this.bookingService.getAll();

      res.json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }
}
