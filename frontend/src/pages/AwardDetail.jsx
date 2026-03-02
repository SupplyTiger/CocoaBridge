import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { dbApi } from "../lib/api.js";
import { useCurrentUser } from "../lib/CurrentUserContext.jsx";
import ItemDetail from "../components/ItemDetail.jsx";

const AwardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const queryClient = useQueryClient();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: result, isLoading, isError, error } = useQuery({
    queryKey: ["award", id],
    queryFn: () => dbApi.getAward(id),
  });

  const item = result?.data;

  const { mutate: deleteItem, isPending: isDeleting } = useMutation({
    mutationFn: () => dbApi.deleteAward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["awards"] });
      toast.success("Award deleted");
      navigate("/awards");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error ?? "Failed to delete award");
      setShowDeleteConfirm(false);
    },
  });

  const fields = [
    {
      label: "Award ID",
      value: item?.externalId,
      render: (val) => val ? <span className="font-mono">{val.split("_")[4]}</span> : "—",
    },
    {
      label: "Recipient",
      value: item?.recipient,
      render: (val) => val
        ? <Link to={`/recipients/${val.id}`} className="link link-primary-content">{val.name}</Link>
        : "—",
    },
    {
      label: "Agency",
      value: item?.buyingOrganization,
      render: (val) => val
        ? <Link to={`/buying-orgs/${val.id}`} className="link link-primary-content">{val.name}</Link>
        : "—",
    },
    { label: "Amount", value: item?.obligatedAmount, render: (val) => val != null ? `$${Number(val).toLocaleString()}` : "—" },
    { label: "NAICS", value: item?.naicsCodes, render: (val) => val?.length > 0 ? val.join(", ") : "—" },
    { label: "PSC", value: item?.pscCode },
    { label: "Start Date", value: item?.startDate, render: (val) => val ? new Date(val).toLocaleDateString() : "—" },
    { label: "End Date", value: item?.endDate, render: (val) => val ? new Date(val).toLocaleDateString() : "—" },
  ];

  return (
    <>
      <ItemDetail
        isLoading={isLoading}
        isError={isError}
        error={error}
        item={item}
        backTo="/awards"
        backLabel="Back to Awards"
        title={item?.description?.slice(0, 80) ?? "Award"}
        fields={fields}
      >
        {isAdmin && item && (
          <div className="flex justify-end">
            <button
              className="btn btn-error btn-sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          </div>
        )}
      </ItemDetail>

      {showDeleteConfirm && (
        <dialog open className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete Award</h3>
            <p className="py-4">Are you sure you want to delete this award? This cannot be undone.</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </button>
              <button
                className="btn btn-error"
                disabled={isDeleting}
                onClick={() => deleteItem()}
              >
                {isDeleting ? <span className="loading loading-spinner loading-xs" /> : "Delete"}
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowDeleteConfirm(false)}>close</button>
          </form>
        </dialog>
      )}
    </>
  );
};

export default AwardDetail;
