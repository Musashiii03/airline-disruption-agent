import { JsonStore } from '../data/json-store.js';
import { Conversation, Message } from '../data/types.js';

export class ConversationRepository {
  private conversationStore: JsonStore<Conversation>;
  private messageStore: JsonStore<Message>;

  constructor() {
    this.conversationStore = new JsonStore<Conversation>('conversations');
    this.messageStore = new JsonStore<Message>('messages');
  }

  async findById(id: number): Promise<Conversation | null> {
    return this.conversationStore.findById(id);
  }

  async findByCustomerAndPnr(customerId: number, pnr: string): Promise<Conversation | null> {
    return this.conversationStore.findOne(
      (c) => c.customerId === customerId && c.pnr === pnr
    );
  }

  async findByCustomerId(customerId: number): Promise<Conversation[]> {
    return this.conversationStore.findMany((c) => c.customerId === customerId);
  }

  async findAll(): Promise<Conversation[]> {
    return this.conversationStore.all();
  }

  async create(
    conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Conversation> {
    const now = new Date().toISOString();
    const data = await this.conversationStore.all();
    const id = Math.max(...data.map((c) => c.id), 0) + 1;

    const newConversation: Conversation = {
      id,
      ...conversation,
      createdAt: now,
      updatedAt: now,
    };

    await this.conversationStore.insert(newConversation);
    return newConversation;
  }

  async update(
    id: number,
    updates: Partial<Omit<Conversation, 'id' | 'createdAt'>>
  ): Promise<Conversation | null> {
    const now = new Date().toISOString();
    return this.conversationStore.update(id, {
      ...updates,
      updatedAt: now,
    } as Partial<Conversation>);
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return this.messageStore.findMany((m) => m.conversationId === conversationId);
  }

  async addMessage(message: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const now = new Date().toISOString();
    const data = await this.messageStore.all();
    const id = Math.max(...data.map((m) => m.id), 0) + 1;

    const newMessage: Message = {
      id,
      ...message,
      createdAt: now,
    };

    await this.messageStore.insert(newMessage);
    return newMessage;
  }
}
