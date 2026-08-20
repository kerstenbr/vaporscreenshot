import { useRef, useState } from "react";
import type { QueueItem } from "../types";

export default function ScreenshotQueue({
  items,
  onAddFiles,
  onRemove,
  onReorder,
}: {
  items: QueueItem[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [dragItemIndex, setDragItemIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (e.dataTransfer.files?.length) onAddFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition " +
          (isDraggingOver
            ? "border-neon-pink bg-neon-pink/10 shadow-neon"
            : "border-grid-violet/40 bg-void/40 hover:border-neon-cyan/70")
        }
      >
        <p className="font-display text-sm tracking-wide text-foam">
          Drag screenshots here, or click to browse
        </p>
        <p className="mt-1 text-xs text-foam/40">JPG, PNG, BMP or WEBP</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.bmp,.webp,image/jpeg,image/png,image/bmp,image/webp"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) onAddFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {items.length > 0 && (
        <ul className="vs-scrollbar mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
          {items.map((item, index) => (
            <li
              key={item.id}
              draggable
              onDragStart={() => setDragItemIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragItemIndex !== null && dragItemIndex !== index) {
                  onReorder(dragItemIndex, index);
                }
                setDragItemIndex(null);
              }}
              className="flex items-center gap-3 rounded-lg border border-grid-violet/30 bg-panel/50 p-2 cursor-move"
            >
              <span className="font-mono text-xs text-foam/30 w-5 text-right">{index + 1}</span>
              <img
                src={item.previewUrl}
                alt=""
                className="h-12 w-16 flex-shrink-0 rounded object-cover border border-grid-violet/30"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foam">{item.file.name}</p>
                <p className="text-xs text-foam/40">{(item.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.file.name}`}
                className="flex-shrink-0 rounded-full p-1.5 text-foam/40 transition hover:bg-neon-pink/10 hover:text-neon-pink"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
