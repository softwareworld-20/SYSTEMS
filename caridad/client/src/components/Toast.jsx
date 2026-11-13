import { useEffect } from "react";

export default function Toast({ message, tone = "success", onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className={`toast toast--${tone}`} role="status" aria-live="polite">
      <span aria-hidden="true">{tone === "error" ? "⚠️" : "✅"}</span>
      <span>{message}</span>
    </div>
  );
}
