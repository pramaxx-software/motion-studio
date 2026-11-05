import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { computeFrameState } from '../engine/interpolate';
import type { PlmMotion } from '../types/plm';
import LogoPramaxx from "../assets/pramaxx.png"
export const PREVIEW_FPS = 30;
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 600;

interface Props {
  motion: PlmMotion;
  previewLabel?: string;
}

export const PlmComposition: React.FC<Props> = ({
  motion,
  previewLabel = 'LOGO',
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Beregn normalized t (0..1). Sørg for at t beregnes per frame for en sømløs loop.
  const t = durationInFrames > 1 ? frame / durationInFrames : 0;
  const { pos, rot, scl } = computeFrameState(motion, t);

  return (
    <AbsoluteFill style={{ background: '#1a1a2e' }}>
      {/* Kanvas senterkryss / hjelpelinjer */}
      <div
        style={{
          position: 'absolute',
          width: 1,
          height: CANVAS_HEIGHT,
          left: CANVAS_WIDTH / 2,
          top: 0,
          background: 'rgba(255,255,255,0.1)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: CANVAS_WIDTH,
          height: 1,
          left: 0,
          top: CANVAS_HEIGHT / 2,
          background: 'rgba(255,255,255,0.1)',
          pointerEvents: 'none',
        }}
      />

      {/* Animert objekt med transform offset basert på spesifikasjonen[cite: 1] */}
      <div
        style={{
          position: 'absolute',
          left: CANVAS_WIDTH / 2 + pos[0],
          top: CANVAS_HEIGHT / 2 + pos[1],
          transform: [
            'translate(-50%, -50%)',
            `rotate(${rot}deg)`,
            `scale(${scl[0]}, ${scl[1]})`,
            motion.axis === '3d' ? `rotateY(${rot}deg)` : '',
          ]
            .filter(Boolean)
            .join(' '),
          transformOrigin: 'center center',
          ...(motion.axis === '3d' && { perspective: 800 }),
        }}
      >
        <div
          style={{
            padding: '12px 24px',
            background: '#000000',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontSize: 20,
            fontWeight: 700,
            borderRadius: 6,
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <img src={LogoPramaxx} alt="" />
        </div>
      </div>
    </AbsoluteFill>
  );
};