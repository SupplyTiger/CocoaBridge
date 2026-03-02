import { useParams } from 'react-router';
import { Link } from 'react-router';
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";
import ItemDetail from "../components/ItemDetail.jsx";
import RelatedRecordsCard from "../components/RelatedRecordsCard.jsx";

const BuyingOrgDetail = () => {
  const { id } = useParams();

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["buying-org", id],
    queryFn: () => dbApi.getBuyingOrg(id),
  });

  const item = result?.data;

  const { data: parentResult } = useQuery({
    queryKey: ["buying-org", item?.parentId],
    queryFn: () => dbApi.getBuyingOrg(item.parentId),
    enabled: !!item?.parentId,
  });

  const parent = parentResult?.data;

  const badges = item?.level ? (
    <span className="badge badge-primary">{item.level}</span>
  ) : null;

  const fields = [
    { label: "Level", value: item?.level },
    { label: "External ID", value: item?.externalId },
    // TODO: Make the website an editable field (with a link to the website)
    { label: "Website", value: item?.website },
  ];

  const children = item?.children ?? [];

  const opportunityLinks = (item?.opportunities ?? []).map((o) => ({
    id: o.id,
    to: `/opportunities/${o.id}`,
    label: o.title ?? "Untitled Opportunity",
    meta: o.postedDate ? new Date(o.postedDate).toLocaleDateString() : undefined,
  }));

  return (
    <div>
      <ItemDetail
        isLoading={isLoading}
        isError={isError}
        error={error}
        item={item}
        backTo="/market-intelligence"
        backLabel="Back to Market Intelligence"
        title={item?.name ?? "Buying Organization"}
        badges={badges}
        fields={fields}
      >
        {(parent || children.length > 0) && (
          <div className="flex flex-col gap-3 text-sm">
            {parent && (
              <div>
                <p className="font-semibold mb-1">Parent Organization</p>
                <Link
                  to={`/buying-orgs/${parent.id}`}
                  className="flex items-center gap-2 link link-hover"
                >
                  <span className="badge badge-accent badge-sm">{parent.level}</span>
                  {parent.name}
                </Link>
              </div>
            )}
            {children.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Sub-Organizations</p>
                <ul className="flex flex-col gap-1">
                  {children.map((c) => (
                    <li key={c.id}>
                      <Link
                        to={`/buying-orgs/${c.id}`}
                        className="flex items-center gap-2 link link-hover"
                      >
                        <span className="badge badge-outline badge-sm">{c.level}</span>
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ItemDetail>
      {item && <RelatedRecordsCard opportunityLinks={opportunityLinks} />}
    </div>
  );
};

export default BuyingOrgDetail;
