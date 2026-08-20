import type { WizardStep } from "../types";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "account", label: "Account" },
  { key: "game", label: "Game" },
  { key: "queue", label: "Queue" },
  { key: "processing", label: "Process" },
  { key: "result", label: "Done" },
];

// Classic vaporwave "sliced sun": horizontal bars with growing gaps toward
// the bottom. It doubles as the wizard's progress indicator - bars fill
// with the neon gradient as you move through each step, so the sun sets
// as you get closer to the end of the flow.
export default function StepIndicator({ current }: { current: WizardStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  const totalBars = 7;
  const filledBars = Math.round(((currentIndex + 1) / STEPS.length) * totalBars);

  const bars = Array.from({ length: totalBars }, (_, i) => {
    const gap = 1.2 + i * 0.9;
    const height = 5.5;
    let y = 6;
    for (let j = 0; j < i; j++) {
      y += height + 1.2 + j * 0.9;
    }
    return { y, height, filled: i < filledBars, gap };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 100 60" className="h-16 w-16 sm:h-20 sm:w-20" role="img" aria-label={`Step ${currentIndex + 1} of ${STEPS.length}`}>
        <defs>
          <clipPath id="sun-clip">
            <circle cx="50" cy="34" r="26" />
          </clipPath>
          <linearGradient id="sun-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffd7f5" />
            <stop offset="45%" stopColor="#ff3ec9" />
            <stop offset="100%" stopColor="#ff9142" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="34" r="26" fill="none" stroke="#7b42ff" strokeWidth="1.5" opacity="0.6" />
        <g clipPath="url(#sun-clip)">
          {bars.map((bar, i) => (
            <rect
              key={i}
              x="20"
              y={bar.y}
              width="60"
              height={bar.height}
              fill={bar.filled ? "url(#sun-fill)" : "transparent"}
              opacity={bar.filled ? 1 : 0}
            />
          ))}
        </g>
        <line x1="6" y1="52" x2="94" y2="52" stroke="#2ee6ff" strokeWidth="1.2" opacity="0.7" />
        <line x1="6" y1="52" x2="20" y2="58" stroke="#2ee6ff" strokeWidth="1" opacity="0.4" />
        <line x1="94" y1="52" x2="80" y2="58" stroke="#2ee6ff" strokeWidth="1" opacity="0.4" />
      </svg>
      <ol className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-foam/60 sm:gap-2 sm:text-xs">
        {STEPS.map((step, i) => (
          <li
            key={step.key}
            className={
              i === currentIndex
                ? "text-neon-cyan"
                : i < currentIndex
                ? "text-neon-pink/70"
                : "text-foam/40"
            }
          >
            {step.label}
            {i < STEPS.length - 1 && <span className="mx-1.5 text-foam/20">/</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
