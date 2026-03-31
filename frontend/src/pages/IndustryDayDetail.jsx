import { useState } from "react";
import { useParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileDown } from "lucide-react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { dbApi } from "../lib/api.js";
import { useCurrentUser } from "../lib/CurrentUserContext.jsx";
import ItemDetail from "../components/ItemDetail.jsx";
import { exportDetailToCsv, csvFilename } from "../lib/csvExport.js";

const STATUS_BADGE = {
  OPEN: "badge-info",
  NOT_ATTENDING: "badge-warning",
  ATTENDING: "badge-success",
  ATTENDED: "badge-neutral",
  PAST_EVENT: "badge-ghost",
};

const STATUSES = ["OPEN", "NOT_ATTENDING", "ATTENDING", "ATTENDED", "PAST_EVENT"];

const IndustryDayDetail = () => {
  const { id } = useParams();
  const currentUser = useCurrentUser();

  const isAdmin = currentUser?.role === "ADMIN";
  const hasReadAccess = currentUser?.role !== "USER";
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["industryDay", id],
    queryFn: () => dbApi.getIndustryDay(id),
  });

  const item = result?.data;

  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: (body) => dbApi.updateIndustryDay(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industryDay", id] });
      queryClient.invalidateQueries({ queryKey: ["industryDays"] });
      toast.success("Saved");
      setIsEditing(false);
      setDraft({});
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to save"),
  });

  const handleEdit = () => {
    setDraft({ status: item.status, summary: item.summary ?? "" });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft({});
    setIsEditing(false);
  };

  const handleSave = () => updateItem({ status: draft.status, summary: draft.summary });

  const badges = (
    <>
      <span className={`badge ${STATUS_BADGE[item?.status] ?? "badge-neutral"}`}>{item?.status}</span>
      <span className="badge">{item?.source}</span>
    </>
  );

  const fields = [
    { label: "Event Date", value: item?.eventDate, render: (val) => val ? new Date(val).toLocaleDateString() : "—" },
    { label: "Location", value: item?.location },
    { label: "Host", value: item?.host },
    { label: "Buying Organization", value: item?.buyingOrganization?.name },
    { label: "Created", value: item?.createdAt, render: (val) => val ? new Date(val).toLocaleString() : "—" },
  ];

  return (
    <ItemDetail
      isLoading={isLoading}
      isError={isError}
      error={error}
      item={item}
      backTo="/industry-day"
      backLabel="Back to Industry Days"
      title={item?.title ?? "Untitled"}
      badges={badges}
      fields={fields}
    >
      {hasReadAccess && item && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 ml-auto flex-wrap">
            <button
              className="btn btn-secondary btn-sm gap-1"
              onClick={() => exportDetailToCsv([
                { label: "Title", value: item.title },
                { label: "Status", value: item.status },
                { label: "Source", value: item.source },
                { label: "Event Date", value: item.eventDate ? new Date(item.eventDate).toLocaleDateString() : "" },
                { label: "Location", value: item.location },
                { label: "Host", value: item.host },
                { label: "Buying Organization", value: item.buyingOrganization?.name },
              ], csvFilename("industry-day", id))}
            >
              <FileDown className="size-4" />
              Export
            </button>
            {item.opportunity && (
              <Link to={`/opportunities/${item.opportunity.id}`} className="btn btn-primary btn-sm">
                View Opportunity
              </Link>
            )}
            {isAdmin && !isEditing && (
              <button className="btn btn-success btn-sm" onClick={handleEdit}>Edit</button>
            )}
          </div>

          {!isEditing && item.summary && (
            <div>
              <p className="font-semibold text-sm">Summary</p>
              <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none text-sm">{item.summary}</ReactMarkdown>
            </div>
          )}

          {isAdmin && isEditing && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Status</span>
                <select
                  className="select select-sm select-bordered"
                  value={draft.status}
                  disabled={isUpdating}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-sm">Summary</p>
                <p className="text-xs text-base-content/50">Markdown supported</p>
                <textarea
                  className="textarea textarea-bordered text-sm w-full"
                  rows={6}
                  value={draft.summary}
                  onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
                  placeholder="Add summary…"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button className="btn btn-ghost btn-sm" onClick={handleCancel}>Cancel</button>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={isUpdating}
                  onClick={handleSave}
                >
                  {isUpdating ? <span className="loading loading-spinner loading-xs" /> : "Save"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </ItemDetail>
  );
};

export default IndustryDayDetail;
