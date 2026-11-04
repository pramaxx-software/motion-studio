/** Cubic-bezier easing: [cx1, cy1, cx2, cy2]. cx di-clamp 0..1 oleh consumer. */
export type PlmEasing = [number, number, number, number];

export interface PlmKeyframePos {
  t: number; // 0..1 normalized loop time
  v: [number, number]; // [x, y] px relative to canvas center (y+ = down)
  e?: PlmEasing; // easing for segment STARTING at this keyframe
  hold?: true; // step: hold value until next keyframe
}

export interface PlmKeyframeRot {
  t: number;
  v: number; // degrees
  e?: PlmEasing;
  hold?: true;
}

export interface PlmKeyframeScl {
  t: number;
  v: [number, number]; // [sx, sy] fraction (1.0 = 100%)
  e?: PlmEasing;
  hold?: true;
}

export interface PlmTracks {
  pos?: PlmKeyframePos[];
  rot?: PlmKeyframeRot[];
  scl?: PlmKeyframeScl[];
}

export interface PlmMotion {
  name: string; // display name, max 64 chars
  format: "plm-motion"; // REQUIRED discriminator, always this literal
  version: number; // integer >= 1
  duration: number; // seconds per loop, > 0
  px_scale?: number; // 0.0005..0.1 — world units per pixel (optional)
  axis?: "2d" | "3d"; // default "2d"; "3d" = tambah Y-axis spin dari rot track
  tracks: PlmTracks;
}

export interface PlmFrameState {
  pos: [number, number]; // px relative to canvas center
  rot: number; // degrees
  scl: [number, number]; // scale fraction
}