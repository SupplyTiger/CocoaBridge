# Welcome to CocoaBridge

Welcome to the team. You're joining at a genuinely interesting moment — the core platform is stable, the data pipeline is running, and there's a clear list of high-value features ready to be built. Your work here will have a direct impact on how SupplyTiger wins government contracts.

---

## What You're Walking Into

CocoaBridge is SupplyTiger's internal procurement intelligence platform. It monitors federal contract databases, scores incoming opportunities against SupplyTiger's product profile, and surfaces the most relevant ones as work items for the team to act on. It also connects to an AI layer (via the MCP server) that lets the team query the procurement data conversationally.

The app is live, in daily use, and actively evolving. You're not maintaining legacy code — you're building the next layer.

---

## Your Goals

1. **Get oriented first.** Read through the documentation folder before writing a single line of code. Understand the system end-to-end, then dive in.

2. **Pick up the planned features.** See `planned-features.md` for what's next, in priority order. The MCP server migration is the most immediately impactful — it's a deployment task, not a coding task, and it unblocks several other things. Start there.

3. **Build with the team, not around them.** Check in regularly. Don't go heads-down for a week on something that turns out to be the wrong thing.

---

## Advice

**Get feedback from John and Ryan early and often.** They know the business context behind features. Before you finalize an approach on anything non-trivial, run it by them. Their input will save you from building something technically correct but operationally useless.

**Read the code before you change it.** CocoaBridge has a consistent set of patterns — how tools are registered, how routes are structured, how data flows through Inngest. Following these patterns matters more than you might think. When in doubt, find the nearest similar feature and mirror it.

**Use AI tooling to your advantage.** It's worth learning how to use AI-powered workflows effectively for exploration and implementation. Don't lean on it as a crutch, but do use it when it saves you time — especially for understanding unfamiliar parts of the codebase.

**Commit small, branch often.** See `github.md` for the branching workflow. Smaller pull requests get reviewed faster and are easier to reason about.

---

## Resources

- **Documentation:** [github.com/SupplyTiger/CocoaBridge/tree/main/documentation](https://github.com/SupplyTiger/CocoaBridge/tree/main/documentation)
- **Mailing group:** cocoabridge@supplytiger.com — keep an eye on this; it's where project-relevant emails land
- **Questions:** divyamalikverma@gmail.com, reach out directly if you're stuck, something is unclear, or you need access to something

---

Good luck. The codebase is in good shape and the work ahead is well-defined. Make it yours.

— Divya
