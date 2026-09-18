/**
 * ConversationStateRepository
 * Persists extended conversation context (bookingId, flightNumber, pending info, etc.)
 */

import { JsonStore } from '../data/json-store.js';
import { ConversationState } from '../data/types.js';

export class ConversationStateRepository {
  private stateStore: JsonStore<ConversationState>;

  constructor() {
    this.stateStore = new JsonStore<ConversationState>('conversation-states');
  }

  async findById(id: string): Promise<ConversationState | null> {
    return this.stateStore.findById(id);
  }

  async findByConversationId(conversationId: number): Promise<ConversationState | null> {
    return this.stateStore.findOne((s) => s.conversationId === conversationId);
  }

  async findAll(): Promise<ConversationState[]> {
    return this.stateStore.all();
  }

  async create(state: Omit<ConversationState, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConversationState> {
    const now = new Date().toISOString();
    const id = `CS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newState: ConversationState = {
      ...state,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.stateStore.insert(newState);
    return newState;
  }

  async update(
    id: string,
    updates: Partial<Omit<ConversationState, 'id' | 'createdAt'>>
  ): Promise<ConversationState | null> {
    const now = new Date().toISOString();
    return this.stateStore.update(id, {
      ...updates,
      updatedAt: now,
    } as Partial<ConversationState>);
  }

  async addActiveAction(stateId: string, actionId: string): Promise<ConversationState | null> {
    const state = await this.findById(stateId);
    if (!state) return null;

    const updated = {
      activeActionIds: [...new Set([...state.activeActionIds, actionId])],
    };

    return this.update(stateId, updated);
  }

  async removeActiveAction(stateId: string, actionId: string): Promise<ConversationState | null> {
    const state = await this.findById(stateId);
    if (!state) return null;

    const updated = {
      activeActionIds: state.activeActionIds.filter((id) => id !== actionId),
    };

    return this.update(stateId, updated);
  }

  async addActiveEscalation(stateId: string, escalationId: string): Promise<ConversationState | null> {
    const state = await this.findById(stateId);
    if (!state) return null;

    const updated = {
      activeEscalationIds: [...new Set([...state.activeEscalationIds, escalationId])],
    };

    return this.update(stateId, updated);
  }

  async removeActiveEscalation(stateId: string, escalationId: string): Promise<ConversationState | null> {
    const state = await this.findById(stateId);
    if (!state) return null;

    const updated = {
      activeEscalationIds: state.activeEscalationIds.filter((id) => id !== escalationId),
    };

    return this.update(stateId, updated);
  }

  async setPendingInformation(stateId: string, pending: string[]): Promise<ConversationState | null> {
    return this.update(stateId, {
      pendingInformation: pending,
    });
  }

  async addPendingInformation(stateId: string, item: string): Promise<ConversationState | null> {
    const state = await this.findById(stateId);
    if (!state) return null;

    const updated = {
      pendingInformation: [...new Set([...state.pendingInformation, item])],
    };

    return this.update(stateId, updated);
  }

  async removePendingInformation(stateId: string, item: string): Promise<ConversationState | null> {
    const state = await this.findById(stateId);
    if (!state) return null;

    const updated = {
      pendingInformation: state.pendingInformation.filter((i) => i !== item),
    };

    return this.update(stateId, updated);
  }
}
