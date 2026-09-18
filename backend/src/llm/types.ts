/**
 * LLM abstraction types
 * Defines the interface between the backend and LLM providers
 */

/**
 * Supported customer intents
 */
export enum CustomerIntent {
  REFUND_REQUEST = 'REFUND_REQUEST',
  REBOOKING_REQUEST = 'REBOOKING_REQUEST',
  DELAY_ASSISTANCE = 'DELAY_ASSISTANCE',
  HOTEL_REQUEST = 'HOTEL_REQUEST',
  FLIGHT_UPGRADE_REQUEST = 'FLIGHT_UPGRADE_REQUEST',
  FARE_DIFFERENCE_REQUEST = 'FARE_DIFFERENCE_REQUEST',
  CANCELLATION_COMPLAINT = 'CANCELLATION_COMPLAINT',
  GENERAL_FLIGHT_SUPPORT = 'GENERAL_FLIGHT_SUPPORT',
  STATUS_INQUIRY = 'STATUS_INQUIRY',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Supported action types that can be extracted by LLM
 */
export enum ActionType {
  FULL_REFUND = 'FULL_REFUND',
  DELAY_COMPENSATION = 'DELAY_COMPENSATION',
  HIGHER_FARE_REBOOK = 'HIGHER_FARE_REBOOK',
  REBOOK_FLIGHT = 'REBOOK_FLIGHT',
  BUSINESS_CLASS_UPGRADE = 'BUSINESS_CLASS_UPGRADE',
  HOTEL_ACCOMMODATION = 'HOTEL_ACCOMMODATION',
  MEAL_VOUCHER = 'MEAL_VOUCHER',
  LOUNGE_ACCESS = 'LOUNGE_ACCESS',
}

/**
 * Customer tone/sentiment
 */
export enum CustomerTone {
  CALM = 'CALM',
  CONFUSED = 'CONFUSED',
  FRUSTRATED = 'FRUSTRATED',
  ANGRY = 'ANGRY',
  URGENT = 'URGENT',
}

/**
 * Extracted entities from customer message
 */
export interface ExtractedEntities {
  pnr?: string | null;
  flightNumber?: string | null;
  origin?: string | null;
  destination?: string | null;
  delayHours?: number | null;
  fareDifference?: number | null;
  currency?: string | null;
  cabin?: string | null;
  date?: string | null;
}

/**
 * Action candidate (request, not authorization)
 */
export interface ActionCandidate {
  type: ActionType;
  parameters: Record<string, any>;
}

/**
 * Input to LLM provider
 */
export interface LLMInput {
  message: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * Output from LLM provider
 */
export interface LLMUnderstanding {
  intent: CustomerIntent;
  entities: ExtractedEntities;
  actions: ActionCandidate[];
  missingInformation: string[];
  customerTone?: CustomerTone;
}

/**
 * LLM provider interface
 * All LLM implementations must follow this contract
 */
export interface LLMProvider {
  /**
   * Understand a customer message and extract intent/entities
   * @param input Customer message and conversation history
   * @returns Structured understanding of customer intent
   * @throws Error if LLM call fails or output is invalid
   */
  understandCustomerMessage(input: LLMInput): Promise<LLMUnderstanding>;
}
