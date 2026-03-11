/* eslint-disable react-refresh/only-export-components */
import { Loader2 } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const getTodayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const fmt = (n) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const truncate = (str, max = 50) =>
  str && str.length > max ? str.slice(0, max) + "…" : str ?? "—";

export const fmtDate = (val) =>
  val ? new Date(val).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

// ─── Constants ────────────────────────────────────────────────────────────────

export const STATUS_BADGE = {
  NEW: "badge-neutral",
  IN_REVIEW: "badge-warning",
  QUALIFIED: "badge-success",
  DISMISSED: "badge-error",
  CONTACTED: "badge-info",
  CLOSED: "badge-ghost",
};

export const TYPE_BADGE = {
  SOLICITATION: "badge-primary",
  PRE_SOLICITATION: "badge-secondary",
  SOURCES_SOUGHT: "badge-accent",
  AWARD_NOTICE: "badge-success",
  SPECIAL_NOTICE: "badge-warning",
  OTHER: "badge-ghost",
};

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

export const SectionShell = ({ title, subtitle, children, action }) => (
  <section className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="card-title text-base">{title}</h2>
          {subtitle && <p className="text-sm opacity-60">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  </section>
);

export const SectionLoader = () => (
  <div className="flex justify-center py-8">
    <Loader2 className="size-6 animate-spin opacity-50" />
  </div>
);

export const SectionError = () => (
  <p className="text-sm text-error py-4">Failed to load data.</p>
);

export const EmptyState = ({ message }) => (
  <p className="text-sm opacity-50 py-6 text-center">{message}</p>
);
