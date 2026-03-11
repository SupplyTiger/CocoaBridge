import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Mail, Handshake, Award, Loader2 } from "lucide-react";
import { dbApi } from "../../lib/api.js";

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ title, icon: Icon, isLoading, isError, count, linkTo, colorClass = "text-primary" }) => (
  <Link to={linkTo} className="card bg-base-100 shadow-sm border border-base-300 hover:border-primary transition-colors">
    <div className="card-body gap-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-70">{title}</span>
        <Icon className={`size-5 ${colorClass} opacity-70`} />
      </div>
      <div className="text-4xl font-bold">
        {isLoading ? (
          <Loader2 className="size-7 animate-spin opacity-40" />
        ) : isError ? (
          <span className="text-2xl opacity-40">—</span>
        ) : (
          count
        )}
      </div>
      <p className="text-xs opacity-50">since midnight today</p>
    </div>
  </Link>
);

// ─── KPI Section ──────────────────────────────────────────────────────────────

const KpiSection = ({ todayMidnight }) => {
  const { data: inboxData, isLoading: inboxLoading, isError: inboxError } = useQuery({
    queryKey: ["dashboard-inbox-today"],
    queryFn: () => dbApi.listInboxItems({ limit: 50, sortBy: "createdAt", sortDir: "desc" }),
  });

  const { data: oppsData, isLoading: oppsLoading, isError: oppsError } = useQuery({
    queryKey: ["dashboard-opportunities-today"],
    queryFn: () => dbApi.listOpportunities({ limit: 50 }),
  });

  const { data: awardsData, isLoading: awardsLoading, isError: awardsError } = useQuery({
    queryKey: ["dashboard-awards-today"],
    queryFn: () => dbApi.listAwards({ limit: 50 }),
  });

  const inboxCount = useMemo(() => {
    if (!inboxData?.data) return 0;
    return inboxData.data.filter((i) => new Date(i.createdAt) >= todayMidnight).length;
  }, [inboxData, todayMidnight]);

  const oppsCount = useMemo(() => {
    if (!oppsData?.data) return 0;
    return oppsData.data.filter((o) => new Date(o.postedDate) >= todayMidnight).length;
  }, [oppsData, todayMidnight]);

  const awardsCount = useMemo(() => {
    if (!awardsData?.data) return 0;
    return awardsData.data.filter((a) => new Date(a.createdAt) >= todayMidnight).length;
  }, [awardsData, todayMidnight]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <KpiCard
        title="Inbox Items Today"
        icon={Mail}
        isLoading={inboxLoading}
        isError={inboxError}
        count={inboxCount}
        linkTo="/inbox"
        colorClass="text-info"
      />
      <KpiCard
        title="Opportunities Today"
        icon={Handshake}
        isLoading={oppsLoading}
        isError={oppsError}
        count={oppsCount}
        linkTo="/opportunities"
        colorClass="text-primary"
      />
      <KpiCard
        title="Awards Today"
        icon={Award}
        isLoading={awardsLoading}
        isError={awardsError}
        count={awardsCount}
        linkTo="/awards"
        colorClass="text-success"
      />
    </div>
  );
};

export default KpiSection;
