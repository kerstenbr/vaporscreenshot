import type { Account, Game, OversizePolicy, ProcessResult } from "../types";

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchAccounts(): Promise<Account[]> {
  const res = await fetch("/api/accounts");
  return jsonOrThrow(res);
}

export async function fetchGames(): Promise<Game[]> {
  const res = await fetch("/api/games");
  return jsonOrThrow(res);
}

export async function startProcessRun(
  accountid: string,
  appid: string
): Promise<{ run_id: string; backup_path: string | null }> {
  const res = await fetch("/api/process/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountid, appid }),
  });
  return jsonOrThrow(res);
}

export async function processSingle(args: {
  accountid: string;
  appid: string;
  jpegQuality: number;
  oversizePolicy: OversizePolicy;
  runId: string;
  file: File;
}): Promise<ProcessResult> {
  const form = new FormData();
  form.set("accountid", args.accountid);
  form.set("appid", args.appid);
  form.set("jpeg_quality", String(args.jpegQuality));
  form.set("oversize_policy", args.oversizePolicy);
  form.set("run_id", args.runId);
  form.set("file", args.file, args.file.name);

  const res = await fetch("/api/process/single", {
    method: "POST",
    body: form,
  });
  return jsonOrThrow(res);
}

