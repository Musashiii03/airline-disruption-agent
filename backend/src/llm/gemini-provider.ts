/**
 * Gemini LLM Provider Implementation
 * Uses Google Generative AI SDK for intent extraction
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, LLMInput, LLMUnderstanding } from './types.js';
import { validateLLMOutput } from './validation.js';
import { env } from '../config/env.js';

/**
 * System prompt for Gemini
 * Instructs the model on its role and constraints
 */
const SYSTEM_PROMPT = `You are an intent and action extraction component for an airline customer-support agent.

Your responsibility:
- Understand what the customer is asking for
- Extract relevant information from the message
- Identify potential actions the system could take
- Flag any missing information needed

IMPORTANT CONSTRAINTS:
- You must only extract information explicitly stated or strongly implied in the customer message
- You must NOT invent facts or hallucinate information
- You must NOT make policy decisions or approvals
- You must NOT determine if requests are allowed or denied
- You must NOT approve, deny, or escalate requests
- You must NOT make business decisions based on customer sentiment
- You must NOT invent airline policies
- You must return ONLY valid JSON matching the specified schema

You must return a JSON object with this exact structure:
{
  "intent": "<one of: REFUND_REQUEST, REBOOKING_REQUEST, DELAY_ASSISTANCE, HOTEL_REQUEST, FLIGHT_UPGRADE_REQUEST, FARE_DIFFERENCE_REQUEST, CANCELLATION_COMPLAINT, GENERAL_FLIGHT_SUPPORT, STATUS_INQUIRY, UNKNOWN>",
  "entities": {
    "pnr": "<extracted PNR or null>",
    "flightNumber": "<extracted flight number or null>",
    "origin": "<extracted origin city or null>",
    "destination": "<extracted destination city or null>",
    "delayHours": "<extracted delay hours as number or null>",
    "fareDifference": "<extracted fare difference as number or null>",
    "currency": "<currency code if applicable or null>",
    "cabin": "<cabin class if mentioned or null>",
    "date": "<date if mentioned or null>"
  },
  "actions": [
    {
      "type": "<action type>",
      "parameters": {}
    }
  ],
  "missingInformation": ["<list of missing info needed>"],
  "customerTone": "<one of: CALM, CONFUSED, FRUSTRATED, ANGRY, URGENT>"
}

Supported action types:
- FULL_REFUND
- DELAY_COMPENSATION
- HIGHER_FARE_REBOOK
- REBOOK_FLIGHT
- BUSINESS_CLASS_UPGRADE
- HOTEL_ACCOMMODATION
- MEAL_VOUCHER
- LOUNGE_ACCESS

PNR Examples: SK4821X, TR1190B, WL7742
Flight Number Examples: SK-204, SK-118, SK-305

When extracting numeric values:
- Convert "₹2,000", "2000 rupees", "Rs 2000" to 2000
- Convert "4 hours", "4-hour", "4hrs" to 4
- Include currency if mentioned: { "fareDifference": 2000, "currency": "INR" }

Return ONLY the JSON object, no other text.`;

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor() {
    const apiKey = env.geminiApiKey;
    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not set. Unable to initialize Gemini provider.'
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = env.geminiModel || 'gemini-1.5-flash';
  }

  async understandCustomerMessage(input: LLMInput): Promise<LLMUnderstanding> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });

      // Build conversation history for context
      const contents = [];

      // Add conversation history if provided
      if (input.history && input.history.length > 0) {
        for (const msg of input.history) {
          contents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
          });
        }
      }

      // Add current message
      contents.push({
        role: 'user',
        parts: [{ text: input.message }],
      });

      // Call Gemini API
      const response = await model.generateContent({
        contents,
        systemInstruction: SYSTEM_PROMPT,
      });

      const responseText = response.response.text();

      // Parse and validate JSON response
      let parsedResponse: unknown;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(
          `Failed to parse LLM response as JSON: ${responseText.substring(0, 200)}`
        );
      }

      // Validate against schema
      const validated = validateLLMOutput(parsedResponse);

      return validated;
    } catch (error) {
      if (error instanceof Error) {
        // Check for specific errors
        if (error.message.includes('API_KEY')) {
          throw new Error(
            'Gemini API key is invalid or missing. Check GEMINI_API_KEY environment variable.'
          );
        }

        if (error.message.includes('Rate limit')) {
          throw new Error('Gemini rate limit exceeded. Please try again later.');
        }

        throw new Error(`Failed to process customer message with Gemini: ${error.message}`);
      }

      throw error;
    }
  }
}
