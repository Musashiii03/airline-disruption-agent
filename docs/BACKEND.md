# Airline Resolution Agent - Backend Foundation

## Overview

This is a clean, layered backend designed for implementing an agentic airline customer resolution system. The foundation is ready for implementing the agent orchestrator, policy engine, and chat API in subsequent phases.

## Architecture

```
Frontend (React)
    ↓
Express API
    ↓
Controllers (HTTP handlers)
    ↓
Services (Business logic)
    ↓
Repositories (Data access abstraction)
    ↓
JsonStore (Persistence layer)
    ↓
JSON Files
```

## Key Features

- ✓ JSON-backed persistence (no database server required)
- ✓ Clean service/repository separation
- ✓ Type-safe with full TypeScript
- ✓ Validation with Zod schemas
- ✓ Structured error handling
- ✓ Request logging
- ✓ Basic test suite for repositories
- ✓ Assignment data pre-loaded (3 customers, policies)
- ✗ No MySQL/PostgreSQL/database remnants

## Project Structure

```
backend/
├── src/
│   ├── agent/              # Agent orchestrator (future)
│   ├── controllers/        # HTTP request handlers
│   │   ├── booking.controller.ts
│   │   ├── customer.controller.ts
│   │   └── conversation.controller.ts
│   ├── routes/
│   │   ├── health.ts
│   │   ├── booking.ts
│   │   ├── customer.ts
│   │   ├── conversation.ts
│   │   └── index.ts
│   ├── services/          # Business logic
│   │   ├── action.service.ts
│   │   ├── audit.service.ts
│   │   ├── booking.service.ts
│   │   ├── conversation.service.ts
│   │   ├── customer.service.ts
│   │   ├── escalation.service.ts
│   │   └── policy.service.ts
│   ├── repositories/      # Data access
│   │   ├── action.repository.ts
│   │   ├── audit.repository.ts
│   │   ├── booking.repository.ts
│   │   ├── conversation.repository.ts
│   │   ├── customer.repository.ts
│   │   ├── escalation.repository.ts
│   │   ├── policy.repository.ts
│   │   ├── *.test.ts      # Basic tests
│   ├── data/
│   │   ├── json-store.ts  # Generic JSON persistence utility
│   │   ├── types.ts       # Domain types
│   │   └── init.ts        # Data initialization
│   ├── policy/
│   │   └── policy-engine.ts # Deterministic policy evaluation
│   ├── llm/               # LLM abstraction (future)
│   ├── tools/             # Agent tools (future)
│   ├── schemas/           # Zod validation
│   │   └── chat.schema.ts
│   ├── middleware/
│   │   ├── error.ts       # Error handling
│   │   └── logger.ts      # Request logging
│   ├── config/
│   │   ├── env.ts         # Environment config
│   ├── types/
│   │   └── common.ts
│   ├── app.ts             # Express setup
│   └── server.ts          # Entry point
├── data/
│   ├── seed/              # Immutable assignment data
│   │   ├── customers.json
│   │   ├── bookings.json
│   │   ├── booking-segments.json
│   │   ├── policies.json
│   │   └── policy-rules.json
│   └── *.json             # Runtime data (auto-initialized)
├── scripts/
│   └── reset-data.ts      # Reset to seed state
└── package.json
```

## Data Layer

### Persistence

Uses `JsonStore<T>` - a generic JSON file-based store that:
- Reads/writes JSON files with proper error handling
- Maintains simple in-memory caching
- Works with any serializable TypeScript interface
- Creates files/directories as needed

### Data Files

**Seed Data** (`data/seed/`) - Immutable assignment data:
- `customers.json` - Priya Nair, Arvind Kulkarni, Meher Kaur
- `bookings.json` - Their flight bookings
- `booking-segments.json` - Flight details with delays/cancellations
- `policies.json` - 5 assignment policies
- `policy-rules.json` - Policy evaluation rules

**Runtime Data** (`data/`) - Created on server start from seed:
- `customers.json`, `bookings.json`, `booking-segments.json` - Copied from seed
- `policies.json`, `policy-rules.json` - Copied from seed
- `conversations.json` - Empty, grows with customer interactions
- `messages.json` - Empty, grows with messages
- `actions.json` - Empty, grows with agent actions
- `escalations.json` - Empty, grows with escalations
- `audit-events.json` - Empty, grows with audit trail
- `action-policy-references.json` - Empty, links actions to policies

## API Endpoints

### Health Check
```
GET /health
→ { "status": "ok" }
```

### Customers
```
GET /api/customers/:pnr          → Get customer by PNR
GET /api/customers                → Get all customers
```

### Bookings
```
GET /api/bookings/:pnr            → Get booking with segments by PNR
GET /api/bookings                 → Get all bookings
```

### Conversations
```
GET /api/conversations/:id        → Get conversation with messages
GET /api/conversations/:id/audit  → Get audit trail for conversation
```

## Running the Backend

### Start Development Server
```bash
cd backend
npm install
npm run dev
```

Server runs on `http://localhost:5000`

### Build
```bash
npm run build
```

Outputs TypeScript to `dist/`

### Run Tests
```bash
npm run test
```

Tests verify:
- ✓ All 3 customers can be found by PNR
- ✓ All bookings load with segments
- ✓ Delay hours are correctly loaded (Arvind: 4h, Meher: 6h)
- ✓ Flight cancellations are marked (Priya: SK-204)
- ✓ Policies load and categorize correctly
- ✓ Policy rules retrieve successfully

### Reset Data
```bash
npm run reset-data
```

Clears all runtime data and reloads from seed. Useful for demo resets.

## Environment Variables

See `.env.example`:

```
PORT=5000
NODE_ENV=development
DATA_DIR=./data
GEMINI_API_KEY=your_key_here
LLM_MODEL=gemini-pro
LLM_PROVIDER=mock
API_BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

## Services Layer

Each service provides business logic operations:

- **CustomerService** - Customer lookup and management
- **BookingService** - Booking retrieval with segments
- **PolicyService** - Policy and rule retrieval
- **ConversationService** - Conversation CRUD and messaging
- **ActionService** - Action creation and updates
- **EscalationService** - Escalation workflow
- **AuditService** - Audit event logging

Services depend on repositories, not JSON files directly.

## Policy Engine

**Location**: `src/policy/policy-engine.ts`

Current capabilities:
- ✓ Refund eligibility for cancelled flights
- ✓ Delay compensation thresholds (3h, 5h)
- ✓ Fare difference approval (₹1,500 agent limit)
- ✓ Business-class upgrade evaluation (not in supplied policies)

**Critical**: The LLM cannot override policy decisions. The policy engine is authoritative.

## Error Handling

All API errors return structured JSON:

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Customer with PNR XYZ not found",
    "statusCode": 404,
    "details": {}
  }
}
```

Error codes:
- `INVALID_REQUEST` - Bad input (400)
- `CUSTOMER_NOT_FOUND` - Customer lookup failed (404)
- `BOOKING_NOT_FOUND` - Booking lookup failed (404)
- `CONVERSATION_NOT_FOUND` - Conversation lookup failed (404)
- `VALIDATION_ERROR` - Zod schema validation failed (400)
- `INTERNAL_SERVER_ERROR` - Unexpected error (500)

## Logging

Request logging via middleware shows:
- HTTP method and path
- Response status code
- Response time in milliseconds

Example output:
```
[2026-09-18T14:32:15.123Z] [INFO] GET /api/customers/SK4821X {"status": 200, "duration": "45ms"}
```

Log levels controlled by `LOG_LEVEL` env var.

## Testing Strategy

Tests focus on repository layer correctness:

**CustomerRepository** (`customer.repository.test.ts`)
- Loads Priya (SK4821X, Gold tier)
- Loads Arvind (TR1190B, Silver tier)
- Loads Meher (WL7742, Platinum tier)
- Returns null for non-existent customer
- Retrieves all customers

**BookingRepository** (`booking.repository.test.ts`)
- Loads cancelled booking (Priya, SK-204)
- Loads delayed booking (Meher, SK-305, 6h delay)
- Includes segments with delay details
- Returns null for non-existent booking

**PolicyRepository** (`policy.repository.test.ts`)
- Finds policies by code
- Retrieves active policies only
- Categories work (cancellation, delay, fare_difference, etc.)
- Rules retrieve for policies
- Relevant policies filter by status

Run with `npm run test`

## JSON vs Database

This backend uses JSON for rapid prototyping because:

1. **No infrastructure setup** - Runs immediately without database server
2. **Human-readable** - Useful for debugging and demos
3. **Version control friendly** - Seed data is textual
4. **Replaceable** - Repository interfaces allow MySQL/PostgreSQL replacement later

The architecture isolates persistence in repositories. Swapping `JsonStore` for a database driver requires only repository changes.

## Next Implementation Phases

### Phase 4: Agent Orchestrator
- Conversation state management
- Intent detection flow
- Tool coordination
- Policy evaluation integration

### Phase 5: Tools
- CustomerTool - Customer lookup
- BookingTool - Booking retrieval
- PolicyTool - Policy retrieval
- ActionTool - Action creation

### Phase 6: LLM Integration
- Prompt engineering
- Intent extraction
- Response generation
- Tool calling

### Phase 7: Chat API
- POST /api/chat - Main chat endpoint
- Conversation history
- Multi-action decomposition

### Phase 8: Frontend Integration
- React chat interface
- Real API connection
- Demo scenarios

## Verification Checklist

- ✓ No MySQL/PostgreSQL/database server required
- ✓ All dependencies in package.json are non-database
- ✓ JSON files created and populated at startup
- ✓ Services use repositories, not direct file access
- ✓ Repositories use JsonStore abstraction
- ✓ TypeScript compiles without errors
- ✓ All 3 assignment scenarios in seed data
- ✓ Tests pass (customer, booking, policy repositories)
- ✓ Server starts cleanly on `npm run dev`
- ✓ Health endpoint responds
- ✓ API endpoints return proper structure
- ✓ Error handling returns clean JSON
- ✓ Request logging works
- ✓ Reset script works

## Current Limitations (By Design)

- No agent orchestrator (yet)
- No chat endpoint (yet)
- No intent detection (yet)
- No tool calling (yet)
- No complete policy evaluation (yet)
- No escalation workflow (yet)
- No audit trail recording (yet)

These will be implemented in future phases building on this foundation.

## Summary

This backend foundation provides:
- Clean separation of concerns
- Type-safe persistence
- JSON-based data storage
- Testable repository layer
- Ready-to-use services
- Basic policy engine
- Error handling and logging
- No database infrastructure needed

It's ready for implementing the agent orchestrator and chat workflow in the next phase.
