import { JsonStore } from '../data/json-store.js';
import { Booking, BookingSegment } from '../data/types.js';

export class BookingRepository {
  private bookingStore: JsonStore<Booking>;
  private segmentStore: JsonStore<BookingSegment>;

  constructor() {
    this.bookingStore = new JsonStore<Booking>('bookings');
    this.segmentStore = new JsonStore<BookingSegment>('booking-segments');
  }

  async findById(id: number): Promise<Booking | null> {
    const booking = await this.bookingStore.findById(id);
    if (!booking) return null;
    const segments = await this.segmentStore.findMany((s) => s.bookingId === booking.id);
    return { ...booking, segments };
  }

  async findByPnr(pnr: string): Promise<Booking | null> {
    const booking = await this.bookingStore.findOne((b) => b.pnr === pnr);
    if (!booking) return null;
    const segments = await this.segmentStore.findMany((s) => s.bookingId === booking.id);
    return { ...booking, segments };
  }

  async findByCustomerId(customerId: number): Promise<Booking[]> {
    const bookings = await this.bookingStore.findMany((b) => b.customerId === customerId);

    return Promise.all(
      bookings.map(async (booking) => {
        const segments = await this.segmentStore.findMany((s) => s.bookingId === booking.id);
        return { ...booking, segments };
      })
    );
  }

  async findAll(): Promise<Booking[]> {
    const bookings = await this.bookingStore.all();
    return Promise.all(
      bookings.map(async (booking) => {
        const segments = await this.segmentStore.findMany((s) => s.bookingId === booking.id);
        return { ...booking, segments };
      })
    );
  }

  async create(booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> {
    const now = new Date().toISOString();
    const data = await this.bookingStore.all();
    const id = Math.max(...data.map((b) => b.id), 0) + 1;

    const newBooking: Booking = {
      id,
      ...booking,
      createdAt: now,
      updatedAt: now,
    };

    await this.bookingStore.insert(newBooking);
    return newBooking;
  }

  async update(id: number, updates: Partial<Omit<Booking, 'id' | 'createdAt'>>): Promise<Booking | null> {
    const now = new Date().toISOString();
    const updated = await this.bookingStore.update(id, {
      ...updates,
      updatedAt: now,
    } as Partial<Booking>);

    if (!updated) return null;

    const segments = await this.segmentStore.findMany((s) => s.bookingId === updated.id);
    return { ...updated, segments };
  }
}
