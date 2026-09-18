import { describe, it, expect } from 'vitest';
import { BookingRepository } from './booking.repository.js';

describe('BookingRepository', () => {
  const repository = new BookingRepository();

  it('should find booking by PNR (Priya - SK4821X)', async () => {
    const booking = await repository.findByPnr('SK4821X');
    expect(booking).toBeDefined();
    expect(booking?.pnr).toBe('SK4821X');
    expect(booking?.status).toBe('CANCELLED');
  });

  it('should include flight segments', async () => {
    const booking = await repository.findByPnr('SK4821X');
    expect(booking?.segments).toBeDefined();
    expect(Array.isArray(booking?.segments)).toBe(true);
    expect(booking?.segments?.length).toBeGreaterThan(0);
  });

  it('should find booking with delayed flight (Meher - WL7742)', async () => {
    const booking = await repository.findByPnr('WL7742');
    expect(booking).toBeDefined();
    expect(booking?.pnr).toBe('WL7742');
    expect(booking?.status).toBe('DELAYED');
  });

  it('should find booking with delay details', async () => {
    const booking = await repository.findByPnr('WL7742');
    const segment = booking?.segments?.[0];
    expect(segment).toBeDefined();
    expect(segment?.delayHours).toBe(6.0);
    expect(segment?.flightNumber).toBe('SK-305');
  });

  it('should return null for non-existent booking', async () => {
    const booking = await repository.findByPnr('NONEXISTENT');
    expect(booking).toBeNull();
  });

  it('should get all bookings', async () => {
    const bookings = await repository.findAll();
    expect(Array.isArray(bookings)).toBe(true);
    expect(bookings.length).toBeGreaterThanOrEqual(3);
  });
});
