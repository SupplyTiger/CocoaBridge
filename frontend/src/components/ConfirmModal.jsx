import Modal from "./Modal.jsx";

const ConfirmModal = ({
  open,
  onClose,
  onConfirm,
  title,
  confirmLabel = "Confirm",
  variant = "error",
  isPending = false,
  children,
}) => (
  <Modal open={open} onClose={onClose} title={title}>
    <p className="py-4">{children}</p>
    <div className="modal-action">
      <button className="btn btn-info text-white" onClick={onClose}>
        Cancel
      </button>
      <button
        className={`btn btn-${variant} text-white`}
        disabled={isPending}
        onClick={onConfirm}
      >
        {isPending ? <span className="loading loading-spinner loading-xs" /> : confirmLabel}
      </button>
    </div>
  </Modal>
);

export default ConfirmModal;
