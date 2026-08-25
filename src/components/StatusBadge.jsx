import { STATUS_LABEL } from "../utils/validade";
import "./StatusBadge.css";

const CLASSES = {
  VERDE: "status-badge status-badge--verde",
  AMARELO: "status-badge status-badge--amarelo",
  VERMELHO: "status-badge status-badge--vermelho",
  EXPIRADO: "status-badge status-badge--vermelho",
};

export default function StatusBadge({ status, children }) {
  return <span className={CLASSES[status] || "status-badge"}>{children || STATUS_LABEL[status] || status}</span>;
}
