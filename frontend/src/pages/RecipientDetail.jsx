import { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { dbApi } from "../lib/api.js";
import { useCurrentUser } from "../lib/CurrentUserContext.jsx";
import ItemDetail from "../components/ItemDetail.jsx";
import RelatedRecordsCard from "../components/RelatedRecordsCard.jsx";

const RecipientDetail = () => {
  const { id } = useParams();
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const queryClient = useQueryClient();

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["recipient", id],
    queryFn: () => dbApi.getRecipient(id),
  });

  const item = result?.data;

  const [website, setWebsite] = useState(null);

  const websiteValue = website ?? (item?.website ?? "");

  const { mutate: saveRecipient, isPending: isSaving } = useMutation({
    mutationFn: () => dbApi.updateRecipient(id, { website: websiteValue }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipient", id] });
      toast.success("Saved");
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to save"),
  });

  const fields = [
    { label: "UEI", value: item?.uei },
    {
      label: "Website",
      value: item?.website
        ? <Link to={item.website} target="_blank" rel="noopener noreferrer" className="link link-primary">{item.website}</Link>
        : null,
    },
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
      >
        {isAdmin && item && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">Edit Recipient</p>
            <div className="flex flex-col gap-2">
              <label className="text-sm">Website</label>
              <input
                type="text"
                className="input input-bordered input-sm w-full max-w-xs"
                placeholder="Add website…"
                value={websiteValue}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary btn-sm w-fit"
              onClick={() => saveRecipient()}
              disabled={isSaving}
            >
              {isSaving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
            </button>
          </div>
        )}
      </ItemDetail>
      {item && <RelatedRecordsCard awardLinks={awardLinks} />}
    </div>
  );
};

export default RecipientDetail;
