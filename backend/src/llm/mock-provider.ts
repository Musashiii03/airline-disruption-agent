/**
 * Mock LLM Provider for testing
 * Returns deterministic responses without calling Gemini
 */

import {
  LLMProvider,
  LLMInput,
  LLMUnderstanding,
  CustomerIntent,
  ActionType,
  CustomerTone,
} from './types.js';

export class MockLLMProvider implements LLMProvider {
  async understandCustomerMessage(input: LLMInput): Promise<LLMUnderstanding> {
    const message = input.message.toLowerCase();

    // UNIVERSAL PNR EXTRACTION - Check for known PNRs first
    if (message.includes('wl7742') || message.includes('wl-7742')) {
      // Map to Meher's details
      if (message.includes('6') || message.includes('six') || message.includes('2000') || message.includes('higher-fare')) {
        return {
          intent: CustomerIntent.FARE_DIFFERENCE_REQUEST,
          entities: {
            pnr: 'WL7742',
            flightNumber: 'SK-305',
            delayHours: 6,
            fareDifference: 2000,
            currency: 'INR',
          },
          actions: [
            {
              type: ActionType.HIGHER_FARE_REBOOK,
              parameters: {
                fareDifference: 2000,
              },
            },
          ],
          missingInformation: [],
          customerTone: CustomerTone.FRUSTRATED,
        };
      }
      // Generic Meher/WL7742 request
      return {
        intent: CustomerIntent.DELAY_ASSISTANCE,
        entities: {
          pnr: 'WL7742',
          flightNumber: 'SK-305',
        },
        actions: [],
        missingInformation: [],
        customerTone: CustomerTone.CALM,
      };
    }

    if (message.includes('sk4821x') || message.includes('sk-4821-x')) {
      // Map to Priya's details
      if (message.includes('refund')) {
        return {
          intent: CustomerIntent.REFUND_REQUEST,
          entities: {
            pnr: 'SK4821X',
            flightNumber: 'SK-204',
          },
          actions: [
            {
              type: ActionType.FULL_REFUND,
              parameters: {},
            },
          ],
          missingInformation: [],
          customerTone: CustomerTone.FRUSTRATED,
        };
      }
      // Generic Priya request
      return {
        intent: CustomerIntent.CANCELLATION_COMPLAINT,
        entities: {
          pnr: 'SK4821X',
          flightNumber: 'SK-204',
        },
        actions: [],
        missingInformation: [],
        customerTone: CustomerTone.CALM,
      };
    }

    if (message.includes('tr1190b') || message.includes('tr-1190-b')) {
      // Map to Arvind's details
      if (message.includes('4') || message.includes('four')) {
        return {
          intent: CustomerIntent.DELAY_ASSISTANCE,
          entities: {
            pnr: 'TR1190B',
            flightNumber: 'SK-118',
            delayHours: 4,
          },
          actions: [
            {
              type: ActionType.DELAY_COMPENSATION,
              parameters: {},
            },
          ],
          missingInformation: [],
          customerTone: CustomerTone.URGENT,
        };
      }
      // Generic Arvind request
      return {
        intent: CustomerIntent.DELAY_ASSISTANCE,
        entities: {
          pnr: 'TR1190B',
          flightNumber: 'SK-118',
        },
        actions: [],
        missingInformation: [],
        customerTone: CustomerTone.CALM,
      };
    }

    // DEMO SCENARIO 1: Priya - Flight SK-204 cancelled (maps to PNR SK4821X)
    if (message.includes('sk-204') || message.includes('sk204')) {
      if (message.includes('refund')) {
        return {
          intent: CustomerIntent.REFUND_REQUEST,
          entities: {
            pnr: 'SK4821X',
            flightNumber: 'SK-204',
          },
          actions: [
            {
              type: ActionType.FULL_REFUND,
              parameters: {},
            },
          ],
          missingInformation: [],
          customerTone: CustomerTone.FRUSTRATED,
        };
      }
      // Just reporting cancellation
      return {
        intent: CustomerIntent.CANCELLATION_COMPLAINT,
        entities: {
          pnr: 'SK4821X',
          flightNumber: 'SK-204',
        },
        actions: [],
        missingInformation: [],
        customerTone: CustomerTone.CALM,
      };
    }

    // DEMO SCENARIO 2: Arvind - Flight SK-118 delayed (maps to PNR TR1190B)
    if (message.includes('sk-118') || message.includes('sk118')) {
      if (message.includes('4') || message.includes('four') || message.includes('4 hour')) {
        return {
          intent: CustomerIntent.DELAY_ASSISTANCE,
          entities: {
            pnr: 'TR1190B',
            flightNumber: 'SK-118',
            delayHours: 4,
          },
          actions: [
            {
              type: ActionType.DELAY_COMPENSATION,
              parameters: {},
            },
          ],
          missingInformation: [],
          customerTone: CustomerTone.URGENT,
        };
      }
      // Just reporting delay without specific hours
      return {
        intent: CustomerIntent.DELAY_ASSISTANCE,
        entities: {
          pnr: 'TR1190B',
          flightNumber: 'SK-118',
        },
        actions: [],
        missingInformation: ['delayHours'],
        customerTone: CustomerTone.CALM,
      };
    }

    // DEMO SCENARIO 3: Meher - Flight SK-305 delayed (maps to PNR WL7742)
    if (message.includes('sk-305') || message.includes('sk305')) {
      if (message.includes('6') || message.includes('six') || message.includes('6 hour')) {
        const hasFareDifference = message.includes('2000') || message.includes('higher-fare');
        
        if (hasFareDifference) {
          return {
            intent: CustomerIntent.FARE_DIFFERENCE_REQUEST,
            entities: {
              pnr: 'WL7742',
              flightNumber: 'SK-305',
              delayHours: 6,
              fareDifference: 2000,
              currency: 'INR',
            },
            actions: [
              {
                type: ActionType.HIGHER_FARE_REBOOK,
                parameters: {
                  fareDifference: 2000,
                },
              },
            ],
            missingInformation: [],
            customerTone: CustomerTone.FRUSTRATED,
          };
        }
        // Just delay, no upgrade request
        return {
          intent: CustomerIntent.DELAY_ASSISTANCE,
          entities: {
            pnr: 'WL7742',
            flightNumber: 'SK-305',
            delayHours: 6,
          },
          actions: [
            {
              type: ActionType.HOTEL_ACCOMMODATION,
              parameters: {},
            },
          ],
          missingInformation: [],
          customerTone: CustomerTone.CALM,
        };
      }
      // Just reporting delay without specific hours
      return {
        intent: CustomerIntent.DELAY_ASSISTANCE,
        entities: {
          pnr: 'WL7742',
          flightNumber: 'SK-305',
        },
        actions: [],
        missingInformation: ['delayHours'],
        customerTone: CustomerTone.CALM,
      };
    }

    // TEST: Simple delay + hotel
    if (message.includes('hotel') && (message.includes('delay') || message.includes('delayed'))) {
      return {
        intent: CustomerIntent.DELAY_ASSISTANCE,
        entities: {
          flightNumber: 'SK-118',
          delayHours: 4,
        },
        actions: [
          {
            type: ActionType.HOTEL_ACCOMMODATION,
            parameters: {},
          },
        ],
        missingInformation: ['pnr'],
      };
    }

    // TEST: Numeric fare extraction - extract any number as fare difference
    if ((message.includes('higher-fare') || message.includes('high fare') || message.includes('fare') || message.includes('upgrade')) && 
        (message.includes('difference') || message.includes('fare'))) {
      // Try to extract a 4-digit number (fare amount)
      const fareMatch = message.match(/\d{3,4}/);
      const fareAmount = fareMatch ? parseInt(fareMatch[0]) : 2000;
      
      return {
        intent: CustomerIntent.FARE_DIFFERENCE_REQUEST,
        entities: {
          pnr: message.includes('wl7742') ? 'WL7742' : undefined,
          fareDifference: fareAmount,
          currency: 'INR',
        },
        actions: [
          {
            type: ActionType.HIGHER_FARE_REBOOK,
            parameters: {
              fareDifference: fareAmount,
            },
          },
        ],
        missingInformation: message.includes('wl7742') ? [] : ['pnr'],
      };
    }

    // TEST: Delay hours extraction
    if (message.includes('delayed') && message.includes('4')) {
      return {
        intent: CustomerIntent.DELAY_ASSISTANCE,
        entities: {
          delayHours: 4,
        },
        actions: [
          {
            type: ActionType.DELAY_COMPENSATION,
            parameters: {},
          },
        ],
        missingInformation: [],
      };
    }

    // TEST: PNR extraction
    if (message.includes('sk4821x') || message.includes('sk-4821-x')) {
      return {
        intent: CustomerIntent.REFUND_REQUEST,
        entities: {
          pnr: 'SK4821X',
        },
        actions: [
          {
            type: ActionType.FULL_REFUND,
            parameters: {},
          },
        ],
        missingInformation: [],
      };
    }

    // TEST: Business class upgrade
    if (message.includes('business') && message.includes('upgrade')) {
      return {
        intent: CustomerIntent.FLIGHT_UPGRADE_REQUEST,
        entities: {
          cabin: 'BUSINESS',
        },
        actions: [
          {
            type: ActionType.BUSINESS_CLASS_UPGRADE,
            parameters: {
              cabin: 'BUSINESS',
            },
          },
        ],
        missingInformation: ['pnr'],
      };
    }

    // TEST CASE: Simple refund
    if (message.includes('refund') && !message.includes('upgrade')) {
      return {
        intent: CustomerIntent.REFUND_REQUEST,
        entities: {
          pnr: null,
        },
        actions: [
          {
            type: ActionType.FULL_REFUND,
            parameters: {},
          },
        ],
        missingInformation: ['pnr'],
      };
    }

    // TEST CASE: Ambiguous request
    if (message.includes('change') && message.includes('flight')) {
      return {
        intent: CustomerIntent.REBOOKING_REQUEST,
        entities: {},
        actions: [
          {
            type: ActionType.REBOOK_FLIGHT,
            parameters: {},
          },
        ],
        missingInformation: ['pnr', 'preferredFlightOrDate'],
      };
    }

    // DEFAULT: Unknown intent
    return {
      intent: CustomerIntent.UNKNOWN,
      entities: {},
      actions: [],
      missingInformation: ['clarification'],
    };
  }
}
