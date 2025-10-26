interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          {label ?? "Progress"}
        </span>
        <span className="text-sm text-slate-500">
          {Math.min(current, total)} / {total}
        </span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;

