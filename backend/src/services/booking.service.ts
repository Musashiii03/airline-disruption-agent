import { BookingRepository } from '../repositories/booking.repository.js';
import { Booking } from '../data/types.js';

export class BookingService {
  private repository: BookingRepository;

  constructor() {
    this.repository = new BookingRepository();
  }

  async getByPnr(pnr: string): Promise<Booking | null> {
    return this.repository.findByPnr(pnr);
  }

  async getById(id: number): Promise<Booking | null> {
    return this.repository.findById(id);
  }

  async getByCustomerId(customerId: number): Promise<Booking[]> {
    return this.repository.findByCustomerId(customerId);
  }

  async getAll(): Promise<Booking[]> {
    return this.repository.findAll();
  }

  async create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    return this.repository.create(booking);
  }

  async update(id: number, updates: Partial<Omit<Booking, 'id' | 'createdAt'>>): Promise<Booking | null> {
    return this.repository.update(id, updates);
  }
}
