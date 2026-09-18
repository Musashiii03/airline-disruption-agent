import { CustomerRepository } from '../repositories/customer.repository.js';
import { Customer } from '../data/types.js';

export class CustomerService {
  private repository: CustomerRepository;

  constructor() {
    this.repository = new CustomerRepository();
  }

  async getByPnr(pnr: string): Promise<Customer | null> {
    return this.repository.findByPnr(pnr);
  }

  async getById(id: number): Promise<Customer | null> {
    return this.repository.findById(id);
  }

  async getAll(): Promise<Customer[]> {
    return this.repository.findAll();
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    return this.repository.create(customer);
  }

  async update(id: number, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer | null> {
    return this.repository.update(id, updates);
  }
}
