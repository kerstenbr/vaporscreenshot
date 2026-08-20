import type { Account } from "../types";

export default function AccountSelect({
  accounts,
  loading,
  error,
  onSelect,
}: {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  onSelect: (accountid: string) => void;
}) {
  if (loading) {
    return <p className="text-foam/70">Reading Steam userdata…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-sunset-orange/50 bg-sunset-orange/10 p-4 text-sm text-sunset-orange">
        Couldn't read the Steam folder: {error}. Check that <code className="font-mono">STEAM_DIR</code> in
        your <code className="font-mono">.env</code> points at a real Steam install and that it's mounted
        into the container.
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-sunset-orange/50 bg-sunset-orange/10 p-4 text-sm text-sunset-orange">
        No Steam accounts found under <code className="font-mono">userdata/</code>. Make sure you've logged
        into Steam on this machine at least once.
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 font-display text-xl tracking-wide text-foam">Which Steam account?</h2>
      <p className="mb-5 text-sm text-foam/60">
        Detected from local <code className="font-mono">userdata/</code> folders.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((acc) => (
          <button
            key={acc.accountid}
            onClick={() => onSelect(acc.accountid)}
            className="group flex flex-col items-start rounded-xl border border-grid-violet/40 bg-panel/60 p-4 text-left transition hover:border-neon-pink hover:shadow-neon"
          >
            <span className="font-display text-lg text-foam group-hover:text-neon-pink">
              {acc.persona_name ?? `Account ${acc.accountid}`}
            </span>
            <span className="mt-1 font-mono text-xs text-foam/50">accountid {acc.accountid}</span>
            <span
              className={
                "mt-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide " +
                (acc.has_screenshots_vdf
                  ? "bg-neon-cyan/15 text-neon-cyan"
                  : "bg-foam/10 text-foam/50")
              }
            >
              {acc.has_screenshots_vdf ? "has screenshots.vdf" : "no screenshots yet"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
