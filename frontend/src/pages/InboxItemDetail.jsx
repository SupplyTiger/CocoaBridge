import { useParams, Link } from 'react-router'
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";

const STATUS_BADGE = {
  NEW: "badge-neutral",
  IN_REVIEW: "badge-warning",
  QUALIFIED: "badge-success",
  DISMISSED: "badge-error",
  CONTACTED: "badge-info",
  CLOSED: "badge-ghost",
};

// TODO: Link to opportunity and award

const InboxItemDetail = () => {
  const { id } = useParams();

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["inboxItem", id],
    queryFn: () => dbApi.getInboxItem(id),
  });

  const item = result?.data;

  return (
    <div className="max-w-3xl">
      <Link to="/inbox" className="btn btn-ghost btn-md mb-4">← Back to Inbox</Link>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : isError ? (
        <div className="alert alert-error">{error?.message ?? "Failed to load item"}</div>
      ) : item ? (
        <div className="card bg-base-200 shadow-md">
          <div className="card-body gap-3">
            <h2 className="card-title">{item.title ?? "Untitled"}</h2>
            <div className="flex gap-2 flex-wrap">
              <span className={`badge ${STATUS_BADGE[item.reviewStatus] ?? "badge-neutral"}`}>{item.reviewStatus}</span>
              <span className="badge badge-outline">{item.type}</span>
              <span className="badge badge-outline">{item.acquisitionPath}</span>
            </div>
            {item.summary && <p className="text-base-content/80">{item.summary}</p>}
            {item.notes && (
              <div>
                <p className="font-semibold text-sm">Notes</p>
                <p className="text-sm text-base-content/80">{item.notes}</p>
              </div>
            )}
            <div className="divider my-1" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="font-semibold">Source</dt><dd>{item.source}</dd>
              <dt className="font-semibold">Tag</dt><dd>{item.tag}</dd>
              {item.reviewedBy && <><dt className="font-semibold">Reviewed By</dt><dd>{item.reviewedBy}</dd></>}
              {item.reviewedAt && <><dt className="font-semibold">Reviewed At</dt><dd>{new Date(item.reviewedAt).toLocaleString()}</dd></>}
              <dt className="font-semibold">Created</dt><dd>{new Date(item.createdAt).toLocaleString()}</dd>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default InboxItemDetail;
