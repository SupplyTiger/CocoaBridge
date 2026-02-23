import { useParams, Link } from 'react-router'
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";

// TODO: Link to recipient and agency pages when those are implemented
const AwardDetail = () => {
  const { id } = useParams();

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["award", id],
    queryFn: () => dbApi.getAward(id),
  });

  const item = result?.data;

  return (
    <div className="max-w-3xl">
      <Link to="/awards" className="btn btn-ghost btn-md mb-4">← Back to Awards</Link>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : isError ? (
        <div className="alert alert-error">{error?.message ?? "Failed to load award"}</div>
      ) : item ? (
        <div className="card bg-base-200 shadow-md">
          <div className="card-body gap-3">
            <h2 className="card-title">{item.description?.slice(0, 80) ?? "Award"}</h2>
            <div className="divider my-1" />
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {item.recipient && <><dt className="font-semibold">Recipient</dt><dd>{item.recipient.name}</dd></>}
              {item.buyingOrganization && <><dt className="font-semibold">Agency</dt><dd>{item.buyingOrganization.name}</dd></>}
              {item.obligatedAmount != null && <><dt className="font-semibold">Amount</dt><dd>${Number(item.obligatedAmount).toLocaleString()}</dd></>}
              {item.naicsCodes?.length > 0 && <><dt className="font-semibold">NAICS</dt><dd>{item.naicsCodes.join(", ")}</dd></>}
              {item.pscCode && <><dt className="font-semibold">PSC</dt><dd>{item.pscCode}</dd></>}
              {item.startDate && <><dt className="font-semibold">Start Date</dt><dd>{new Date(item.startDate).toLocaleDateString()}</dd></>}
              {item.endDate && <><dt className="font-semibold">End Date</dt><dd>{new Date(item.endDate).toLocaleDateString()}</dd></>}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AwardDetail;
