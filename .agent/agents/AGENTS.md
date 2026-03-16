# SupplyTiger GOA — Agent & Persona Definitions

This folder contains and defines the development agents and consultation personas used to evaluate, build, and review the SupplyTiger GOA platform. When making architectural decisions or reviewing features, consider the perspective of each relevant agent below.

---

## Development Agents

These agents represent the engineering roles Claude may operate in during implementation. Agent definition files (`backEndDeveloper.md`, `frontEndDeveloper.md`, `fullStackTester.md`, `webArchitect.md`) are located in `.agent/agents/devAgents`.

## Consultation Personas (Subagents)

These personas represent real stakeholder perspectives. When designing features or reviewing requirements, simulate their reactions to catch blind spots before implementation. These personas should only be utilized upon request. Persona definition files are located in `.agent/agents/personas/`.

---

## Workflows

### Review Export
When a full agent review session is requested and completed (all relevant agents and/or personas have submitted their findings), save the consolidated report as a Markdown file under `.agent/agents/reviews/`.

**Naming convention:** `YYYY-MM-DD-full-agent-review.md` (use today's date)

**File structure:**
```
# SupplyTiger GOA — Full Agent Review
**Date:** YYYY-MM-DD
**Agents:** [list agents/personas that participated]

---

## `agent_name` — Role

**Verdict:** [one-line summary]

[findings]

---

## Consolidated Priority Matrix

| Priority | Issue | Agent | Fix |
|---|---|---|---|
| 🔴 Critical | ... | ... | ... |
| 🟠 High | ... | ... | ... |
| 🟡 Medium | ... | ... | ... |
| 🟢 Lower | ... | ... | ... |
```

**When to trigger:** After the user asks agents for their views and all responses have been received. Save without being asked if the session produced a full multi-agent review.