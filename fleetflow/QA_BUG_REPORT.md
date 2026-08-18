# FleetFlow QA Bug Report

## Audit scope

Audited the `server` and `client` applications, with emphasis on authentication, simulation lifecycle, analytics correctness, request payload handling, shutdown behavior, and dependency advisories.

Verification completed:

- `client`: `npm run build` — passed
- `server`: `npx tsc --noEmit` — passed
- `server`: `npm audit --omit=dev` — no vulnerabilities
- `client`: `npm audit --omit=dev` — 2 moderate React Router advisories remain

## Fixed findings

### CRITICAL — JWT authentication accepted a weak fallback secret

**Location:** `server/src/controllers/auth.controller.ts`, `server/src/middleware/auth.ts`

**Bug:** Token signing and verification used `process.env.JWT_SECRET || 'secret'`. A missing environment variable therefore silently reduced the security of every authenticated endpoint.

**Fix:** Added `server/src/config.ts` with fail-fast environment validation. `JWT_SECRET` is now required, trimmed, rejected when equal to `secret`, and required to be at least 32 characters. Both token creation and verification use the same validated secret. `DATABASE_URL` is also checked before the server starts.

**Acceptance criteria:** Starting the server without a strong `JWT_SECRET` or `DATABASE_URL` exits with an actionable error before listening for requests.

### HIGH — GPS simulation intervals could outlive the server or overlap

**Location:** `server/src/services/simulator.service.ts`, `server/src/server.ts`

**Bug:** Simulations were tracked per vehicle, but shutdown only disconnected Prisma on `SIGINT`. There was no global simulator cleanup for `SIGTERM`, and asynchronous interval callbacks could overlap while database writes were still pending.

**Fix:** Added `stopAllSimulations()` and invoke it during `SIGINT` and `SIGTERM` graceful shutdown. Added per-simulation re-entry protection and an active-state check so stopped/replaced simulations cannot continue writing telemetry. Existing completion, manual stop, delivery, and reroute paths continue to clear the interval through `stopSimulation()`.

**Acceptance criteria:** Each simulation has at most one in-flight movement operation; completion, stop, delivery, reroute replacement, `SIGINT`, and `SIGTERM` clear active intervals.

### HIGH — Request bodies were not centrally validated

**Location:** `server/src/routes/*.routes.ts`, `server/src/validation/schemas.ts`, `server/src/middleware/validateBody.ts`

**Bug:** Controllers destructured request bodies manually, but unknown keys and malformed values were not rejected consistently. This made the API contract implicit and allowed invalid numeric, enum, and date values to reach controller logic.

**Fix:** Added strict Zod schemas and route middleware for authentication, shipment, vehicle, driver, and tracking mutation endpoints. Unknown fields are rejected, numeric fields are coerced and checked for finiteness/positivity, dates are parsed, and enum values are constrained before controllers run. No controller passes `req.body` directly to Prisma.

**Acceptance criteria:** Invalid or extra mutation fields receive HTTP 400; Prisma receives only explicitly modeled controller data.

### MEDIUM — Analytics generated fabricated shipment volumes

**Location:** `server/src/controllers/analytics.controller.ts`

**Bug:** A zero database count was replaced with a random number from 1–5, causing the dashboard to report shipments that did not exist.

**Fix:** Daily volume now returns the database count exactly, including zero.

**Acceptance criteria:** An empty database produces zero daily shipments and zero-valued chart entries rather than synthetic activity.

## Remaining actionable work

These items were not changed because they require product decisions, dependency migration work, or broader test coverage.

### HIGH — Client dependency advisories require a planned major upgrade

**Owner: Member 1 — Frontend dependency/security**

`npm audit --omit=dev` reports moderate advisories in `react-router` / `react-router-dom`. The available remediation moves beyond the currently pinned React Router 6 line. Perform a compatibility review, upgrade to a patched release, run the client build, and test all navigation and redirect flows.

### HIGH — Vite development-tool advisories remain

**Owner: Member 2 — Build tooling**

The full client audit reports a high-severity Vite advisory and a related esbuild advisory in development dependencies. The available fix requires a Vite major-version upgrade. Upgrade Vite and compatible plugins, verify development-server behavior, and rerun `npm audit`.

### MEDIUM — Shipment status transitions are not enforced

**Owner: Member 3 — Shipment lifecycle**

`updateShipmentStatus` validates that a status is a known enum value but permits arbitrary jumps such as `PENDING → DELIVERED` or `DELIVERED → IN_TRANSIT`. Define an allowed transition matrix, reject invalid transitions with HTTP 409/400, and make vehicle, driver, route, and simulator side effects transactional with the transition.

### MEDIUM — Mutation validation needs integration tests

**Owner: Member 4 — Backend QA**

Add endpoint tests for every strict schema: unknown fields, invalid IDs, NaN/infinite numbers, negative quantities, invalid dates, invalid enum values, and boundary values. Include regression tests proving that analytics returns zero for empty datasets and that missing JWT configuration prevents startup.

### MEDIUM — Simulator lifecycle needs deterministic tests

**Owner: Member 5 — Realtime QA**

Add fake-timer tests covering completion, pause/resume, manual stop, delivery stop, reroute replacement, duplicate interval prevention, and `SIGINT`/`SIGTERM` cleanup. Assert that no telemetry write occurs after a simulation has been replaced or stopped.

### LOW — Operational security hardening is incomplete

**Owner: Member 6 — Platform/security**

Add production configuration for a restricted CORS allowlist, request-rate limiting on login/register, structured error responses that do not expose raw exception messages, and secret rotation documentation. Keep development origins configurable rather than hard-coded.

## QA conclusion

The requested JWT fallback, simulator cleanup, fabricated analytics data, and mutation payload controls are fixed. Build and server type verification pass. The remaining work is tracked above by severity and assigned across six project members.
