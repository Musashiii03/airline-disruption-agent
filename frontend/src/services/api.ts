import { HealthCheckResponse, ChatRequest, ChatResponse, ConversationResponse, Message, Action, Escalation, AuditEvent } from '../types/api';

const getApiUrl = (): string => {
  const url = import.meta.env.VITE_API_BASE_URL;
  
  // In development, allow fallback to localhost
  if (!url) {
    if (import.meta.env.DEV) {
      console.warn('VITE_API_BASE_URL not set, using default http://localhost:5000/api');
      return 'http://localhost:5000/api';
    }
    throw new Error('VITE_API_BASE_URL environment variable must be configured for production');
  }
  
  return url;
};

const API_BASE_URL = getApiUrl();

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async getHealth(): Promise<HealthCheckResponse> {
    return this.request<HealthCheckResponse>('/health');
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.request<ChatResponse>('/agent/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getConversation(conversationId: number): Promise<ConversationResponse> {
    return this.request<ConversationResponse>(`/conversations/${conversationId}`);
  }

  async getMessages(conversationId: number): Promise<{ success: boolean; data?: Message[] }> {
    return this.request(`/conversations/${conversationId}/messages`);
  }

  async getActions(conversationId: number): Promise<{ success: boolean; data?: Action[] }> {
    return this.request(`/conversations/${conversationId}/actions`);
  }

  async getEscalations(conversationId: number): Promise<{ success: boolean; data?: Escalation[] }> {
    return this.request(`/conversations/${conversationId}/escalations`);
  }

  async getAudit(conversationId: number): Promise<{ success: boolean; data?: AuditEvent[] }> {
    return this.request(`/conversations/${conversationId}/audit`);
  }
}

export const apiService = new ApiService(API_BASE_URL);
