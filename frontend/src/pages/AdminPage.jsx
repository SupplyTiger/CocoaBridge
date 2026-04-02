import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, Loader2, ChevronDown, ChevronRight, X } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../lib/api.js";
import { useCurrentUser } from "../lib/CurrentUserContext.jsx";

// ─── Helpers ─────────────────────────────────────────────────────────────────
// Testing
const ROLES = ["USER", "READ_ONLY", "ADMIN"];

const ROLE_LABELS = {
  ADMIN: "Admin",
  READ_ONLY: "Read Only",
  USER: "User",
};

const SYNC_JOBS = [
  { type: "sam-opportunities", label: "SAM Opportunities", description: "Pull current active opportunities from SAM.gov and upsert into the database." },
  { type: "usaspending-awards", label: "USASpending Awards", description: "Sync recent federal contract awards from USASpending.gov across all configured presets." },
  { type: "sam-descriptions", label: "Opportunity Descriptions", description: "Backfill missing descriptions for opportunities that were synced without full text." },
  { type: "sam-industry-days", label: "Industry Days", description: "Sync industry day and outreach events from SAM.gov." },
  { type: "sam-attachments", label: "Attachment Metadata", description: "Fetch file metadata (name, size, type) for opportunity attachments from the SAM.gov resources endpoint." },
  { type: "score-opportunity-attachments", label: "Score New Opportunities", description: "Run FLIS-based scoring on unprocessed PSC/NAICS-matched opportunities. High scores are auto-admitted to inbox; mid-range scores go to the review queue." },
  { type: "score-attachments", label: "Score Parsed Attachments", description: "Run MCP scoring on attachments that have parsed text but no score result yet. Writes score to the attachment record." },
  { type: "backfill-inbox-scores", label: "Backfill Inbox Scores", description: "Re-score inbox items that have parsed attachment text but no attachment score. One-time catch-up for items created before the scoring pipeline was live." },
  { type: "backfill-award-inbox-scores", label: "Backfill Award Inbox Scores", description: "Score award-linked inbox items that have no score yet. Uses NAICS/PSC/keyword/micropurchase signals. Does not delete items below threshold." },
  { type: "cleanup-chats", label: "Cleanup Expired Chats", description: "Delete chat conversations that have passed their retention expiry date." },
];

const timeAgo = (dateStr) => {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const StatusBadge = ({ status }) => {
  if (!status) return <span className="badge badge-ghost badge-sm">Never run</span>;
  if (status === "PARTIAL") return <span className="badge badge-warning badge-sm gap-1"><AlertCircle className="size-3" />Partial</span>;
  if (status === "SUCCESS") return <span className="badge badge-success badge-sm gap-1"><CheckCircle className="size-3" />Success</span>;
  if (status === "FAILED") return <span className="badge badge-error badge-sm gap-1"><XCircle className="size-3" />Failed</span>;
  return <span className="badge badge-warning badge-sm gap-1"><Clock className="size-3" />Running</span>;
}

// ─── User Management Section ─────────────────────────────────────────────────

const UserManagement = () => {
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: adminApi.listUsers,
  });

  const { mutate: updateUser } = useMutation({
    mutationFn: ({ id, body }) => adminApi.updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User updated");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message ?? "Failed to update user");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Role</th>
            <th>Active</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;
            return (
              <tr key={u.id} className={isSelf ? "opacity-50" : ""}>
                <td>
                  <div className="flex items-center gap-2">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt={u.name} className="w-8 h-8 rounded-full shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-base-300 shrink-0" />
                    )}
                    <span className="font-medium text-sm">{u.name ?? "—"}</span>
                    {isSelf && <span className="badge badge-ghost badge-xs">you</span>}
                  </div>
                </td>
                <td className="text-sm opacity-70">{u.email}</td>
                <td>
                  <select
                    className="select select-xs select-bordered"
                    value={u.role}
                    disabled={isSelf}
                    onChange={(e) => updateUser({ id: u.id, body: { role: e.target.value } })}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm toggle-success"
                    checked={u.isActive}
                    disabled={isSelf}
                    onChange={(e) => updateUser({ id: u.id, body: { isActive: e.target.checked } })}
                  />
                </td>
                <td className="text-xs opacity-60">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sync Controls Section ────────────────────────────────────────────────────

const SyncControls = () => {
  const queryClient = useQueryClient();

  const mutations = Object.fromEntries(
    SYNC_JOBS.map(({ type }) => [
      type,
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useMutation({
        mutationFn: () => adminApi.triggerSync(type),
        onSuccess: (data) => {
          const count = data?.recordsAffected;
          toast.success(
            count != null
              ? `${data.jobName}: ${count} records affected`
              : `${data.jobName} completed`
          );
          queryClient.invalidateQueries({ queryKey: ["systemHealth"] });
        },
        onError: (err) => {
          toast.error(err?.response?.data?.message ?? "Sync failed");
        },
      }),
    ])
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SYNC_JOBS.map(({ type, label, description }) => {
        const mutation = mutations[type];
        return (
          <div key={type} className="flex flex-col gap-1.5 p-3 rounded-lg bg-accent-content/10">
            <button
              className="btn btn-sm gap-2 bg-accent-content/10 hover:bg-accent-content/20 border-0 text-accent-content self-start"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              {label}
            </button>
            {description && <p className="text-xs opacity-50 leading-snug">{description}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── System Health Section ────────────────────────────────────────────────────

const SystemHealth = () => {
  const { data: health = [], isLoading } = useQuery({
    queryKey: ["systemHealth"],
    queryFn: adminApi.getSystemHealth,
    refetchInterval: 30000, // refresh every 30s
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {health.map(({ jobId, jobName, lastRun, history = [] }) => (
        <JobHealthCard key={jobId} jobName={jobName} lastRun={lastRun} history={history} />
      ))}
    </div>
  );
}

const JobHealthCard = ({ jobName, lastRun, history }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="card card-compact bg-accent-content/10">
      <div className="card-body gap-1">
        <p className="text-sm font-medium">{jobName}</p>
        <div className="flex items-center justify-between">
          <StatusBadge status={lastRun?.status} />
          <span className="text-xs opacity-60">{timeAgo(lastRun?.startedAt)}</span>
        </div>
        {lastRun?.recordsAffected != null && (
          <p className="text-xs opacity-60">{lastRun.recordsAffected} records</p>
        )}
        {lastRun?.errorMessage && (
          <p className="text-xs text-error truncate" title={lastRun.errorMessage}>
            {lastRun.errorMessage}
          </p>
        )}
        {history.length > 1 && (
          <div>
            <button
              type="button"
              className="flex items-center gap-1 text-xs opacity-50 hover:opacity-80 mt-1"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              History ({history.length})
            </button>
            {open && (
              <div className="flex flex-col gap-1 mt-1">
                {history.slice(1).map((run) => (
                  <div key={run.id} className="flex items-center justify-between text-xs opacity-60">
                    <StatusBadge status={run.status} />
                    <span>{timeAgo(run.startedAt)}</span>
                    {run.recordsAffected != null && <span>{run.recordsAffected} rec</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DB Stats Section ─────────────────────────────────────────────────────────

const DbStats = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dbStats"],
    queryFn: adminApi.getDbStats,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return <div className="flex justify-center py-4"><Loader2 className="size-5 animate-spin opacity-50" /></div>;
  }

  const inboxTotal = Object.values(stats?.inbox ?? {}).reduce((s, n) => s + n, 0);

  const tiles = [
    { label: "Active Opps", value: stats?.opportunities?.active ?? 0 },
    { label: "Inactive Opps", value: stats?.opportunities?.inactive ?? 0 },
    { label: "Awards", value: stats?.awards ?? 0 },
    { label: "Contacts", value: stats?.contacts ?? 0 },
    { label: "Inbox Items", value: inboxTotal },
    { label: "Chat Conversations", value: stats?.chatConversations ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {tiles.map(({ label, value }) => (
          <div key={label} className="card card-compact bg-accent-content/10">
            <div className="card-body items-center text-center gap-0">
              <p className="text-lg font-semibold">{value.toLocaleString()}</p>
              <p className="text-xs opacity-60">{label}</p>
            </div>
          </div>
        ))}
      </div>
      {stats?.inbox && Object.keys(stats.inbox).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(stats.inbox).map(([status, count]) => (
            <span key={status} className="badge badge-sm badge-ghost gap-1">
              {status.replace("_", " ")}: {count}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Filter Configuration Section ────────────────────────────────────────────

const FILTER_SECTIONS = [
  { label: "Solicitation Keywords", activeKey: "solicitationKeywords", bankKey: "solicitationKeywordsBank" },
  { label: "NAICS Codes", activeKey: "naicsCodes", bankKey: "naicsCodesBank" },
  { label: "PSC Prefixes", activeKey: "pscPrefixes", bankKey: "pscPrefixesBank" },
  { label: "Industry Day Keywords", activeKey: "industryDayKeywords", bankKey: "industryDayKeywordsBank" },
];

const FilterListEditor = ({ sectionLabel, activeKey, bankKey, config, hideBank = false, placeholder }) => {
  const queryClient = useQueryClient();
  const [activeInput, setActiveInput] = useState("");
  const [bankInput, setBankInput] = useState("");
  const [bankOpen, setBankOpen] = useState(false);

  const activeValues = config[activeKey] ?? [];
  const bankValues = config[bankKey] ?? [];

  const { mutate: saveActive, isPending: savingActive } = useMutation({
    mutationFn: (values) => adminApi.updateFilterConfig(activeKey, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filterConfig"] });
      toast.success(`${sectionLabel} saved`);
    },
    onError: () => toast.error(`Failed to save ${sectionLabel}`),
  });

  const { mutate: saveBank } = useMutation({
    mutationFn: (values) => adminApi.updateFilterConfig(bankKey, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filterConfig"] });
      toast.success("Word bank updated");
    },
    onError: () => toast.error("Failed to update word bank"),
  });

  const addToActive = (value) => {
    const v = value.trim();
    if (!v || activeValues.includes(v)) return;
    saveActive([...activeValues, v]);
  };

  const removeFromActive = (value) => {
    saveActive(activeValues.filter((v) => v !== value));
  };

  const addToBank = (value) => {
    const v = value.trim();
    if (!v || bankValues.includes(v)) return;
    saveBank([...bankValues, v]);
  };

  const removeFromBank = (value) => {
    saveBank(bankValues.filter((v) => v !== value));
  };

  const moveChipToActive = (value) => {
    if (!activeValues.includes(value)) {
      saveActive([...activeValues, value]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Active list */}
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {activeValues.map((v) => (
          <span key={v} className="badge badge-accent text-white gap-1">
            {v}
            <button
              type="button"
              className="hover:opacity-70"
              onClick={() => removeFromActive(v)}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        {activeValues.length === 0 && (
          <span className="text-xs opacity-40 italic">No active values — sync runs without this filter</span>
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-sm input-bordered flex-1 max-w-xs"
          placeholder={placeholder ?? `Add ${sectionLabel.toLowerCase()}…`}
          value={activeInput}
          onChange={(e) => setActiveInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              addToActive(activeInput);
              setActiveInput("");
            }
          }}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={savingActive || !activeInput.trim()}
          onClick={() => { addToActive(activeInput); setActiveInput(""); }}
        >
          {savingActive ? <Loader2 className="size-3 animate-spin" /> : "Add"}
        </button>
      </div>

      {/* Word bank */}
      {!hideBank && (
        <div>
          <button
            type="button"
            className="flex items-center gap-1 text-xs opacity-60 hover:opacity-90"
            onClick={() => setBankOpen((o) => !o)}
          >
            {bankOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
            Word bank ({bankValues.length})
          </button>
          {bankOpen && (
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {bankValues.map((v) => (
                  <span key={v} className="badge badge-secondary text-white gap-1 cursor-pointer hover:badge-primary" onClick={() => moveChipToActive(v)}>
                    {v}
                    <button
                      type="button"
                      className="hover:opacity-70"
                      onClick={(e) => { e.stopPropagation(); removeFromBank(v); }}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {bankValues.length === 0 && (
                  <span className="text-xs opacity-40 italic">Bank is empty</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input input-xs input-bordered flex-1 max-w-xs"
                  placeholder="Add to bank…"
                  value={bankInput}
                  onChange={(e) => setBankInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addToBank(bankInput);
                      setBankInput("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-xs btn-ghost border border-base-300"
                  disabled={!bankInput.trim()}
                  onClick={() => { addToBank(bankInput); setBankInput(""); }}
                >
                  Add to bank
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const FilterConfig = () => {
  const [activeSection, setActiveSection] = useState(FILTER_SECTIONS[0].activeKey);

  const { data: config, isLoading } = useQuery({
    queryKey: ["filterConfig"],
    queryFn: adminApi.getFilterConfig,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin opacity-50" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="join flex-wrap">
        {FILTER_SECTIONS.map(({ label, activeKey }) => (
          <button
            key={activeKey}
            className={`join-item btn btn-sm ${activeSection === activeKey ? "btn-primary" : "btn-ghost hover:bg-accent-content/40 border border-accent-content/40"}`}
            onClick={() => setActiveSection(activeKey)}
          >
            {label}
          </button>
        ))}
      </div>
      {FILTER_SECTIONS.map(({ label, activeKey, bankKey }) => (
        <div key={activeKey} className={activeSection === activeKey ? "" : "hidden"}>
          <FilterListEditor
            sectionLabel={label}
            activeKey={activeKey}
            bankKey={bankKey}
            config={config}
          />
        </div>
      ))}
    </div>
  );
};

// ─── Access Control Section ───────────────────────────────────────────────────

const RetentionEditor = ({ initialDays }) => {
  const queryClient = useQueryClient();
  const [days, setDays] = useState(initialDays);

  const { mutate: saveRetention, isPending: savingRetention } = useMutation({
    mutationFn: (value) => adminApi.updateFilterConfig("chatRetentionDays", [String(value)]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["filterConfig"] });
      toast.success("Chat retention updated");
    },
    onError: () => toast.error("Failed to update chat retention"),
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Chat retention (days)</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={365}
          className="input input-sm input-bordered w-24"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          disabled={savingRetention}
          onClick={() => saveRetention(days)}
        >
          {savingRetention ? <Loader2 className="size-3 animate-spin" /> : "Save"}
        </button>
      </div>
      <p className="text-xs opacity-50">Changes apply to new conversations only</p>
    </div>
  );
};

const AccessControl = () => {
  const { data: config, isLoading } = useQuery({
    queryKey: ["filterConfig"],
    queryFn: adminApi.getFilterConfig,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="size-6 animate-spin opacity-50" />
      </div>
    );
  }

  const configDays = parseInt(config?.chatRetentionDays?.[0], 10);
  const initialDays = isNaN(configDays) ? 14 : configDays;

  return (
    <div className="flex flex-col gap-6">
      {/* Email Rules */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Admin Email Rules</p>
          <FilterListEditor
            sectionLabel="Admin Email Rules"
            activeKey="adminEmailRules"
            bankKey=""
            config={config ?? {}}
            hideBank={true}
            placeholder="Add email or @domain.com…"
          />
          <p className="text-xs opacity-50">Use exact email (user@example.com) or domain postfix (@example.com)</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Read-Only Email Rules</p>
          <FilterListEditor
            sectionLabel="Read-Only Email Rules"
            activeKey="readOnlyEmailRules"
            bankKey=""
            config={config ?? {}}
            hideBank={true}
            placeholder="Add email or @domain.com…"
          />
          <p className="text-xs opacity-50">Use exact email (user@example.com) or domain postfix (@example.com)</p>
        </div>
      </div>

      <div className="divider my-0" />

      {/* Chat Retention */}
      <RetentionEditor initialDays={initialDays} />
    </div>
  );
};

// ─── AdminPage ────────────────────────────────────────────────────────────────

const AdminPage = () => {
  return (
    <div className="flex flex-col gap-8 max-w-5xl">

      {/* User Management */}
      <section className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base">User Management</h2>
          <UserManagement />
        </div>
      </section>

      {/* Access Control */}
      <section className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title text-base">Access Control</h2>
            <p className="text-sm opacity-60">
              Configure default roles for new users at sign-up and set the chat conversation retention window.
            </p>
          </div>
          <AccessControl />
        </div>
      </section>

      {/* Manual Sync */}
      <section className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title text-base">Manual Sync</h2>
            <p className="text-sm opacity-60">Trigger a data sync on demand without waiting for the scheduled cron.</p>
          </div>
          <SyncControls />
        </div>
      </section>

      {/* DB Stats */}
      <section className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base">Database Stats</h2>
          <DbStats />
        </div>
      </section>

      {/* System Health */}
      <section className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body gap-4">
          <h2 className="card-title text-base">System Health</h2>
          <SystemHealth />
        </div>
      </section>

      {/* Filter Configuration */}
      <section className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body gap-4">
          <div>
            <h2 className="card-title text-base">Filter Configuration</h2>
            <p className="text-sm opacity-60">Manage the keywords and codes used to filter SAM.gov and USASpending syncs. Changes take effect on the next sync run.</p>
          </div>
          <FilterConfig />
        </div>
      </section>
    </div>
  );
};

export default AdminPage;
