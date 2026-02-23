import { useParams, Link } from 'react-router'
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";

const OpportunityDetail = () => {
  const { id } = useParams();

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: () => dbApi.getOpportunity(id),
  });

  const item = result?.data;

  return (
    <div className="max-w-3xl">
      <Link to="/opportunities" className="btn btn-ghost btn-md mb-4">← Back to Opportunities</Link>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : isError ? (
        <div className="alert alert-error">{error?.message ?? "Failed to load opportunity"}</div>
      ) : item ? (
        <div className="card bg-base-200 shadow-md">
          <div className="card-body gap-3">
            <h2 className="card-title">{item.title ?? "Untitled"}</h2>
            <div className="flex gap-2 flex-wrap">
              {item.type && <span className="badge badge-outline">{item.type}</span>}
              <span className={`badge ${item.active ? "badge-success" : "badge-error"}`}>
                {item.active ? "Active" : "Inactive"}
              </span>
              {item.setAside && <span className="badge badge-outline">{item.setAside}</span>}
            </div>
            {item.description && <p className="text-base-content/80 text-sm">{item.description}</p>}
            <div className="divider my-1" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {item.buyingOrganization && <><dt className="font-semibold">Agency</dt><dd>{item.buyingOrganization.name}</dd></>}
              {item.naicsCodes?.length > 0 && <><dt className="font-semibold">NAICS</dt><dd>{item.naicsCodes.join(", ")}</dd></>}
              {item.pscCode && <><dt className="font-semibold">PSC</dt><dd>{item.pscCode}</dd></>}
              {item.postedDate && <><dt className="font-semibold">Posted</dt><dd>{new Date(item.postedDate).toLocaleDateString()}</dd></>}
              {item.responseDeadline && <><dt className="font-semibold">Deadline</dt><dd>{new Date(item.responseDeadline).toLocaleDateString()}</dd></>}
              {item.setAside && <><dt className="font-semibold">Set Aside</dt><dd>{item.setAside}</dd></>}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OpportunityDetail;
