/**
 * Tool Input Validation Schemas
 * Validates all tool inputs before execution
 */

import { z } from 'zod';
import {
  CustomerLookupInput,
  BookingLookupInput,
  PolicyLookupInput,
} from './types.js';

/**
 * Customer lookup input schema
 */
export const CustomerLookupSchema = z.object({
  pnr: z
    .string()
    .min(1, 'PNR is required')
    .max(20, 'PNR must be 20 characters or less')
    .transform((val) => val.toUpperCase()),
}) satisfies z.ZodType<CustomerLookupInput>;

/**
 * Booking lookup input schema
 */
export const BookingLookupSchema = z.object({
  pnr: z
    .string()
    .min(1, 'PNR is required')
    .max(20, 'PNR must be 20 characters or less')
    .transform((val) => val.toUpperCase()),
}) satisfies z.ZodType<BookingLookupInput>;

/**
 * Policy lookup input schema
 */
export const PolicyLookupSchema = z.object({
  actionType: z.string().optional(),
  bookingStatus: z.string().optional(),
  delayHours: z.number().int().min(0).optional(),
}) satisfies z.ZodType<PolicyLookupInput>;

/**
 * Validate customer lookup input
 */
export function validateCustomerLookup(data: unknown): CustomerLookupInput {
  return CustomerLookupSchema.parse(data);
}

/**
 * Validate booking lookup input
 */
export function validateBookingLookup(data: unknown): BookingLookupInput {
  return BookingLookupSchema.parse(data);
}

/**
 * Validate policy lookup input
 */
export function validatePolicyLookup(data: unknown): PolicyLookupInput {
  return PolicyLookupSchema.parse(data);
}
