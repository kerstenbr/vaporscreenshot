import type { QueueItem } from "../types";

export default function ResultScreen({
  items,
  onStartOver,
}: {
  items: QueueItem[];
  onStartOver: () => void;
}) {
  const results = items.map((i) => i.result).filter(Boolean) as NonNullable<QueueItem["result"]>[];
  const succeeded = results.filter((r) => r.status === "success");
  const skipped = results.filter((r) => r.status === "skipped");
  const errored = results.filter((r) => r.status === "error");

  return (
    <div>
      <h2 className="mb-1 font-display text-xl tracking-wide text-foam">All done</h2>
      <p className="mb-6 text-sm text-foam/60">Here's what happened with your queue.</p>

      <div className="mb-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-neon-cyan/30 bg-neon-cyan/5 p-4">
          <p className="font-display text-2xl text-neon-cyan">{succeeded.length}</p>
          <p className="text-xs uppercase tracking-wide text-foam/50">Prepared</p>
        </div>
        <div className="rounded-xl border border-sunset-orange/30 bg-sunset-orange/5 p-4">
          <p className="font-display text-2xl text-sunset-orange">{skipped.length}</p>
          <p className="text-xs uppercase tracking-wide text-foam/50">Skipped</p>
        </div>
        <div className="rounded-xl border border-neon-pink/30 bg-neon-pink/5 p-4">
          <p className="font-display text-2xl text-neon-pink">{errored.length}</p>
          <p className="text-xs uppercase tracking-wide text-foam/50">Errors</p>
        </div>
      </div>

      {succeeded.length > 0 && (
        <div className="mb-6 rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 p-4">
          <p className="font-display text-sm text-neon-cyan">
            Your screenshots are prepared. Open Steam as usual to sync them with the cloud.
          </p>
          <p className="mt-1 text-xs text-foam/50">
            Steam will pick up the new entries in <code className="font-mono">screenshots.vdf</code> the
            next time it starts, either syncing automatically or listing them in the Screenshot Uploader.
          </p>
        </div>
      )}

      {(skipped.length > 0 || errored.length > 0) && (
        <ul className="vs-scrollbar mb-6 max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {[...skipped, ...errored].map((r, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between rounded-lg border border-grid-violet/20 bg-panel/40 px-3 py-2 text-sm"
            >
              <span className="truncate text-foam/80">{r.original_filename}</span>
              <span
                className={
                  "ml-3 flex-shrink-0 font-mono text-xs " +
                  (r.status === "skipped" ? "text-sunset-orange" : "text-neon-pink")
                }
              >
                {r.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onStartOver}
        className="rounded-full border border-neon-pink px-5 py-2 text-sm text-neon-pink transition hover:bg-neon-pink hover:text-void hover:shadow-neon"
      >
        Prepare more screenshots
      </button>
    </div>
  );
}
