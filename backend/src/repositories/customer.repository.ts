import { JsonStore } from '../data/json-store.js';
import { Customer } from '../data/types.js';

export class CustomerRepository {
  private store: JsonStore<Customer>;

  constructor() {
    this.store = new JsonStore<Customer>('customers');
  }

  async findById(id: number): Promise<Customer | null> {
    return this.store.findById(id);
  }

  async findByPnr(pnr: string): Promise<Customer | null> {
    return this.store.findOne((customer) => customer.pnr === pnr);
  }

  async findAll(): Promise<Customer[]> {
    return this.store.all();
  }

  async create(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const now = new Date().toISOString();
    const data = await this.store.all();
    const id = Math.max(...data.map((c) => c.id), 0) + 1;

    const newCustomer: Customer = {
      id,
      ...customer,
      createdAt: now,
      updatedAt: now,
    };

    await this.store.insert(newCustomer);
    return newCustomer;
  }

  async update(id: number, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer | null> {
    const now = new Date().toISOString();
    return this.store.update(id, {
      ...updates,
      updatedAt: now,
    } as Partial<Customer>);
  }
}
