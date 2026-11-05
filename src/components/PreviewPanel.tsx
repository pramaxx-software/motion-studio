import React, { useEffect, useRef } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import {
  PlmComposition,
  PREVIEW_FPS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../remotion/PlmComposition';
import { useEditorStore } from '../store/editorStore';

export const PreviewPanel: React.FC = () => {
  const localPlayerRef = useRef<PlayerRef>(null);
  const { motion, currentT, setCurrentT, setPlayerRef } = useEditorStore();

  const durationInFrames = Math.max(
    1,
    Math.round(motion.duration * PREVIEW_FPS)
  );

  // Simpan instance player ke Zustand store
  useEffect(() => {
    if (localPlayerRef.current) {
      setPlayerRef(localPlayerRef.current);
    }
  }, [setPlayerRef]);

  // Sync 1: Player playback -> Timeline store (hanya saat animasi diputar)
  useEffect(() => {
    const player = localPlayerRef.current;
    if (!player) return;

    const handler = (e: { detail: { frame: number } }) => {
      if (player.isPlaying()) {
        setCurrentT(e.detail.frame / durationInFrames);
      }
    };

    player.addEventListener('frameupdate', handler);
    return () => player.removeEventListener('frameupdate', handler);
  }, [durationInFrames, setCurrentT]);

  // Sync 2: REAL-TIME PREVIEW SEEKING
  // Memastikan saat currentT berubah dari timeline scrubber drag atau inspector slider, canvas Remotion langsung me-render frame tersebut secara real-time
  useEffect(() => {
    const player = localPlayerRef.current;
    if (!player) return;

    const targetFrame = Math.round(currentT * durationInFrames);
    const currentFrame = player.getCurrentFrame();

    // Jalankan seekTo hanya saat pause dan selisih frame >= 1 (mencegah loop dengan event frameupdate)
    if (!player.isPlaying() && Math.abs(currentFrame - targetFrame) >= 1) {
      player.seekTo(targetFrame);
    }
  }, [currentT, durationInFrames]);

  return (
    <div className="relative overflow-hidden w-full h-full flex items-center justify-center bg-black/40 p-4 rounded-lg border border-slate-800">
      <div className="w-full max-w-200 aspect-4/3 rounded overflow-hidden shadow-2xl border border-slate-700">
        <Player
          ref={localPlayerRef}
          component={PlmComposition}
          inputProps={{ motion }}
          fps={PREVIEW_FPS}
          durationInFrames={durationInFrames}
          compositionWidth={CANVAS_WIDTH}
          compositionHeight={CANVAS_HEIGHT}
          style={{
            width: '100%',
            height: '100%',
          }}
          loop
          controls
        />
      </div>
    </div>
  );
};