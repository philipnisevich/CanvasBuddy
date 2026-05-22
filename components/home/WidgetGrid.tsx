"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Minus, Plus, Settings, X } from "lucide-react";
import { isConfigurableWidget } from "@/lib/home-widget-config";
import {
  getNextSize,
  isResizableWidget,
} from "@/lib/home-widget-sizes";
import { useMemo, useState } from "react";
import type { HomeData } from "@/lib/canvas/home-data";
import {
  canPlace,
  getGridBounds,
  gridStyle,
  moveWidget,
  resizeWidget,
  parseSlotId,
  repackForColumns,
  sizeToSpan,
  slotId,
  type PlacedWidget,
} from "@/lib/home-grid";
import type { HomeLayout, HomeWidgetInstance } from "@/lib/home-layout";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import WidgetRenderer from "@/components/home/WidgetRenderer";

function GridWidget({
  widget,
  data,
  editMode,
  col,
  row,
  onRemove,
  onConfigure,
  onResize,
  dragEnabled,
}: {
  widget: HomeWidgetInstance;
  data: HomeData;
  editMode: boolean;
  col: number;
  row: number;
  onRemove: (id: string) => void;
  onConfigure?: (widget: HomeWidgetInstance) => void;
  onResize?: (widgetId: string, direction: "grow" | "shrink") => void;
  dragEnabled: boolean;
}) {
  const canGrow = getNextSize(widget.type, widget.size, "grow") != null;
  const canShrink = getNextSize(widget.type, widget.size, "shrink") != null;
  const resizable = editMode && isResizableWidget(widget.type) && onResize;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: widget.id,
      disabled: !dragEnabled,
    });

  const style = {
    ...gridStyle(col, row, widget.size),
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 1,
  };

  const compact = widget.size === "1x1";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative z-[5] h-full min-h-0 overflow-hidden ${
        editMode ? "ring-2 ring-[var(--color-canvas-red)] ring-offset-2" : ""
      }`}
    >
      {editMode && (
        <div className="absolute left-1 top-1 z-10 flex gap-1">
          {resizable && (
            <>
              <button
                type="button"
                disabled={!canShrink}
                onClick={() => onResize(widget.id, "shrink")}
                className="cb-icon-btn disabled:cursor-not-allowed"
                aria-label="Shrink widget"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                disabled={!canGrow}
                onClick={() => onResize(widget.id, "grow")}
                className="cb-icon-btn disabled:cursor-not-allowed"
                aria-label="Expand widget"
              >
                <Plus className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )}
      {editMode && (
        <div className="absolute right-1 top-1 z-10 flex gap-1">
          {isConfigurableWidget(widget.type) && onConfigure && (
            <button
              type="button"
              onClick={() => onConfigure(widget)}
              className="cb-icon-btn"
              aria-label="Configure widget"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          {dragEnabled && (
            <button
              type="button"
              className="cb-icon-btn"
              aria-label="Drag to move"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(widget.id)}
            className="cb-icon-btn cb-icon-btn--danger"
            aria-label="Remove widget"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="h-full min-h-full overflow-hidden">
        <WidgetRenderer widget={widget} data={data} compact={compact} />
      </div>
    </div>
  );
}

function DropSlot({
  col,
  row,
  spanW,
  spanH,
  active,
}: {
  col: number;
  row: number;
  spanW: number;
  spanH: number;
  active: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slotId(col, row) });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...gridStyle(col, row, spanSize(spanW, spanH)),
        pointerEvents: "auto",
      }}
      className={`z-0 rounded-[var(--radius)] border-2 border-dashed transition-colors duration-200 ${
        isOver || active
          ? "border-[var(--color-canvas-red)] bg-[var(--accent-soft)]"
          : "border-[var(--border)] bg-[var(--card-muted)]/40"
      }`}
      aria-hidden
    />
  );
}

function spanSize(w: number, h: number): HomeWidgetInstance["size"] {
  if (w === 2 && h === 3) return "2x3";
  if (w === 2 && h === 2) return "2x2";
  if (w === 2 && h === 1) return "2x1";
  if (w === 1 && h === 2) return "1x2";
  return "1x1";
}

export default function WidgetGrid({
  layout,
  data,
  editMode,
  onLayoutChange,
  onConfigureWidget,
}: {
  layout: HomeLayout;
  data: HomeData;
  editMode: boolean;
  onLayoutChange: (layout: HomeLayout) => void;
  onConfigureWidget?: (widget: HomeWidgetInstance) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const displayWidgets: PlacedWidget[] = useMemo(() => {
    if (isDesktop) {
      return layout.map((w) => ({
        ...w,
        displayCol: w.col,
        displayRow: w.row,
      }));
    }
    return repackForColumns(layout, 2);
  }, [layout, isDesktop]);

  const { rows: boundRows } = getGridBounds(layout);
  const scanRows = boundRows + (editMode && isDesktop ? 3 : 0);
  const gridRows = isDesktop
    ? Math.max(boundRows + (editMode ? 3 : 0), 1)
    : Math.max(
        displayWidgets.reduce((max, w) => {
          const { h } = sizeToSpan(w.size);
          return Math.max(max, w.displayRow + h);
        }, 0),
        1
      );

  const activeWidget = activeId
    ? layout.find((w) => w.id === activeId)
    : undefined;

  const dropSlots = useMemo(() => {
    if (!editMode || !isDesktop || !activeWidget) return [];
    const { w, h } = sizeToSpan(activeWidget.size);
    const slots: { col: number; row: number }[] = [];
    for (let row = 0; row < scanRows; row++) {
      for (let col = 0; col <= 4 - w; col++) {
        if (canPlace(layout, col, row, w, h, 4, activeWidget.id)) {
          slots.push({ col, row });
        }
      }
    }
    return slots;
  }, [editMode, isDesktop, activeWidget, layout, scanRows]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event;
    setActiveId(null);
    if (!over || !activeWidget) return;

    const pos = parseSlotId(String(over.id));
    if (!pos) return;

    const next = moveWidget(layout, activeWidget.id, pos.col, pos.row);
    if (next) onLayoutChange(next);
  }

  function removeWidget(id: string) {
    onLayoutChange(layout.filter((w) => w.id !== id));
  }

  function handleResize(widgetId: string, direction: "grow" | "shrink") {
    const widget = layout.find((w) => w.id === widgetId);
    if (!widget) return;
    const nextSize = getNextSize(widget.type, widget.size, direction);
    if (!nextSize) return;
    const next = resizeWidget(layout, widgetId, nextSize);
    if (next) onLayoutChange(next);
  }

  const dragEnabled = editMode && isDesktop;
  const cols = isDesktop ? 4 : 2;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="relative grid grid-cols-2 gap-4 md:grid-cols-4"
        style={{
          gridAutoRows: "var(--home-unit-h)",
          gridTemplateRows: `repeat(${gridRows}, var(--home-unit-h))`,
        }}
      >
        {editMode &&
          isDesktop &&
          activeWidget &&
          dropSlots.map(({ col, row }) => {
            const { w, h } = sizeToSpan(activeWidget.size);
            return (
              <DropSlot
                key={slotId(col, row)}
                col={col}
                row={row}
                spanW={w}
                spanH={h}
                active={false}
              />
            );
          })}

        {displayWidgets.map((widget) => (
          <GridWidget
            key={widget.id}
            widget={widget}
            data={data}
            editMode={editMode}
            col={widget.displayCol}
            row={widget.displayRow}
            onRemove={removeWidget}
            onConfigure={onConfigureWidget}
            onResize={editMode ? handleResize : undefined}
            dragEnabled={dragEnabled}
          />
        ))}
      </div>

      <DragOverlay>
        {activeWidget ? (
          <div
            className="pointer-events-none overflow-hidden rounded-[var(--radius)] opacity-90 shadow-lg ring-2 ring-[var(--color-canvas-red)]"
            style={{
              width: `calc(${sizeToSpan(activeWidget.size).w} * ((100% - 3 * 1rem) / ${cols}) + ${sizeToSpan(activeWidget.size).w - 1} * 1rem)`,
              height: `calc(${sizeToSpan(activeWidget.size).h} * var(--home-unit-h) + ${sizeToSpan(activeWidget.size).h - 1} * 1rem)`,
            }}
          >
            <WidgetRenderer
              widget={activeWidget}
              data={data}
              compact={activeWidget.size === "1x1"}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
