import type {
  PlmEasing,
  PlmFrameState,
  PlmKeyframePos,
  PlmKeyframeRot,
  PlmKeyframeScl,
  PlmMotion,
} from '../types/plm';



// Menghitung koefisien polynomial X dari cubic bezier Bx(t) = c1*t + c2*t^2 + c3*t^3
function polyCoeffX(cx1: number, cx2: number) {
  const c1 = 3 * cx1;
  const c2 = 3 * (cx2 - cx1) - c1;
  const c3 = 1 - c1 - c2;
  return { c1, c2, c3 };
}

function evalBezierAxis(c1: number, c2: number, c3: number, t: number): number {
  return ((c3 * t + c2) * t + c1) * t;
}

function evalBezierAxisDerivative(
  c1: number,
  c2: number,
  c3: number,
  t: number
): number {
  return (3 * c3 * t + 2 * c2) * t + c1;
}

/**
 * Solve cubic bezier untuk mendapatkan y (eased progress) pada x (progress linear).
 * cx1 dan cx2 di-clamp ke 0..1.
 */
export function solveCubicBezier(
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x: number
): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Clamp X handles ke 0..1
  cx1 = Math.max(0, Math.min(1, cx1));
  cx2 = Math.max(0, Math.min(1, cx2));

  const { c1: xc1, c2: xc2, c3: xc3 } = polyCoeffX(cx1, cx2);
  const { c1: yc1, c2: yc2, c3: yc3 } = polyCoeffX(cy1, cy2);

  // Newton-Raphson iteration
  let t = x;
  for (let i = 0; i < 10; i++) {
    const xEst = evalBezierAxis(xc1, xc2, xc3, t) - x;
    if (Math.abs(xEst) < 1e-7) break;
    const dxdt = evalBezierAxisDerivative(xc1, xc2, xc3, t);
    if (Math.abs(dxdt) < 1e-10) break;
    t -= xEst / dxdt;
    t = Math.max(0, Math.min(1, t));
  }

  return evalBezierAxis(yc1, yc2, yc3, t);
}

/**
 * Memastikan keyframe terisi di t=0 dan t=1 tanpa mengubah array asli.
 */
function anchorKeyframes<T extends { t: number; v: any; e?: PlmEasing; hold?: true }>(
  kfs: T[]
): T[] {
  if (kfs.length === 0) return kfs;

  const sorted = [...kfs].sort((a, b) => a.t - b.t);
  const result: T[] = [];

  if (sorted[0].t > 0) {
    result.push({ t: 0, v: sorted[0].v } as T);
  }

  result.push(...sorted);

  if (sorted[sorted.length - 1].t < 1) {
    result.push({ t: 1, v: sorted[sorted.length - 1].v } as T);
  }

  return result;
}

/**
 * Interpolasi scalar track (rot) pada t (0..1).
 */
export function interpolateScalar(kfs: PlmKeyframeRot[], t: number): number {
  if (kfs.length === 0) return 0;

  const anchored = anchorKeyframes(kfs);
  if (anchored.length === 1) return anchored[0].v;

  t = Math.max(0, Math.min(1, t));

  let lo = anchored[0];
  let hi = anchored[anchored.length - 1];

  for (let i = 0; i < anchored.length - 1; i++) {
    if (t >= anchored[i].t && t <= anchored[i + 1].t) {
      lo = anchored[i];
      hi = anchored[i + 1];
      break;
    }
  }

  if (lo.t === hi.t) return lo.v;

  // HOLD check dilakukan sebelum kalkulasi progress
  if (lo.hold) return lo.v;

  const progress = (t - lo.t) / (hi.t - lo.t);
  const easedProgress = lo.e
    ? solveCubicBezier(lo.e[0], lo.e[1], lo.e[2], lo.e[3], progress)
    : progress;

  return lo.v + (hi.v - lo.v) * easedProgress;
}

/**
 * Interpolasi Vec2 track (pos / scl).
 */
export function interpolateVec2(
  kfs: PlmKeyframePos[] | PlmKeyframeScl[],
  t: number
): [number, number] {
  if (kfs.length === 0) return [0, 0];

  const xKfs = kfs.map((k) => ({
    t: k.t,
    v: (k.v as [number, number])[0],
    e: k.e,
    hold: k.hold,
  })) as PlmKeyframeRot[];

  const yKfs = kfs.map((k) => ({
    t: k.t,
    v: (k.v as [number, number])[1],
    e: k.e,
    hold: k.hold,
  })) as PlmKeyframeRot[];

  return [interpolateScalar(xKfs, t), interpolateScalar(yKfs, t)];
}

/**
 * Evaluasi state animasi lengkap (pos, rot, scl) pada t (0..1).
 */
export function computeFrameState(motion: PlmMotion, t: number): PlmFrameState {
  return {
    pos:
      motion.tracks.pos && motion.tracks.pos.length > 0
        ? interpolateVec2(motion.tracks.pos, t)
        : [0, 0],
    rot:
      motion.tracks.rot && motion.tracks.rot.length > 0
        ? interpolateScalar(motion.tracks.rot, t)
        : 0,
    scl:
      motion.tracks.scl && motion.tracks.scl.length > 0
        ? interpolateVec2(motion.tracks.scl, t)
        : [1, 1],
  };
}