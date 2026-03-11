import { useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import { Lock } from "lucide-react";
import { useCurrentUser } from "../lib/CurrentUserContext.jsx";
import { getTodayMidnight } from "../components/dashboard/dashboardHelpers.jsx";
import KpiSection from "../components/dashboard/KpiSection.jsx";
import RecentActivitySection from "../components/dashboard/RecentActivitySection.jsx";
import UpcomingDeadlinesSection from "../components/dashboard/UpcomingDeadlinesSection.jsx";
import UpcomingIndustryDaysSection from "../components/dashboard/UpcomingIndustryDaysSection.jsx";

const DashboardPage = () => {
  const currentUser = useCurrentUser();
  const { user } = useUser();

  const todayMidnight = useMemo(() => getTodayMidnight(), []);

  const greeting = user?.firstName ?? user?.fullName ?? "there";

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (currentUser?.role === "USER") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <div className="card bg-base-200 shadow-sm max-w-md w-full">
          <div className="card-body items-center gap-3">
            <div className="text-4xl"><Lock /></div>
            <h2 className="card-title text-lg">Access Restricted</h2>
            <p className="text-base-content/70 text-sm">
              You don&apos;t have the credentials to view this data. Please
              contact the system administrator to receive access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Section 1: Greeting */}
      <div>
        <h1 className="text-2xl font-semibold">Hello, {greeting}!</h1>
        <p className="text-sm opacity-60 mt-0.5">{todayLabel}</p>
      </div>

      {/* Section 2: KPI Cards */}
      <KpiSection todayMidnight={todayMidnight} />

      {/* Section 3: Recent Activity */}
      <RecentActivitySection />

      {/* Section 4: Upcoming Deadlines */}
      <UpcomingDeadlinesSection />

      {/* Section 5: Upcoming Industry Days */}
      <UpcomingIndustryDaysSection />
    </div>
  );
};

export default DashboardPage;
