# SupplyTiger GOA — Full Agent Review
**Date:** 2026-02-23
**Agents:** web_architect · frontend_developer · backend_developer · fullstack_tester · Federal Procurement Consultant · SupplyTiger Manager · Compliance & Ethics Reviewer · Data & Analytics Reviewer

---

## `web_architect` — System Designer

**Verdict: Solid MVP, growing pains ahead**

The schema is the strongest part — hierarchical org modeling, GIN indexes, scoped unique constraints, and Decimal for money are all correct decisions. Inngest + Clerk integration shows architectural maturity.

**What will hurt at scale:**
- **N+1 query risk** — controllers don't appear to use `.select()` with explicit field lists; 50-item table loads could fan out to 50 queries
- **Coupled Vercel deployment** — frontend and backend deploy together; a backend break takes down frontend
- **No API contract** — `api.js` assumes backend response shape with no shared types or OpenAPI spec; silent breakage on any endpoint change
- **`updateMany` without batching** — `changeExpiredOpportunitiesToInactive()` could table-lock on large datasets
- **No service layer** — controllers handle data access, transformation, and event emission; tight to refactor

**Fix first:** N+1 queries (use `.select()`), then request validation (Zod), then rate limiting.

---

## `frontend_developer` — UI/UX Implementation

**Verdict: Solid architecture, unfinished product**

TanStack Query usage is correct, routing guards are clean, and the `ItemDetail`/`Table` component pattern is reusable and well-composed.

**What will hurt users:**
- **4 placeholder pages** — Analytics, Calendar, Contacts, Market Intelligence are stub text. Users will click them, lose trust immediately
- **Dashboard is a dead end** — USER role sees "Access Restricted" on the landing page; READ_ONLY sees blank text. No entry point to actual work
- **Generic empty states** — `"No Data / Data will appear here once available"` gives no context. Users don't know if the sync broke or they have no access
- **Error messages are technical** — Axios error strings ("Request failed with status code 500") surface directly to users
- **Loading states have no context** — full-screen spinner with no message on slow connections

**Fix first:** Remove or stub-out placeholder pages, build a real dashboard landing, improve error/empty state copy.

---

## `backend_developer` — API Development

**Verdict: Auth is solid, public endpoints are a gap**

RBAC middleware is correct, idempotent upserts are disciplined, and raw DB errors are not exposed to clients.

**Critical gap — unauthenticated proxy endpoints:**

The SAM and USASpending routes are fully public:
- `GET /api/samgov/opportunities/current` — no auth
- `POST /api/usaspending/search-award` — no auth
- Several others

These proxy directly to external APIs, can trigger DB writes (`cacheInDB=true`), and have no rate limiting. A bad actor can exhaust your API quotas.

**Other gaps:**
- No enum validation on mutation endpoints — any string can be passed as `reviewStatus` or `role`
- No audit trail on user-initiated mutations (only sync operations are logged)
- `error?.response?.data` from external APIs sometimes leaks to client response

**Fix first:** Add `...protectRoute` to all SAM and USASpending routes. It's a one-liner per route.

---

## `fullstack_tester` — Quality Assurance

**Verdict: Zero tests. Block production until Phase 1 passes.**

No test files. No test framework in either `package.json`. No CI pipeline. Nothing.

**Compliance-critical untested paths:**
- Sync idempotency — can the same opportunity be ingested twice without double inbox events?
- Auth middleware — does USER role actually get 403 on admin routes?
- Audit trail — mutations to inbox items have `reviewedBy` but no change history
- Pagination failure — network error on page 5 of 20 returns partial data but SyncLog can be marked SUCCESS

**First test suite priority:**
1. `sync-idempotency.test.js` — same noticeId twice → one inbox event
2. `auth.test.js` — all role/route combinations
3. `audit-trail.test.js` — mutations are recorded with before/after
4. `pagination.test.js` — mid-run failure marks log FAILED, not SUCCESS

---

## `Federal Procurement Consultant` — B2G Domain Expert

**Verdict: Good triage tool, not yet procurement intelligence**

Strong: UEI-based recipient dedup, acquisition path enum, hierarchical org modeling, source system tracking. These are things most platforms get wrong.

**What makes me distrust the data:**
- **Acquisition path classification is oversimplified** — path is inferred from dollar amount alone (`amount < threshold → MICROPURCHASE`, else `OPEN_MARKET`). A $9,500 GSA Schedule order gets labeled OPEN_MARKET. This misleads strategy
- **Default to `OPEN_MARKET` in Inngest** — unclassified items silently become OPEN_MARKET. Silent data loss for anything not explicitly classified
- **Data freshness is invisible** — SyncLog exists but nothing in the UI shows when data was last synced. Users act on stale intelligence
- **Incumbent tracking has the schema but not the UX** — Award → Recipient → BuyingOrganization chain is there; the UI never surfaces "who holds this contract" or "what else has this agency bought"
- **Award-to-opportunity linkage is optional** — can't correlate solicitations to outcomes; win-loss analysis is impossible

**Use this as:** opportunity discovery and inbox triage. Do NOT rely on acquisition path labels without manual review.

---

## `SupplyTiger Manager` — End User

**Verdict: I'd use the Inbox once, then go back to my spreadsheets**

Navigation is intuitive and badges are readable. The Inbox table and detail pages give enough context to act. Admin sync controls are well-designed.

**What I can't do that I need to:**
- **Nothing on the Dashboard** — I land here and immediately navigate away. Where's my "3 new inbox items since yesterday"?
- **Can't filter the Inbox** — I need to filter by Type, Status, Acquisition Path, Agency. Scrolling pages isn't a workflow
- **Can't take action on inbox items** — I can read them but can't mark Qualified, Dismiss, or log a contact from the UI
- **Search doesn't work** — the sidebar search box is disabled
- **Calendar and Contacts are empty** — these are daily workflow tools for me, not nice-to-haves
- **No outreach history** — I can't see if someone already contacted this buyer

**The foundation is there. The features I need daily aren't.**

---

## `Compliance & Ethics Reviewer` — FAR / CAN-SPAM

**Verdict: Conditional pass — approved for data aggregation, blocked for outreach**

**What passes:**
- All contact data sourced exclusively from public SAM.gov and USASpending APIs — no scraping
- Contact schema stores only business-role information (name, work email, title, phone) — no PII
- Zero email sending capability currently — no SMTP, no mail service, no templates
- SyncLog + InboxItem workflow tracking provides a solid audit trail for data operations
- RBAC enforced throughout

**Hard blocker for any future outreach feature:**
- No consent tracking on ContactLink — no `consentGiven`, `optOutAt`, `lastContactedAt`
- `CONTACTED` status exists on InboxItem but no OutreachLog table — you can't prove what was sent, when, by whom
- No CAN-SPAM compliance layer — no mechanism to enforce unsubscribe links or sender disclosure

**Before any outreach feature ships:** add consent fields to ContactLink, create an OutreachLog table, and build a CAN-SPAM validation gate.

---

## `Data & Analytics Reviewer` — Pipeline Integrity

**Verdict: Sound for MVP, will drift at scale without instrumentation**

Deduplication via external IDs is disciplined. GIN indexes on NAICS arrays are correct. `withSyncLog` wrapper and Inngest orchestration are solid foundations.

**What will cause data quality issues:**
- **No retry logic** — network error on page 5 of SAM pagination silently returns partial data; SyncLog may still show SUCCESS
- **Partial sync atomicity** — opportunity upserts successfully but contact upsert fails mid-loop; contacts are silently lost, not rolled back
- **Agency name normalization is missing** — `"Dept of Defense"` vs `"Department of Defense"` creates duplicate BuyingOrganization rows; spending rollups split across them
- **Obligated amounts have no bounds validation** — null or malformed amounts from API silently become null; aggregates understate totals
- **No data retention policy** — inactive opportunities are soft-deleted but never archived; table grows unbounded
- **ContactLink externalId includes fullName** — if SAM changes "Christopher Russell" to "Christopher S. Russell", a second ContactLink is created instead of updating

**Fix first:** retry logic with exponential backoff on pagination, wrap opportunity+contacts upsert in a transaction, normalize agency names before upsert.

---

## Consolidated Priority Matrix

| Priority | Issue | Agent | Fix |
|---|---|---|---|
| 🔴 Critical | SAM/USASpending routes are unauthenticated | `backend_developer` | Add `...protectRoute` to route files |
| 🔴 Critical | Zero test coverage on compliance-critical paths | `fullstack_tester` | Phase 1 test suite |
| 🔴 Critical | Sync partial failure can be logged as SUCCESS | `data_reviewer`, `tester` | Transaction wrap + failure propagation |
| 🟠 High | Acquisition path classification by dollar amount only | `procurement_consultant` | Use contract type fields from API |
| 🟠 High | No retry logic on external API pagination | `data_reviewer` | Exponential backoff |
| 🟠 High | No input validation on any endpoint | `web_architect`, `backend_developer` | Zod schemas |
| 🟠 High | No audit trail on user mutations | `tester`, `compliance` | AuditLog table |
| 🟡 Medium | 4 placeholder pages erode user trust | `frontend_developer`, `end_user` | Complete or hide from sidebar |
| 🟡 Medium | Dashboard has no content | `end_user` | Summary widgets, recent activity |
| 🟡 Medium | Agency name normalization missing | `data_reviewer` | Normalize before upsert |
| 🟡 Medium | Outreach schema not ready for CAN-SPAM | `compliance` | Consent fields, OutreachLog table |
| 🟡 Medium | Data freshness not visible to users | `procurement_consultant` | Surface last sync time in UI |
| 🟢 Lower | No rate limiting | `backend_developer` | express-rate-limit |
| 🟢 Lower | No CI pipeline | `tester` | GitHub Actions |
| 🟢 Lower | N+1 query risk in controllers | `web_architect` | Prisma `.select()` audit |
