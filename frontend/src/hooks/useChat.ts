import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import { Message, CaseSnapshot } from '../types/api';

export interface ChatState {
  messages: Message[];
  conversationId: number | null;
  caseSnapshot: CaseSnapshot | null;
  loading: boolean;
  error: string | null;
}

export const useChat = () => {
  const [state, setState] = useState<ChatState>({
    messages: [],
    conversationId: null,
    caseSnapshot: null,
    loading: false,
    error: null,
  });

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) {
      setState((prev) => ({ ...prev, error: 'Message cannot be empty' }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiService.sendMessage({
        conversationId: state.conversationId || undefined,
        message: userMessage,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to send message');
      }

      // Update conversation ID if this is the first message
      const newConversationId = response.data.conversationId;

      // Build new messages array
      const userMsg: Message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      };

      const assistantMsg = response.data.message;

      setState((prev) => ({
        ...prev,
        conversationId: newConversationId,
        messages: [...prev.messages, userMsg, assistantMsg],
        caseSnapshot: response.data?.case || null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, [state.conversationId]);

  const resetConversation = useCallback(() => {
    setState({
      messages: [],
      conversationId: null,
      caseSnapshot: null,
      loading: false,
      error: null,
    });
  }, []);

  const loadConversation = useCallback(async (conversationId: number) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiService.getConversation(conversationId);

      if (!response.success || !response.data) {
        throw new Error('Failed to load conversation');
      }

      setState((prev) => ({
        ...prev,
        conversationId,
        messages: response.data?.messages || [],
        caseSnapshot: response.data || null,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load conversation',
      }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendMessage,
    resetConversation,
    loadConversation,
    clearError,
  };
};
