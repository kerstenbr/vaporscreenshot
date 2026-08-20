import { useEffect, useRef, useState } from "react";
import type { Account, Game, OversizePolicy, QueueItem, WizardStep } from "./types";
import { fetchAccounts, fetchGames, processSingle, startProcessRun } from "./api/client";
import StepIndicator from "./components/StepIndicator";
import AccountSelect from "./components/AccountSelect";
import GameSelect from "./components/GameSelect";
import ScreenshotQueue from "./components/ScreenshotQueue";
import SettingsPanel from "./components/SettingsPanel";
import ProcessPanel from "./components/ProcessPanel";
import ResultScreen from "./components/ResultScreen";

let nextId = 0;

export default function App() {
  const [step, setStep] = useState<WizardStep>("account");

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountid, setAccountid] = useState<string | null>(null);

  const [games, setGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [appid, setAppid] = useState<string | null>(null);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [jpegQuality, setJpegQuality] = useState(95);
  const [oversizePolicy, setOversizePolicy] = useState<OversizePolicy>("resize");

  const [completedCount, setCompletedCount] = useState(0);
  const cancelRef = useRef(false);

  useEffect(() => {
    fetchAccounts()
      .then(setAccounts)
      .catch((e) => setAccountsError(String(e.message ?? e)))
      .finally(() => setAccountsLoading(false));
  }, []);

  function goToGameStep(selectedAccountid: string) {
    setAccountid(selectedAccountid);
    setStep("game");
    setGamesLoading(true);
    setGamesError(null);
    fetchGames()
      .then(setGames)
      .catch((e) => setGamesError(String(e.message ?? e)))
      .finally(() => setGamesLoading(false));
  }

  function goToQueueStep(selectedAppid: string) {
    setAppid(selectedAppid);
    setStep("queue");
  }

  function addFiles(files: FileList | File[]) {
    const accepted = Array.from(files).filter((f) =>
      /\.(jpe?g|png|bmp|webp)$/i.test(f.name)
    );
    const newItems: QueueItem[] = accepted.map((file) => ({
      id: String(nextId++),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setQueue((prev) => [...prev, ...newItems]);
  }

  function removeItem(id: string) {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((q) => q.id !== id);
    });
  }

  function reorderItems(fromIndex: number, toIndex: number) {
    setQueue((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }

  async function runProcessing() {
    if (!accountid || !appid || queue.length === 0) return;
    setStep("processing");
    setCompletedCount(0);
    cancelRef.current = false;

    const { run_id } = await startProcessRun(accountid, appid);

    let done = 0;
    for (const item of queue) {
      if (cancelRef.current) break;
      try {
        const result = await processSingle({
          accountid,
          appid,
          jpegQuality,
          oversizePolicy,
          runId: run_id,
          file: item.file,
        });
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, result } : q)));
      } catch (e) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                ...q,
                result: {
                  original_filename: item.file.name,
                  status: "error",
                  message: String((e as Error).message ?? e),
                  output_filename: null,
                  width: null,
                  height: null,
                },
              }
              : q
          )
        );
      }
      done += 1;
      setCompletedCount(done);
    }

    setStep("result");
  }

  function startOver() {
    for (const item of queue) URL.revokeObjectURL(item.previewUrl);
    setQueue([]);
    setCompletedCount(0);
    setStep("game");
  }

  return (
    <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:py-12">
      <div className="vs-grid-floor pointer-events-none fixed inset-x-0 bottom-0 h-64 opacity-70" />

      <header className="relative mb-8 flex flex-col items-center gap-4 text-center">
        <h1 className="vs-chrome-text font-display text-3xl font-bold tracking-widest sm:text-4xl">
          VAPORSCREENSHOT
        </h1>
        <p className="max-w-md text-xs text-foam/50">
          Prepare local screenshots for Steam Cloud sync, entirely offline.
        </p>
        <StepIndicator current={step} />
      </header>

      <main className="vs-panel relative z-10 flex-1 rounded-2xl p-5 shadow-xl sm:p-8">
        {step === "account" && (
          <AccountSelect
            accounts={accounts}
            loading={accountsLoading}
            error={accountsError}
            onSelect={goToGameStep}
          />
        )}

        {step === "game" && (
          <GameSelect
            games={games}
            loading={gamesLoading}
            error={gamesError}
            onSelect={goToQueueStep}
            onBack={() => setStep("account")}
          />
        )}

        {step === "queue" && (
          <div className="grid gap-6 sm:grid-cols-[1fr_260px]">
            <div>
              <button
                onClick={() => setStep("game")}
                className="mb-4 text-xs text-foam/50 hover:text-neon-cyan"
              >
                ← back to game
              </button>
              <h2 className="mb-1 font-display text-xl tracking-wide text-foam">Build your queue</h2>
              <p className="mb-4 text-sm text-foam/60">
                Add the screenshots you want to prepare for this game, in any order you like.
              </p>
              <ScreenshotQueue
                items={queue}
                onAddFiles={addFiles}
                onRemove={removeItem}
                onReorder={reorderItems}
              />
              <button
                disabled={queue.length === 0}
                onClick={runProcessing}
                className="mt-5 w-full rounded-full bg-neon-pink py-2.5 font-display text-sm tracking-wide text-void transition hover:shadow-neon disabled:cursor-not-allowed disabled:opacity-30"
              >
                Prepare {queue.length > 0 ? queue.length : ""} screenshot{queue.length === 1 ? "" : "s"}
              </button>
            </div>
            <SettingsPanel
              jpegQuality={jpegQuality}
              onJpegQualityChange={setJpegQuality}
              oversizePolicy={oversizePolicy}
              onOversizePolicyChange={setOversizePolicy}
            />
          </div>
        )}

        {step === "processing" && <ProcessPanel items={queue} completedCount={completedCount} />}

        {step === "result" && <ResultScreen items={queue} onStartOver={startOver} />}
      </main>
    </div>
  );
}
