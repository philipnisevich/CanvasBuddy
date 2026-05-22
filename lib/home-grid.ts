import type {
  HomeLayout,
  HomeWidgetInstance,
  WidgetSize,
} from "@/lib/home-layout";

export function sizeToSpan(size: WidgetSize): { w: number; h: number } {
  switch (size) {
    case "1x1":
      return { w: 1, h: 1 };
    case "1x2":
      return { w: 1, h: 2 };
    case "2x1":
      return { w: 2, h: 1 };
    case "2x2":
      return { w: 2, h: 2 };
    case "2x3":
      return { w: 2, h: 3 };
    default:
      return { w: 1, h: 1 };
  }
}

export const GRID_COLS_CANONICAL = 4;

export interface GridSpan {
  w: number;
  h: number;
}

export interface PlacedWidget extends HomeWidgetInstance {
  displayCol: number;
  displayRow: number;
}

export function occupancyMap(
  layout: HomeLayout,
  cols: number,
  excludeId?: string
): boolean[][] {
  const maxRow =
    layout.reduce((max, w) => {
      if (excludeId && w.id === excludeId) return max;
      const { h } = sizeToSpan(w.size);
      return Math.max(max, w.row + h);
    }, 0) + 4;

  const grid: boolean[][] = Array.from({ length: maxRow }, () =>
    Array(cols).fill(false)
  );

  for (const w of layout) {
    if (excludeId && w.id === excludeId) continue;
    const { w: spanW, h: spanH } = sizeToSpan(w.size);
    for (let r = w.row; r < w.row + spanH; r++) {
      for (let c = w.col; c < w.col + spanW; c++) {
        if (r < grid.length && c < cols) grid[r][c] = true;
      }
    }
  }
  return grid;
}

export function canPlace(
  layout: HomeLayout,
  col: number,
  row: number,
  spanW: number,
  spanH: number,
  cols: number = GRID_COLS_CANONICAL,
  excludeId?: string
): boolean {
  if (col < 0 || row < 0 || col + spanW > cols) return false;
  const grid = occupancyMap(layout, cols, excludeId);
  for (let r = row; r < row + spanH; r++) {
    for (let c = col; c < col + spanW; c++) {
      if (r >= grid.length || grid[r][c]) return false;
    }
  }
  return true;
}

export function findFirstSlot(
  layout: HomeLayout,
  size: WidgetSize,
  cols: number = GRID_COLS_CANONICAL,
  maxScanRows = 32
): { col: number; row: number } | null {
  const { w, h } = sizeToSpan(size);
  for (let row = 0; row < maxScanRows; row++) {
    for (let col = 0; col <= cols - w; col++) {
      if (canPlace(layout, col, row, w, h, cols)) {
        return { col, row };
      }
    }
  }
  return null;
}

export function getGridBounds(layout: HomeLayout): { cols: number; rows: number } {
  let rows = 0;
  for (const w of layout) {
    const { h } = sizeToSpan(w.size);
    rows = Math.max(rows, w.row + h);
  }
  return { cols: GRID_COLS_CANONICAL, rows: Math.max(rows, 1) };
}

/** Place widgets in array order into a 4-column grid (legacy layouts). */
export function migrateOrderedLayout(
  widgets: Omit<HomeWidgetInstance, "col" | "row">[]
): HomeLayout {
  const placed: HomeLayout = [];
  for (const w of widgets) {
    const slot = findFirstSlot(placed, w.size);
    if (!slot) continue;
    placed.push({ ...w, col: slot.col, row: slot.row });
  }
  return placed;
}

/** Remove overlapping widgets (keep first by row, col). */
export function dedupeOverlaps(layout: HomeLayout): HomeLayout {
  const sorted = [...layout].sort(
    (a, b) => a.row - b.row || a.col - b.col
  );
  const result: HomeLayout = [];
  for (const w of sorted) {
    const { w: spanW, h: spanH } = sizeToSpan(w.size);
    if (canPlace(result, w.col, w.row, spanW, spanH)) {
      result.push(w);
    }
  }
  return result;
}

/** Display-only repack for 2- or 4-column view; canonical col/row unchanged in storage. */
export function repackForColumns(
  layout: HomeLayout,
  cols: 2 | 4
): PlacedWidget[] {
  const sorted = [...layout].sort(
    (a, b) => a.row - b.row || a.col - b.col
  );
  const placed: HomeLayout = [];
  const display: PlacedWidget[] = [];

  for (const w of sorted) {
    const slot = findFirstSlot(placed, w.size, cols);
    if (!slot) continue;
    placed.push({ ...w, col: slot.col, row: slot.row });
    display.push({
      ...w,
      displayCol: slot.col,
      displayRow: slot.row,
    });
  }
  return display;
}

export function moveWidget(
  layout: HomeLayout,
  id: string,
  col: number,
  row: number
): HomeLayout | null {
  const widget = layout.find((w) => w.id === id);
  if (!widget) return null;
  const { w, h } = sizeToSpan(widget.size);
  if (!canPlace(layout, col, row, w, h, GRID_COLS_CANONICAL, id)) {
    return null;
  }
  return layout.map((item) =>
    item.id === id ? { ...item, col, row } : item
  );
}

export function gridStyle(
  col: number,
  row: number,
  size: WidgetSize
): { gridColumn: string; gridRow: string } {
  const { w, h } = sizeToSpan(size);
  return {
    gridColumn: `${col + 1} / span ${w}`,
    gridRow: `${row + 1} / span ${h}`,
  };
}

export function placeNewWidget(
  layout: HomeLayout,
  widget: HomeWidgetInstance
): HomeLayout | null {
  const slot = findFirstSlot(layout, widget.size);
  if (!slot) return null;
  return [...layout, { ...widget, col: slot.col, row: slot.row }];
}

export function slotId(col: number, row: number): string {
  return `slot-${col}-${row}`;
}

export function parseSlotId(id: string): { col: number; row: number } | null {
  const m = /^slot-(\d+)-(\d+)$/.exec(id);
  if (!m) return null;
  return { col: Number(m[1]), row: Number(m[2]) };
}

function spansOverlap(
  colA: number,
  rowA: number,
  wA: number,
  hA: number,
  colB: number,
  rowB: number,
  wB: number,
  hB: number
): boolean {
  return (
    colA < colB + wB &&
    colA + wA > colB &&
    rowA < rowB + hB &&
    rowA + hA > rowB
  );
}

function horizontalOverlap(
  colA: number,
  wA: number,
  colB: number,
  wB: number
): boolean {
  return colA < colB + wB && colA + wA > colB;
}

/** Nudge widgets down until no overlaps remain (stable row/col order). */
export function resolveOverlaps(layout: HomeLayout): HomeLayout {
  const sorted = [...layout].sort(
    (a, b) => a.row - b.row || a.col - b.col
  );
  const placed: HomeLayout = [];
  for (const w of sorted) {
    const { col } = w;
    let { row } = w;
    const { w: sw, h: sh } = sizeToSpan(w.size);
    let guard = 0;
    while (!canPlace(placed, col, row, sw, sh) && guard < 64) {
      row += 1;
      guard += 1;
    }
    placed.push({ ...w, col, row });
  }
  return placed;
}

export function resizeWidget(
  layout: HomeLayout,
  id: string,
  newSize: WidgetSize
): HomeLayout | null {
  return resizeWidgetWithReflow(layout, id, newSize);
}

export function resizeWidgetWithReflow(
  layout: HomeLayout,
  id: string,
  newSize: WidgetSize
): HomeLayout | null {
  const widget = layout.find((w) => w.id === id);
  if (!widget || widget.size === newSize) return null;

  const oldSpan = sizeToSpan(widget.size);
  const newSpan = sizeToSpan(newSize);
  const deltaRow = newSpan.h - oldSpan.h;
  const deltaW = newSpan.w - oldSpan.w;

  let result: HomeLayout = layout.map((item) =>
    item.id === id ? { ...item, size: newSize } : item
  );

  const canPlaceDirect = canPlace(
    layout,
    widget.col,
    widget.row,
    newSpan.w,
    newSpan.h,
    GRID_COLS_CANONICAL,
    id
  );

  if (deltaRow < 0) {
    const pullUp = -deltaRow;
    const newBottom = widget.row + newSpan.h;
    result = result.map((o) => {
      if (o.id === id) return o;
      const os = sizeToSpan(o.size);
      if (!horizontalOverlap(o.col, os.w, widget.col, newSpan.w)) return o;
      if (o.row >= newBottom) {
        return { ...o, row: Math.max(newBottom, o.row - pullUp) };
      }
      return o;
    });
    result = resolveOverlaps(result);
  } else if (canPlaceDirect && deltaRow >= 0 && deltaW >= 0) {
    return result;
  } else if (deltaRow > 0 || deltaW > 0) {
    result = result.map((o) => {
      if (o.id === id) return o;
      const os = sizeToSpan(o.size);
      const overlapsNew = spansOverlap(
        widget.col,
        widget.row,
        newSpan.w,
        newSpan.h,
        o.col,
        o.row,
        os.w,
        os.h
      );
      if (!overlapsNew) return o;
      return {
        ...o,
        row: o.row + Math.max(0, deltaRow),
        col:
          deltaW > 0 &&
          horizontalOverlap(o.col, os.w, widget.col, newSpan.w) &&
          o.col >= widget.col
            ? o.col + deltaW
            : o.col,
      };
    });
    result = resolveOverlaps(result);
  } else {
    return null;
  }

  if (deltaRow >= 0) {
    result = resolveOverlaps(result);
  }

  const resized = result.find((w) => w.id === id);
  if (!resized) return null;
  const rs = sizeToSpan(resized.size);
  if (
    !canPlace(
      result,
      resized.col,
      resized.row,
      rs.w,
      rs.h,
      GRID_COLS_CANONICAL,
      id
    )
  ) {
    return null;
  }

  return result;
}
