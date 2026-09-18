// ============ API Response Wrapper ============
export type HealthCheckResponse = {
  success: boolean;
  data: {
    status: string;
    timestamp: string;
    uptime: number;
  };
};

export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
};

// ============ Chat & Conversation Types ============
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
};

export type Customer = {
  id: number;
  name: string;
  pnr: string;
  loyaltyTier?: string;
  contactEmail?: string;
  contactPhone?: string;
};

export type BookingSegment = {
  flightNumber: string;
  departure: string;
  arrival: string;
  delayHours?: number;
};

export type Booking = {
  id: number;
  pnr: string;
  customerId: number;
  status: 'ACTIVE' | 'CANCELLED' | 'DELAYED' | 'COMPLETED';
  segments?: BookingSegment[];
};

export type Action = {
  id: string;
  conversationId: number;
  customerId: number;
  actionType: string;
  status: 'REQUESTED' | 'EXECUTED' | 'ESCALATED' | 'DENIED' | 'FAILED';
  createdAt: string;
  updatedAt: string;
};

export type Escalation = {
  id: string;
  conversationId: number;
  customerId: number;
  reasonCode: string;
  reason: string;
  priority: 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
};

export type AuditEvent = {
  id: string;
  conversationId: number;
  eventType: string;
  actor: string;
  details: Record<string, unknown>;
  timestamp: string;
};

export type CaseSnapshot = {
  customer?: Customer;
  booking?: Booking;
  messages: Message[];
  actions: Action[];
  escalations: Escalation[];
  auditEvents: AuditEvent[];
  status?: string;
};

export type ChatRequest = {
  conversationId?: number;
  message: string;
};

export type ChatResponse = {
  success: boolean;
  data?: {
    conversationId: number;
    message: Message;
    case: CaseSnapshot;
    orchestratorResult?: {
      decision: string;
      actionExecuted: boolean;
      actionId?: string;
      escalationId?: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
};

export type ConversationResponse = {
  success: boolean;
  data?: CaseSnapshot;
  error?: {
    code: string;
    message: string;
  };
};
