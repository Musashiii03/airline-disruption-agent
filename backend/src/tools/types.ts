/**
 * Tool Layer Type Definitions
 * Defines input/output schemas for all tools
 */

import { Customer, Booking, Policy } from '../data/types.js';

/**
 * Customer Tool Input
 */
export interface CustomerLookupInput {
  pnr: string;
}

/**
 * Customer Tool Result
 */
export interface CustomerLookupResult {
  found: boolean;
  customer: Customer | null;
  error?: string;
}

/**
 * Booking Tool Input
 */
export interface BookingLookupInput {
  pnr: string;
}

/**
 * Booking Tool Result
 */
export interface BookingLookupResult {
  found: boolean;
  booking: Booking | null;
  error?: string;
}

/**
 * Policy Tool Input - criteria for finding relevant policies
 */
export interface PolicyLookupInput {
  actionType?: string;
  bookingStatus?: string;
  delayHours?: number;
}

/**
 * Policy Tool Result
 */
export interface PolicyLookupResult {
  policies: Policy[];
  error?: string;
}

/**
 * Generic Tool Result wrapper
 */
export interface ToolResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
