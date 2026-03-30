import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ScanSearch, Save, X, RefreshCw, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { dbApi } from "../lib/api.js";
import { useCurrentUser } from "../lib/CurrentUserContext.jsx";
import Modal from "./Modal.jsx";

const ParsedTextModal = ({ attachment, opportunityId, onClose }) => {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === "ADMIN";
  const [previewText, setPreviewText] = useState(null);

  const { mutate: parse, isPending: isParsing } = useMutation({
    mutationFn: () => dbApi.parseAttachment(attachment.id),
    onSuccess: (data) => {
      setPreviewText(data.parsedText);
      toast.success("Preview ready — review and save or discard");
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to parse attachment"),
  });

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: (parsedText) => dbApi.saveParsedAttachment(attachment.id, parsedText),
    onSuccess: () => {
      setPreviewText(null);
      queryClient.invalidateQueries({ queryKey: ["opportunity", opportunityId] });
      queryClient.invalidateQueries({ queryKey: ["attachment-text", attachment.id] });
      toast.success("Parsed text saved");
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to save parsed text"),
  });

  const { mutate: deleteParsed, isPending: isDeleting } = useMutation({
    mutationFn: () => dbApi.deleteParsedAttachment(attachment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity", opportunityId] });
      queryClient.removeQueries({ queryKey: ["attachment-text", attachment.id] });
      toast.success("Parsed text deleted");
      onClose();
    },
    onError: (err) => toast.error(err?.response?.data?.error ?? "Failed to delete parsed text"),
  });

  const { data: savedTextData, isLoading: isLoadingText } = useQuery({
    queryKey: ["attachment-text", attachment.id],
    queryFn: () => dbApi.getAttachmentText(attachment.id),
    enabled: !!attachment.parsedAt && !previewText,
  });

  const displayText = previewText || savedTextData?.parsedText;
  const isPreview = !!previewText;

  return (
    <Modal open onClose={onClose} title={attachment.name} className="max-w-3xl">
      {/* Status bar */}
      <div className="flex items-center gap-2 mb-3">
        {isPreview ? (
          <span className="badge badge-warning badge-sm">Preview — not yet saved</span>
        ) : attachment.parsedAt ? (
          <span className="badge badge-success badge-sm">
            Saved {new Date(attachment.parsedAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="badge badge-ghost badge-sm">Not parsed</span>
        )}
      </div>

      {/* Content area */}
      <div className="min-h-48">
        {isParsing ? (
          <div className="flex items-center justify-center h-48">
            <span className="loading loading-spinner loading-md" />
            <span className="ml-2 text-sm">Parsing document…</span>
          </div>
        ) : isLoadingText ? (
          <div className="flex items-center justify-center h-48">
            <span className="loading loading-dots loading-sm" />
          </div>
        ) : displayText ? (
          <pre className="whitespace-pre-wrap text-xs bg-base-200 p-4 rounded-lg max-h-[60vh] overflow-y-auto font-mono">
            {displayText}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-base-content/50">
            <ScanSearch className="size-8 mb-2" />
            <p className="text-sm">Click Parse to extract text from this document</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="modal-action">
        {isPreview ? (
          <>
            <button
              className="btn btn-ghost btn-sm"
              disabled={isSaving}
              onClick={() => setPreviewText(null)}
            >
              <X className="size-4" />
              Discard
            </button>
            <button
              className="btn btn-success btn-sm"
              disabled={isSaving}
              onClick={() => save(previewText)}
            >
              {isSaving
                ? <span className="loading loading-spinner loading-xs" />
                : <Save className="size-4" />}
              Save
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
            {isAdmin && attachment.parsedAt && (
              <button
                className="btn btn-error btn-sm"
                disabled={isDeleting}
                onClick={() => deleteParsed()}
              >
                {isDeleting
                  ? <span className="loading loading-spinner loading-xs" />
                  : <Trash2 className="size-4" />}
                Delete
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              disabled={isParsing}
              onClick={() => parse()}
            >
              {isParsing
                ? <span className="loading loading-spinner loading-xs" />
                : attachment.parsedAt
                  ? <RefreshCw className="size-4" />
                  : <ScanSearch className="size-4" />}
              {attachment.parsedAt ? "Re-parse" : "Parse"}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ParsedTextModal;