declare module 'culori' {
  interface Color {
    mode: string;
    [key: string]: unknown;
  }

  interface Oklch extends Color {
    mode: 'oklch';
    l?: number;
    c?: number;
    h?: number;
    alpha?: number;
  }

  interface Rgb extends Color {
    mode: 'rgb';
    r?: number;
    g?: number;
    b?: number;
    alpha?: number;
  }

  export function parse(color: string): Color | undefined;
  export function oklch(color: Color | { mode: string; r: number; g: number; b: number }): Oklch | undefined;
  export function rgb(color: Color): Rgb | undefined;
  export function formatHex(color: Color): string | undefined;
  export function formatCss(color: Color): string | undefined;
  export function displayable(color: Color): boolean;
  export function clampChroma(color: Color, mode: string): Oklch;
  export type { Oklch, Color };
}
