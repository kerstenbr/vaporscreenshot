import type { QueueItem } from "../types";

const STATUS_STYLES: Record<string, string> = {
  pending: "text-foam/30",
  success: "text-neon-cyan",
  skipped: "text-sunset-orange",
  error: "text-neon-pink",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "…",
  success: "done",
  skipped: "skipped",
  error: "error",
};

export default function ProcessPanel({
  items,
  completedCount,
}: {
  items: QueueItem[];
  completedCount: number;
}) {
  const total = items.length;
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  return (
    <div>
      <h2 className="mb-1 font-display text-xl tracking-wide text-foam">Processing…</h2>
      <p className="mb-4 text-sm text-foam/60">
        Copying into your Steam userdata folder and updating screenshots.vdf.
      </p>

      <div className="mb-5 h-3 w-full overflow-hidden rounded-full bg-void/60 border border-grid-violet/30">
        <div
          className="h-full bg-gradient-to-r from-neon-pink to-sunset-orange transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mb-4 text-xs text-foam/50">
        {completedCount} / {total} processed
      </p>

      <ul className="vs-scrollbar max-h-80 space-y-1.5 overflow-y-auto pr-1">
        {items.map((item) => {
          const status = item.result?.status ?? "pending";
          return (
            <li
              key={item.id}
              className="flex items-center justify-between rounded-lg border border-grid-violet/20 bg-panel/40 px-3 py-2 text-sm"
            >
              <span className="truncate text-foam/80">{item.file.name}</span>
              <span className={"ml-3 flex-shrink-0 font-mono text-xs " + STATUS_STYLES[status]}>
                {STATUS_LABEL[status]}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
