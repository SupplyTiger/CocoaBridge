const SIGNAL_META = {
  PSC_MATCH:          { label: "PSC",          className: "badge-info text-white" },
  PSC_PRIORITY:       { label: "PSC ★",        className: "badge-info text-white opacity-90" },
  PSC_IN_TEXT:        { label: "PSC (doc)",     className: "badge-info badge-outline" },
  NAICS_MATCH:        { label: "NAICS",         className: "badge-secondary text-white" },
  NAICS_PRIORITY:     { label: "NAICS ★",      className: "badge-secondary text-white opacity-90" },
  KEYWORD:            { label: "KW",            className: "badge-warning text-black" },
  NSN_MATCH:          { label: "NSN",           className: "badge-error text-white" },
  ITEM_NAME:          { label: "Item",          className: "badge-accent text-white" },
  COMMON_NAME:        { label: "Name",          className: "badge-accent badge-outline" },
  AGENCY_HISTORY:     { label: "Agency",        className: "badge-neutral text-white" },
  MICROPURCHASE:      { label: "Micropurchase", className: "badge-success text-white" },
  DEADLINE_FAVORABLE: { label: "Deadline",      className: "badge-success badge-outline" },
};

export default function SignalPills({ signals }) {
  if (!signals || signals.length === 0) return <span className="text-base-content/40 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {signals.map((s, i) => {
        const meta = SIGNAL_META[s.type] ?? { label: s.type, className: "badge-ghost" };
        return (
          <span key={i} className={`badge badge-sm text-xs ${meta.className}`} title={s.type}>
            <span className="opacity-70 mr-0.5">{meta.label}:</span>{s.value}
          </span>
        );
      })}
    </div>
  );
}
