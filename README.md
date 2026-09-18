# Airline Customer Resolution Agent

A customer-facing support chat application powered by an intelligent agent that uses deterministic policy evaluation to resolve flight disruptions (cancellations, delays, upgrades).

## Architecture

```
Frontend (React + TypeScript)
    ↓
Express API (Backend)
    ↓
Agent Orchestrator
    ↓
LLM (Gemini) / Policy Engine / Action Service / Escalation Service
    ↓
Repositories (Service Layer)
    ↓
JsonStore (JSON Persistence)
    ↓
JSON Files (data/)
```

## Key Features

- **Customer Support Chat** - Real-time conversation interface for flight disruption resolution
- **Deterministic Policies** - Policy engine makes authoritative decisions; LLM cannot override
- **Action Execution** - Prototype action handlers for refunds, hotel, rebooking, upgrades
- **Escalation Management** - Automatic escalation when actions exceed agent approval authority
- **Conversation State** - Multi-turn conversations with context retention
- **Audit Trail** - Complete event log of all policy decisions and actions
- **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript 5.3+
- **LLM**: Google Gemini (generative AI)
- **Persistence**: JSON files (JsonStore)
- **Testing**: Vitest with 124 tests

### Frontend
- **Framework**: React 18
- **Language**: TypeScript 5.3+
- **Styling**: Tailwind CSS 3.3+
- **Build**: Vite 5
- **HTTP**: Fetch API with centralized service

## Prerequisites

- Node.js 18+
- npm 9+
- Google Gemini API key (optional - defaults to mock provider)

## Setup

### 1. Clone and Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend** (backend/.env):
```
PORT=5000
NODE_ENV=development
DATA_DIR=./data
GEMINI_API_KEY=<your-api-key>  # Optional, leave empty for mock provider
GEMINI_MODEL=gemini-2.0-flash
LLM_PROVIDER=mock              # Use 'mock' or 'gemini'
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=info
```

**Frontend** (frontend/.env):
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Reset Demo Data (Optional)

Restores the database to seed state:

```bash
cd backend
npm run reset-data
```

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`

### Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:5173`

### Build for Production

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

## Testing

### Run All Tests

```bash
cd backend
npm test
```

**Result**: 124 tests passing

### Run Specific Tests

```bash
cd backend
npm test -- policy-engine.test.ts
npm test -- orchestrator.service.test.ts
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Health check |
| POST | `/api/agent/chat` | Send customer message, get agent response |
| GET | `/api/conversations/:id` | Get conversation case snapshot |
| GET | `/api/conversations/:id/messages` | Get all messages in conversation |
| GET | `/api/conversations/:id/actions` | Get all actions taken |
| GET | `/api/conversations/:id/escalations` | Get all escalations |
| GET | `/api/conversations/:id/audit` | Get audit trail |

**Request Example** (Send message to agent):

```bash
curl -X POST http://localhost:5000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "My flight SK-204 was cancelled and I want a refund."
  }'
```

## Assignment Scenarios

The application supports three primary test scenarios:

### Scenario 1: Priya - Cancellation + Refund

- **Customer**: Priya Sharma
- **PNR**: SK4821X
- **Booking Status**: CANCELLED
- **Flow**:
  1. "My flight SK-204 was cancelled."
  2. "I want a full cash refund."
- **Expected Result**: Refund is ALLOWED and executed (policy permits refunds for cancelled flights)

### Scenario 2: Arvind - Delay + Assistance

- **Customer**: Arvind Kulkarni
- **PNR**: TR1190B
- **Booking Status**: DELAYED (4 hours)
- **Flow**:
  1. "My flight SK-118 is delayed."
  2. "It's delayed by 4 hours and I need help because of my meeting."
- **Expected Result**: Policy evaluated; assistance provided based on delay duration and policy rules

### Scenario 3: Meher - Delay + Higher-Fare Request (ESCALATION)

- **Customer**: Meher Kaur
- **PNR**: WL7742
- **Booking Status**: DELAYED (6 hours)
- **Flow**:
  1. "My flight SK-305 is delayed by 6 hours."
  2. "I want a higher-fare flight. The fare difference is ₹2,000."
- **Expected Result**: 
  - ✅ Fare difference ₹2,000 EXCEEDS agent approval limit (₹1,500)
  - ✅ Policy decision: ESCALATE (not ALLOWED)
  - ✅ No upgrade execution
  - ✅ Escalation created
  - ✅ UI shows "Supervisor approval required"

## Important: Prototype Limitations

⚠️ **This is a prototype demonstration. The following are NOT real airline integrations:**

- ✋ **Action Execution**: Actions (refunds, hotels, rebooking) are recorded in prototype mode only. No actual payments, bookings, or hotel reservations are made.
- ✋ **Escalation**: Escalations are recorded but do not route to real supervisors. This is a mock escalation workflow.
- ✋ **External Systems**: No integration with actual airline booking systems, payment processors, or hotel chains.
- ✋ **Data Persistence**: Data is stored in JSON files (development only). No database is used.

The prototype demonstrates the **policy engine, agent orchestration, and conversation flow** in a safe, demonstrable way.

## Project Structure

```
airline_resolution_architechture/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app setup
│   │   ├── server.ts              # Server startup
│   │   ├── controllers/           # HTTP request handlers
│   │   ├── routes/                # Express routes
│   │   ├── services/              # Business logic
│   │   │   ├── orchestrator.service.ts
│   │   │   ├── policy.service.ts
│   │   │   ├── action.service.ts
│   │   │   ├── escalation.service.ts
│   │   │   └── ...
│   │   ├── policy/                # Policy engine
│   │   ├── llm/                   # LLM provider (Gemini)
│   │   ├── repositories/          # Data access layer
│   │   ├── data/                  # JSON persistence
│   │   │   ├── json-store.ts
│   │   │   ├── types.ts
│   │   │   └── init.ts
│   │   ├── tools/                 # Agent tools (controlled access)
│   │   └── middleware/            # Express middleware
│   ├── data/                      # JSON data files
│   │   └── seed/                  # Seed data for demo
│   ├── tests/                     # Test files
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/                 # Page components
│   │   ├── components/            # React components
│   │   │   ├── Chat/              # Chat interface
│   │   │   └── Case/              # Case information panel
│   │   ├── hooks/                 # React hooks
│   │   │   └── useChat.ts
│   │   ├── services/              # API service
│   │   │   └── api.ts
│   │   ├── types/                 # TypeScript types
│   │   └── index.css              # Tailwind styles
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── .gitignore
├── README.md
└── PROMPT.md                      # Original assignment prompts
```

## How It Works

### 1. Customer Sends Message
```
Frontend → POST /api/agent/chat
```

### 2. Agent Understands Intent
```
Backend LLM → Extracts: action type, entities, amounts
```

### 3. Policy Engine Decides
```
PolicyEngine → Evaluates action against deterministic policies
Decision: ALLOWED | ESCALATE | DENIED_BY_POLICY | NEEDS_INFORMATION | UNSUPPORTED
```

### 4. Action Execution or Escalation
```
IF decision = ALLOWED:
  → ActionService executes action
ELSE:
  → EscalationService creates escalation record
```

### 5. Response to Customer
```
Backend → Generates customer-facing response
Frontend → Displays result + case information
```

## Security

- ✅ **API keys not exposed**: Gemini API key stored in `.env` (not in frontend)
- ✅ **LLM cannot authorize**: Policy engine is authoritative for decisions
- ✅ **No database secrets**: JSON-only storage, no database credentials
- ✅ **Type safety**: TypeScript strict mode enforced throughout
- ✅ **CORS configured**: Frontend origin validated
- ✅ **Input validation**: Zod schema validation on all endpoints

## Known Limitations

1. **Single-user prototype**: No authentication or multi-user support
2. **JSON storage**: Not suitable for production at scale
3. **Mock LLM by default**: Uses deterministic mock provider unless Gemini key configured
4. **In-memory during runtime**: Session data in memory (persisted to JSON between runs)
5. **No database**: All data in JSON files in `backend/data/`

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Use different port
PORT=5001 npm run dev
```

### Frontend API connection fails
```bash
# Check VITE_API_BASE_URL environment variable
echo $env:VITE_API_BASE_URL

# Should be: http://localhost:5000/api
```

### Gemini API errors
```bash
# Use mock provider instead (default)
LLM_PROVIDER=mock npm run dev

# Or configure real API key:
GEMINI_API_KEY=<your-key> LLM_PROVIDER=gemini npm run dev
```

### Reset demo data
```bash
cd backend
npm run reset-data
```

## Testing the Application

### Manual E2E Test
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173`
4. Try one of the demo scenarios:
   - Priya: "My flight SK-204 was cancelled. I want a refund."
   - Arvind: "My flight SK-118 is delayed by 4 hours."
   - Meher: "My flight SK-305 is delayed 6 hours. I need a ₹2,000 higher-fare flight."

### Automated Tests
```bash
cd backend
npm test
```

Expected: All 124 tests pass ✅

## Documentation

- **API_DOCUMENTATION.md**: Detailed API reference with examples
- **QUICK_START.md**: Quick test scenarios with curl commands
- **PROMPT.md**: Original assignment prompts

## Contributing

This is a job assignment submission. No external contributions are expected.

## License

Internal use only.

## Support

For questions about this assignment, refer to:
1. PROMPT.md - Original requirements
2. API_DOCUMENTATION.md - API details
3. QUICK_START.md - Test scenarios
4. Backend test files - Implementation examples
