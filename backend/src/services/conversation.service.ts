import { ConversationRepository } from '../repositories/conversation.repository.js';
import { Conversation, Message } from '../data/types.js';

export class ConversationService {
  private repository: ConversationRepository;

  constructor() {
    this.repository = new ConversationRepository();
  }

  async getById(id: number): Promise<Conversation | null> {
    return this.repository.findById(id);
  }

  async getOrCreateConversation(
    customerId: number,
    pnr: string
  ): Promise<Conversation> {
    const existing = await this.repository.findByCustomerAndPnr(customerId, pnr);
    if (existing) {
      return existing;
    }

    return this.repository.create({
      customerId,
      pnr,
      status: 'ACTIVE',
    });
  }

  async getByCustomerId(customerId: number): Promise<Conversation[]> {
    return this.repository.findByCustomerId(customerId);
  }

  async getAll(): Promise<Conversation[]> {
    return this.repository.findAll();
  }

  async updateStatus(
    id: number,
    status: Conversation['status']
  ): Promise<Conversation | null> {
    return this.repository.update(id, { status });
  }

  async addMessage(
    conversationId: number,
    role: Message['role'],
    content: string,
    intent?: string
  ): Promise<Message> {
    return this.repository.addMessage({
      conversationId,
      role,
      content,
      intent,
    });
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return this.repository.getMessages(conversationId);
  }
}
