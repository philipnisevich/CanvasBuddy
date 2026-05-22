"use client";

import type { HomeData } from "@/lib/canvas/home-data";
import {
  getDefaultSize,
  sizeLabel,
  type WidgetType,
} from "@/lib/home-layout";
import { sizeToSpan } from "@/lib/home-grid";
import type { WidgetSize } from "@/lib/home-layout";
import WidgetRenderer from "@/components/home/WidgetRenderer";

const PREVIEW_HEIGHT: Record<WidgetSize, string> = {
  "1x1": "calc(var(--home-unit-h) * 1)",
  "1x2": "calc(var(--home-unit-h) * 2 + 1rem)",
  "2x1": "calc(var(--home-unit-h) * 1)",
  "2x2": "calc(var(--home-unit-h) * 2 + 1rem)",
  "2x3": "calc(var(--home-unit-h) * 3 + 2rem)",
};

export default function WidgetPreviewCard({
  type,
  label,
  description,
  size,
  data,
  onSelect,
}: {
  type: WidgetType;
  label: string;
  description: string;
  size: WidgetSize;
  data: HomeData;
  onSelect: () => void;
}) {
  const { w } = sizeToSpan(size);
  const previewWidget = {
    id: `preview-${type}`,
    type,
    size: getDefaultSize(type),
    col: 0,
    row: 0,
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex cursor-pointer flex-col rounded-[var(--radius)] border-2 border-[var(--border)] p-3 text-left transition-colors duration-200 hover:border-[var(--color-canvas-red)] hover:bg-[var(--accent-soft)] ${
        w === 2 ? "sm:col-span-2" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-semibold">{label}</span>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{description}</p>
        </div>
        <span className="shrink-0 rounded bg-[var(--card-muted)] px-2 py-0.5 text-xs font-semibold">
          {sizeLabel(size)}
        </span>
      </div>
      <div
        className="relative mt-3 w-full overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--background)]"
        style={{ height: PREVIEW_HEIGHT[size] }}
      >
        <div
          className="pointer-events-none absolute inset-0 origin-top-left scale-[0.92]"
          style={{ width: "108%", height: "108%" }}
        >
          <WidgetRenderer
            widget={previewWidget}
            data={data}
            preview
            compact={size === "1x1"}
          />
        </div>
      </div>
    </button>
  );
}
