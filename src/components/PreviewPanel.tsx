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
  const { motion, setCurrentT, setPlayerRef } = useEditorStore();

  const durationInFrames = Math.max(
    1,
    Math.round(motion.duration * PREVIEW_FPS)
  );

  useEffect(() => {
    if (localPlayerRef.current) {
      setPlayerRef(localPlayerRef.current);
    }
  }, [setPlayerRef]);

  useEffect(() => {
    const player = localPlayerRef.current;
    if (!player) return;

    const handler = (e: { detail: { frame: number } }) => {
      setCurrentT(e.detail.frame / durationInFrames);
    };

    player.addEventListener('frameupdate', handler);
    return () => player.removeEventListener('frameupdate', handler);
  }, [durationInFrames, setCurrentT]);

  return (
    <div className="relative w-full overflow-hidden h-full flex items-center justify-center bg-black/40 p-4 rounded-lg border border-slate-800">
      <div className="w-full max-w-200 aspect-4/3 rounded overflow-hidden shadow-2xl border border-slate-700">
        <Player
          acknowledgeRemotionLicense
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