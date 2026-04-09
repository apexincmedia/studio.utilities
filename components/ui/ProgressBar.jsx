/**
 * ProgressBar — thin pill-shape progress indicator.
 *
 * Props:
 *   value: number  0–100
 */
export default function ProgressBar({ value = 0 }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}
