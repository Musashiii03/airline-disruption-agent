import { AuditRepository } from '../repositories/audit.repository.js';
import { AuditEvent } from '../data/types.js';

export class AuditService {
  private repository: AuditRepository;

  constructor() {
    this.repository = new AuditRepository();
  }

  async getByConversationId(conversationId: number): Promise<AuditEvent[]> {
    return this.repository.findByConversationId(conversationId);
  }

  async getByEventType(eventType: string): Promise<AuditEvent[]> {
    return this.repository.findByEventType(eventType);
  }

  async getAll(): Promise<AuditEvent[]> {
    return this.repository.findAll();
  }

  async logEvent(
    conversationId: number,
    eventType: string,
    actor: AuditEvent['actor'],
    metadata?: Record<string, any>
  ): Promise<AuditEvent> {
    return this.repository.create({
      conversationId,
      eventType,
      actor,
      metadataJson: metadata,
    });
  }
}
