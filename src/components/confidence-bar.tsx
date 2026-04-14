export function ConfidenceBar({ confidence }: { confidence: number | null }) {
  if (confidence === null) return null;

  const percentage = Math.round(confidence * 100);
  const color =
    percentage >= 90
      ? "bg-status-offer"
      : percentage >= 70
        ? "bg-status-assessment"
        : "bg-status-rejected";

  return (
    <div className="confidence-bar-container flex items-center gap-2">
      <div className="confidence-bar-track h-2 flex-1 rounded-full bg-surface-overlay">
        <div
          className={`confidence-bar-fill h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-text-secondary">{percentage}%</span>
    </div>
  );
}
