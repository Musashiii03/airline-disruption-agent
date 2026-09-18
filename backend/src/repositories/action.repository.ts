import { JsonStore } from '../data/json-store.js';
import { Action, ActionPolicyReference } from '../data/types.js';

export class ActionRepository {
  private actionStore: JsonStore<Action>;
  private refStore: JsonStore<ActionPolicyReference>;

  constructor() {
    this.actionStore = new JsonStore<Action>('actions');
    this.refStore = new JsonStore<ActionPolicyReference>('action-policy-references');
  }

  async findById(id: string): Promise<Action | null> {
    return this.actionStore.findById(id);
  }

  async findByConversationId(conversationId: number): Promise<Action[]> {
    return this.actionStore.findMany((a) => a.conversationId === conversationId);
  }

  async findAll(): Promise<Action[]> {
    return this.actionStore.all();
  }

  async create(action: Omit<Action, 'createdAt' | 'updatedAt'>): Promise<Action> {
    const now = new Date().toISOString();
    const newAction: Action = {
      ...action,
      createdAt: now,
      updatedAt: now,
    };

    await this.actionStore.insert(newAction);
    return newAction;
  }

  async update(id: string, updates: Partial<Omit<Action, 'id' | 'createdAt'>>): Promise<Action | null> {
    const now = new Date().toISOString();
    return this.actionStore.update(id, {
      ...updates,
      updatedAt: now,
    } as Partial<Action>);
  }

  async addPolicyReference(actionId: string, policyId: number): Promise<void> {
    const now = new Date().toISOString();
    const ref: ActionPolicyReference = {
      id: `${actionId}_${policyId}_${Date.now()}`,
      actionId,
      policyId,
      createdAt: now,
    };

    await this.refStore.insert(ref);
  }

  async getPolicyReferences(actionId: string): Promise<ActionPolicyReference[]> {
    return this.refStore.findMany((r) => r.actionId === actionId);
  }
}
