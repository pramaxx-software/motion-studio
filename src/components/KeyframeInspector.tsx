import React from 'react';
import { useEditorStore } from '../store/editorStore';
import type { PlmEasing, PlmKeyframePos, PlmKeyframeRot, PlmKeyframeScl } from '../types/plm';
import { BezierEditor } from './BezierEditor';

export const KeyframeInspector: React.FC = () => {
  const {
    motion,
    selectedTrack,
    selectedKeyframeIndex,
    updateKeyframe,
    deleteKeyframe,
    setCurrentT,
  } = useEditorStore();

  if (
    !selectedTrack ||
    selectedKeyframeIndex === null ||
    !motion.tracks[selectedTrack] ||
    !motion.tracks[selectedTrack]![selectedKeyframeIndex]
  ) {
    return (
      <div className="p-4 text-center text-slate-500 text-xs italic bg-slate-900/40 rounded-lg border border-slate-800/80">
        Pilih salah satu keyframe di timeline untuk melihat inspector.
      </div>
    );
  }

  const kf = motion.tracks[selectedTrack]![selectedKeyframeIndex];

  const handleTChange = (newT: number) => {
    const clampedT = Math.max(0, Math.min(1, newT));
    updateKeyframe(selectedTrack, selectedKeyframeIndex, { t: clampedT });
    // Snap preview canvas ke posisi t keyframe yang sedang di-edit
    setCurrentT(clampedT);
  };

  const handleHoldToggle = (hold: boolean) => {
    if (hold) {
      updateKeyframe(selectedTrack, selectedKeyframeIndex, { hold: true, e: undefined });
    } else {
      updateKeyframe(selectedTrack, selectedKeyframeIndex, { hold: undefined });
    }
  };

  const handleEasingChange = (easing?: PlmEasing) => {
    updateKeyframe(selectedTrack, selectedKeyframeIndex, { e: easing });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900/80 rounded-lg border border-slate-800">
      <div className="flex justify-between items-center pb-2 border-b border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
          Keyframe Inspector ({selectedTrack.toUpperCase()})
        </h3>
        <button
          type="button"
          onClick={() => deleteKeyframe(selectedTrack, selectedKeyframeIndex)}
          className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-2 py-1 rounded transition"
        >
          Hapus Keyframe
        </button>
      </div>

      {/* Input Waktu (t) Slider + Number */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center text-xs">
          <label className="text-slate-300 font-medium">Position (t)</label>
          <span className="text-slate-400 font-mono">{kf.t.toFixed(3)}</span>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={kf.t}
            onChange={(e) => handleTChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <input
            type="number"
            min="0"
            max="1"
            step="0.001"
            value={kf.t}
            onChange={(e) => handleTChange(parseFloat(e.target.value) || 0)}
            className="w-20 bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 rounded font-mono text-right"
          />
        </div>
      </div>

      {/* Input Nilai (v) Realtime Slider */}
      <div className="flex flex-col gap-3 pt-2 border-t border-slate-800">
        <label className="text-xs text-slate-300 font-medium">Value (v)</label>

        {/* Position Track (X & Y) */}
        {selectedTrack === 'pos' && (
          <div className="flex flex-col gap-2.5">
            {/* Pos X */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">X (px)</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {(kf as PlmKeyframePos).v[0]} px
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="1"
                  value={(kf as PlmKeyframePos).v[0]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [parseFloat(e.target.value) || 0, (kf as PlmKeyframePos).v[1]],
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <input
                  type="number"
                  value={(kf as PlmKeyframePos).v[0]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [parseFloat(e.target.value) || 0, (kf as PlmKeyframePos).v[1]],
                    })
                  }
                  className="w-20 bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 rounded font-mono text-right"
                />
              </div>
            </div>

            {/* Pos Y */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Y (px)</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {(kf as PlmKeyframePos).v[1]} px
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="-300"
                  max="300"
                  step="1"
                  value={(kf as PlmKeyframePos).v[1]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [(kf as PlmKeyframePos).v[0], parseFloat(e.target.value) || 0],
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <input
                  type="number"
                  value={(kf as PlmKeyframePos).v[1]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [(kf as PlmKeyframePos).v[0], parseFloat(e.target.value) || 0],
                    })
                  }
                  className="w-20 bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 rounded font-mono text-right"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rotation Track */}
        {selectedTrack === 'rot' && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Rotation (deg)</span>
              <span className="text-[10px] font-mono text-slate-400">
                {(kf as PlmKeyframeRot).v}°
              </span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="range"
                min="-360"
                max="360"
                step="1"
                value={(kf as PlmKeyframeRot).v}
                onChange={(e) =>
                  updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                    v: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <input
                type="number"
                value={(kf as PlmKeyframeRot).v}
                onChange={(e) =>
                  updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                    v: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-20 bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 rounded font-mono text-right"
              />
            </div>
          </div>
        )}

        {/* Scale Track (Scale X & Scale Y) */}
        {selectedTrack === 'scl' && (
          <div className="flex flex-col gap-2.5">
            {/* Scale X */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Scale X</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Number((kf as PlmKeyframeScl).v[0]).toFixed(2)}x
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.01"
                  value={(kf as PlmKeyframeScl).v[0]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [parseFloat(e.target.value) || 0, (kf as PlmKeyframeScl).v[1]],
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <input
                  type="number"
                  step="0.01"
                  value={(kf as PlmKeyframeScl).v[0]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [parseFloat(e.target.value) || 0, (kf as PlmKeyframeScl).v[1]],
                    })
                  }
                  className="w-20 bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 rounded font-mono text-right"
                />
              </div>
            </div>

            {/* Scale Y */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Scale Y</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {Number((kf as PlmKeyframeScl).v[1]).toFixed(2)}x
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.01"
                  value={(kf as PlmKeyframeScl).v[1]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [(kf as PlmKeyframeScl).v[0], parseFloat(e.target.value) || 0],
                    })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <input
                  type="number"
                  step="0.01"
                  value={(kf as PlmKeyframeScl).v[1]}
                  onChange={(e) =>
                    updateKeyframe(selectedTrack, selectedKeyframeIndex, {
                      v: [(kf as PlmKeyframeScl).v[0], parseFloat(e.target.value) || 0],
                    })
                  }
                  className="w-20 bg-slate-800 border border-slate-700 text-white text-xs px-2 py-1 rounded font-mono text-right"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Checkbox Hold */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
        <input
          type="checkbox"
          id="hold-checkbox"
          checked={!!kf.hold}
          onChange={(e) => handleHoldToggle(e.target.checked)}
          className="accent-indigo-500 rounded cursor-pointer"
        />
        <label htmlFor="hold-checkbox" className="text-xs text-slate-300 font-medium cursor-pointer">
          Hold / Step Value (Tahan nilai sampai keyframe berikutnya)
        </label>
      </div>

      {/* Easing Editor jika hold tidak di-centang */}
      {!kf.hold && (
        <div className="pt-2 border-t border-slate-800">
          <BezierEditor easing={kf.e} onChange={handleEasingChange} />
        </div>
      )}
    </div>
  );
};