const Modal = ({ open, onClose, title, children, className = "" }) => {
  if (!open) return null;
  return (
    <dialog open className="modal modal-open">
      <div className={`modal-box ${className}`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{title}</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
          </div>
        )}
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}></button>
      </form>
    </dialog>
  );
};

export default Modal;