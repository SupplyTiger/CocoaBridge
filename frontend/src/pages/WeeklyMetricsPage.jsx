import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { analyticsApi } from "../lib/api.js";

// ─── ISO week helpers ─────────────────────────────────────────────────────────

const toISOWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dow); // Thursday of same week
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const weekNum = Math.ceil(((d - startOfYear) / 86400000 + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, "0")}`;
};

const isoWeekToMonday = (weekStr) => {
  const [year, w] = weekStr.split("-W").map(Number);
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const result = new Date(jan4);
  result.setDate(jan4.getDate() - (dow - 1) + (w - 1) * 7);
  return result;
};

const shiftWeek = (weekStr, delta) => {
  const monday = isoWeekToMonday(weekStr);
  monday.setDate(monday.getDate() + delta * 7);
  return toISOWeek(monday);
};

const CURRENT_WEEK = toISOWeek(new Date());

const formatWeekLabel = (week, weekStart, weekEnd) => {
  if (!week) return "";
  const [, w] = week.split("-W");
  const fmtDate = (s) => new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const fmtDateYear = (s) => new Date(s + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `Week ${parseInt(w, 10)} — ${fmtDate(weekStart)} – ${fmtDateYear(weekEnd)}`;
};

// ─── Delta badge ──────────────────────────────────────────────────────────────

const Delta = ({ current, previous }) => {
  const delta = current - previous;
  const label = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "=";
  const cls = delta > 0 ? "text-success" : delta < 0 ? "text-error" : "text-base-content/40";
  return <span className={`text-sm font-semibold ${cls}`}>{label}</span>;
};

// ─── Drill-down tables ────────────────────────────────────────────────────────

const fmtDate = (s) => s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";

const InboxRecords = ({ records }) => (
  <table className="table table-xs w-full mt-2">
    <thead><tr><th>Title</th><th>Reviewed by</th><th>Date</th></tr></thead>
    <tbody>
      {records.map((r) => (
        <tr key={r.inboxItemId} className="hover">
          <td><Link to={`/inbox/${r.inboxItemId}`} className="link link-hover text-xs">{r.title ?? "—"}</Link></td>
          <td className="text-xs opacity-60">{r.reviewedBy ?? "—"}</td>
          <td className="text-xs opacity-60">{fmtDate(r.reviewedAt)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ContactRecords = ({ records }) => (
  <table className="table table-xs w-full mt-2">
    <thead><tr><th>Name</th><th>Email</th></tr></thead>
    <tbody>
      {records.map((r) => (
        <tr key={r.contactId} className="hover">
          <td><Link to={`/contacts/${r.contactId}`} className="link link-hover text-xs">{r.fullName ?? "—"}</Link></td>
          <td className="text-xs opacity-60">{r.email ?? "—"}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const InteractionRecords = ({ records }) => (
  <table className="table table-xs w-full mt-2">
    <thead><tr><th>Contact</th><th>Logged by</th><th>Date</th></tr></thead>
    <tbody>
      {records.map((r) => (
        <tr key={r.interactionId} className="hover">
          <td><Link to={`/contacts/${r.contactId}`} className="link link-hover text-xs">{r.contactName ?? "—"}</Link></td>
          <td className="text-xs opacity-60">{r.loggedByName ?? "—"}</td>
          <td className="text-xs opacity-60">{fmtDate(r.loggedAt)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const BuyerPathRecords = ({ records }) => (
  <table className="table table-xs w-full mt-2">
    <thead><tr><th>Source</th><th>Entity</th><th>Date</th></tr></thead>
    <tbody>
      {records.map((r) => (
        <tr key={`${r.source}-${r.id}`} className="hover">
          <td><span className={`badge badge-xs ${r.source === "INBOX" ? "badge-primary" : "badge-secondary"}`}>{r.source === "INBOX" ? "Inbox" : "Interaction"}</span></td>
          <td>
            {r.source === "INBOX"
              ? <Link to={`/inbox/${r.id}`} className="link link-hover text-xs">{r.title ?? "—"}</Link>
              : <Link to={`/contacts/${r.contactId}`} className="link link-hover text-xs">{r.contactName ?? "—"}</Link>
            }
          </td>
          <td className="text-xs opacity-60">{fmtDate(r.source === "INBOX" ? r.reviewedAt : r.loggedAt)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// ─── Metric card ──────────────────────────────────────────────────────────────

const MetricCard = ({ title, description, current, previous, children }) => {
  const [expanded, setExpanded] = useState(false);
  const hasRecords = current.records?.length > 0;

  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body gap-2 py-4">
        <p className="text-sm opacity-60">{title}</p>
        <div className="flex items-end justify-between">
          <span className="text-4xl font-bold">{current.count}</span>
          <Delta current={current.count} previous={previous.count} />
        </div>

        <p className="text-xs opacity-40">prev week: {previous.count}</p>
        {description && <p className="text-xs opacity-55 leading-relaxed">{description}</p>}

        {hasRecords && (
          <button
            className="btn btn-xs btn-ghost border border-base-300 mt-1 w-full flex items-center gap-1"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            {expanded ? "Hide" : "Show"} records
          </button>
        )}

        {expanded && hasRecords && (
          <div className="overflow-x-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const WeeklyMetricsPage = () => {
  const [week, setWeek] = useState(CURRENT_WEEK);
  const isCurrentWeek = week === CURRENT_WEEK;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["weeklyMetrics", week],
    queryFn: () => analyticsApi.getWeeklyMetrics(week),
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-semibold">Metrics</h1>
          {data && (
            <p className="text-sm opacity-60 mt-0.5">{formatWeekLabel(data.week, data.weekStart, data.weekEnd)}</p>
          )}
        </div>
        <div className="join text-primary-content">
          <button
            className="join-item btn btn-sm bg-primary hover:bg-primary/80 border border-primary-content/60 text-primary-content"
            onClick={() => setWeek((w) => shiftWeek(w, -1))}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            className="join-item btn btn-sm bg-accent/40 border border-accent-content/20 text-accent-content"
            onClick={() => setWeek(CURRENT_WEEK)}
            disabled={isCurrentWeek}
          >
            This week
          </button>
          <button
            className="join-item btn btn-sm bg-primary hover:bg-primary/80 border border-primary-content/60 text-primary-content"
            onClick={() => setWeek((w) => shiftWeek(w, 1))}
            disabled={isCurrentWeek}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="size-8 animate-spin opacity-40" />
        </div>
      )}

      {isError && (
        <div className="alert alert-error text-sm">Failed to load metrics.</div>
      )}

      {data && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="New Contacts"
            description="Contacts added this week that are linked to at least one inbox item — people we identified through active pipeline work."
            current={data.current.newContacts}
            previous={data.previous.newContacts}
          >
            <ContactRecords records={data.current.newContacts.records} />
          </MetricCard>

          <MetricCard
            title="Outreaches Sent"
            description="Inbox items moved to Contacted this week — first touches made to a buyer or agency POC."
            current={data.current.outreaches}
            previous={data.previous.outreaches}
          >
            <InboxRecords records={data.current.outreaches.records} />
          </MetricCard>

          <MetricCard
            title="Followups Sent"
            description="Contact interactions logged as Follow-Up this week — second and subsequent touches after the initial outreach."
            current={data.current.followups}
            previous={data.previous.followups}
          >
            <InteractionRecords records={data.current.followups.records} />
          </MetricCard>

          <MetricCard
            title="Solicitations Screened"
            description="Inbox items moved to In Review this week — opportunities that passed the initial filter and are being evaluated for bid/no-bid."
            current={data.current.screened}
            previous={data.previous.screened}
          >
            <InboxRecords records={data.current.screened.records} />
          </MetricCard>

          <MetricCard
            title="Buyer Paths Found"
            description="Qualified inbox items plus interactions where a buyer responded this week — deduplicated signals that a real procurement path exists."
            current={data.current.buyerPaths}
            previous={data.previous.buyerPaths}
          >
            <BuyerPathRecords records={data.current.buyerPaths.records} />
          </MetricCard>
        </div>
      )}
    </div>
  );
};

export default WeeklyMetricsPage;
