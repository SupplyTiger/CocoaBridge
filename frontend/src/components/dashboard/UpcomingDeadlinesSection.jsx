import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { dbApi } from "../../lib/api.js";
import PaginationButton from "../PaginationButton.jsx";
import {
  SectionShell,
  SectionLoader,
  SectionError,
  EmptyState,
  TYPE_BADGE,
  truncate,
  fmtDate,
} from "./dashboardHelpers.jsx";

const PAGE_SIZE = 10;

const UpcomingDeadlinesSection = () => {
  const now = useMemo(() => new Date(), []);
  const in30Days = useMemo(() => new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), [now]);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-upcoming-deadlines"],
    queryFn: () =>
      dbApi.listOpportunities({ active: true, sortBy: "responseDeadline", sortDir: "asc", limit: 200 }),
  });

  const deadlines = useMemo(() => {
    if (!data?.data) return [];
    return data.data.filter((o) => {
      if (!o.responseDeadline) return false;
      const d = new Date(o.responseDeadline);
      return d > now && d <= in30Days;
    });
  }, [data, now, in30Days]);

  const totalPages = Math.max(1, Math.ceil(deadlines.length / PAGE_SIZE));
  const paged = deadlines.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <SectionShell
      title="Upcoming Deadlines"
      subtitle="Response deadlines in the next 30 days"
    >
      {isLoading && <SectionLoader />}
      {isError && <SectionError />}
      {!isLoading && !isError && deadlines.length === 0 && (
        <EmptyState message="No deadlines in the next 30 days." />
      )}
      {!isLoading && !isError && deadlines.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr>
                  <th className="text-accent-content">Title</th>
                  <th className="text-accent-content">Type</th>
                  <th className="text-accent-content text-right">Deadline</th>
                  <th className="text-accent-content text-right">Time Left</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((opp) => {
                  const daysLeft = Math.ceil(
                    (new Date(opp.responseDeadline) - now) / 86400000
                  );
                  const urgencyClass =
                    daysLeft <= 3
                      ? "badge-error"
                      : daysLeft <= 7
                      ? "badge-warning"
                      : "badge-ghost";

                  return (
                    <tr key={opp.id} className="hover">
                      <td className="text-accent-content/80">
                        <Link
                          to={`/opportunities/${opp.id}`}
                          className="link link-hover font-medium text-sm"
                        >
                          {truncate(opp.title, 60)}
                        </Link>
                      </td>
                      <td>
                        {opp.type && (
                          <span className={`badge badge-xs ${TYPE_BADGE[opp.type] ?? "badge-ghost"}`}>
                            {opp.type}
                          </span>
                        )}
                      </td>
                      <td className="text-right text-sm opacity-70 whitespace-nowrap">
                        {fmtDate(opp.responseDeadline)}
                      </td>
                      <td className="text-right">
                        <span className={`badge badge-sm ${urgencyClass}`}>
                          in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <PaginationButton
              totalPages={totalPages}
              currentPage={page}
              onPageChange={setPage}
              size="sm"
            />
          )}
        </>
      )}
    </SectionShell>
  );
};

export default UpcomingDeadlinesSection;
