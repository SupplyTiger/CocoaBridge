# SupplyTiger GOA — Full Agent Review
**Date:** 2026-03-04
**Agents:** web_architect, frontend_developer, backend_developer, fullstack_tester, Federal Procurement Consultant, SupplyTiger Manager, Compliance & Ethics Reviewer, Data & Analytics Reviewer

**Scope:** Recent feature additions — Favorites (toggle, tab, FavoritesPage), Analytics page (4-tab breakdown: Recipients, PSC, NAICS, Agencies), InboxItemDetail read-only access to linked records, JSX syntax fixes across detail pages.

---

## `web_architect` — System Designer

**Verdict:** Solid structural additions, but the local `Table` in AnalyticsPage creates a naming collision risk and the FavoriteButton's optimistic UI claim is unsubstantiated.

### Findings

- **Local Table duplication.** `AnalyticsPage.jsx` defines a local `Table` component alongside the global `Table.jsx`. The local variant is intentionally simpler (no pagination, sort, or row clicks), but the name collision is a latent bug — any future developer adding `import Table from "../components/Table.jsx"` to AnalyticsPage will silently override the local one, or vice versa. Recommend renaming the local component to `AnalyticsTable` to make the distinction explicit.

- **Duplicate `accessor` keys.** Both `RecipientAnalytics` and `CodeAnalytics` define two columns with `accessor: "totalObligated"` — one for the formatted amount, one for the `Bar`. The local `Table` uses `col.accessor` as the React `key` for `<th>` and `<td>`. Duplicate keys suppress React warnings and can cause rendering bugs. The Bar column needs a distinct accessor (e.g., `"_bar"`).

- **Favorite model allows null-null rows.** The schema has no DB-level constraint preventing a `Favorite` row where both `opportunityId` and `awardId` are `null`. Only application logic prevents this. A `@@check` constraint or a single `entityType + entityId` column pattern would be more robust.

- **Analytics queries are not cached.** All four analytics endpoints are hit on every tab switch. TanStack Query defaults to `staleTime: 0`, meaning each tab click refetches. These are read-heavy, slow aggregations — they should have `staleTime: 5 * 60 * 1000` or similar.

- **`AwardsPage` tab→filter connection is correct.** `handleTabChange` correctly sets both `activeTab` and `filters.favoritesOnly`, and the dead `toggleFavoritesOnly` function was cleaned up. Good.

---

## `frontend_developer` — UI/UX Implementation

**Verdict:** Tabs and favorites are clean and usable. Two rendering bugs (duplicate keys, non-optimistic star) need fixing before release.

### Findings

- **Duplicate `accessor` keys cause silent React warnings.** In `RecipientAnalytics` and `CodeAnalytics`, two columns share `accessor: "totalObligated"`. This produces duplicate `key` props on `<th>` and `<td>` elements, which React will warn about in dev and can cause mis-renders. Fix: give the Bar column `accessor: "_bar"` and pass `row.totalObligated` through `render: (_, row) => <Bar value={row.totalObligated} max={max} />`.

- **FavoriteButton is not optimistic.** The README describes the star toggle as "optimistic UI" but `FavoriteButton` waits for the mutation to succeed before invalidating queries. The star doesn't change until the server responds. True optimistic UI would call `queryClient.setQueryData` immediately and roll back on error. As-is, the star lags on slow connections.

- **`InboxItemDetail` read-only notes visibility.** The `{!isAdmin && item?.notes && (...)}` block at line 157 correctly shows notes as read-only text to non-admin users. This works, but the condition is fragile — it renders for `READ_ONLY` but also for `USER` if they somehow reach the page. Since `InboxItemDetail` is behind `DataOnlyRoute`, `USER` can't reach it, so this is safe in practice, but the condition should use `hasReadAccess && !isAdmin` for clarity.

- **Agency tab column density.** The "By Agency" tab renders 9+ columns including 6 type abbreviations (SOL, PRE, SS, AWD, SPC, OTH). On mobile or narrow viewports this will overflow even with `overflow-x-auto`. The abbreviations are not explained anywhere on the page — a legend or tooltip would help the target user (SupplyTiger Manager).

- **Empty state on Analytics.** If an analytics tab returns no data, the local `Table` shows "No data" centered in the table body. This is acceptable but the SupplyTiger Manager has no context for why there's no data or what to do.

- **`AnalyticsPage` closing brace style.** The `return (` in `AnalyticsPage` is missing a space before `)` on the closing line (line 328-329 has `);` on a separate line without matching `return (`). Minor but inconsistent with other pages.

---

## `backend_developer` — API Development

**Verdict:** Auth and input validation are correct. Two performance concerns in analytics and one redundant round-trip in favorites toggle.

### Findings

- **`getRecipientAnalytics` sorts in memory.** The `prisma.award.groupBy` call fetches all grouped recipient rows with no `take` or `orderBy` at the DB level, then sorts in JavaScript. As the award table grows, this is an unbounded in-memory sort. Prisma `groupBy` supports `orderBy` on aggregate fields — use `orderBy: { _sum: { obligatedAmount: "desc" } }, take: 50` to push the sort and limit to the database.

- **`toggleFavorite` uses two round-trips for unfavorite.** `findFirst` + `delete` is two DB calls. `prisma.favorite.deleteMany({ where })` is idempotent and requires one call. The unfavorite path should use `deleteMany` and check `count` to determine the response.

- **`listFavorites` returns full records with no `select`.** Both `opportunity.findMany` and `award.findMany` return all columns. FavoritesPage likely only needs a subset (id, title, description, dates). Add `select` projections to reduce payload size.

- **Analytics endpoints have no pagination.** PSC and NAICS analytics return all codes (potentially hundreds). There's no `take` or pagination support. This is fine now but will degrade as data grows. Recommend a `limit` query param (defaulting to 100).

- **`getAgencyAnalytics` sort metric is misleading.** Agencies are sorted by `oppCount + awardCount`. These are different magnitudes — an agency with 500 opps and 1 award ranks the same as one with 250 opps and 251 awards. The frontend already lets users re-sort by "By Opp Count" or "By Award $", so the default sort should match the default frontend sort (currently `awardTotal`). The backend default sort should be `awardTotal` descending.

- **Auth on favorites is correct.** `toggleFavorite` and `listFavorites` are both behind `readOnlyOrAbove` — `USER` role cannot access them. The `userId` is read from `req.user.id` (server-side from the JWT lookup), so users cannot spoof another user's favorites.

- **Input validation on `toggleFavorite` is sufficient.** `entityType` is validated against an allowlist. `entityId` is not validated as a valid UUID/CUID, but a non-existent ID will either fail the `findFirst` (returning null → create) or throw a foreign key violation on `create`, which is caught and returns 500. Consider a `findUnique` check on the entity before creating.

---

## `fullstack_tester` — Quality Assurance

**Verdict:** No tests exist for favorites or analytics. The duplicate accessor key bug is a P1 that will manifest as a rendering defect in production.

### Findings

- **No tests for analytics controllers.** All four analytics endpoints (`getRecipientAnalytics`, `getPscAnalytics`, `getNaicsAnalytics`, `getAgencyAnalytics`) are untested. The NAICS endpoint uses raw SQL (`$queryRaw`) which is particularly risky — a schema rename or column change will silently break it with no type-system guard.

- **No tests for favorites toggle idempotency.** The toggle uses `findFirst` + `delete`/`create`. A concurrent double-click could race: both requests call `findFirst`, both see `null`, both attempt `create`, and one will throw a unique constraint violation. The 500 response from this race is caught but returns a misleading error. A `upsert` or `createOrSkip` pattern would be safer.

- **Duplicate accessor key — rendering defect.** The `RecipientAnalytics` and `CodeAnalytics` columns include two entries with `accessor: "totalObligated"`. React will use the first matching `key` and may skip rendering the second `<td>`. This means the `Bar` column may not render for some rows. This is a correctness bug, not just a warning.

- **`FavoriteButton` has no test for the race condition.** Double-clicking the star fires two mutations. The second click is not debounced or disabled during the first request — `disabled={isPending}` only disables after the first mutation starts, but a very fast double-click can fire both before `isPending` becomes `true`.

- **No end-to-end test for tab→filter sync on AwardsPage.** The `handleTabChange` function sets both `activeTab` and `filters.favoritesOnly`. If these ever desync (e.g., a refactor changes one but not the other), the UI will show "Favorites" tab active but fetch all awards. An integration test asserting the query key changes on tab switch would catch this.

---

## `Federal Procurement Consultant` — Stakeholder Persona

**Verdict:** Analytics are a good start for market awareness, but lack date-range scoping and hierarchy context — both critical for real procurement decisions.

### Findings

- **No date range on analytics.** All four analytics tabs aggregate all historical data. A procurement professional needs to ask "what did this agency buy in FY2025?" or "who were the top recipients in the last 6 months?" Without date filtering, the analytics conflate old awards with current market activity, which leads to bad outreach decisions.

- **Agency hierarchy is ignored in "By Agency" tab.** The tab mixes AGENCY, SUBAGENCY, and OFFICE level organizations. A contracting office and its parent agency both appear as separate rows with separate totals, even though the office's spending is already included in the parent. This double-counts spend across the hierarchy and misrepresents who actually controls the budget.

- **Incumbent tracking TODO is unresolved.** The `Award` schema has a comment: `// TODO: Ensure that award is inherently linked`. The connection between awards and the opportunities that preceded them is inconsistently populated. An analytics page that shows award recipients but can't answer "is this an incumbent?" is half the picture.

- **The "By PSC Code" and "By NAICS Code" tabs are genuinely useful.** Being able to sort by opp count vs. award $ provides two distinct signals — frequency of buying vs. size of spend. This is exactly the right dual-axis view for market sizing.

---

## `SupplyTiger Manager` — End User Persona

**Verdict:** Favorites and the analytics page are meaningful improvements. The abbreviations in the Agency tab and the lack of column explanations will cause confusion.

### Findings

- **Abbreviations in "By Agency" tab are unexplained.** The column headers SOL, PRE, SS, AWD, SPC, OTH are meaningful to a procurement expert but not to a product engineer who is new to federal buying. A tooltip or legend ("SOL = Solicitation", "SS = Sources Sought") would remove this barrier.

- **Favorites tab on Awards is intuitive.** Clicking the star and seeing the tab update is a natural workflow. The empty state message "Star an award to save it here" is clear.

- **Analytics page tab labels are clear.** "Top Recipients", "By PSC Code", "By NAICS Code", "By Agency" are descriptive enough to explore without training. Good.

- **No way to know what PSC or NAICS codes mean.** The analytics show codes like `R425` or `336413` but provide no description. A hover tooltip or a linked reference would help the manager understand what market they're looking at.

- **FavoriteButton on the Opportunities list page is missing.** The star appears on AwardsPage list and both detail pages, but `OpportunitiesPage` list view has no star column — only the detail page does. Inconsistent star placement across the two primary list views is confusing.

---

## `Compliance & Ethics Reviewer` — Stakeholder Persona

**Verdict:** No compliance concerns introduced. Favorites are purely internal user data. Analytics are read-only aggregations of public contract data.

### Findings

- **Favorites are per-user and cannot be shared.** The `Favorite` model is scoped to `userId`. There is no feature that exposes one user's favorites to another. Compliant.

- **Analytics query only public contract data.** Recipients, PSC codes, NAICS codes, and agencies are all sourced from USASpending.gov and SAM.gov public APIs. No PII is aggregated. Compliant.

- **No automated actions triggered by favorites or analytics.** Both features are read-only from a workflow perspective — no email, no outreach, no automated follow-up. Compliant.

- **`Favorite` model has no `updatedAt`.** Favorites can be created and deleted but the deletion is unlogged. If an audit trail of "who starred what and when they removed it" is ever required, the current schema won't support it. Low risk now, worth noting for future compliance requirements.

---

## `Data & Analytics Reviewer` — Stakeholder Persona

**Verdict:** Analytics queries are functional but will not scale. Two query design issues (in-memory sort, raw SQL LIMIT mismatch) could produce incorrect results today.

### Findings

- **`getRecipientAnalytics` in-memory sort will not scale.** `prisma.award.groupBy` fetches all grouped recipient rows, then sorts in JavaScript. No DB-level `orderBy` or `take` is applied. As awards grow past 10k rows, this becomes a slow in-memory sort on the server. Fix: use `orderBy: { _sum: { obligatedAmount: "desc" } }, take: 50` in the Prisma `groupBy` call.

- **NAICS `$queryRaw` LIMIT mismatch.** The raw SQL queries fetch the top 100 opps by count and the top 100 awards by spend separately, then merge them in memory. A NAICS code that is #101 by opp count but #1 by award spend would appear in the awards list but have `oppCount: 0` — even though it has opps. The merge produces incorrect oppCount for codes outside the top 100 by each metric. Fix: remove the `LIMIT` from both raw queries (or use a single query that fetches all NAICS entries and sorts in memory post-merge).

- **No analytics caching.** All four endpoints execute aggregate queries on every request. These are expensive operations (groupBy on large tables, raw SQL with unnest). TanStack Query's `staleTime` should be set (e.g., 5 minutes) on all analytics queries in `AnalyticsPage`.

- **`getAgencyAnalytics` default sort is `oppCount + awardCount`.** This produces a combined rank that has no clear business meaning. The two metrics have different magnitudes. Agencies should be sorted by a single primary metric; the combined sort should be removed in favor of the default matching the UI's default sort button.

- **Deduplication on favorites `toggleFavorite` is correct.** The `findFirst` + `delete`/`create` pattern correctly handles the toggle. The unique constraints on the schema (`@@unique([userId, opportunityId])`, `@@unique([userId, awardId])`) provide a safety net against duplicate favorites. No data integrity concern.

---

## Consolidated Priority Matrix

| Priority | Issue | Agent | Fix |
|---|---|---|---|
| 🔴 Critical | Duplicate `accessor: "totalObligated"` in RecipientAnalytics and CodeAnalytics causes React key conflict and may skip rendering the Bar column | frontend_developer, fullstack_tester | Give Bar column `accessor: "_bar"` and use `render: (_, row) => <Bar ...>` |
| 🔴 Critical | `getNaicsAnalytics` LIMIT 100 on sub-queries produces wrong `oppCount` for codes outside top 100 by opp count | Data & Analytics Reviewer | Remove LIMIT from raw SQL sub-queries or use a single union query |
| 🟠 High | `getRecipientAnalytics` in-memory sort and slice — unbounded as data grows | backend_developer, Data & Analytics Reviewer | Add `orderBy: { _sum: { obligatedAmount: "desc" } }, take: 50` to Prisma groupBy |
| 🟠 High | `FavoriteButton` is not optimistic — star lags on slow connections; README incorrectly claims optimistic UI | frontend_developer | Implement `queryClient.setQueryData` pre-mutation optimistic update, or remove the claim from README |
| 🟠 High | Favorites toggle race condition — double-click before `isPending` can fire two concurrent `create` calls | fullstack_tester | Debounce the click handler or use `deleteMany`/upsert instead of findFirst+create |
| 🟡 Medium | Analytics queries have no `staleTime` — every tab switch hits the DB | web_architect, Data & Analytics Reviewer | Add `staleTime: 5 * 60 * 1000` to all four analytics `useQuery` calls |
| 🟡 Medium | `getAgencyAnalytics` default sort (`oppCount + awardCount`) is misleading; doesn't match frontend default | backend_developer | Sort by `awardTotal` desc to match the frontend's default sort button |
| 🟡 Medium | Star button missing from OpportunitiesPage list view (inconsistent with AwardsPage) | frontend_developer | Add `FavoriteButton` column to OpportunitiesPage table |
| 🟡 Medium | Agency analytics mixes hierarchy levels — AGENCY and OFFICE totals double-count spend | Federal Procurement Consultant | Add level filter or group by top-level AGENCY only by default |
| 🟡 Medium | `listFavorites` returns full records with no select projection — large payload | backend_developer | Add `select` to return only needed fields |
| 🟡 Medium | `Favorite` model has no `updatedAt` — deletions are unaudited | Compliance Reviewer | Add `updatedAt DateTime @updatedAt` to Favorite model |
| 🟢 Lower | `InboxItemDetail` notes condition uses `!isAdmin` instead of `hasReadAccess && !isAdmin` — fragile but safe | frontend_developer | Update condition for explicitness |
| 🟢 Lower | SOL/PRE/SS/AWD/SPC/OTH abbreviations unexplained in Agency tab | SupplyTiger Manager | Add tooltips or a legend row |
| 🟢 Lower | No date range filter on analytics | Federal Procurement Consultant | Add FY or date range selector as a future milestone |
| 🟢 Lower | Local `Table` in AnalyticsPage should be renamed `AnalyticsTable` to avoid naming collision risk | web_architect | Rename component |
| 🟢 Lower | `Favorite` model allows null-null rows at DB level | web_architect | Add application-level guard or DB check constraint |
