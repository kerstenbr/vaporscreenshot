import type { OversizePolicy } from "../types";

export default function SettingsPanel({
  jpegQuality,
  onJpegQualityChange,
  oversizePolicy,
  onOversizePolicyChange,
}: {
  jpegQuality: number;
  onJpegQualityChange: (v: number) => void;
  oversizePolicy: OversizePolicy;
  onOversizePolicyChange: (v: OversizePolicy) => void;
}) {
  return (
    <div className="rounded-xl border border-grid-violet/30 bg-panel/40 p-4">
      <h3 className="mb-4 font-display text-sm uppercase tracking-widest text-neon-cyan">Settings</h3>

      <label className="mb-1 flex items-center justify-between text-sm text-foam/80">
        <span>JPEG quality</span>
        <span className="font-mono text-neon-pink">{jpegQuality}</span>
      </label>
      <input
        type="range"
        min={1}
        max={100}
        value={jpegQuality}
        onChange={(e) => onJpegQualityChange(Number(e.target.value))}
        className="w-full accent-neon-pink"
      />
      <p className="mt-1 text-xs text-foam/40">
        Used when converting to JPEG, or recompressing an oversized image.
      </p>

      <div className="mt-5">
        <p className="mb-2 text-sm text-foam/80">If a screenshot is too large for Steam Cloud</p>
        <div className="space-y-1.5">
          {(
            [
              ["resize", "Resize to fit, keeping aspect ratio"],
              ["skip", "Skip this image"],
              ["force", "Try anyway (may fail)"],
            ] as [OversizePolicy, string][]
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-sm text-foam/80 transition hover:border-grid-violet/40"
            >
              <input
                type="radio"
                name="oversize-policy"
                checked={oversizePolicy === value}
                onChange={() => onOversizePolicyChange(value)}
                className="accent-neon-cyan"
              />
              {label}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-foam/40">
          Steam Cloud limits: max side 16000px, max total 26,210,175px (~26MP).
        </p>
      </div>
    </div>
  );
}
