import { useEffect } from 'react';
import { useEditorStore } from '../store/editorStore';
import { PREVIEW_FPS } from '../remotion/PlmComposition';
import { exportMotion } from '../utils/plmJson';

export function useKeyboardShortcuts() {
  const {
    motion,
    currentT,
    setCurrentT,
    playerRef,
    selectedTrack,
    selectedKeyframeIndex,
    selectKeyframe,
    deleteKeyframe,
  } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: Abaikan shortcut jika sedang mengetik di elemen input/textarea/select
      const activeEl:any = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.isContentEditable;

      if (isInputFocused) return;

      const totalFrames = Math.max(1, Math.round(motion.duration * PREVIEW_FPS));
      const currentFrame = Math.round(currentT * totalFrames);

      // 1. Space: Toggle Play / Pause
      if (e.code === 'Space') {
        e.preventDefault();
        if (playerRef) {
          if (playerRef.isPlaying()) {
            playerRef.pause();
          } else {
            playerRef.play();
          }
        }
        return;
      }

      // 2. Arrow Left: Step Back 1 Frame
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const prevFrame = Math.max(0, currentFrame - 1);
        const nextT = prevFrame / totalFrames;
        setCurrentT(nextT);
        if (playerRef) {
          playerRef.pause();
          playerRef.seekTo(prevFrame);
        }
        return;
      }

      // 3. Arrow Right: Step Forward 1 Frame
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        const nextFrame = Math.min(totalFrames - 1, currentFrame + 1);
        const nextT = nextFrame / totalFrames;
        setCurrentT(nextT);
        if (playerRef) {
          playerRef.pause();
          playerRef.seekTo(nextFrame);
        }
        return;
      }

      // 4. Home: Jump to t = 0
      if (e.code === 'Home') {
        e.preventDefault();
        setCurrentT(0);
        if (playerRef) {
          playerRef.pause();
          playerRef.seekTo(0);
        }
        return;
      }

      // 5. End: Jump to Last Frame
      if (e.code === 'End') {
        e.preventDefault();
        const lastFrame = totalFrames - 1;
        setCurrentT(lastFrame / totalFrames);
        if (playerRef) {
          playerRef.pause();
          playerRef.seekTo(lastFrame);
        }
        return;
      }

      // 6. Escape: Clear Selected Keyframe
      if (e.code === 'Escape') {
        e.preventDefault();
        selectKeyframe(null, null);
        return;
      }

      // 7. Delete / Backspace: Delete Selected Keyframe
      if (e.code === 'Delete' || e.code === 'Backspace') {
        if (selectedTrack && selectedKeyframeIndex !== null) {
          e.preventDefault();
          deleteKeyframe(selectedTrack, selectedKeyframeIndex);
        }
        return;
      }

      // 8. Ctrl+S / Cmd+S: Quick Export JSON
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault();
        const jsonStr = exportMotion(motion);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${motion.name.toLowerCase().replace(/\s+/g, '-')}.plm-motion.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    motion,
    currentT,
    setCurrentT,
    playerRef,
    selectedTrack,
    selectedKeyframeIndex,
    selectKeyframe,
    deleteKeyframe,
  ]);
}