import { useParams } from 'react-router';
import { useQuery } from "@tanstack/react-query";
import { dbApi } from "../lib/api.js";
import ItemDetail from "../components/ItemDetail.jsx";
import RelatedRecordsCard from "../components/RelatedRecordsCard.jsx";

const RecipientDetail = () => {
  const { id } = useParams();

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["recipient", id],
    queryFn: () => dbApi.getRecipient(id),
  });

  const item = result?.data;

  const fields = [
    { label: "UEI", value: item?.uei },
    { label: "Website", value: item?.website },
  ];

  const awardLinks = (item?.awards ?? []).map((a) => ({
    id: a.id,
    to: `/awards/${a.id}`,
    description: a.description,
    obligatedAmount: a.obligatedAmount,
    startDate: a.startDate,
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
        title={item?.name ?? "Recipient"}
        fields={fields}
      />
      {item && <RelatedRecordsCard awardLinks={awardLinks} />}
    </div>
  );
};

export default RecipientDetail;
