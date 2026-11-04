import React, { useCallback, useRef } from 'react';
import { solveCubicBezier } from '../engine/interpolate';
import type { PlmEasing } from '../types/plm';

interface Props {
  easing?: PlmEasing;
  onChange: (easing: PlmEasing | undefined) => void;
}

const DEFAULT_EASING: PlmEasing = [0.42, 0, 0.58, 1]; // Ease In-Out

export const BezierEditor: React.FC<Props> = ({ easing, onChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const activeEasing = easing || DEFAULT_EASING;
  const [cx1, cy1, cx2, cy2] = activeEasing;

  // Konversi koordinat Bezier (x: 0..1, y: -0.5..1.5) ke koordinat SVG (200x200 canvas)
  const PAD = 30;
  const SIZE = 140;

  const toSvgX = (x: number) => PAD + Math.max(0, Math.min(1, x)) * SIZE;
  const toSvgY = (y: number) => PAD + SIZE - y * SIZE;

  const fromSvgX = (X: number) => Math.max(0, Math.min(1, (X - PAD) / SIZE));
  const fromSvgY = (Y: number) => (PAD + SIZE - Y) / SIZE;

  // Handle Dragging
  const handlePointerMove = useCallback(
    (pointIndex: 1 | 2, e: React.PointerEvent) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = Number(fromSvgX(mouseX).toFixed(2));
      const newY = Number(fromSvgY(mouseY).toFixed(2));

      if (pointIndex === 1) {
        onChange([newX, newY, cx2, cy2]);
      } else {
        onChange([cx1, cy1, newX, newY]);
      }
    },
    [cx1, cy1, cx2, cy2, onChange]
  );

  const startDrag = (pointIndex: 1 | 2, e: React.PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onMove = (moveEvent: PointerEvent) => {
      handlePointerMove(pointIndex, moveEvent as unknown as React.PointerEvent);
    };

    const onUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', onMove);
      target.removeEventListener('pointerup', onUp);
    };

    target.addEventListener('pointermove', onMove);
    target.addEventListener('pointerup', onUp);
  };

  // Generate titik-titik sampel kurva bezier untuk SVG polyline (100 sampel)
  const points: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const x = i / 100;
    const y = solveCubicBezier(cx1, cy1, cx2, cy2, x);
    points.push(`${toSvgX(x)},${toSvgY(y)}`);
  }

  // Preset Handlers
  const applyPreset = (preset?: PlmEasing) => {
    onChange(preset);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-900/60 rounded-lg border border-slate-800">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-300">Bezier Easing Curve</span>
        <button
          type="button"
          onClick={() => applyPreset(undefined)}
          className={`text-[11px] px-2 py-0.5 rounded transition ${
            !easing
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Linear (Default)
        </button>
      </div>

      {/* Visual Canvas (SVG) */}
      <div className="relative w-full aspect-square max-w-[200px] mx-auto bg-slate-950 rounded border border-slate-800 overflow-hidden select-none">
        <svg
          ref={svgRef}
          viewBox="0 0 200 200"
          className="w-full h-full cursor-crosshair touch-none"
        >
          {/* Grid Background */}
          <line x1={PAD} y1={PAD} x2={PAD + SIZE} y2={PAD} stroke="#334155" strokeDasharray="2 2" />
          <line x1={PAD} y1={PAD + SIZE} x2={PAD + SIZE} y2={PAD + SIZE} stroke="#334155" strokeDasharray="2 2" />
          
          {/* Tangent Lines */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(cx1)}
            y2={toSvgY(cy1)}
            stroke="#e94560"
            strokeWidth="1.5"
          />
          <line
            x1={toSvgX(1)}
            y1={toSvgY(1)}
            x2={toSvgX(cx2)}
            y2={toSvgY(cy2)}
            stroke="#3b82f6"
            strokeWidth="1.5"
          />

          {/* Easing Curve */}
          <polyline
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
            points={points.join(' ')}
          />

          {/* Fixed Endpoints P0 & P3 */}
          <circle cx={toSvgX(0)} cy={toSvgY(0)} r="4" fill="#94a3b8" />
          <circle cx={toSvgX(1)} cy={toSvgY(1)} r="4" fill="#94a3b8" />

          {/* Draggable Handles P1 (cx1, cy1) & P2 (cx2, cy2) */}
          <circle
            cx={toSvgX(cx1)}
            cy={toSvgY(cy1)}
            r="6"
            fill="#e94560"
            className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
            onPointerDown={(e) => startDrag(1, e)}
          />
          <circle
            cx={toSvgX(cx2)}
            cy={toSvgY(cy2)}
            r="6"
            fill="#3b82f6"
            className="cursor-grab active:cursor-grabbing hover:scale-125 transition-transform"
            onPointerDown={(e) => startDrag(2, e)}
          />
        </svg>
      </div>

      {/* Manual Inputs (cx1, cy1, cx2, cy2) */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div>
          <label className="block text-[10px] text-slate-400">cx1</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={cx1}
            onChange={(e) => onChange([parseFloat(e.target.value) || 0, cy1, cx2, cy2])}
            className="w-full bg-slate-800 text-slate-200 text-xs px-1 py-1 rounded text-center border border-slate-700"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400">cy1</label>
          <input
            type="number"
            step="0.01"
            value={cy1}
            onChange={(e) => onChange([cx1, parseFloat(e.target.value) || 0, cx2, cy2])}
            className="w-full bg-slate-800 text-slate-200 text-xs px-1 py-1 rounded text-center border border-slate-700"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400">cx2</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={cx2}
            onChange={(e) => onChange([cx1, cy1, parseFloat(e.target.value) || 0, cy2])}
            className="w-full bg-slate-800 text-slate-200 text-xs px-1 py-1 rounded text-center border border-slate-700"
          />
        </div>
        <div>
          <label className="block text-[10px] text-slate-400">cy2</label>
          <input
            type="number"
            step="0.01"
            value={cy2}
            onChange={(e) => onChange([cx1, cy1, cx2, parseFloat(e.target.value) || 0])}
            className="w-full bg-slate-800 text-slate-200 text-xs px-1 py-1 rounded text-center border border-slate-700"
          />
        </div>
      </div>

      {/* Easing Presets */}
      <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800">
        <button
          type="button"
          onClick={() => applyPreset(undefined)}
          className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
        >
          Linear
        </button>
        <button
          type="button"
          onClick={() => applyPreset([0.42, 0, 1, 1])}
          className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
        >
          Ease In
        </button>
        <button
          type="button"
          onClick={() => applyPreset([0, 0, 0.58, 1])}
          className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
        >
          Ease Out
        </button>
        <button
          type="button"
          onClick={() => applyPreset([0.42, 0, 0.58, 1])}
          className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
        >
          Ease In-Out
        </button>
        <button
          type="button"
          onClick={() => applyPreset([0.34, 1.56, 0.64, 1])}
          className="text-[10px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-amber-400"
        >
          Bounce
        </button>
      </div>
    </div>
  );
};