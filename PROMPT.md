PROMPT 11 — FINAL CODE AUDIT, BUG FIX & SUBMISSION READINESS

We have now completed the implementation phases for the Customer-Facing Resolution Agent assignment.

Implemented phases:

1. Project foundation and backend cleanup
2. JSON data + repositories
3. Deterministic Policy Engine
4. Gemini LLM + structured intent/action extraction
5. Controlled Agent Tools
6. Agent Orchestrator
7. Action Execution + Escalation Service
8. Conversation State + Audit Timeline
9. Complete Backend API + End-to-End Integration
10. React Customer Support Frontend

This is the FINAL CODE PHASE.

IMPORTANT:

DO NOT add new major features.

DO NOT redesign the architecture.

DO NOT add a database.

DO NOT add real airline integrations.

DO NOT start another implementation phase.

The purpose of this prompt is:

AUDIT → TEST → FIND BUGS → FIX BUGS → VERIFY → CLEAN UP

==================================================
1. FULL PROJECT INSPECTION
==================================================

Inspect the complete project:

- backend
- frontend
- package.json files
- configuration
- environment files
- routes
- controllers
- services
- repositories
- JsonStore
- agent orchestrator
- LLM provider
- tools
- policy engine
- action service
- escalation service
- conversation state
- audit service
- React components
- hooks
- API client
- types
- tests

Understand how the current implementation actually works before making changes.

Do not assume previous prompts were implemented perfectly.

Find inconsistencies between modules.

==================================================
2. ARCHITECTURE AUDIT
==================================================

Verify that the architecture is still:

Frontend
    ↓
Express API
    ↓
Agent Orchestrator
    ↓
Tools / Policy Engine / Services
    ↓
Repositories
    ↓
JsonStore
    ↓
JSON

Verify responsibilities:

CONTROLLER
- HTTP handling only

ORCHESTRATOR
- coordinates agent workflow

LLM
- understands customer language
- extracts structured information
- generates language
- DOES NOT authorize actions

TOOLS
- controlled access to customer/booking/policy data

POLICY ENGINE
- deterministic policy evaluation
- authoritative for authorization

ACTION SERVICE
- executes only allowed actions

ESCALATION SERVICE
- handles escalation outcomes

CONVERSATION STATE SERVICE
- maintains case state

REPOSITORIES
- persistence abstraction

JSON STORE
- filesystem persistence

If responsibilities are mixed, refactor them.

Do not rewrite modules that are already correctly separated.

==================================================
3. REMOVE DATABASE DEPENDENCIES
==================================================

Search the entire project for:

- mysql
- postgres
- postgresql
- mongodb
- prisma
- sequelize
- mongoose
- database connection code
- DB environment variables
- unused DB packages

The final application must use JSON persistence only.

Remove unused database dependencies/configuration if they were accidentally introduced.

Do NOT remove anything that is genuinely required by the existing application for another valid purpose.

Verify:

Services
    ↓
Repositories
    ↓
JsonStore
    ↓
JSON

==================================================
4. REMOVE DEAD / UNUSED CODE
==================================================

Look for:

- unused imports
- unused files
- duplicate services
- duplicate types
- duplicate API routes
- abandoned implementations
- commented-out code
- debug console logs
- temporary test code
- hardcoded demo responses
- unused dependencies

Remove only clearly unnecessary code.

Do not aggressively rewrite working modules.

Keep the code easy for an evaluator to understand.

==================================================
5. SECURITY AUDIT
==================================================

Search the entire repository for:

- Gemini API keys
- API tokens
- passwords
- secrets
- private credentials
- hardcoded production URLs
- authorization tokens

Verify secrets are loaded from environment variables.

Verify:

.env

is not committed.

Verify:

.env.example

contains variable names but no real secrets.

Frontend MUST NOT contain:

GEMINI_API_KEY

or any backend secret.

The Gemini API must be called only from the backend.

==================================================
6. LLM TRUST BOUNDARY AUDIT
==================================================

This is extremely important.

Verify that the LLM cannot authorize actions.

The LLM may produce:

- intent
- entities
- requested actions
- missing information
- customer tone

The LLM must NOT control:

- ALLOWED
- ESCALATE
- DENIED_BY_POLICY
- action authorization
- approval threshold
- refund eligibility
- supervisor authority

Verify the flow:

LLM
 ↓
Structured understanding
 ↓
Backend authoritative data
 ↓
PolicyEngine
 ↓
Decision
 ↓
ActionService / EscalationService

If any code violates this, fix it.

==================================================
7. POLICY ENGINE AUDIT
==================================================

Verify all authorization decisions are deterministic.

Policies must come from:

policies.json

through:

PolicyRepository
    ↓
PolicyService / PolicyTool
    ↓
PolicyEngine

Do not hardcode assignment-specific customer rules.

Do not hardcode:

Priya = refund

Meher = escalate

Arvind = hotel

Instead, use:

customer/booking facts
+
requested action
+
policy data
=
policy decision

Verify the fare-difference authority comes from policy data.

The ₹2,000 Meher scenario must be evaluated against the configured authority rather than a hidden magic number.

==================================================
8. ACTION EXECUTION AUDIT
==================================================

Verify:

ONLY ALLOWED actions can reach ActionService execution.

ESCALATE:
→ EscalationService

DENIED_BY_POLICY:
→ no execution

NEEDS_INFORMATION:
→ ask customer

UNSUPPORTED:
→ no execution

The frontend must never execute actions directly.

The LLM must never execute actions directly.

The controller must not contain action authorization logic.

==================================================
9. DUPLICATE ACTION AUDIT
==================================================

Verify duplicate protection.

For example:

Customer requests refund.

Refund executes.

Customer repeats the same request.

The system must not blindly execute another refund.

Test using:

- same conversation
- same booking
- same action type

Make sure legitimate separate actions are not accidentally blocked.

==================================================
10. CONVERSATION STATE AUDIT
==================================================

Verify multi-turn conversations.

Example:

Turn 1:
"My flight SK-204 was cancelled."

Turn 2:
"I want a refund."

The second turn should use the existing context.

Verify the system does not unnecessarily ask again for:

- PNR
- flight number
- booking information

when already established.

Also verify a NEW conversation does not inherit previous state.

==================================================
11. AUTHORITATIVE DATA AUDIT
==================================================

Verify backend data is authoritative.

Customer statements must NOT override:

- customer identity
- booking
- PNR
- flight
- loyalty tier
- policy
- action authority

Conversation state is contextual, not authoritative.

LLM output is contextual, not authoritative.

Backend repository data is authoritative for customer/booking facts.

Policy data is authoritative for policy decisions.

==================================================
12. AUDIT LOG AUDIT
==================================================

Verify audit events represent observable system actions.

Examples:

CONVERSATION_CREATED
MESSAGE_RECEIVED
CUSTOMER_LOOKUP
BOOKING_LOOKUP
POLICY_RETRIEVED
ACTION_EVALUATED
ACTION_EXECUTED
ACTION_ESCALATED
ESCALATION_CREATED
CASE_STATUS_CHANGED

Do NOT store:

- chain-of-thought
- hidden reasoning
- system prompts
- API keys
- internal secrets

Remove such information if accidentally stored.

==================================================
13. JSON PERSISTENCE AUDIT
==================================================

Verify every runtime JSON file works correctly.

Expected files include:

customers.json
bookings.json
policies.json
conversations.json
messages.json
actions.json
escalations.json
audit-events.json

and any other intentionally created runtime files.

Verify:

- valid JSON
- consistent schemas
- no accidental corruption
- IDs are unique
- writes are persisted
- reads return correct data

Verify the application still works after restart.

==================================================
14. RESET DATA AUDIT
==================================================

Run:

npm run reset-data

or the project's equivalent.

Verify it restores the prototype to a clean state.

After reset:

- conversations are empty
- messages are empty
- actions are empty
- escalations are empty
- audit events are empty

Seed/reference data remains available.

Run the application after reset and verify the demo still works.

==================================================
15. API AUDIT
==================================================

Verify all required endpoints.

Expected:

GET /api/health

POST /api/agent/chat

GET /api/conversations/:conversationId

GET /api/conversations/:conversationId/messages

GET /api/conversations/:conversationId/actions

GET /api/conversations/:conversationId/escalations

GET /api/conversations/:conversationId/audit

Check:

- validation
- status codes
- error responses
- response schemas
- missing conversation handling
- malformed request handling

Do not create duplicate endpoints.

==================================================
16. API SECURITY AUDIT
==================================================

Verify users cannot use API endpoints to access arbitrary files.

There must be no endpoint such as:

GET /api/files/:filename

that exposes the JSON directory.

Only intended domain data should be exposed.

Do not expose:

- filesystem paths
- internal JSON implementation
- server environment
- secrets
- internal prompts

==================================================
17. ERROR HANDLING AUDIT
==================================================

Test:

- invalid request
- empty message
- nonexistent conversation
- unknown PNR
- unknown booking
- missing policy
- malformed LLM output
- Gemini unavailable
- JSON read failure
- JSON write failure
- unexpected server error

Verify customer-facing errors are safe and understandable.

Do not expose stack traces.

==================================================
18. FRONTEND AUDIT
==================================================

Verify the frontend is actually customer-facing.

The primary experience must be:

CUSTOMER
    ↕
RESOLUTION AGENT

Verify it contains:

- chat
- message input
- send button
- loading state
- error state
- conversation state
- customer information
- booking information
- case status
- action status
- escalation status
- relevant activity/history

It should NOT have become an admin dashboard.

==================================================
19. FRONTEND BUSINESS LOGIC AUDIT
==================================================

Search frontend code for policy/business decisions.

The frontend must NOT contain logic such as:

if fareDifference > 1500

or:

if customerTier === "Platinum"

for deciding authorization.

The frontend only renders backend results.

If business rules are found in React, move them back to the backend.

==================================================
20. FRONTEND API AUDIT
==================================================

Verify all backend calls are centralized.

Prefer:

React component
    ↓
useChat / hook
    ↓
api.ts
    ↓
Backend

Avoid scattered fetch/axios logic across many components.

Verify:

- API base URL comes from environment
- no hardcoded Gemini URL
- no backend secrets
- no unnecessary duplicate requests

==================================================
21. UI STATE AUDIT
==================================================

Verify:

Loading:
→ Send disabled

Success:
→ message appears

Error:
→ friendly error appears

New conversation:
→ frontend state resets

Follow-up:
→ same conversationId

Escalation:
→ clearly displayed

Executed action:
→ clearly displayed

Do not show an action as executed unless backend says so.

==================================================
22. BUILD / TYPE / LINT CHECK
==================================================

Run all available checks.

Backend:

- npm install if necessary
- TypeScript compilation
- lint
- tests

Frontend:

- TypeScript compilation
- lint
- tests
- production build

Fix all errors caused by the implementation.

Do not suppress errors simply to make the build pass.

Do not use:

// @ts-ignore

unless genuinely necessary and justified.

Do not replace proper types with:

any

just to bypass compiler errors.

==================================================
23. END-TO-END SCENARIO 1 — PRIYA
==================================================

Reset data first.

Start backend.

Start frontend.

Perform:

1. "My flight SK-204 was cancelled."
2. "I want a full cash refund."

Verify:

- same conversation
- customer resolved
- booking resolved
- cancellation recognized
- refund evaluated through PolicyEngine
- allowed action executes if policy permits
- action persisted
- audit persisted
- UI shows correct action status
- response reflects actual action result

No duplicate action.

==================================================
24. END-TO-END SCENARIO 2 — ARVIND
==================================================

Reset data.

Perform:

1. "My flight SK-118 is delayed."
2. "It has been delayed by 4 hours and I need help because of my meeting."

Verify:

- same conversation
- context retained
- delay information correctly processed
- relevant policy retrieved
- policy decision respected
- action/escalation follows the actual supplied policy
- UI reflects backend result

Do not invent an outcome.

==================================================
25. END-TO-END SCENARIO 3 — MEHER
==================================================

Reset data.

Perform:

1. "My flight SK-305 is delayed by 6 hours."
2. "I want a higher-fare flight. The fare difference is ₹2,000."

Verify:

- same conversation
- delay = 6 hours
- fare difference = 2000
- PolicyEngine evaluates it
- if configured approval authority is ₹1,500, result = ESCALATE
- no upgrade execution
- escalation record created
- case status = ESCALATED
- UI shows escalation
- response tells customer approval is required

This is a critical acceptance test.

==================================================
26. MULTI-ACTION ACCEPTANCE TEST
==================================================

Test:

"My flight was cancelled. I want a refund and I also want to upgrade my return flight."

Verify each action independently goes through policy evaluation.

Possible result:

Refund:
ALLOWED → execute

Upgrade:
ESCALATE → escalate

Do NOT collapse multiple actions into one decision.

==================================================
27. FOLLOW-UP ACCEPTANCE TEST
==================================================

Test:

Turn 1:
"My flight SK-204 was cancelled."

Turn 2:
"I want a refund."

Turn 3:
"How long will it take?"

Verify the agent maintains conversation context.

Do not unnecessarily request PNR again.

==================================================
28. RESTART ACCEPTANCE TEST
==================================================

Test:

1. Start backend.
2. Create conversation.
3. Send messages.
4. Execute/escalate action.
5. Stop backend.
6. Restart backend.
7. Fetch conversation.

Verify all state remains available.

==================================================
29. NEW CONVERSATION ACCEPTANCE TEST
==================================================

After completing a previous case:

Click:

New Conversation

Then send:

"My flight SK-118 is delayed."

Verify:

- new conversationId
- no previous PNR inherited
- no previous customer inherited
- no previous actions inherited
- no previous escalation inherited

==================================================
30. RESPONSIVENESS CHECK
==================================================

Verify frontend at:

- desktop
- laptop
- tablet
- mobile

Fix obvious layout problems.

Do not spend time on pixel-perfect design.

The goal is:

clean
professional
usable
responsive

==================================================
31. DEMO RELIABILITY
==================================================

The application must be easy to demonstrate.

Verify:

1. Fresh reset.
2. Start backend.
3. Start frontend.
4. Open browser.
5. Run a scenario.
6. See response.
7. See case update.
8. See action/escalation.
9. Start another case.

Avoid requiring manual JSON editing for the normal demo.

==================================================
32. STARTUP COMMANDS
==================================================

Verify the exact commands needed to run:

Backend

Frontend

Reset data

If possible, ensure package.json scripts are clear.

For example:

npm run dev
npm run test
npm run build
npm run reset-data

Use the project's actual scripts.

Do not invent scripts that do not exist.

==================================================
33. ENVIRONMENT DOCUMENTATION
==================================================

Verify .env.example includes only required configuration.

For example:

GEMINI_API_KEY=
PORT=
FRONTEND_URL=

and frontend:

VITE_API_URL=

Use the project's actual variable names.

No secrets.

==================================================
34. GIT / SUBMISSION CLEANUP
==================================================

Check for files that should NOT be committed:

- .env
- node_modules
- build output
- dist if inappropriate
- logs
- temporary files
- IDE metadata
- OS files
- API keys
- generated runtime artifacts if they should not be submitted

Make sure .gitignore is appropriate.

Do not delete useful source files.

==================================================
35. README CHECK
==================================================

Ensure README contains enough information for an evaluator to run the project.

At minimum:

- project overview
- architecture
- tech stack
- prerequisites
- environment setup
- installation
- backend startup
- frontend startup
- reset-data command
- API overview
- assignment scenarios
- testing instructions
- important prototype limitations

Do not write a huge README.

Keep it evaluator-friendly.

==================================================
36. PROTOTYPE LIMITATION CHECK
==================================================

The application must clearly behave as a prototype.

Do not claim:

- real airline booking changes
- real payment processing
- real hotel reservations
- real supervisor systems
- real external airline integrations

unless an actual integration exists.

ActionService represents prototype execution.

EscalationService represents prototype escalation.

The README should explain this briefly.

==================================================
37. FINAL QUALITY BAR
==================================================

The final project should satisfy:

FUNCTIONAL
- application runs
- frontend communicates with backend
- agent responds
- conversations persist
- actions work
- escalations work

ARCHITECTURAL
- clean separation of concerns
- deterministic policy engine
- controlled tools
- JSON repositories
- no database

AI
- Gemini used for language understanding/generation
- structured outputs validated
- LLM does not authorize actions

SAFETY / TRUST
- backend data authoritative
- policy engine authoritative
- no secrets exposed
- no chain-of-thought exposed

UX
- customer-facing support chat
- case information visible
- action/escalation status visible
- responsive interface

DEMO
- Priya scenario works
- Arvind scenario works
- Meher scenario works
- multi-action works
- multi-turn works
- reset works

==================================================
38. DO NOT OVER-ENGINEER
==================================================

This is a job-entry assignment.

Do NOT add:

- microservices
- Kubernetes
- message queues
- Redis
- Kafka
- complex authentication
- database migrations
- real airline integrations
- unnecessary design patterns
- unnecessary abstractions
- complicated state-management libraries

Prefer a clean working prototype over unnecessary infrastructure.

==================================================
39. FINAL FIX RULE
==================================================

If you find a bug:

1. Identify the root cause.
2. Make the smallest clean fix.
3. Run the relevant test.
4. Run the complete test suite afterward.

Do not mask bugs.

Do not rewrite the whole project.

==================================================
40. FINAL REPORT
==================================================

After completing the audit and fixes, provide a final report containing:

A. Code quality status

B. Backend status

C. Frontend status

D. Test results

E. Build results

F. End-to-end scenario results

G. Files changed during this audit

H. Remaining known issues, if any

I. Exact commands to run the project

J. Exact command to reset demo data

K. Confirmation that no database was introduced

L. Confirmation that Gemini/API secrets are not exposed in frontend

M. Confirmation that LLM cannot authorize policy decisions

N. Confirmation that the three assignment scenarios were tested

==================================================
FINAL INSTRUCTION
==================================================

This is the final code phase.

Do not add another major feature after this.

Do not build another architecture layer.

Do not build the PPT in this phase.

Do not create presentation content in this phase.

Finish by leaving the repository in a clean, working, submission-ready state.