import { useMemo, useState } from "react";
import type { Game } from "../types";

export default function GameSelect({
  games,
  loading,
  error,
  onSelect,
  onBack,
}: {
  games: Game[];
  loading: boolean;
  error: string | null;
  onSelect: (appid: string) => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter(
      (g) => g.name.toLowerCase().includes(q) || g.appid.includes(q)
    );
  }, [games, query]);

  return (
    <div>
      <button onClick={onBack} className="mb-4 text-xs text-foam/50 hover:text-neon-cyan">
        ← back to account
      </button>
      <h2 className="mb-1 font-display text-xl tracking-wide text-foam">Which game?</h2>
      <p className="mb-4 text-sm text-foam/60">
        Only games installed locally are listed (read from <code className="font-mono">steamapps/</code>).
      </p>

      {loading && <p className="text-foam/70">Reading installed games…</p>}

      {error && (
        <div className="rounded-lg border border-sunset-orange/50 bg-sunset-orange/10 p-4 text-sm text-sunset-orange">
          Couldn't read installed games: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search installed games…"
            className="mb-4 w-full rounded-lg border border-grid-violet/40 bg-void/60 px-4 py-2.5 text-sm text-foam placeholder:text-foam/30 outline-none focus:border-neon-cyan focus:shadow-neon-cyan"
          />
          {games.length === 0 && (
            <div className="rounded-lg border border-sunset-orange/50 bg-sunset-orange/10 p-4 text-sm text-sunset-orange">
              No installed games found under <code className="font-mono">steamapps/</code>. Games in
              other library folders aren't listed yet - see the README for details.
            </div>
          )}
          <ul className="vs-scrollbar max-h-80 space-y-1.5 overflow-y-auto pr-1">
            {filtered.map((g) => (
              <li key={g.appid}>
                <button
                  onClick={() => onSelect(g.appid)}
                  className="flex w-full items-center justify-between rounded-lg border border-grid-violet/30 bg-panel/50 px-4 py-2.5 text-left text-sm transition hover:border-neon-pink hover:shadow-neon"
                >
                  <span className="text-foam">{g.name}</span>
                  <span className="font-mono text-xs text-foam/40">{g.appid}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && games.length > 0 && (
              <li className="px-2 py-6 text-center text-sm text-foam/40">No games match "{query}"</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
