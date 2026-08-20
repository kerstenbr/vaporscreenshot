export interface Account {
  accountid: string;
  steamid64: string | null;
  persona_name: string | null;
  has_screenshots_vdf: boolean;
}

export interface Game {
  appid: string;
  name: string;
}

export type OversizePolicy = "resize" | "skip" | "force";

export interface ProcessResult {
  original_filename: string;
  status: "success" | "skipped" | "error";
  message: string;
  output_filename: string | null;
  width: number | null;
  height: number | null;
}

export interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  result?: ProcessResult;
}

export type WizardStep = "account" | "game" | "queue" | "processing" | "result";
