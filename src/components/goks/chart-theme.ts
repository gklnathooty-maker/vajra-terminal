/** Shared chart constants, kept out of the component files so hot reload keeps working. */
export const WINDOW = 180;
export const UP = "var(--color-sage)";
export const DOWN = "var(--color-loss)";
export const BRASS = "var(--color-brass)";
export const BLUE = "#6aa8d8";
export const VIOLET = "#b58bd6";
export const AXIS = { fill: "var(--color-muted)", fontSize: 11 } as const;
export const Y_WIDTH = 64;

export const compactAxis = (v: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);
export const plainAxis = (v: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
