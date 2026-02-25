import { useParams } from 'react-router';
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

  const badges = item?.level ? (
    <span className="badge badge-primary">{item.level}</span>
  ) : null;

  const fields = [
    { label: "Level", value: item?.level },
    { label: "Website", value: item?.website },
    { label: "External ID", value: item?.externalId },
    { label: "Full Path", value: item?.pathName },
  ];

  const buyingOrgLinks = (item?.children ?? []).map((c) => ({
    id: c.id,
    to: `/buying-orgs/${c.id}`,
    label: c.name,
    badge: c.level,
  }));

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
      />
      {item && <RelatedRecordsCard buyingOrgLinks={buyingOrgLinks} opportunityLinks={opportunityLinks} />}
    </div>
  );
};

export default BuyingOrgDetail;
