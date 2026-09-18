/**
 * LLM Service
 * Factory for creating and managing LLM providers
 */

import { LLMProvider } from '../llm/types.js';
import { GeminiProvider } from '../llm/gemini-provider.js';
import { MockLLMProvider } from '../llm/mock-provider.js';
import { env } from '../config/env.js';

export class LLMService {
  private static instance: LLMProvider | null = null;

  /**
   * Get or create LLM provider singleton
   * @returns LLM provider instance
   */
  static getProvider(): LLMProvider {
    if (!this.instance) {
      this.instance = this.createProvider();
    }

    return this.instance;
  }

  /**
   * Create appropriate provider based on configuration
   * @returns LLM provider instance
   */
  private static createProvider(): LLMProvider {
    const providerType = env.llmProvider || 'mock';

    console.log(`[LLMService] Initializing ${providerType} LLM provider`);

    if (providerType === 'gemini') {
      return new GeminiProvider();
    }

    // Default to mock provider
    return new MockLLMProvider();
  }

  /**
   * Reset provider (for testing)
   */
  static resetProvider(): void {
    this.instance = null;
  }
}
