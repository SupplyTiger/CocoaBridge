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

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({});

  const { mutate: saveRecipient, isPending: isSaving } = useMutation({
    mutationFn: () => dbApi.updateRecipient(id, { website: draft.website }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipient", id] });
      toast.success("Saved");
      setIsEditing(false);
      setDraft({});
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to save"),
  });

  const handleEdit = () => {
    setDraft({ website: item.website ?? "" });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft({});
    setIsEditing(false);
  };

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
          <div className="flex justify-end gap-2">
            {!isEditing ? (
              <button className="btn btn-success text-white btn-sm" onClick={handleEdit}>Edit</button>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={handleCancel}>Cancel</button>
                <button className="btn btn-primary text-white btn-sm" disabled={isSaving} onClick={() => saveRecipient()}>
                  {isSaving ? <span className="loading loading-spinner loading-xs" /> : "Save"}
                </button>
              </>
            )}
          </div>
        )}
        {isAdmin && isEditing && item && (
          <div className="flex flex-col gap-2">
            <label className="text-sm">Website</label>
            <input
              type="text"
              className="input input-bordered input-sm w-full max-w-xs"
              placeholder="Add website…"
              value={draft.website ?? ""}
              onChange={(e) => setDraft({ ...draft, website: e.target.value })}
            />
          </div>
        )}
      </ItemDetail>
      {item && <RelatedRecordsCard awardLinks={awardLinks} />}
    </div>
  );
};

export default RecipientDetail;
