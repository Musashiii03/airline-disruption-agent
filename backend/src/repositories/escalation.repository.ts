import { JsonStore } from '../data/json-store.js';
import { Escalation } from '../data/types.js';

export class EscalationRepository {
  private store: JsonStore<Escalation>;

  constructor() {
    this.store = new JsonStore<Escalation>('escalations');
  }

  async findById(id: string): Promise<Escalation | null> {
    return this.store.findById(id);
  }

  async findByConversationId(conversationId: number): Promise<Escalation[]> {
    return this.store.findMany((e) => e.conversationId === conversationId);
  }

  async findByStatus(status: string): Promise<Escalation[]> {
    return this.store.findMany((e) => e.status === status);
  }

  async findAll(): Promise<Escalation[]> {
    return this.store.all();
  }

  async create(escalation: Omit<Escalation, 'createdAt' | 'updatedAt'>): Promise<Escalation> {
    const now = new Date().toISOString();
    const newEscalation: Escalation = {
      ...escalation,
      createdAt: now,
      updatedAt: now,
    };

    await this.store.insert(newEscalation);
    return newEscalation;
  }

  async update(id: string, updates: Partial<Omit<Escalation, 'id' | 'createdAt'>>): Promise<Escalation | null> {
    const now = new Date().toISOString();
    return this.store.update(id, {
      ...updates,
      updatedAt: now,
    } as Partial<Escalation>);
  }

  async resolve(id: string): Promise<Escalation | null> {
    const now = new Date().toISOString();
    return this.update(id, {
      status: 'RESOLVED',
      resolvedAt: now,
    });
  }
}
