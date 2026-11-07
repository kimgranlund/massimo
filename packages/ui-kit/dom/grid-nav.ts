// Headless two-dimensional roving focus, shared by the calendar and the data table. It only computes
// where focus goes: the caller moves the tab stop and handles what a cell means.
export interface GridPos { row: number; col: number }
export interface GridSize { rows: number; cols: number; pageRows?: number; rtl?: boolean }

const clamp = (n: number, max: number) => Math.min(max, Math.max(0, n));

/** The next cell for a key, or null when the key isn't a grid key. Movement stops at the edges. */
export function gridMove(key: string, at: GridPos, size: GridSize, ctrl = false): GridPos | null {
  const { rows, cols, pageRows = 5, rtl = false } = size;
  const across = rtl ? -1 : 1;
  const to = (row: number, col: number) => ({ row: clamp(row, rows - 1), col: clamp(col, cols - 1) });
  switch (key) {
    case 'ArrowRight': return to(at.row, at.col + across);
    case 'ArrowLeft': return to(at.row, at.col - across);
    case 'ArrowDown': return to(at.row + 1, at.col);
    case 'ArrowUp': return to(at.row - 1, at.col);
    case 'Home': return ctrl ? to(0, 0) : to(at.row, 0);
    case 'End': return ctrl ? to(rows - 1, cols - 1) : to(at.row, cols - 1);
    case 'PageDown': return to(at.row + pageRows, at.col);
    case 'PageUp': return to(at.row - pageRows, at.col);
    default: return null;
  }
}

/** A cell's tabindex in a roving grid: exactly one cell takes the tab stop. */
export const rovingTabindex = (cell: GridPos, active: GridPos) => (cell.row === active.row && cell.col === active.col ? 0 : -1);
