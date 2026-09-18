import { JsonStore } from '../data/json-store.js';
import { AuditEvent } from '../data/types.js';

export class AuditRepository {
  private store: JsonStore<AuditEvent>;

  constructor() {
    this.store = new JsonStore<AuditEvent>('audit-events');
  }

  async findByConversationId(conversationId: number): Promise<AuditEvent[]> {
    return this.store.findMany((e) => e.conversationId === conversationId);
  }

  async findByEventType(eventType: string): Promise<AuditEvent[]> {
    return this.store.findMany((e) => e.eventType === eventType);
  }

  async findAll(): Promise<AuditEvent[]> {
    return this.store.all();
  }

  async create(event: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent> {
    const now = new Date().toISOString();
    const events = await this.store.all();
    const id = `AUD-${String(events.length + 1).padStart(6, '0')}`;

    const newEvent: AuditEvent = {
      id,
      ...event,
      createdAt: now,
    };

    await this.store.insert(newEvent);
    return newEvent;
  }
}
