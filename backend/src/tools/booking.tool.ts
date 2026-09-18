/**
 * Booking Tool
 * Provides controlled access to booking information
 */

import { BookingService } from '../services/booking.service.js';
import { BookingLookupResult } from './types.js';
import { validateBookingLookup } from './validation.js';

export class BookingTool {
  private bookingService: BookingService;

  constructor(bookingService: BookingService) {
    this.bookingService = bookingService;
  }

  /**
   * Look up booking by PNR
   * @param input Booking lookup input with PNR
   * @returns Result with booking data or not found
   */
  async getBookingByPnr(input: unknown): Promise<BookingLookupResult> {
    try {
      // Validate input
      const validated = validateBookingLookup(input);

      // Look up booking via service
      const booking = await this.bookingService.getByPnr(validated.pnr);

      if (!booking) {
        return {
          found: false,
          booking: null,
        };
      }

      return {
        found: true,
        booking,
      };
    } catch (error) {
      if (error instanceof Error) {
        return {
          found: false,
          booking: null,
          error: `Failed to lookup booking: ${error.message}`,
        };
      }

      return {
        found: false,
        booking: null,
        error: 'Unknown error during booking lookup',
      };
    }
  }

  /**
   * Tool description for orchestrator/LLM
   */
  static getDescription(): string {
    return 'Retrieve authoritative booking and flight information for a supplied PNR.';
  }

  /**
   * Tool schema for orchestrator
   */
  static getSchema() {
    return {
      type: 'object',
      properties: {
        pnr: {
          type: 'string',
          description: 'Airline PNR (e.g., SK4821X)',
        },
      },
      required: ['pnr'],
    };
  }
}
