"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { HomeData } from "@/lib/canvas/home-data";
import { placeNewWidget } from "@/lib/home-grid";
import {
  WIDGET_CATALOG,
  createWidgetFromCatalog,
  type HomeLayout,
  type WidgetType,
} from "@/lib/home-layout";
import WidgetPreviewCard from "@/components/home/WidgetPreviewCard";

export default function WidgetPickerModal({
  open,
  onClose,
  data,
  layout,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  data: HomeData;
  layout: HomeLayout;
  onAdd: (layout: HomeLayout) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function handlePick(type: WidgetType) {
    const widget = createWidgetFromCatalog(type, data.grades);
    if (!widget) return;
    const next = placeNewWidget(layout, widget);
    if (next) {
      onAdd(next);
      onClose();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-[min(42rem,calc(100vw-2rem))] max-h-[min(85vh,640px)] overflow-hidden rounded-[var(--radius-lg)] border-2 border-[var(--border)] bg-[var(--card)] p-0 shadow-[var(--shadow-clay)] backdrop:bg-black/40"
    >
      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
        <div>
          <p className="font-semibold">Add widget</p>
          <p className="text-sm text-[var(--muted)]">
            Choose a widget to place on your dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cb-icon-btn"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="max-h-[calc(85vh-5rem)] overflow-y-auto px-5 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {WIDGET_CATALOG.map((entry) => (
            <WidgetPreviewCard
              key={entry.type}
              type={entry.type}
              label={entry.label}
              description={entry.description}
              size={entry.defaultSize}
              data={data}
              onSelect={() => handlePick(entry.type)}
            />
          ))}
        </div>
      </div>
    </dialog>
  );
}
