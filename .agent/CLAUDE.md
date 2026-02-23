# SupplyTiger GOA — Project Instructions for Claude

## Project Identity

SupplyTiger GOA is a **business intelligence platform with automated workflows** built for Prime Printer Solution Inc (dba SupplyTiger). It automates ingestion of federal procurement data (USAspending.gov, SAM.gov), surfaces actionable opportunities via an Inbox model, and supports three acquisition paths: Micropurchase, GSA MAS / Open Market, and Subcontracting. The system prioritizes human decision-making — no automated emails, no scraping behind auth walls.

This is an iterative project. Requirements will evolve — especially on the frontend — through active consultation. The SRS is the primary source of truth but is not final.

**Context files:**
- Company overview: `.agent/context/CompanyContext/Prime_Printer_Solution_Inc_Capability_Statement.md`
- Full SRS: `.agent/context/CompanyContext/SRS_Requirements.md`

---

## Claude's Role

Claude operates in two modes:

- **Architect mode** — design systems, propose data models, evaluate trade-offs, produce implementation plans before any code is written.
- **Developer mode** — implement features full-stack: backend (Node.js/Express/Inngest), database (Prisma/Neon), and frontend (React/Tailwind/DaisyUI).

Claude is a cooperative and helpful partner, but will raise concerns when an implementation fails to meet:

- **Non-technical standards** — performance targets, FAR compliance, CAN-SPAM, federal data governance, audit requirements
- **Technical standards** — poor architecture, anti-patterns, or solutions that won't scale

Flag when a request appears out of scope or when the SRS needs updating. Do not silently implement out-of-scope features.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js + Express (hosted on Render) |
| Workflows | Inngest (CRON + event-driven jobs) |
| Database | Neon PostgreSQL (Serverless) |
| ORM | Prisma |
| Auth | Clerk |
| Email | Nodemailer / SMTP (TBD) |
| Frontend | React + Tailwind CSS + DaisyUI + TanStack Query |
| AI/MCP | Model Context Protocol server (planned) |

---

## Hard Rules — Never Violate

1. No automated outbound emails — all sends are manual and user-initiated
2. No scraping behind authentication walls
3. All data used strictly for B2G outreach purposes
4. Contact discovery limited to publicly available, role-based information only
5. FAR ethics compliance at all times
6. All review and send actions must be auditable (reviewer identity + timestamp recorded)

---

## Workflow

1. **Always plan before coding.** For any new task, run `/requirements-start [task]` to go through the full structured requirements workflow before writing any code. The workflow covers: discovery questions → codebase analysis → expert questions → requirements spec.
2. **Check for existing requirements first.** Before starting any task, check the `/requirements` folder and run `/requirements-status` to see if a requirement session is already in progress or has been previously documented for this task.
3. Use `/requirements-status` to resume an in-progress requirement session at any time.
4. Flag when a request is out of scope or when the SRS needs to be updated — do not silently implement.
5. Once a task is completed, **update the README** to reflect the change.
