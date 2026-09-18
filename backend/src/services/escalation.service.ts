import { EscalationRepository } from '../repositories/escalation.repository.js';
import { Escalation } from '../data/types.js';

export class EscalationService {
  private repository: EscalationRepository;

  constructor() {
    this.repository = new EscalationRepository();
  }

  async getById(id: string): Promise<Escalation | null> {
    return this.repository.findById(id);
  }

  async getByConversationId(conversationId: number): Promise<Escalation[]> {
    return this.repository.findByConversationId(conversationId);
  }

  async getByStatus(status: string): Promise<Escalation[]> {
    return this.repository.findByStatus(status);
  }

  async getAll(): Promise<Escalation[]> {
    return this.repository.findAll();
  }

  async createEscalation(
    conversationId: number,
    customerId: number,
    reasonCode: string,
    summary?: string,
    actionId?: string,
    priority: Escalation['priority'] = 'NORMAL'
  ): Promise<Escalation> {
    const escalations = await this.repository.findAll();
    const id = `ESC-${String(escalations.length + 1).padStart(6, '0')}`;

    return this.repository.create({
      id,
      conversationId,
      customerId,
      actionId,
      reasonCode,
      summary,
      priority,
      status: 'OPEN',
    });
  }

  async updateEscalation(
    id: string,
    updates: Partial<Omit<Escalation, 'id' | 'createdAt'>>
  ): Promise<Escalation | null> {
    return this.repository.update(id, updates);
  }

  async resolveEscalation(id: string): Promise<Escalation | null> {
    return this.repository.resolve(id);
  }
}
