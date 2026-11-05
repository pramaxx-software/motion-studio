import React, { useRef, useEffect } from 'react';
import { useEditorStore, type TrackType } from '../store/editorStore';
import { computeFrameState } from '../engine/interpolate';
import type { PlmKeyframePos, PlmKeyframeRot, PlmKeyframeScl } from '../types/plm';

export const Timeline: React.FC = () => {
  const {
    motion,
    currentT,
    setCurrentT,
    selectedTrack,
    selectedKeyframeIndex,
    selectKeyframe,
    addKeyframe,
    updateKeyframe,
    deleteKeyframe,
  } = useEditorStore();

  const trackContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedTrack &&
        selectedKeyframeIndex !== null
      ) {
        if (
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA'
        ) {
          return;
        }
        e.preventDefault();
        deleteKeyframe(selectedTrack, selectedKeyframeIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTrack, selectedKeyframeIndex, deleteKeyframe]);

  const handleAddKeyAtCurrentT = (track: TrackType, e: React.MouseEvent) => {
    e.stopPropagation();
    const state = computeFrameState(motion, currentT);
    let newKf: PlmKeyframePos | PlmKeyframeRot | PlmKeyframeScl;

    if (track === 'pos') {
      newKf = { t: currentT, v: state.pos };
    } else if (track === 'rot') {
      newKf = { t: currentT, v: state.rot };
    } else {
      newKf = { t: currentT, v: state.scl };
    }

    addKeyframe(track, newKf);
  };

  const handleTrackClick = (track: TrackType, e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackContainerRef.current) return;
    const rect = trackContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const t = Math.max(0, Math.min(1, clickX / rect.width));

    const state = computeFrameState(motion, t);
    let newKf: PlmKeyframePos | PlmKeyframeRot | PlmKeyframeScl;

    if (track === 'pos') {
      newKf = { t, v: state.pos };
    } else if (track === 'rot') {
      newKf = { t, v: state.rot };
    } else {
      newKf = { t, v: state.scl };
    }

    addKeyframe(track, newKf);
    setCurrentT(t);
  };

  const startScrubberDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const updateT = (clientX: number) => {
      if (!trackContainerRef.current) return;
      const rect = trackContainerRef.current.getBoundingClientRect();
      const newT = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setCurrentT(newT);
    };

    updateT(e.clientX);

    const onPointerMove = (moveEvent: PointerEvent) => {
      updateT(moveEvent.clientX);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
  };

  const startDiamondDrag = (
    track: TrackType,
    index: number,
    e: React.PointerEvent
  ) => {
    e.stopPropagation();
    e.preventDefault();
    selectKeyframe(track, index);

    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!trackContainerRef.current) return;
      const rect = trackContainerRef.current.getBoundingClientRect();
      const newT = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const roundedT = Number(newT.toFixed(4));
      updateKeyframe(track, index, { t: roundedT });
      // Update currentT real-time saat diamond di-drag
      setCurrentT(roundedT);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      target.removeEventListener('pointermove', onPointerMove);
      target.removeEventListener('pointerup', onPointerUp);
    };

    target.addEventListener('pointermove', onPointerMove);
    target.addEventListener('pointerup', onPointerUp);
  };

  const tracks: TrackType[] = ['pos', 'rot', 'scl'];

  return (
    <div className="flex flex-col bg-slate-900 border-t border-slate-800 text-slate-200 select-none p-4 gap-3 h-full">
      <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-800 pb-2">
        <span className="text-indigo-400 uppercase tracking-wider">Timeline</span>
        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <span>T: {currentT.toFixed(3)}</span>
          <span>Waktu: {(currentT * motion.duration).toFixed(2)}s / {motion.duration}s</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 relative flex-1 justify-center">
        {tracks.map((track) => {
          const keyframes = motion.tracks[track] || [];
          return (
            <div key={track} className="flex items-center gap-3">
              <div className="w-16 text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{track}</span>
              </div>

              <div
                ref={trackContainerRef}
                onClick={(e) => handleTrackClick(track, e)}
                className="flex-1 h-8 bg-slate-950/80 rounded border border-slate-800 relative cursor-pointer overflow-hidden group"
              >
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20">
                  {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                    <div
                      key={step}
                      style={{ left: `${step * 100}%` }}
                      className="absolute top-0 bottom-0 w-px bg-slate-400"
                    />
                  ))}
                </div>

                {keyframes.map((kf, idx) => {
                  const isSelected =
                    selectedTrack === track && selectedKeyframeIndex === idx;
                  return (
                    <div
                      key={idx}
                      style={{ left: `${kf.t * 100}%` }}
                      onPointerDown={(e) => startDiamondDrag(track, idx, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectKeyframe(track, idx);
                        setCurrentT(kf.t);
                      }}
                      className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rotate-45 cursor-grab active:cursor-grabbing transition-transform z-10 ${
                        isSelected
                          ? 'bg-amber-400 ring-2 ring-amber-300 scale-125 z-20'
                          : kf.hold
                          ? 'bg-emerald-400 hover:scale-110'
                          : kf.e
                          ? 'bg-sky-400 hover:scale-110'
                          : 'bg-indigo-500 hover:scale-110'
                      }`}
                      title={`${track} t=${kf.t.toFixed(3)} ${
                        kf.hold ? '[HOLD]' : kf.e ? '[EASING]' : ''
                      }`}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={(e) => handleAddKeyAtCurrentT(track, e)}
                className="px-2 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded border border-slate-700 transition"
              >
                + Add Key
              </button>
            </div>
          );
        })}

        {trackContainerRef.current && (
          <div
            style={{
              left: `calc(4rem + 0.75rem + ${
                currentT * (trackContainerRef.current.clientWidth || 0)
              }px)`,
            }}
            onPointerDown={startScrubberDrag}
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-30 cursor-ew-resize -translate-x-1/2 pointer-events-auto"
          >
            <div className="w-3 h-3 bg-amber-400 rotate-45 -translate-x-1.25 -translate-y-1 rounded-sm shadow-md" />
          </div>
        )}
      </div>
    </div>
  );
};