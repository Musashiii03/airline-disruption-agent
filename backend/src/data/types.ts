/**
 * Core data types for the airline resolution system
 */

export interface Customer {
  id: number;
  name: string;
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  pnr: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingSegment {
  id: number;
  bookingId: number;
  flightNumber: string;
  origin: string;
  destination: string;
  flightDate: string;
  scheduledDeparture: string;
  status: 'ON_TIME' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
  disruptionReason?: string;
  delayHours?: number;
  newDeparture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: number;
  customerId: number;
  pnr: string;
  status: 'ACTIVE' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  segments?: BookingSegment[];
}

export interface Policy {
  id: number;
  code: string;
  name: string;
  category: string;
  content: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PolicyRule {
  id: number;
  policyId: number;
  ruleType: string;
  conditionJson?: Record<string, any>;
  actionJson: Record<string, any>;
  priority: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Conversation: Base record for a support case
 * Maintains minimal core state only (ID, customer, PNR, status)
 * Extended context stored in ConversationState
 */
export interface Conversation {
  id: number;
  customerId: number;
  pnr: string;
  status: 'ACTIVE' | 'WAITING_FOR_CUSTOMER' | 'RESOLVED' | 'ESCALATED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

/**
 * ConversationState: Extended persistent state for a conversation
 * Captures conversation context: booking, flight, pending info, actions, escalations, intent, tone
 * Persisted separately to avoid bloating Conversation record
 */
export interface ConversationState {
  id: string; // Unique state record ID (different from conversationId)
  conversationId: number; // Foreign key to Conversation
  customerId: number;
  bookingId?: number;
  pnr: string;
  flightNumber?: string;
  pendingInformation: string[]; // e.g., ["fareDifference", "hotelPreference"]
  lastIntent?: string; // e.g., "REFUND_REQUEST", "REBOOK_REQUEST"
  lastCustomerTone?: 'FRUSTRATED' | 'NEUTRAL' | 'SATISFIED'; // Emotional context
  activeActionIds: string[]; // References to unresolved Action records
  activeEscalationIds: string[]; // References to open Escalation records
  createdAt: string;
  updatedAt: string;
}

/**
 * CaseSnapshot: Structured read-only view of a complete support case
 * Returned by API for frontend/agent dashboard consumption
 * Contains enriched facts but NOT internal reasoning or chain-of-thought
 */
export interface CaseSnapshot {
  conversationId: number;
  status: string;
  customer?: {
    id: number;
    name: string;
    loyaltyTier?: string;
  };
  booking?: {
    id: number;
    pnr: string;
    flightNumber?: string;
    route?: string;
    status?: string;
    delayHours?: number;
  };
  pendingInformation: string[];
  actions: Array<{
    actionId: string;
    actionType: string;
    status: string;
    createdAt: string;
  }>;
  escalations: Array<{
    escalationId: string;
    reasonCode: string;
    priority: string;
    status: string;
    createdAt: string;
  }>;
  recentMessages: Array<{
    messageId: number;
    role: string;
    content: string;
    timestamp: string;
  }>;
  auditTimeline: Array<{
    eventId: string;
    eventType: string;
    timestamp: string;
    summary?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'TOOL';
  content: string;
  intent?: string;
  createdAt: string;
}

export interface Action {
  id: string;
  conversationId: number;
  customerId: number;
  bookingId?: number;
  actionType: string;
  status: 'REQUESTED' | 'EXECUTED' | 'ESCALATED' | 'DENIED' | 'FAILED';
  requestedData?: Record<string, any>;
  resultData?: Record<string, any>;
  policyDecision?: 'ALLOWED' | 'ESCALATE' | 'NEEDS_INFORMATION' | 'UNSUPPORTED' | 'DENIED_BY_POLICY';
  createdAt: string;
  updatedAt: string;
}

export interface Escalation {
  id: string;
  conversationId: number;
  customerId: number;
  actionId?: string;
  reasonCode: string;
  summary?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface AuditEvent {
  id: string;
  conversationId: number;
  eventType: string;
  actor: 'CUSTOMER' | 'AGENT' | 'SYSTEM' | 'TOOL' | 'HUMAN';
  metadataJson?: Record<string, any>;
  createdAt: string;
}

export interface ActionPolicyReference {
  id: string;
  actionId: string;
  policyId: number;
  createdAt: string;
}
