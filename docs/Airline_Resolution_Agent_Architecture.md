# Assignment 3 --- Customer-Facing Resolution Agent

## Airline Disruption --- Complete Architecture & Process Flow

> **Purpose of this document:** This is the implementation blueprint for
> the job-entry assignment. It describes the frontend, backend,
> agent/orchestrator, policy enforcement, database, APIs, conversation
> flow, escalation flow, folder structure, data model, and demo
> scenarios.
>
> The assignment is intentionally treated as a **closed-world agent**:
> the agent must use the supplied customer, booking, transaction,
> service-rule, and allowed/prohibited-action data. It must not invent
> airline policies, customer information, compensation, permissions, or
> operational capabilities that are not provided.

------------------------------------------------------------------------

# 1. Executive Summary

The application is a **customer-facing airline disruption resolution
agent**.

It is not just a normal chatbot.

The system combines:

1.  A customer chat interface.
2.  Customer and booking lookup.
3.  A policy/knowledge layer containing the supplied assignment rules.
4.  An LLM used for natural-language understanding and response
    generation.
5.  An orchestrator that controls the complete agent workflow.
6.  Deterministic business-rule validation.
7.  Action execution for allowed operations.
8.  Human escalation for prohibited, risky, ambiguous, or unauthorized
    operations.
9.  Conversation and action audit history.
10. Source/policy references in the response.

The most important architectural principle is:

``` text
                 LLM
                  |
                  | understands language
                  | extracts intent
                  | generates response
                  v
        +-----------------------+
        |      ORCHESTRATOR     |
        |                       |
        | controls the workflow |
        | calls tools           |
        | checks rules          |
        | validates actions     |
        +-----------+-----------+
                    |
       +------------+-------------+
       |            |             |
       v            v             v
 Customer       Booking       Policy/Rules
 Data           Data          Engine
       |            |             |
       +------------+-------------+
                    |
                    v
             Action Decision
              /           \
             /             \
            v               v
        Execute          Escalate
            |               |
            v               v
       Action Record    Ticket Record
```

The LLM should **not** have unrestricted authority.

The orchestrator and deterministic policy layer should decide whether an
action is permitted.

------------------------------------------------------------------------

# 2. Assignment Scope

The supplied assignment is:

> **Assignment 3 --- Customer-Facing Resolution Agent (Airline
> Disruption)**

The general assignment requires a working agent or clickable prototype,
architecture/process flow, inputs/sources/assumptions, AI-tool usage
documentation, a demo and demo video, GitHub repository, and a 10-slide
PPT.

For this specific exercise, the source data contains:

-   Customer profiles.
-   Booking/transaction data.
-   Service rules.
-   Allowed and prohibited agent actions.
-   Sample prior conversations.
-   Three concrete scenarios.

The agent must handle the three scenarios using the supplied data.

------------------------------------------------------------------------

# 3. Product Definition

## 3.1 What the user sees

The customer sees a support-chat application.

The main interaction is:

``` text
Customer
   |
   | types problem
   v
Chat Interface
   |
   v
Resolution Agent
   |
   | asks necessary questions
   | retrieves data
   | checks policies
   | determines action
   v
Resolution / Escalation
```

A small case-information panel can show:

``` text
Customer
PNR
Loyalty Tier
Flight
Route
Disruption Status
Current Case Status
Current Action
```

A source/action panel can optionally show:

``` text
Policy used
Action taken
Escalation reason
Audit timeline
```

The UI does not need to be a complete airline administration system.

------------------------------------------------------------------------

# 4. Core Design Principle

## 4.1 Do not build this

``` text
User -> Gemini -> Answer
```

That is just a chatbot.

## 4.2 Build this

``` text
User
  |
  v
Conversation API
  |
  v
Agent Orchestrator
  |
  +--> Identify customer
  |
  +--> Understand intent
  |
  +--> Retrieve booking
  |
  +--> Retrieve relevant policy
  |
  +--> Determine missing information
  |
  +--> Evaluate requested action
  |
  +--> Apply deterministic rules
  |
  +--> Execute OR escalate
  |
  +--> Save audit record
  |
  +--> Generate grounded response
  |
  v
Customer
```

The LLM is one component of the agent.

The **agent is the complete controlled system**.

------------------------------------------------------------------------

# 5. High-Level Architecture

``` text
+---------------------------------------------------------------+
|                         FRONTEND                              |
|                                                               |
|  +----------------------+     +----------------------------+  |
|  | Customer Chat        |     | Case Information           |  |
|  |                      |     |                            |  |
|  | Messages             |     | Customer                   |  |
|  | Input                |     | PNR                        |  |
|  | Send                 |     | Flight                     |  |
|  | Loading              |     | Status                     |  |
|  +----------+-----------+     | Current Action             |  |
|             |                 +----------------------------+  |
+-------------|-------------------------------------------------+
              |
              | HTTPS / REST
              v
+---------------------------------------------------------------+
|                         BACKEND                               |
|                                                               |
|  API Layer                                                    |
|       |                                                       |
|       v                                                       |
|  Conversation Service                                         |
|       |                                                       |
|       v                                                       |
|  Agent Orchestrator                                           |
|       |                                                       |
|       +----------------+----------------+------------------+  |
|       |                |                |                  |  |
|       v                v                v                  v  |
| Customer Tool     Booking Tool     Policy Tool       Action Tool|
|       |                |                |                  |  |
|       +----------------+----------------+------------------+  |
|                                |                              |
|                                v                              |
|                        Policy/Rule Engine                     |
|                                |                              |
|                    +-----------+-----------+                  |
|                    |                       |                  |
|                    v                       v                  |
|                Execute                  Escalate              |
|                    |                       |                  |
|                    +-----------+-----------+                  |
|                                |                              |
|                                v                              |
|                           Audit Service                        |
+---------------------------------------------------------------+
              |
              +------------------------+
              |                        |
              v                        v
       +-------------+          +-------------+
       | PostgreSQL  |          | LLM API     |
       |             |          | Gemini etc. |
       +-------------+          +-------------+
```

------------------------------------------------------------------------

# 6. Recommended Technology Stack

The exact stack is not prescribed by the assignment. A practical
implementation is:

## Frontend

-   React
-   Vite or Next.js
-   TypeScript
-   Tailwind CSS
-   Fetch/Axios for API communication

## Backend

-   Node.js
-   Express.js
-   TypeScript
-   Zod for request/response validation

## Database

-   MySQL

For a 6-hour assignment, SQLite can also be used if MySQL setup
slows development. The architecture should still separate the
repository/data layer so the database can be replaced.

## LLM

-   Gemini API or another suitable LLM API.

The LLM should be treated as an interchangeable adapter:

``` text
LLMProvider
   |
   +-- GeminiProvider
   |
   +-- OpenAIProvider
   |
   +-- MockProvider
```

The `MockProvider` is useful for deterministic local testing.

## Optional

-   Docker
-   Prisma or Drizzle ORM
-   OpenAPI/Swagger
-   Vitest/Jest
-   Playwright for one or two end-to-end tests

Do not add infrastructure that does not improve the demo.

## Security & Compliance

- **Authentication**: JWT tokens or session-based for customer ID validation
- **Authorization**: Role-based access (CUSTOMER, AGENT, SUPERVISOR)
- **Audit**: Immutable PostgreSQL audit table with customer ID, action, rule, timestamp
- **PII**: No personally identifiable data in logs; phone/email only in direct responses
- **Validation**: Zod schemas for all API inputs
- **Rate Limiting**: Basic rate limit on /chat endpoint
- **HTTPS**: All production endpoints HTTPS-only

------------------------------------------------------------------------

# 7. Agent Architecture

The agent consists of several logical layers.

``` text
                    Agent
                      |
       +--------------+--------------+
       |              |              |
       v              v              v
   Orchestrator     Tools        Guardrails
       |
       +---- LLM Adapter
       |
       +---- Customer Tool
       |
       +---- Booking Tool
       |
       +---- Policy Tool
       |
       +---- Action Tool
       |
       +---- Escalation Tool
       |
       +---- Audit Tool
```

------------------------------------------------------------------------

# 8. Security & Audit Architecture

## 8.1 Authentication Flow
Customer → Booking Reference (SK4821X) → Backend validates → Returns JWT
Customer Message + JWT → Backend verifies ownership → Process


## 8.2 Audit Trail

Every action writes:
- Timestamp
- Customer ID
- Action type (REFUND, REBOOK, ESCALATE, etc.)
- Policy rule applied
- Result (EXECUTED / ESCALATED)
- Reason (if escalated)

## 8.3 Escalation Trigger

Actions that trigger escalation → Create TICKET record:
- ID
- Priority
- Context (sanitized)
- Assigned to queue for human review

# 8. Orchestrator

The orchestrator is the heart of the system.

It controls:

-   conversation state
-   intent
-   tool calls
-   data retrieval
-   policy retrieval
-   missing information
-   action evaluation
-   escalation
-   response generation
-   audit logging

## 8.1 What the orchestrator should NOT do

It should not:

-   invent policies
-   invent customer information
-   decide that a prohibited action is allowed
-   fabricate a booking
-   fabricate a refund
-   claim that a real external airline system was updated if no such
    system exists
-   silently approve exceptions

------------------------------------------------------------------------

# 9. Orchestrator State Machine

A useful implementation is a state machine.

``` text
START
  |
  v
IDENTIFY_CUSTOMER
  |
  v
LOAD_CASE
  |
  v
UNDERSTAND_INTENT
  |
  v
CHECK_REQUIRED_INFORMATION
  |
  +---- missing ----> ASK_FOLLOWUP
  |                       |
  |                       v
  |                 WAIT_FOR_CUSTOMER
  |                       |
  |                       v
  |                UNDERSTAND_INTENT
  |
  v
RETRIEVE_POLICY
  |
  v
EVALUATE_REQUEST
  |
  +---- allowed -------> EXECUTE_ACTION
  |
  +---- prohibited ----> ESCALATE
  |
  +---- ambiguous -----> ESCALATE
  |
  +---- unsupported ----> ESCALATE
  |
  v
RECORD_ACTION
  |
  v
GENERATE_RESPONSE
  |
  v
RETURN_RESPONSE
```

------------------------------------------------------------------------

# 10. Detailed Request Lifecycle

Every customer message should pass through the following stages.

## Step 1 --- Receive message

Frontend sends:

``` json
{
  "conversationId": "optional-existing-id",
  "pnr": "SK4821X",
  "message": "My flight was cancelled and I want a refund."
}
```

Backend validates the request.

------------------------------------------------------------------------

## Step 2 --- Load conversation

If `conversationId` exists:

``` text
GET conversation
GET previous messages
GET previous actions
GET current case state
```

If it does not exist:

``` text
CREATE conversation
```

------------------------------------------------------------------------

## Step 3 --- Identify customer

Use the PNR/customer identifier provided by the UI/session.

Call:

``` text
CustomerRepository.getByPnr(pnr)
```

If no customer exists:

``` text
Do not invent customer data.
Ask for a valid booking reference or escalate.
```

------------------------------------------------------------------------

# 11. Customer Tool

Conceptually:

``` text
getCustomerByPnr(pnr)
```

Returns:

``` json
{
  "name": "Priya Nair",
  "loyaltyTier": "Gold",
  "pnr": "SK4821X",
  "contact": "...",
  "travelHistory": "..."
}
```

The customer tool is read-only.

The LLM cannot modify customer profile information.

------------------------------------------------------------------------

# 12. Booking Tool

Conceptually:

``` text
getBookingByPnr(pnr)
```

Returns:

``` json
{
  "pnr": "SK4821X",
  "flight": "SK-204",
  "route": "Delhi -> Goa",
  "date": "2026-09-23",
  "scheduledDeparture": "18:40",
  "status": "Cancelled",
  "reason": "operational reasons"
}
```

For a PNR containing multiple flights, the booking tool should return
all relevant segments.

------------------------------------------------------------------------

# 13. Intent Detection

The LLM can convert free-form customer text into structured intent.

Example:

Customer:

> "My flight was cancelled and I'm furious. I want my money back."

LLM output:

``` json
{
  "intent": "REFUND_FOR_AIRLINE_CANCELLATION",
  "sentiment": "angry",
  "requestedAction": "refund",
  "requiresFollowUp": false
}
```

The output should be schema-validated.

Do not allow arbitrary free-form LLM output to control backend actions.

------------------------------------------------------------------------

# 14. Intent Categories

A practical set for this assignment:

``` text
CANCELLATION_REBOOK
CANCELLATION_REFUND
DELAY_COMPENSATION
MEAL_VOUCHER
LOUNGE_ACCESS
HOTEL_ACCOMMODATION
HIGHER_FARE_REBOOKING
FARE_DIFFERENCE
FORMAL_COMPLAINT
LEGAL_THREAT
REFUND_METHOD_CHANGE
GENERAL_STATUS
UNKNOWN
```

These categories should map to actual supplied policies/actions.

If the customer asks for something outside the supplied data:

``` text
UNKNOWN / UNSUPPORTED
```

Then ask for clarification or escalate rather than inventing an answer.

------------------------------------------------------------------------

# 15. Follow-Up Question Logic

The agent should ask only necessary questions.

Example:

``` text
Customer:
"I want to change my flight."
```

If the current case already identifies the disrupted flight and the
desired replacement is clear, do not ask unnecessary questions.

If a required decision variable is missing:

``` text
Agent:
"Would you like to rebook on the next available flight or request a refund?"
```

The assignment specifically expects the agent to ask only necessary
questions.

------------------------------------------------------------------------

# 16. Policy Layer

The policy layer is the most important guardrail.

Store the supplied rules as structured policy records.

Example:

``` json
{
  "policyId": "CANCEL_REBOOK_001",
  "name": "Cancellation Rebooking",
  "trigger": {
    "disruption": "cancelled",
    "cause": "airline"
  },
  "allowedActions": [
    "FREE_REBOOK_NEXT_AVAILABLE",
    "FULL_REFUND"
  ]
}
```

Another:

``` json
{
  "policyId": "FARE_DIFF_001",
  "name": "Fare Difference",
  "conditions": {
    "higherFare": true,
    "voluntaryChange": true
  },
  "customerPaysDifference": true,
  "supervisorApprovalThreshold": 1500
}
```

------------------------------------------------------------------------

# 17. Policy Retrieval

Do not send every possible policy to the LLM unnecessarily.

First determine the disruption type:

``` text
Cancelled
Delayed
Other
```

Then retrieve relevant policies.

Example:

``` text
Booking status = Cancelled

Relevant policies:
- Cancellation Rebooking
- Refund Processing
- Loyalty Tier
- Prohibited Actions
```

For delayed flight:

``` text
Booking status = Delayed

Relevant policies:
- Delay Compensation
- Hotel Accommodation
- Loyalty Tier
- Fare Difference
- Prohibited Actions
```

------------------------------------------------------------------------

# 18. Deterministic Policy Engine

The LLM can interpret language, but the backend should enforce rules.

Example:

``` ts
function evaluateFareDifference(amount: number) {
  if (amount > 1500) {
    return {
      decision: "ESCALATE",
      reason: "Fare difference exceeds agent approval threshold."
    };
  }

  return {
    decision: "ALLOWED"
  };
}
```

Another:

``` ts
function evaluateDelay(delayHours: number) {
  if (delayHours > 5) {
    return {
      mealVoucher: true,
      loungeAccess: true,
      hotelAccommodation: true
    };
  }

  if (delayHours > 3) {
    return {
      mealVoucher: true,
      loungeAccess: true,
      hotelAccommodation: false
    };
  }

  return {
    mealVoucher: false,
    loungeAccess: false,
    hotelAccommodation: false
  };
}
```

The exact thresholds and policy behavior must match the supplied
assignment data.

------------------------------------------------------------------------

# 19. Important Rule: LLM Does Not Authorize Actions

Bad:

``` text
LLM:
"Sure, I'll give you a business class upgrade."
```

Good:

``` text
LLM extracts:
customer wants business-class upgrade

        ↓

Orchestrator

        ↓

Policy Engine

        ↓

Is this allowed by supplied policy?

        ↓

NO / not established

        ↓

Do not execute

        ↓

Explain limitation / escalate
```

------------------------------------------------------------------------

# 20. Action Evaluation

Every requested action should be represented as structured data.

``` json
{
  "action": "REBOOK_HIGHER_FARE",
  "requestedFareDifference": 2000,
  "cause": "customer_requested",
  "requiresSupervisor": true
}
```

Then the action evaluator returns:

``` json
{
  "decision": "ESCALATE",
  "reason": "Requested fare difference is above the agent approval threshold."
}
```

------------------------------------------------------------------------

# 21. Action Decision Types

Use explicit values:

``` text
ALLOWED
ESCALATE
NEEDS_INFORMATION
UNSUPPORTED
DENIED_BY_POLICY
```

Do not use vague values such as:

``` text
probably
maybe
seems okay
```

------------------------------------------------------------------------

# 22. Action Execution Layer

Allowed actions should be represented as backend functions.

Examples:

``` text
createRefundRequest()
createRebookingRequest()
issueMealVoucher()
addLoungeAccess()
createHotelAccommodationRequest()
createEscalationTicket()
```

For the prototype, these can write to the database instead of calling
real airline systems.

Example:

``` text
createRefundRequest()
        |
        v
refund_requests table
        |
        v
status = REQUESTED
```

Do not claim that money was actually transferred.

------------------------------------------------------------------------

# 23. Prototype vs Real Airline System

The assignment allows a prototype.

Therefore:

``` text
Prototype Action:
"Refund request created"
```

is different from:

``` text
"Refund completed"
```

The first can be simulated in the database.

The second would require a real airline/payment integration, which is
outside the supplied data.

Use precise language.

------------------------------------------------------------------------

# 24. Escalation Service

The escalation service creates a structured ticket.

Example:

``` json
{
  "conversationId": "conv_123",
  "pnr": "WL7742",
  "reasonCode": "FARE_DIFFERENCE_OVER_LIMIT",
  "summary": "Customer requested a higher-fare flight with ₹2,000 fare difference.",
  "priority": "HIGH",
  "status": "OPEN"
}
```

------------------------------------------------------------------------

# 25. Escalation Reasons

Use explicit reason codes:

``` text
POLICY_EXCEPTION
FARE_DIFFERENCE_OVER_LIMIT
LEGAL_OR_FORMAL_COMPLAINT
THREAT_OR_ABUSE
MISSING_AUTHORITY
UNKNOWN_REQUEST
INSUFFICIENT_INFORMATION
UNSUPPORTED_OPERATION
```

Only use categories supported by the assignment.

------------------------------------------------------------------------

# 26. Response Generation

After action evaluation/execution, the LLM can generate a
customer-friendly response.

The response generator should receive:

``` text
Customer data
Booking data
Relevant policy facts
Action result
Escalation result
Conversation context
```

It should NOT be given permission to override the action result.

Example internal context:

``` json
{
  "decision": "ESCALATE",
  "action": "REBOOK_HIGHER_FARE",
  "reason": "Fare difference exceeds threshold",
  "customerName": "Meher Kaur"
}
```

The response generator turns that into natural language.

------------------------------------------------------------------------

# 27. Source Attribution

Every policy-grounded response should identify its source.

Example UI:

``` text
Source used:
Cancellation Rebooking Rule
Refund Processing Rule
```

Or:

``` text
Policy source:
Delay Compensation Rule
```

Database action:

``` json
{
  "policyIds": [
    "DELAY_COMP_001"
  ]
}
```

This satisfies the requirement that the agent show the source used for
its answer.

------------------------------------------------------------------------

# 28. Audit Trail

Every important step should be recorded.

Example:

``` text
09:41:02 Customer message received
09:41:02 Customer identified: PNR SK4821X
09:41:02 Booking retrieved: SK-204
09:41:03 Intent: cancellation refund
09:41:03 Policy retrieved: Refund Processing Rule
09:41:03 Action evaluated: refund
09:41:03 Decision: allowed
09:41:03 Refund request created
09:41:04 Response generated
```

The customer does not necessarily need to see every internal event, but
the system should preserve the audit trail.

------------------------------------------------------------------------

# 29. Complete Request Flow

``` text
1. Customer opens application

2. Customer selects/enters PNR

3. Frontend loads customer and booking summary

4. Customer enters message

5. Frontend sends POST /api/chat

6. Backend validates request

7. Conversation service loads or creates conversation

8. User message is persisted

9. Orchestrator starts

10. Orchestrator identifies customer

11. Orchestrator retrieves customer data

12. Orchestrator retrieves booking data

13. Orchestrator sends relevant context to LLM

14. LLM returns structured intent

15. Backend validates the intent schema

16. Orchestrator determines required information

17. If information is missing:
      a. Generate targeted question
      b. Save assistant message
      c. Return question
      d. Wait for customer

18. If enough information exists:
      a. Retrieve relevant policy
      b. Retrieve allowed/prohibited actions

19. Convert customer request into structured action

20. Policy engine evaluates action

21. If action is allowed:
      a. Execute action
      b. Save action record
      c. Save policy references

22. If action is prohibited:
      a. Do not execute
      b. Create escalation
      c. Save escalation reason
      d. Save policy reference

23. If action is ambiguous:
      a. Ask clarification OR
      b. Escalate if authority is missing

24. Response generator creates grounded response

25. Response is validated

26. Assistant message is persisted

27. Audit events are persisted

28. Backend returns response

29. Frontend displays response

30. Frontend updates case/action status
```

------------------------------------------------------------------------

# 30. Scenario 1 --- Priya Nair

## Data

``` text
Customer:
Priya Nair

Loyalty:
Gold

PNR:
SK4821X

Flight:
SK-204

Route:
Delhi -> Goa

Status:
Cancelled

Cause:
Operational reasons
```

Return flight:

``` text
Goa -> Delhi
Unaffected
```

## Customer request

She is furious and wants:

1.  Full cash refund.
2.  Free business-class upgrade on the return flight.

------------------------------------------------------------------------

## Flow

``` text
Priya
 |
 | "My flight was cancelled..."
 v
Intent Detection
 |
 +--> cancellation
 +--> refund
 +--> higher-class request
 |
 v
Booking Lookup
 |
 v
SK-204 = cancelled
 |
 v
Cancellation Policy
 |
 +--> full refund is available
 |
 v
Refund Action
 |
 v
Allowed
 |
 v
Create Refund Request
```

Then separately:

``` text
Business-class upgrade request
 |
 v
Check supplied rules
 |
 v
Is free upgrade explicitly provided?
 |
 +--> If not established:
          DO NOT INVENT IT
          |
          v
       explain limitation /
       escalate where required
```

The important architecture is that one customer message can contain
**multiple requested actions**.

Therefore the agent should be able to decompose:

``` text
Request
  |
  +--> refund
  |
  +--> upgrade
```

and evaluate them separately.

------------------------------------------------------------------------

# 31. Scenario 2 --- Arvind Kulkarni

## Data

``` text
Customer:
Arvind Kulkarni

Loyalty:
Silver

PNR:
TR1190B

Flight:
SK-118

Route:
Mumbai -> Bengaluru

Delay:
4 hours

New departure:
11:10
```

He asks for hotel accommodation because he has a connecting meeting.

------------------------------------------------------------------------

## Flow

``` text
Customer message
      |
      v
Intent = delay compensation + hotel
      |
      v
Booking lookup
      |
      v
Delay = 4 hours
      |
      v
Delay policy lookup
      |
      v
Evaluate delay threshold
      |
      v
Applicable compensation
      |
      +--> meal voucher
      +--> lounge access where policy applies
      |
      v
Hotel?
      |
      v
Check exact supplied rule
      |
      v
Do not invent a full-night stay
      |
      v
Generate grounded response
```

The customer's personal inconvenience does not automatically create a
new compensation entitlement.

------------------------------------------------------------------------

# 32. Scenario 3 --- Meher Kaur

## Data

``` text
Customer:
Meher Kaur

Loyalty:
Platinum

PNR:
WL7742

Flight:
SK-305

Route:
Delhi -> Hyderabad

Delay:
6 hours

New departure:
20:00
```

She requests:

1.  Full night's hotel stay.
2.  Move to another higher-fare flight.
3.  Fare difference is ₹2,000.

------------------------------------------------------------------------

## Flow

``` text
Customer
 |
 v
Intent extraction
 |
 +--> hotel
 |
 +--> higher-fare rebooking
 |
 +--> fare difference = ₹2,000
 |
 v
Booking lookup
 |
 v
Delay = 6 hours
 |
 v
Delay policy
 |
 +--> hotel accommodation applicable
 |
 +--> meal voucher
 |
 +--> other applicable benefits
 |
 v
Hotel request evaluated
 |
 v
Does policy say full night?
 |
 +--> No / only delayed hours
 |
 v
Do not promise full-night coverage
```

Then:

``` text
Higher-fare flight
 |
 v
Fare difference = ₹2,000
 |
 v
Agent threshold = ₹1,500
 |
 v
₹2,000 > ₹1,500
 |
 v
ESCALATE
 |
 v
Create human-review ticket
```

Platinum priority rebooking can be considered where the supplied loyalty
rule applies, but loyalty status does not create additional compensation
beyond the standard policy.

------------------------------------------------------------------------

# 33. Handling Angry Customers

The LLM can recognize tone:

``` json
{
  "sentiment": "angry"
}
```

The response should:

1.  Acknowledge frustration.
2.  State the verified facts.
3.  State what the agent can do.
4.  State what requires escalation if applicable.
5.  Avoid arguing.
6.  Avoid inventing compensation.

Example structure:

``` text
I understand this disruption is frustrating.

Your booking shows that SK-305 is delayed by 6 hours.

Under the supplied delay policy, the applicable hotel
coverage is based on the delayed period rather than an
automatic full-night stay.

Your requested ₹2,000 higher-fare change exceeds the
agent approval threshold, so I have escalated that request
for human review.
```

The exact wording can be generated by the LLM, but the facts must come
from the backend.

------------------------------------------------------------------------

# 34. Conversation Memory

The agent needs short-term conversation memory.

Example:

``` text
Turn 1:
Customer: My flight is cancelled.

Turn 2:
Agent: I can see SK-204 is cancelled. Would you like a refund
       or rebooking?

Turn 3:
Customer: Refund.

Turn 4:
Agent: ...
```

The agent should not ask:

``` text
Which flight?
```

if the active PNR already establishes the relevant flight.

------------------------------------------------------------------------

# 35. Conversation State

Recommended state:

``` json
{
  "conversationId": "conv_123",
  "pnr": "SK4821X",
  "customerId": "cust_001",
  "activeFlightId": "flight_001",
  "lastIntent": "CANCELLATION_REFUND",
  "pendingQuestion": null,
  "pendingAction": "REFUND",
  "status": "RESOLVING"
}
```

Possible conversation statuses:

``` text
ACTIVE
WAITING_FOR_CUSTOMER
RESOLVED
ESCALATED
CLOSED
```

------------------------------------------------------------------------

# 36. Database Architecture

Use a relational database.

``` text
customers
    |
    +---- bookings
             |
             +---- booking_segments

customers
    |
    +---- conversations
              |
              +---- messages
              |
              +---- actions
              |
              +---- escalations
              |
              +---- audit_events

policies
    |
    +---- policy_versions

actions
    |
    +---- action_policy_references
```

------------------------------------------------------------------------

# 37. Database Tables

## 37.1 customers

``` sql
customers
---------
id
name
loyalty_tier
pnr
contact_email
contact_phone
created_at
updated_at
```

Example:

``` text
id: cust_001
name: Priya Nair
loyalty_tier: Gold
pnr: SK4821X
```

------------------------------------------------------------------------

# 38. bookings

``` sql
bookings
--------
id
pnr
customer_id
status
created_at
updated_at
```

Relationship:

``` text
customer 1 ---- N bookings
```

------------------------------------------------------------------------

# 39. booking_segments

``` sql
booking_segments
----------------
id
booking_id
flight_number
route_from
route_to
flight_date
scheduled_departure
status
disruption_reason
delay_hours
new_departure
created_at
updated_at
```

Example:

``` text
flight_number: SK-204
route_from: Delhi
route_to: Goa
status: CANCELLED
disruption_reason: operational reasons
```

For a delayed flight:

``` text
delay_hours: 6
new_departure: 20:00
```

------------------------------------------------------------------------

# 40. policies

``` sql
policies
--------
id
code
name
category
content
active
created_at
updated_at
```

Examples:

``` text
CANCELLATION_REBOOK
DELAY_COMPENSATION
REFUND_PROCESSING
FARE_DIFFERENCE
LOYALTY_TIER
```

------------------------------------------------------------------------

# 41. policy_rules

If you want more deterministic behavior:

``` sql
policy_rules
------------
id
policy_id
rule_type
condition_json
action_json
priority
active
```

Example:

``` json
condition_json:
{
  "delayHours": {
    "gt": 5
  }
}

action_json:
{
  "mealVoucher": true,
  "hotelAccommodation": true
}
```

This makes rules executable rather than purely textual.

------------------------------------------------------------------------

# 42. conversations

``` sql
conversations
-------------
id
customer_id
pnr
status
created_at
updated_at
```

------------------------------------------------------------------------

# 43. messages

``` sql
messages
--------
id
conversation_id
role
content
intent
created_at
```

Roles:

``` text
USER
ASSISTANT
SYSTEM
TOOL
```

You can store structured intent separately if desired.

------------------------------------------------------------------------

# 44. actions

``` sql
actions
-------
id
conversation_id
customer_id
booking_id
action_type
status
requested_data_json
result_data_json
policy_decision
created_at
updated_at
```

Possible action status:

``` text
REQUESTED
EXECUTED
ESCALATED
DENIED
FAILED
```

------------------------------------------------------------------------

# 45. escalations

``` sql
escalations
-----------
id
conversation_id
customer_id
action_id
reason_code
summary
priority
status
created_at
resolved_at
```

Status:

``` text
OPEN
IN_REVIEW
RESOLVED
```

------------------------------------------------------------------------

# 46. audit_events

``` sql
audit_events
------------
id
conversation_id
event_type
actor
metadata_json
created_at
```

Examples:

``` text
MESSAGE_RECEIVED
CUSTOMER_LOOKUP
BOOKING_LOOKUP
POLICY_RETRIEVED
INTENT_DETECTED
ACTION_EVALUATED
ACTION_EXECUTED
ESCALATION_CREATED
RESPONSE_GENERATED
```

------------------------------------------------------------------------

# 47. action_policy_references

``` sql
action_policy_references
------------------------
action_id
policy_id
```

This gives traceability:

``` text
Action
  |
  +--> Policy A
  +--> Policy B
```

------------------------------------------------------------------------

# 48. Suggested ER Diagram

``` text
CUSTOMERS
   |
   | 1:N
   v
BOOKINGS
   |
   | 1:N
   v
BOOKING_SEGMENTS


CUSTOMERS
   |
   | 1:N
   v
CONVERSATIONS
   |
   +--------1:N--------> MESSAGES
   |
   +--------1:N--------> ACTIONS
   |                       |
   |                       +----N:M---- POLICIES
   |
   +--------1:N--------> ESCALATIONS
   |
   +--------1:N--------> AUDIT_EVENTS
```

------------------------------------------------------------------------

# 49. API Architecture

## POST /api/chat

Main endpoint.

Request:

``` json
{
  "conversationId": "conv_123",
  "pnr": "SK4821X",
  "message": "I want a refund."
}
```

Response:

``` json
{
  "conversationId": "conv_123",
  "message": "Your refund request has been created...",
  "case": {
    "pnr": "SK4821X",
    "status": "CANCELLED"
  },
  "action": {
    "type": "REFUND",
    "status": "REQUESTED"
  },
  "sources": [
    "Refund Processing Rule"
  ]
}
```

------------------------------------------------------------------------

# 50. GET /api/customers/:pnr

Returns:

``` json
{
  "name": "Priya Nair",
  "pnr": "SK4821X",
  "loyaltyTier": "Gold"
}
```

------------------------------------------------------------------------

# 51. GET /api/bookings/:pnr

Returns booking and segment information.

------------------------------------------------------------------------

# 52. GET /api/conversations/:id

Returns:

``` text
conversation
messages
actions
escalations
```

------------------------------------------------------------------------

# 53. GET /api/conversations/:id/audit

Returns audit timeline.

------------------------------------------------------------------------

# 54. POST /api/escalations

Creates a structured escalation.

------------------------------------------------------------------------

# 55. Optional Endpoint: GET /api/policies/:category

Returns the policy information relevant to a category.

------------------------------------------------------------------------

# 56. Backend Folder Structure

Recommended:

``` text
backend/
│
├── src/
│   │
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   └── database.ts
│   │
│   ├── routes/
│   │   ├── chat.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── conversation.routes.ts
│   │   └── escalation.routes.ts
│   │
│   ├── controllers/
│   │   ├── chat.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── conversation.controller.ts
│   │   └── escalation.controller.ts
│   │
│   ├── agent/
│   │   ├── orchestrator.ts
│   │   ├── agent.types.ts
│   │   ├── agent.state.ts
│   │   ├── intent.service.ts
│   │   ├── response.service.ts
│   │   └── prompts/
│   │       ├── intent.prompt.ts
│   │       └── response.prompt.ts
│   │
│   ├── tools/
│   │   ├── customer.tool.ts
│   │   ├── booking.tool.ts
│   │   ├── policy.tool.ts
│   │   ├── action.tool.ts
│   │   └── escalation.tool.ts
│   │
│   ├── policy/
│   │   ├── policy.engine.ts
│   │   ├── policy.types.ts
│   │   ├── cancellation.rules.ts
│   │   ├── delay.rules.ts
│   │   ├── refund.rules.ts
│   │   ├── fare-difference.rules.ts
│   │   └── loyalty.rules.ts
│   │
│   ├── services/
│   │   ├── customer.service.ts
│   │   ├── booking.service.ts
│   │   ├── conversation.service.ts
│   │   ├── action.service.ts
│   │   ├── escalation.service.ts
│   │   └── audit.service.ts
│   │
│   ├── repositories/
│   │   ├── customer.repository.ts
│   │   ├── booking.repository.ts
│   │   ├── policy.repository.ts
│   │   ├── conversation.repository.ts
│   │   ├── action.repository.ts
│   │   └── escalation.repository.ts
│   │
│   ├── llm/
│   │   ├── llm.interface.ts
│   │   ├── gemini.provider.ts
│   │   └── mock.provider.ts
│   │
│   ├── schemas/
│   │   ├── chat.schema.ts
│   │   ├── intent.schema.ts
│   │   └── action.schema.ts
│   │
│   ├── middleware/
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   └── types/
│       └── common.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── tests/
│   ├── policy/
│   ├── agent/
│   └── api/
│
├── .env.example
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 57. Frontend Folder Structure

``` text
frontend/
│
├── src/
│   │
│   ├── App.tsx
│   │
│   ├── pages/
│   │   └── SupportPage.tsx
│   │
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   │
│   │   ├── Case/
│   │   │   ├── CustomerCard.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   ├── CaseStatus.tsx
│   │   │   └── ActionStatus.tsx
│   │   │
│   │   ├── Sources/
│   │   │   └── PolicySources.tsx
│   │   │
│   │   └── Escalation/
│   │       └── EscalationCard.tsx
│   │
│   ├── services/
│   │   └── api.ts
│   │
│   ├── hooks/
│   │   └── useChat.ts
│   │
│   ├── types/
│   │   └── api.ts
│   │
│   └── utils/
│       └── formatting.ts
│
├── public/
│
├── package.json
└── README.md
```

------------------------------------------------------------------------

# 58. Complete Repository Structure

``` text
airline-resolution-agent/
│
├── frontend/
│
├── backend/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── PROCESS_FLOW.md
│   ├── DATABASE.md
│   ├── AGENT.md
│   ├── POLICIES.md
│   └── DEMO_SCRIPT.md
│
├── data/
│   ├── customers.json
│   ├── bookings.json
│   └── policies.json
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

------------------------------------------------------------------------

# 59. LLM Interface

Do not directly import Gemini everywhere.

Create an interface:

``` ts
interface LLMProvider {
  detectIntent(
    input: IntentInput
  ): Promise<IntentResult>;

  generateResponse(
    input: ResponseInput
  ): Promise<string>;
}
```

Then:

``` text
LLMProvider
     |
     +---- GeminiProvider
     |
     +---- MockProvider
```

This gives you:

-   easier testing
-   easier model replacement
-   cleaner architecture
-   no vendor-specific logic throughout the application

------------------------------------------------------------------------

# 60. Intent Schema

Example:

``` ts
type IntentResult = {
  intent:
    | "CANCELLATION_REBOOK"
    | "CANCELLATION_REFUND"
    | "DELAY_COMPENSATION"
    | "HOTEL_ACCOMMODATION"
    | "HIGHER_FARE_REBOOKING"
    | "FARE_DIFFERENCE"
    | "FORMAL_COMPLAINT"
    | "UNKNOWN";

  requestedActions: {
    type: string;
    parameters?: Record<string, unknown>;
  }[];

  missingInformation: string[];

  sentiment?: "neutral" | "confused" | "angry";
};
```

Validate this with Zod.

------------------------------------------------------------------------

# 61. Action Schema

``` ts
type ActionRequest = {
  type:
    | "REFUND"
    | "FREE_REBOOK"
    | "MEAL_VOUCHER"
    | "LOUNGE_ACCESS"
    | "HOTEL_ACCOMMODATION"
    | "HIGHER_FARE_REBOOK"
    | "ESCALATE";

  parameters: Record<string, unknown>;
};
```

------------------------------------------------------------------------

# 62. Policy Decision Schema

``` ts
type PolicyDecision = {
  decision:
    | "ALLOWED"
    | "ESCALATE"
    | "NEEDS_INFORMATION"
    | "UNSUPPORTED"
    | "DENIED_BY_POLICY";

  reason: string;

  policyIds: string[];

  action?: ActionRequest;
};
```

------------------------------------------------------------------------

# 63. Orchestrator Pseudocode

``` text
function handleMessage(request):

    validate(request)

    conversation = loadOrCreateConversation(request)

    saveUserMessage(request.message)

    customer = getCustomer(request.pnr)

    if customer not found:
        return clarification/escalation

    booking = getBooking(request.pnr)

    if booking not found:
        return clarification/escalation

    state = buildAgentState(
        customer,
        booking,
        conversation
    )

    intent = llm.detectIntent(
        currentMessage,
        conversationHistory,
        state
    )

    validateIntent(intent)

    if intent.missingInformation exists:
        question = generateFollowUp(intent)
        saveAssistantMessage(question)
        return question

    policies = policyService.getRelevantPolicies(
        booking,
        intent
    )

    actions = actionPlanner.createActions(
        intent,
        state
    )

    results = []

    for action in actions:

        decision = policyEngine.evaluate(
            action,
            state,
            policies
        )

        saveAudit(decision)

        if decision == ALLOWED:
            result = actionService.execute(action)
            results.push(result)

        else if decision == ESCALATE:
            ticket = escalationService.create(
                action,
                decision.reason
            )
            results.push(ticket)

        else:
            results.push(decision)

    response = llm.generateResponse(
        state,
        policies,
        results
    )

    saveAssistantMessage(response)

    return {
        response,
        actions,
        sources,
        escalation
    }
```

------------------------------------------------------------------------

# 64. Multi-Action Requests

This is important for Priya and Meher.

Do not model every customer message as one action.

Example:

``` text
"I want a refund and a free upgrade."
```

becomes:

``` json
[
  {
    "type": "REFUND"
  },
  {
    "type": "FREE_UPGRADE"
  }
]
```

Then evaluate independently.

This avoids a dangerous situation where one valid request makes the
entire message appear valid.

------------------------------------------------------------------------

# 65. Policy Evaluation Order

Use a predictable order.

``` text
1. Is the request understandable?
2. Is the customer identifiable?
3. Is the booking identifiable?
4. Is the disruption verified?
5. Is the requested operation present in supplied rules?
6. Are all required parameters available?
7. Is the action permitted?
8. Does it exceed an approval threshold?
9. Is escalation required?
10. Execute only if allowed.
```

------------------------------------------------------------------------

# 66. Guardrail Hierarchy

A useful priority hierarchy:

``` text
Highest priority
     |
     v
System constraints
     |
     v
Assignment supplied data
     |
     v
Deterministic business rules
     |
     v
Agent action permissions
     |
     v
Conversation context
     |
     v
LLM interpretation
     |
     v
LLM wording/style
Lowest priority
```

The LLM should never override a higher-level constraint.

------------------------------------------------------------------------

# 67. Prompt Architecture

Do not use one giant prompt.

Use separate prompts.

## Intent prompt

Purpose:

``` text
Convert customer message into structured intent.
Do not make policy decisions.
Do not invent customer or booking data.
```

## Response prompt

Purpose:

``` text
Generate a customer-facing response from verified facts,
policy results, and action results.
Do not introduce new entitlements.
Do not claim an action was completed unless the action
service returned success.
```

------------------------------------------------------------------------

# 68. Grounding Context

The response model should receive something similar to:

``` json
{
  "customer": {
    "name": "Meher Kaur",
    "loyaltyTier": "Platinum"
  },
  "booking": {
    "flight": "SK-305",
    "route": "Delhi -> Hyderabad",
    "status": "Delayed",
    "delayHours": 6
  },
  "policyFacts": [
    "Delay over 5 hours qualifies for hotel accommodation.",
    "Hotel coverage applies to delayed hours, not automatically a full night.",
    "Higher-fare changes above ₹1,500 require supervisor approval."
  ],
  "actionResults": [
    {
      "action": "HOTEL_ACCOMMODATION",
      "status": "REQUESTED"
    },
    {
      "action": "HIGHER_FARE_REBOOK",
      "status": "ESCALATED"
    }
  ]
}
```

Then the LLM generates the answer.

------------------------------------------------------------------------

# 69. Preventing Hallucination

Use several controls.

## Control 1

Only retrieve customer data from database.

## Control 2

Only retrieve policies from supplied policy records.

## Control 3

Use deterministic policy checks.

## Control 4

Use structured LLM output.

## Control 5

Never allow the LLM to directly call arbitrary database queries.

## Control 6

Only expose explicit tools.

## Control 7

Record source policies.

## Control 8

Validate actions before execution.

------------------------------------------------------------------------

# 70. Tool Permissions

The LLM can conceptually access:

``` text
READ:
- get_customer
- get_booking
- get_policy
- get_conversation

WRITE:
- create_refund_request
- create_rebooking_request
- create_voucher
- create_hotel_request
- create_escalation
```

But write tools should internally validate authorization.

For example:

``` text
LLM -> create_refund_request
             |
             v
      Policy validation
             |
       +-----+-----+
       |           |
     ALLOW       DENY
       |           |
       v           v
    execute     reject
```

------------------------------------------------------------------------

# 71. No Direct LLM-to-Database Access

Avoid:

``` text
LLM
 |
 +--> SQL database directly
```

Prefer:

``` text
LLM
 |
 v
Tool
 |
 v
Service
 |
 v
Repository
 |
 v
Database
```

This gives you validation and security boundaries.

------------------------------------------------------------------------

# 72. Error Handling

## LLM unavailable

Return:

``` text
"We're temporarily unable to process this request.
Please try again or request human assistance."
```

Do not expose raw API errors.

## Database unavailable

Same principle.

## Unknown PNR

Ask for a valid booking reference.

## Unknown request

Ask a concise clarification question.

## Policy conflict

Escalate instead of guessing.

------------------------------------------------------------------------

# 73. Security Basics

Even for a prototype:

-   validate all inputs
-   do not expose API keys to frontend
-   store Gemini/API keys only in backend environment variables
-   validate PNR format if appropriate
-   avoid returning internal database fields
-   sanitize customer-generated text
-   rate-limit chat endpoint if deployed
-   never log secrets

------------------------------------------------------------------------

# 74. Environment Variables

Backend:

``` text
PORT=5000
DATABASE_URL=...
GEMINI_API_KEY=...
LLM_MODEL=...
```

Frontend:

``` text
VITE_API_BASE_URL=...
```

Never put:

``` text
GEMINI_API_KEY
```

in frontend code.

------------------------------------------------------------------------

# 75. Data Seeding

Seed the exact three customer profiles and booking data.

Example:

``` text
npm run db:seed
```

After seed:

``` text
Priya Nair
SK4821X
SK-204
Cancelled

Arvind Kulkarni
TR1190B
SK-118
Delayed 4 hours

Meher Kaur
WL7742
SK-305
Delayed 6 hours
```

This makes the demo deterministic.

------------------------------------------------------------------------

# 76. Demo Flow

The demo should show all three scenarios.

## Demo 1 --- Priya

Start:

``` text
PNR: SK4821X
```

Message:

``` text
My flight was cancelled and I'm furious. I want a full cash
refund and a free business-class upgrade on my return flight.
```

Show:

``` text
Customer identified
Booking verified
Cancellation detected
Refund recognized
Upgrade recognized separately
Refund handled according to policy
Upgrade not invented
Relevant source shown
```

------------------------------------------------------------------------

# 77. Demo 2 --- Arvind

Start:

``` text
PNR: TR1190B
```

Message:

``` text
My flight is delayed by four hours and I have a meeting.
Can you arrange a hotel?
```

Show:

``` text
Booking verified
Delay = 4 hours
Relevant delay policy retrieved
Applicable compensation determined
Hotel request evaluated against policy
Response grounded in policy
Source shown
```

------------------------------------------------------------------------

# 78. Demo 3 --- Meher

Start:

``` text
PNR: WL7742
```

Message:

``` text
My flight is delayed six hours. I want a full night's hotel
stay and I want to move to another flight. The fare difference
is ₹2,000.
```

Show:

``` text
Delay = 6 hours
Hotel rule applied
Full-night request handled according to supplied rule
Higher-fare request detected
Fare difference = ₹2,000
Threshold = ₹1,500
Escalation created
Audit event recorded
```

This scenario demonstrates the strongest agent behavior because the
system has to **separate allowed and escalated actions**.

------------------------------------------------------------------------

# 79. Frontend Screen Layout

Recommended:

``` text
+---------------------------------------------------------------+
| ✈ Airline Resolution Agent                         [Case]     |
+---------------------------------------------------------------+
|                                                               |
|  +----------------------------------+  +--------------------+ |
|  | CHAT                             |  | CUSTOMER           | |
|  |                                  |  |                    | |
|  | Customer:                        |  | Meher Kaur         | |
|  | My flight is delayed...          |  | Platinum           | |
|  |                                  |  | PNR: WL7742        | |
|  | Agent:                           |  |                    | |
|  | I can see your flight...         |  | BOOKING            | |
|  |                                  |  | SK-305             | |
|  |                                  |  | Delhi -> Hyderabad | |
|  |                                  |  | Delayed 6 hours    | |
|  |                                  |  |                    | |
|  |                                  |  | ACTION             | |
|  |                                  |  | Hotel: Requested   | |
|  |                                  |  | Rebooking: Review  | |
|  |                                  |  |                    | |
|  |                                  |  | SOURCES            | |
|  |                                  |  | Delay Rule         | |
|  +----------------------------------+  +--------------------+ |
|                                                               |
|  Type your message...                            [Send]       |
+---------------------------------------------------------------+
```

------------------------------------------------------------------------

# 80. UI States

Chat UI should support:

``` text
LOADING
NORMAL
ASKING_FOLLOWUP
ACTION_IN_PROGRESS
ESCALATED
RESOLVED
ERROR
```

------------------------------------------------------------------------

# 81. Action Status UI

Use simple status indicators:

``` text
Refund
[Requested]

Hotel
[Requested]

Higher-fare rebooking
[Escalated for review]
```

Avoid implying real-world execution if the prototype only creates a
database record.

------------------------------------------------------------------------

# 82. Source UI

Example:

``` text
Sources used

• Cancellation Rebooking Rule
• Refund Processing Rule
```

For a delayed case:

``` text
Sources used

• Delay Compensation Rule
• Fare Difference Rule
• Loyalty Tier Rule
```

------------------------------------------------------------------------

# 83. Audit UI

Optional but useful:

``` text
Case timeline

09:41 Customer message
09:41 Booking verified
09:41 Intent detected
09:41 Policy checked
09:41 Refund request created
09:41 Response sent
```

This is especially useful during the demo.

------------------------------------------------------------------------

# 84. Agent vs Chatbot

Your architecture should clearly demonstrate the difference.

## Chatbot

``` text
User
 ↓
LLM
 ↓
Answer
```

## Your Agent

``` text
User
 ↓
LLM
 ↓
Intent
 ↓
Tools
 ↓
Data
 ↓
Policy Engine
 ↓
Action Decision
 ↓
Execute / Escalate
 ↓
Audit
 ↓
LLM Response
 ↓
User
```

The second architecture is what you should demonstrate.

------------------------------------------------------------------------

# 85. Testing Strategy

You do not need hundreds of tests.

Prioritize policy tests.

## Test 1

``` text
Delay = 4 hours
```

Verify applicable delay rule.

## Test 2

``` text
Delay = 6 hours
```

Verify hotel rule.

## Test 3

``` text
Fare difference = ₹1,500
```

Verify threshold behavior according to supplied rule.

## Test 4

``` text
Fare difference = ₹2,000
```

Verify escalation.

## Test 5

``` text
Airline cancellation + refund
```

Verify refund request.

## Test 6

``` text
Unsupported compensation request
```

Verify no invented entitlement.

## Test 7

``` text
Formal complaint/legal issue
```

Verify escalation.

------------------------------------------------------------------------

# 86. Test the Agent Without the LLM

This is extremely useful.

The policy engine should be testable independently:

``` text
policyEngine.evaluate(
    action,
    booking,
    customer
)
```

This means even if Gemini gives a bad interpretation, your backend can
reject an unauthorized action.

------------------------------------------------------------------------

# 87. Mock LLM

Create a mock provider:

``` text
MockLLMProvider
```

For automated tests:

``` text
"My flight was cancelled"
        ↓
CANCELLATION_REFUND
```

This prevents your tests from depending on an external API.

------------------------------------------------------------------------

# 88. Logging

Log:

``` text
requestId
conversationId
pnr
intent
action
decision
policyIds
latency
error
```

Do not log secrets.

------------------------------------------------------------------------

# 89. Observability

For the prototype, a simple request log is enough:

``` text
[CHAT] conversation=123 pnr=WL7742
[INTENT] HIGHER_FARE_REBOOK
[POLICY] FARE_DIFFERENCE
[DECISION] ESCALATE
[ACTION] ESCALATION_CREATED
```

------------------------------------------------------------------------

# 90. API Response Contract

A useful response:

``` json
{
  "conversationId": "conv_123",
  "message": "Your request has been escalated...",
  "case": {
    "pnr": "WL7742",
    "flight": "SK-305",
    "status": "Delayed"
  },
  "actions": [
    {
      "type": "HOTEL_ACCOMMODATION",
      "status": "REQUESTED"
    },
    {
      "type": "HIGHER_FARE_REBOOK",
      "status": "ESCALATED"
    }
  ],
  "sources": [
    {
      "id": "DELAY_COMPENSATION",
      "name": "Delay Compensation Rule"
    },
    {
      "id": "FARE_DIFFERENCE",
      "name": "Fare Difference Rule"
    }
  ],
  "escalation": {
    "created": true,
    "reason": "Fare difference exceeds agent approval threshold."
  }
}
```

------------------------------------------------------------------------

# 91. End-to-End Example

Customer:

``` text
My flight is delayed 6 hours. I want a hotel for the whole
night and I want another flight. The difference is ₹2,000.
```

## Backend

``` text
POST /api/chat
```

## Conversation service

``` text
conversation exists
```

## Customer service

``` text
WL7742 -> Meher Kaur
```

## Booking service

``` text
SK-305
Delayed 6 hours
```

## LLM

``` json
{
  "intent": "DELAY_COMPENSATION",
  "requestedActions": [
    {
      "type": "HOTEL_ACCOMMODATION"
    },
    {
      "type": "HIGHER_FARE_REBOOK",
      "fareDifference": 2000
    }
  ]
}
```

## Policy engine

Hotel:

``` text
ALLOWED / applicable
```

Higher fare:

``` text
₹2,000 > ₹1,500
=> ESCALATE
```

## Action service

``` text
hotel request -> created
```

## Escalation service

``` text
ticket -> created
```

## Audit

``` text
POLICY_RETRIEVED
ACTION_EVALUATED
HOTEL_REQUEST_CREATED
ESCALATION_CREATED
```

## LLM response

``` text
Grounded response based on those results.
```

## Frontend

Displays:

``` text
Hotel accommodation: Requested
Higher-fare rebooking: Escalated
```

------------------------------------------------------------------------

# 92. What Makes This an Agent

Your system has:

### Perception

``` text
Customer message
```

### Reasoning

``` text
Intent + context
```

### Memory

``` text
Conversation history
```

### Tools

``` text
Customer
Booking
Policy
Action
Escalation
```

### Decision

``` text
Allowed / Escalate / Ask / Unsupported
```

### Action

``` text
Create request / ticket
```

### Feedback

``` text
Action result
```

### Traceability

``` text
Policy source + audit trail
```

That is the agentic loop.

------------------------------------------------------------------------

# 93. Agent Loop

A concise representation:

``` text
                +------------------+
                |      USER        |
                +--------+---------+
                         |
                         v
                +------------------+
                | OBSERVE MESSAGE  |
                +--------+---------+
                         |
                         v
                +------------------+
                | UNDERSTAND INTENT|
                +--------+---------+
                         |
                         v
                +------------------+
                | GET CONTEXT      |
                | Customer/Booking |
                +--------+---------+
                         |
                         v
                +------------------+
                | GET POLICY       |
                +--------+---------+
                         |
                         v
                +------------------+
                | PLAN ACTION      |
                +--------+---------+
                         |
                         v
                +------------------+
                | VALIDATE POLICY  |
                +--------+---------+
                         |
                 +-------+-------+
                 |               |
              ALLOWED         NOT ALLOWED
                 |               |
                 v               v
             EXECUTE         ESCALATE
                 |               |
                 +-------+-------+
                         |
                         v
                +------------------+
                | RECORD RESULT    |
                +--------+---------+
                         |
                         v
                +------------------+
                | GENERATE ANSWER  |
                +--------+---------+
                         |
                         v
                       USER
```

------------------------------------------------------------------------

# 94. Recommended MVP

Because the original assignment has a limited time window, implement the
smallest complete vertical slice.

## Must have

``` text
[1] Chat UI
[2] PNR/customer selection
[3] Customer lookup
[4] Booking lookup
[5] LLM intent extraction
[6] Policy layer
[7] Deterministic policy evaluation
[8] Action execution
[9] Escalation
[10] Conversation history
[11] Source display
[12] Audit trail
[13] Three seeded scenarios
```

------------------------------------------------------------------------

# 95. Nice-to-Have

Only after the MVP works:

``` text
[ ] Streaming response
[ ] Fancy animations
[ ] Admin dashboard
[ ] Authentication
[ ] Docker deployment
[ ] Swagger
[ ] Automated tests
[ ] Better audit viewer
```

Do not sacrifice the agent workflow for these.

------------------------------------------------------------------------

# 96. Recommended Implementation Order

## Phase 1 --- Data

Create:

``` text
customers
bookings
booking_segments
policies
```

Seed the supplied data.

------------------------------------------------------------------------

## Phase 2 --- Backend

Build:

``` text
GET customer
GET booking
GET policies
POST chat
```

------------------------------------------------------------------------

## Phase 3 --- Policy Engine

Implement:

``` text
cancellation rules
delay rules
refund rules
fare difference rules
loyalty rules
prohibited actions
```

------------------------------------------------------------------------

## Phase 4 --- Agent

Implement:

``` text
intent extraction
action planning
policy evaluation
execution
escalation
response generation
```

------------------------------------------------------------------------

## Phase 5 --- Frontend

Build:

``` text
chat
customer card
booking card
action status
source panel
```

------------------------------------------------------------------------

## Phase 6 --- Testing

Run:

``` text
Priya
Arvind
Meher
```

Then test prohibited actions.

------------------------------------------------------------------------

# 97. Suggested Development Commands

Example:

``` bash
# backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend:

``` bash
cd frontend
npm install
npm run dev
```

If using Docker:

``` bash
docker compose up -d
```

------------------------------------------------------------------------

# 98. GitHub README

Your README should contain:

``` text
# Airline Customer Resolution Agent

## Problem
...

## Solution
...

## Architecture
...

## Agent Flow
...

## Tech Stack
...

## Setup
...

## Environment Variables
...

## Database
...

## Supported Scenarios
...

## Policy Guardrails
...

## Escalation
...

## AI Usage
...

## Demo
...
```

------------------------------------------------------------------------

# 99. Architecture Diagram for PPT

Use this simplified diagram in the presentation:

``` text
Customer
   |
   v
React Chat UI
   |
   v
REST API
   |
   v
Agent Orchestrator
   |
   +---- Customer Tool
   |
   +---- Booking Tool
   |
   +---- Policy Tool
   |
   +---- LLM
   |
   v
Policy Engine
   |
   +----------+
   |          |
   v          v
Execute    Escalate
   |          |
   +-----+----+
         |
         v
     Audit Log
         |
         v
    Customer Response
```

------------------------------------------------------------------------

# 100. Process Flow for PPT

Use:

``` text
Customer Message
       ↓
Identify Customer
       ↓
Retrieve Booking
       ↓
Understand Intent
       ↓
Check Missing Information
       ↓
Retrieve Relevant Policies
       ↓
Create Requested Actions
       ↓
Validate Against Rules
       ↓
 ┌─────┴─────────┐
 ↓               ↓
Allowed       Not Allowed
 ↓               ↓
Execute       Escalate
 ↓               ↓
 └───────┬───────┘
         ↓
      Audit
         ↓
 Generate Response
         ↓
      Customer
```

------------------------------------------------------------------------

# 101. Final Architecture Principle

The most important sentence to remember during the demo is:

> **The LLM understands and communicates; the orchestrator coordinates;
> the policy engine controls authority; tools retrieve and modify data;
> and the audit layer records what happened.**

This separation is the core architectural idea of the project.

------------------------------------------------------------------------

# 102. Final System

The completed application should therefore look like:

``` text
                        CUSTOMER
                           |
                           v
                  +----------------+
                  |   React Chat   |
                  +-------+--------+
                          |
                          v
                  +----------------+
                  |  REST API      |
                  +-------+--------+
                          |
                          v
              +-------------------------+
              |   AGENT ORCHESTRATOR    |
              |                         |
              | State + Context         |
              | Intent                  |
              | Planning                |
              | Tool Coordination       |
              +-----------+-------------+
                          |
          +---------------+----------------+
          |               |                |
          v               v                v
   Customer Tool    Booking Tool     Policy Tool
          |               |                |
          +---------------+----------------+
                          |
                          v
                 +------------------+
                 |   POLICY ENGINE  |
                 +--------+---------+
                          |
              +-----------+-----------+
              |                       |
              v                       v
       +-------------+          +-------------+
       | ACTION      |          | ESCALATION |
       | SERVICE     |          | SERVICE    |
       +------+------+          +------+------+
              |                        |
              +------------+-----------+
                           |
                           v
                    +-------------+
                    | AUDIT LOG   |
                    +------+------+
                           |
                           v
                    +-------------+
                    | LLM RESPONSE|
                    +------+------+
                           |
                           v
                       CUSTOMER
```

------------------------------------------------------------------------

# 103. The Core MVP in One Sentence

Build a **React customer-support chat application backed by a
Node/Express agent orchestrator that retrieves the supplied
customer/booking/policy data, uses an LLM for intent and
natural-language handling, enforces deterministic airline rules before
every action, executes allowed prototype actions, escalates
prohibited/unclear actions, and records sources and audit history.**
