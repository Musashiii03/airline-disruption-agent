/**
 * Validation schemas for LLM output
 */

import { z } from 'zod';
import { CustomerIntent, ActionType, CustomerTone } from './types.js';

/**
 * Zod schema for extracted entities
 */
export const ExtractedEntitiesSchema = z.object({
  pnr: z.string().nullable().optional(),
  flightNumber: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  destination: z.string().nullable().optional(),
  delayHours: z.number().int().nullable().optional(),
  fareDifference: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  cabin: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
});

/**
 * Zod schema for action candidates
 */
export const ActionCandidateSchema = z.object({
  type: z.nativeEnum(ActionType),
  parameters: z.record(z.any()),
});

/**
 * Zod schema for LLM understanding output
 */
export const LLMUnderstandingSchema = z.object({
  intent: z.nativeEnum(CustomerIntent),
  entities: ExtractedEntitiesSchema,
  actions: z.array(ActionCandidateSchema),
  missingInformation: z.array(z.string()),
  customerTone: z.nativeEnum(CustomerTone).optional(),
});

/**
 * Validate LLM output against schema
 * @param data Raw data from LLM
 * @returns Validated LLMUnderstanding
 * @throws ZodError if validation fails
 */
export function validateLLMOutput(data: unknown) {
  return LLMUnderstandingSchema.parse(data);
}
