import { useEffect } from "react";
import Icon from "./Icon";

export default function Toast({ message, tone = "success", onDone }) {
  useEffect(() => {
    const t = setTimeout(() => onDone?.(), 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!message) return null;

  return (
    <div className={"toast" + (tone === "error" ? " toast--error" : "")}>
      <Icon name={tone === "error" ? "alert" : "check"} size={16} />
      <span>{message}</span>
    </div>
  );
}
