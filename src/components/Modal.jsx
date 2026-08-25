import { useEffect } from "react";
import Icon from "./Icon";
import "./Modal.css";

export default function Modal({ open, onClose, title, tone = "default", children, footer }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={"modal" + (tone === "danger" ? " modal--danger" : "")}>
        <div className="modal__header">
          {tone === "danger" && (
            <span className="modal__icon">
              <Icon name="alert" size={18} />
            </span>
          )}
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Fechar">
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
