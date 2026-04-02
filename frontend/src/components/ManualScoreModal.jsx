import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { X, Search, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";
import { dbApi, adminApi } from "../lib/api.js";
import SignalPills from "./SignalPills.jsx";

const ROUTING_BADGE = {
  AUTO_ADMIT:      { label: "Auto-Admit",     className: "badge-success" },
  QUEUE:           { label: "Pending Review", className: "badge-warning" },
  BELOW_THRESHOLD: { label: "Below Threshold", className: "badge-error" },
};

export default function ManualScoreModal({ opportunityId, onClose }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState("build");
  const [previewResult, setPreviewResult] = useState(null);

  // FLIS search
  const [flisQuery, setFlisQuery] = useState("");
  const [debouncedFlisQuery, setDebouncedFlisQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedFlisItems, setSelectedFlisItems] = useState([]);
  const debounceRef = useRef(null);

  // Other signals
  const [pscInText, setPscInText] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState([]);

  // Ground truths
  const { data: preview, isLoading: previewLoading } = useQuery({
    queryKey: ["manualScorePreview", opportunityId],
    queryFn: () => dbApi.getManualScorePreview(opportunityId),
  });

  // Solicitation keywords from AppConfig
  const { data: configData } = useQuery({
    queryKey: ["filterConfig"],
    queryFn: adminApi.getFilterConfig,
  });
  const keywords = configData?.solicitationKeywords ?? [];
  const availableKeywords = keywords.filter(kw => !selectedKeywords.includes(kw));

  // FLIS item search
  const { data: flisResults, isFetching: flisLoading } = useQuery({
    queryKey: ["flisSearch", debouncedFlisQuery],
    queryFn: () => dbApi.listFLISItems({ search: debouncedFlisQuery, supplyTigerOnly: "true", limit: 10 }),
    enabled: debouncedFlisQuery.length >= 2,
  });
  const flisItems = flisResults?.data ?? [];
  const selectedIds = new Set(selectedFlisItems.map(i => i.id));
  const unselectedResults = flisItems.filter(i => !selectedIds.has(i.id));

  function handleFlisInput(e) {
    const val = e.target.value;
    setFlisQuery(val);
    setShowDropdown(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedFlisQuery(val), 300);
  }

  function selectFlisItem(item) {
    setSelectedFlisItems(prev => [...prev, item]);
    setFlisQuery("");
    setDebouncedFlisQuery("");
    setShowDropdown(false);
  }

  function removeFlisItem(id) {
    setSelectedFlisItems(prev => prev.filter(i => i.id !== id));
  }

  function buildSignals() {
    const signals = [];
    for (const item of selectedFlisItems) {
      if (item.nsn) signals.push({ type: "NSN_MATCH", value: item.nsn });
    }
    const withItemName = selectedFlisItems.find(i => i.itemName);
    if (withItemName) signals.push({ type: "ITEM_NAME", value: withItemName.itemName });
    const withCommonName = selectedFlisItems.find(i => i.commonName);
    if (withCommonName) signals.push({ type: "COMMON_NAME", value: withCommonName.commonName });
    if (pscInText) signals.push({ type: "PSC_IN_TEXT", value: null });
    for (const kw of selectedKeywords) signals.push({ type: "KEYWORD", value: kw });
    return signals;
  }

  const { mutate: calculate, isPending: isCalculating } = useMutation({
    mutationFn: (signals) => dbApi.submitManualScore(opportunityId, signals),
    onSuccess: (data) => {
      if (data.rejectedNsns?.length > 0) {
        toast.error(`NSNs not found in catalog: ${data.rejectedNsns.join(", ")}`);
        setSelectedFlisItems(prev => prev.filter(i => !data.rejectedNsns.includes(i.nsn)));
      }
      setPreviewResult(data);
      setStep("preview");
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to calculate score"),
  });

  const { mutate: confirm, isPending: isConfirming } = useMutation({
    mutationFn: (signals) => dbApi.submitManualScore(opportunityId, signals),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["opportunity", opportunityId] });
      queryClient.invalidateQueries({ queryKey: ["inboxItems"] });
      queryClient.invalidateQueries({ queryKey: ["scoringQueueList"] });

      if (data.routing === "AUTO_ADMIT" && data.inboxItemId) {
        toast.success("Admitted to inbox");
        onClose();
        navigate(`/inbox/${data.inboxItemId}`);
      } else if (data.routing === "QUEUE") {
        toast.success("Added to pending review queue");
        onClose();
      } else {
        toast("Score below threshold — no item created", { icon: "ℹ️" });
        onClose();
      }
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to submit score"),
  });

  const routing = previewResult ? ROUTING_BADGE[previewResult.routing] : null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-2xl flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Manual Score</h3>
            <p className="text-xs text-base-content/50 mt-0.5">
              No parseable attachments — assert signals from external content
            </p>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>

        {step === "build" && (
          <>
            {/* Ground truths */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Metadata signals <span className="text-base-content/40 font-normal">(auto-computed)</span></p>
              {previewLoading ? (
                <span className="loading loading-spinner loading-sm" />
              ) : preview?.metadataSignals?.length > 0 ? (
                <div className="flex flex-col gap-1">
                  <SignalPills signals={preview.metadataSignals} />
                  <p className="text-xs text-base-content/40">Metadata score: {preview.metadataScore} pts</p>
                </div>
              ) : (
                <p className="text-xs text-base-content/40">No metadata signals matched</p>
              )}
            </div>

            <div className="divider my-0" />

            {/* Signal bank */}
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium">Add signals from external content</p>

              {/* FLIS item search */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-base-content/70">
                  FLIS catalog items <span className="font-normal opacity-60">(NSN +5, item name +3, common name +2 — from catalog)</span>
                </label>

                {/* Selected items */}
                {selectedFlisItems.length > 0 && (
                  <div className="flex flex-col gap-1 mb-1">
                    {selectedFlisItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-base-200 rounded px-3 py-1.5 text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium">{item.itemName ?? "—"}</span>
                          <div className="flex gap-2 text-xs text-base-content/50 mt-0.5">
                            {item.nsn && <span className="font-mono">{item.nsn}</span>}
                            {item.commonName && <span>{item.commonName}</span>}
                            {item.pscCode && <span>PSC {item.pscCode}</span>}
                          </div>
                        </div>
                        <button
                          className="btn btn-xs btn-ghost btn-circle ml-2"
                          onClick={() => removeFlisItem(item.id)}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Search input */}
                <div className="relative">
                  <label className="input input-bordered input-sm flex items-center gap-2">
                    <Search className="size-3.5 opacity-40" />
                    <input
                      type="text"
                      className="grow"
                      placeholder="Search by item name, common name, or NSN..."
                      value={flisQuery}
                      onChange={handleFlisInput}
                      onFocus={() => flisQuery.length >= 2 && setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    />
                    {flisLoading && <span className="loading loading-spinner loading-xs opacity-40" />}
                  </label>

                  {/* Dropdown */}
                  {showDropdown && debouncedFlisQuery.length >= 2 && (
                    <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-box shadow-lg overflow-hidden">
                      {unselectedResults.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-base-content/40">
                          {flisLoading ? "Searching…" : "No results found"}
                        </div>
                      ) : (
                        <ul className="max-h-48 overflow-y-auto">
                          {unselectedResults.map(item => (
                            <li key={item.id}>
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-base-200 transition-colors flex flex-col gap-0.5"
                                onMouseDown={() => selectFlisItem(item)}
                              >
                                <span className="text-sm font-medium">{item.itemName}</span>
                                <div className="flex gap-2 text-xs text-base-content/50">
                                  {item.nsn && <span className="font-mono">{item.nsn}</span>}
                                  {item.commonName && <span>{item.commonName}</span>}
                                  {item.pscCode && <span>PSC {item.pscCode}</span>}
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* PSC in text */}
              <div className="flex items-center gap-3">
                <input
                  ty8925015785062 pe="checkbox"
                  className="checkbox checkbox-sm"
                  id="psc-in-text"
                  checked={pscInText}
                  onChange={e => setPscInText(e.target.checked)}
                />
                <label htmlFor="psc-in-text" className="text-xs font-medium text-base-content/70 cursor-pointer">
                  PSC code visible in document <span className="font-normal opacity-60">(+1)</span>
                </label>
              </div>

              {/* Keywords */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-base-content/70">
                  Keywords found in external content <span className="font-normal opacity-60">(+2 each)</span>
                </label>
                {selectedKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1">
                    {selectedKeywords.map(kw => (
                      <span key={kw} className="badge badge-sm badge-warning text-black gap-1">
                        {kw}
                        <button onClick={() => setSelectedKeywords(p => p.filter(k => k !== kw))}>
                          <X className="size-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {availableKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {availableKeywords.map(kw => (
                      <button
                        key={kw}
                        className="badge badge-sm badge-ghost cursor-pointer hover:badge-warning hover:text-black transition-colors"
                        onClick={() => setSelectedKeywords(p => [...p, kw])}
                      >
                        + {kw}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action mt-0">
              <button className="btn btn-info text-white btn-sm" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-success text-white btn-sm"
                disabled={isCalculating}
                onClick={() => calculate(buildSignals())}
              >
                {isCalculating ? <span className="loading loading-spinner loading-xs" /> : "Calculate Score"}
              </button>
            </div>
          </>
        )}

        {step === "preview" && previewResult && (
          <>
            {/* Score */}
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold tabular-nums">{previewResult.score}</div>
              <div className="flex flex-col gap-1">
                <span className={`badge ${routing.className}`}>{routing.label}</span>
                {previewResult.routing === "BELOW_THRESHOLD" && (
                  <p className="text-xs text-base-content/50">No inbox item or queue entry will be created</p>
                )}
              </div>
            </div>

            {/* Signal breakdown */}
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium text-base-content/60 uppercase tracking-wide">Signal breakdown</p>
              <SignalPills signals={previewResult.matchedSignals} />
            </div>

            {previewResult.rejectedNsns?.length > 0 && (
              <div className="alert alert-warning py-2 text-sm">
                NSNs not found in FLIS catalog (removed): {previewResult.rejectedNsns.join(", ")}
              </div>
            )}

            <div className="modal-action mt-0">
              <button className="btn btn-ghost btn-sm gap-1" onClick={() => setStep("build")}>
                <ChevronLeft className="size-4" /> Back
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={isConfirming}
                onClick={() => confirm(buildSignals())}
              >
                {isConfirming ? <span className="loading loading-spinner loading-xs" /> : "Confirm"}
              </button>
            </div>
          </>
        )}
      </div>

      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose} />
      </form>
    </dialog>
  );
}
