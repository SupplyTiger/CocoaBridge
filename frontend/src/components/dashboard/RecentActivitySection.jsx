import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { dbApi } from "../../lib/api.js";
import {
  SectionShell,
  SectionLoader,
  SectionError,
  EmptyState,
  STATUS_BADGE,
  TYPE_BADGE,
  truncate,
  fmt,
  fmtDate,
} from "./dashboardHelpers.jsx";

// ─── Recent Inbox Card ────────────────────────────────────────────────────────

const RecentInboxCard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-recent-inbox"],
    queryFn: () => dbApi.listInboxItems({ limit: 5, sortBy: "createdAt", sortDir: "desc" }),
  });

  const items = data?.data ?? [];

  return (
    <SectionShell
      title="Recent Inbox Items"
      action={
        <Link to="/inbox" className="link link-hover text-xs opacity-60">
          View all →
        </Link>
      }
    >
      {isLoading && <SectionLoader />}
      {isError && <SectionError />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState message="No inbox items yet." />
      )}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="flex flex-col divide-y divide-base-200">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/inbox/${item.id}`}
                className="flex flex-col gap-0.5 py-2.5 hover:bg-base-200 -mx-1 px-1 rounded transition-colors"
              >
                <span className="text-sm font-medium link-hover leading-snug">
                  {truncate(item.title)}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.reviewStatus && (
                    <span className={`badge badge-xs ${STATUS_BADGE[item.reviewStatus] ?? "badge-neutral"}`}>
                      {item.reviewStatus}
                    </span>
                  )}
                  <span className="text-xs opacity-50">{fmtDate(item.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
};

// ─── Recent Opportunities Card ────────────────────────────────────────────────

const RecentOpportunitiesCard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-recent-opps"],
    queryFn: () => dbApi.listOpportunities({ limit: 5 }),
  });

  const items = data?.data ?? [];

  return (
    <SectionShell
      title="Recent Opportunities"
      action={
        <Link to="/opportunities" className="link link-hover text-xs opacity-60">
          View all →
        </Link>
      }
    >
      {isLoading && <SectionLoader />}
      {isError && <SectionError />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState message="No opportunities yet." />
      )}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="flex flex-col divide-y divide-base-200">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/opportunities/${item.id}`}
                className="flex flex-col gap-0.5 py-2.5 hover:bg-base-200 -mx-1 px-1 rounded transition-colors"
              >
                <span className="text-sm font-medium link-hover leading-snug">
                  {truncate(item.title)}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.type && (
                    <span className={`badge badge-xs ${TYPE_BADGE[item.type] ?? "badge-ghost"}`}>
                      {item.type}
                    </span>
                  )}
                  {item.responseDeadline && (
                    <span className="text-xs opacity-50">Due {fmtDate(item.responseDeadline)}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
};

// ─── Recent Awards Card ───────────────────────────────────────────────────────

const RecentAwardsCard = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-recent-awards"],
    queryFn: () => dbApi.listAwards({ limit: 5 }),
  });

  const items = data?.data ?? [];

  return (
    <SectionShell
      title="Recent Awards"
      action={
        <Link to="/awards" className="link link-hover text-xs opacity-60">
          View all →
        </Link>
      }
    >
      {isLoading && <SectionLoader />}
      {isError && <SectionError />}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState message="No awards yet." />
      )}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="flex flex-col divide-y divide-base-200">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/awards/${item.id}`}
                className="flex flex-col gap-0.5 py-2.5 hover:bg-base-200 -mx-1 px-1 rounded transition-colors"
              >
                <span className="text-sm font-medium link-hover leading-snug">
                  {truncate(item.description)}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono opacity-70">{fmt(item.obligatedAmount)}</span>
                  <span className="text-xs opacity-50">{fmtDate(item.startDate)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionShell>
  );
};

// ─── Recent Activity Section ──────────────────────────────────────────────────

const RecentActivitySection = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <RecentInboxCard />
    <RecentOpportunitiesCard />
    <RecentAwardsCard />
  </div>
);

export default RecentActivitySection;
