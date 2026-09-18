# Airline Resolution Backend API Documentation

## Overview

Complete REST API for the airline customer-facing resolution agent system. All endpoints return JSON responses with standardized structure.

## Base URL

```
http://localhost:5000/api
```

## Authentication

No authentication required for this prototype phase.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400
  }
}
```

## Endpoints

### 1. Main Chat Endpoint

**POST** `/agent/chat`

Main entry point for customer messages. Processes message, evaluates policies, executes actions/escalations, and returns case snapshot.

#### Request Body
```json
{
  "conversationId": 123,  // optional - omit to start new conversation
  "message": "My flight SK-204 was cancelled"
}
```

#### Response (Success)
```json
{
  "success": true,
  "data": {
    "conversationId": 123,
    "message": {
      "role": "ASSISTANT",
      "content": "I see your flight was cancelled. I've processed your full refund..."
    },
    "case": {
      "conversationId": 123,
      "status": "ACTIVE",
      "customer": {
        "id": 1,
        "name": "Priya Sharma",
        "loyaltyTier": "Gold"
      },
      "booking": {
        "id": 1,
        "pnr": "SK4821X",
        "flightNumber": "SK-204",
        "status": "CANCELLED"
      },
      "pendingInformation": [],
      "actions": [
        {
          "actionId": "ACT-001",
          "actionType": "FULL_REFUND",
          "status": "EXECUTED",
          "createdAt": "2026-09-18T12:00:00Z"
        }
      ],
      "escalations": [],
      "recentMessages": [ ],
      "auditTimeline": [ ]
    }
  }
}
```

#### Response (Error - Customer Not Found)
```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Unable to identify customer from booking information",
    "statusCode": 400
  }
}
```

#### Response (Error - Validation)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request format",
    "statusCode": 400,
    "details": [ ]
  }
}
```

#### Flow
1. Validate request body
2. Load existing conversation (if conversationId provided) or create new
3. Save customer message
4. Call LLM to understand intent and extract entities
5. Identify customer and booking from PNR
6. Execute orchestrator for each requested action
7. Generate customer-facing response
8. Save assistant message
9. Return case snapshot with all context

#### Policy Decisions Handled
- **ALLOWED** → Action executes, customer receives success message
- **ESCALATE** → Action escalates to supervisor, customer notified
- **DENIED_BY_POLICY** → Action blocked by policy, customer receives explanation
- **NEEDS_INFORMATION** → More information required, customer asked for details
- **UNSUPPORTED** → Action not supported, customer directed to support team

#### Example Responses by Scenario

**Refund Allowed:**
```
"I have processed your full refund. You should see it in 7-10 business days."
```

**Upgrade Escalated (₹2,000 > ₹1,500 limit):**
```
"Your request requires supervisor approval. I have escalated it for review and you will hear from our team shortly. Reference: ESC-001"
```

**Hotel Denied (4h delay < 5h minimum):**
```
"I'm sorry, but your hotel accommodation request doesn't qualify under our current policies. Accommodation is provided for delays exceeding 5 hours."
```

---

### 2. Get Conversation

**GET** `/conversations/:conversationId`

Retrieve complete case snapshot for a conversation.

#### Response
```json
{
  "success": true,
  "data": {
    "conversationId": 123,
    "status": "ACTIVE",
    "customer": { },
    "booking": { },
    "pendingInformation": [],
    "actions": [],
    "escalations": [],
    "recentMessages": [],
    "auditTimeline": [],
    "createdAt": "2026-09-18T10:00:00Z",
    "updatedAt": "2026-09-18T12:00:00Z"
  }
}
```

#### Status Codes
- **200** - Success
- **404** - Conversation not found
- **400** - Invalid conversation ID

---

### 3. Get Messages

**GET** `/conversations/:conversationId/messages`

Retrieve all messages in a conversation.

#### Response
```json
{
  "success": true,
  "data": {
    "conversationId": 123,
    "messages": [
      {
        "messageId": 1,
        "role": "USER",
        "content": "My flight was cancelled",
        "timestamp": "2026-09-18T12:00:00Z"
      },
      {
        "messageId": 2,
        "role": "ASSISTANT",
        "content": "I can help with that...",
        "timestamp": "2026-09-18T12:00:05Z"
      }
    ],
    "count": 2
  }
}
```

---

### 4. Get Actions

**GET** `/conversations/:conversationId/actions`

Retrieve all actions related to a conversation.

#### Response
```json
{
  "success": true,
  "data": {
    "conversationId": 123,
    "actions": [
      {
        "actionId": "ACT-001",
        "actionType": "FULL_REFUND",
        "status": "EXECUTED",
        "policyDecision": "ALLOWED",
        "createdAt": "2026-09-18T12:00:00Z",
        "updatedAt": "2026-09-18T12:00:00Z"
      }
    ],
    "count": 1
  }
}
```

#### Action Types
- `FULL_REFUND` - Full ticket refund
- `PARTIAL_REFUND` - Partial ticket refund
- `HOTEL_ACCOMMODATION` - Hotel booking
- `MEAL_VOUCHER` - Meal voucher
- `LOUNGE_ACCESS` - Airport lounge access
- `REBOOK_FLIGHT` - Rebook on alternative flight
- `HIGHER_FARE_REBOOK` - Upgrade to higher-fare flight
- `BUSINESS_CLASS_UPGRADE` - Business class upgrade

#### Action Statuses
- `REQUESTED` - Action requested but not yet evaluated
- `EXECUTED` - Action successfully executed
- `ESCALATED` - Action escalated for supervisor approval
- `DENIED` - Action denied by policy
- `FAILED` - Action failed to execute

---

### 5. Get Escalations

**GET** `/conversations/:conversationId/escalations`

Retrieve all escalations related to a conversation.

#### Response
```json
{
  "success": true,
  "data": {
    "conversationId": 123,
    "escalations": [
      {
        "escalationId": "ESC-001",
        "reasonCode": "AMOUNT_EXCEEDS_AUTHORITY",
        "priority": "HIGH",
        "status": "OPEN",
        "summary": "₹2,000 fare difference exceeds agent limit",
        "createdAt": "2026-09-18T12:00:00Z",
        "resolvedAt": null
      }
    ],
    "count": 1
  }
}
```

#### Reason Codes
- `AMOUNT_EXCEEDS_AUTHORITY` - Amount exceeds agent approval limit
- `POLICY_VIOLATION` - Request violates policy
- `MISSING_INFORMATION` - Required information not provided
- `UNSUPPORTED_ACTION` - Action not supported by system

#### Escalation Statuses
- `OPEN` - Escalation waiting for supervisor
- `IN_REVIEW` - Supervisor reviewing
- `RESOLVED` - Escalation resolved

---

### 6. Get Audit Trail

**GET** `/conversations/:conversationId/audit`

Retrieve audit trail of all events in conversation.

#### Response
```json
{
  "success": true,
  "data": {
    "conversationId": 123,
    "events": [
      {
        "eventId": "EVT-001",
        "eventType": "POLICY_DECISION",
        "actor": "SYSTEM",
        "timestamp": "2026-09-18T12:00:00Z",
        "metadata": {
          "actionType": "FULL_REFUND",
          "decision": "ALLOWED",
          "reason": "Flight cancelled - customer entitled to refund"
        }
      },
      {
        "eventId": "EVT-002",
        "eventType": "ACTION_EXECUTION",
        "actor": "SYSTEM",
        "timestamp": "2026-09-18T12:00:01Z",
        "metadata": {
          "actionType": "FULL_REFUND",
          "actionId": "ACT-001",
          "status": "EXECUTED"
        }
      }
    ],
    "count": 2
  }
}
```

#### Event Types
- `MESSAGE_RECEIVED` - Customer message received
- `CONVERSATION_CREATED` - New conversation started
- `POLICY_DECISION` - Policy evaluated
- `ACTION_EVALUATED` - Action reviewed
- `ACTION_EXECUTION` - Action executed
- `ACTION_ESCALATED` - Action escalated
- `ESCALATION_CREATED` - Escalation created
- `DUPLICATE_ACTION_BLOCKED` - Duplicate action prevented
- `CONVERSATION_STATUS_CHANGED` - Status updated

---

### 7. Health Check

**GET** `/health`

Check API health and readiness.

#### Response
```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
}
```

#### Status Codes
- **200** - API healthy
- **503** - API unavailable

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request format |
| CUSTOMER_NOT_FOUND | 400 | Customer cannot be identified |
| CONVERSATION_NOT_FOUND | 404 | Conversation does not exist |
| LLM_AUTH_ERROR | 503 | LLM service not configured |
| LLM_RATE_LIMIT | 429 | Too many LLM requests |
| LLM_ERROR | 500 | LLM processing failed |

---

## Quick Start Examples

### Create New Conversation
```bash
curl -X POST http://localhost:5000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"My flight SK-204 was cancelled"}'
```

### Continue Conversation
```bash
curl -X POST http://localhost:5000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId":123,"message":"I want a full refund"}'
```

### Get Case Status
```bash
curl http://localhost:5000/api/conversations/123
```

### Get Audit Trail
```bash
curl http://localhost:5000/api/conversations/123/audit
```

---

## Data Persistence

- All data stored in JSON files (`backend/data/`)
- No database required
- Survives server restart
- Reset with: `npm run reset-data`

---

## Rate Limits

- No hard rate limits in prototype
- LLM provider may have built-in rate limits

---

## CORS

- Configured to accept requests from `http://localhost:5173` (React dev server)
- Configurable via `FRONTEND_URL` environment variable

---

## Example Flow: Priya Refund

**Turn 1 - Problem Statement**
```bash
curl -X POST http://localhost:5000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"My flight SK-204 was cancelled"}'
```

Returns: `{"conversationId": 123, "message": {"role": "ASSISTANT", "content": "I see..."}}`

**Turn 2 - Action Request**
```bash
curl -X POST http://localhost:5000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"conversationId":123,"message":"I want a full refund"}'
```

Returns: Case with executed refund action and success message

**Turn 3 - Follow-up**
```bash
curl http://localhost:5000/api/conversations/123
```

Returns: Complete case snapshot with all history
