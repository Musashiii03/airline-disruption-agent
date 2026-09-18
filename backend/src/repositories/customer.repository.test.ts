import { describe, it, expect } from 'vitest';
import { CustomerRepository } from './customer.repository.js';

describe('CustomerRepository', () => {
  const repository = new CustomerRepository();

  it('should find customer by PNR (Priya)', async () => {
    const customer = await repository.findByPnr('SK4821X');
    expect(customer).toBeDefined();
    expect(customer?.name).toBe('Priya Nair');
    expect(customer?.loyaltyTier).toBe('Gold');
    expect(customer?.pnr).toBe('SK4821X');
  });

  it('should find customer by PNR (Arvind)', async () => {
    const customer = await repository.findByPnr('TR1190B');
    expect(customer).toBeDefined();
    expect(customer?.name).toBe('Arvind Kulkarni');
    expect(customer?.loyaltyTier).toBe('Silver');
  });

  it('should find customer by PNR (Meher)', async () => {
    const customer = await repository.findByPnr('WL7742');
    expect(customer).toBeDefined();
    expect(customer?.name).toBe('Meher Kaur');
    expect(customer?.loyaltyTier).toBe('Platinum');
  });

  it('should return null for non-existent customer', async () => {
    const customer = await repository.findByPnr('NONEXISTENT');
    expect(customer).toBeNull();
  });

  it('should get all customers', async () => {
    const customers = await repository.findAll();
    expect(Array.isArray(customers)).toBe(true);
    expect(customers.length).toBeGreaterThanOrEqual(3);
  });

  it('should find customer by ID', async () => {
    const customer = await repository.findById(1);
    expect(customer).toBeDefined();
    expect(customer?.pnr).toBe('SK4821X');
  });
});
