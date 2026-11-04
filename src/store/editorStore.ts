import { create } from 'zustand';
import type { PlayerRef } from '@remotion/player';
import type {
  PlmKeyframePos,
  PlmKeyframeRot,
  PlmKeyframeScl,
  PlmMotion,
} from '../types/plm';

const DEFAULT_MOTION: PlmMotion = {
  name: 'New Motion',
  format: 'plm-motion',
  version: 1,
  duration: 2.0,
  axis: '2d',
  tracks: {
    pos: [
      { t: 0, v: [0, 0] },
      { t: 1, v: [0, 0] },
    ],
    rot: [
      { t: 0, v: 0 },
      { t: 1, v: 360 },
    ],
    scl: [
      { t: 0, v: [1, 1] },
      { t: 1, v: [1, 1] },
    ],
  },
};

export type TrackType = 'pos' | 'rot' | 'scl';

interface EditorStore {
  motion: PlmMotion;
  currentT: number;
  isPlaying: boolean;
  selectedTrack: TrackType | null;
  selectedKeyframeIndex: number | null;
  playerRef: PlayerRef | null;

  setPlayerRef: (ref: PlayerRef | null) => void;
  setMotionField: <K extends keyof PlmMotion>(key: K, value: PlmMotion[K]) => void;
  addKeyframe: (
    track: TrackType,
    kf: PlmKeyframePos | PlmKeyframeRot | PlmKeyframeScl
  ) => void;
  updateKeyframe: (
    track: TrackType,
    index: number,
    patch: Partial<PlmKeyframePos | PlmKeyframeRot | PlmKeyframeScl>
  ) => void;
  deleteKeyframe: (track: TrackType, index: number) => void;
  selectKeyframe: (track: TrackType | null, index: number | null) => void;
  setCurrentT: (t: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setMotion: (motion: PlmMotion) => void;
  editingMotionId: number | null;
setEditingMotionId: (id: number | null) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  motion: DEFAULT_MOTION,
  currentT: 0,
  isPlaying: false,
  selectedTrack: null,
  selectedKeyframeIndex: null,
  playerRef: null,
  

  setPlayerRef: (playerRef) => set({ playerRef }),

  setMotionField: (key, value) =>
    set((state) => ({
      motion: { ...state.motion, [key]: value },
    })),

  addKeyframe: (track, kf) =>
    set((state) => {
      const currentTrackKfs = state.motion.tracks[track] || [];
      if (currentTrackKfs.some((item) => Math.abs(item.t - kf.t) < 0.0001)) {
        return state;
      }
      const updatedTrack = [...currentTrackKfs, kf].sort((a, b) => a.t - b.t);
      const newIndex = updatedTrack.findIndex((item) => item.t === kf.t);

      return {
        motion: {
          ...state.motion,
          tracks: {
            ...state.motion.tracks,
            [track]: updatedTrack,
          },
        },
        selectedTrack: track,
        selectedKeyframeIndex: newIndex,
      };
    }),

  updateKeyframe: (track, index, patch) =>
    set((state) => {
      const trackKfs = state.motion.tracks[track];
      if (!trackKfs || !trackKfs[index]) return state;

      const targetKf = { ...trackKfs[index], ...patch };
      
      if (patch.t !== undefined && patch.t !== trackKfs[index].t) {
        const collision = trackKfs.some(
          (k, idx) => idx !== index && Math.abs(k.t - targetKf.t) < 0.0001
        );
        if (collision) return state;
      }

      const updatedTrack = trackKfs.map((k, idx) => (idx === index ? targetKf : k));
      updatedTrack.sort((a, b) => a.t - b.t);
      const newIndex = updatedTrack.indexOf(targetKf);

      return {
        motion: {
          ...state.motion,
          tracks: {
            ...state.motion.tracks,
            [track]: updatedTrack,
          },
        },
        selectedKeyframeIndex: state.selectedTrack === track ? newIndex : state.selectedKeyframeIndex,
      };
    }),

  deleteKeyframe: (track, index) =>
    set((state) => {
      const trackKfs = state.motion.tracks[track];
      if (!trackKfs || trackKfs.length <= 1) return state;

      const updatedTrack = trackKfs.filter((_, idx) => idx !== index);

      return {
        motion: {
          ...state.motion,
          tracks: {
            ...state.motion.tracks,
            [track]: updatedTrack,
          },
        },
        selectedTrack: state.selectedTrack === track ? null : state.selectedTrack,
        selectedKeyframeIndex: state.selectedTrack === track ? null : state.selectedKeyframeIndex,
      };
    }),

  selectKeyframe: (track, index) =>
    set({
      selectedTrack: track,
      selectedKeyframeIndex: index,
    }),

  setCurrentT: (t) => set({ currentT: Math.max(0, Math.min(1, t)) }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setMotion: (motion) =>
    set({
      motion,
      selectedTrack: null,
      selectedKeyframeIndex: null,
      currentT: 0,
    }),
    editingMotionId: null,
setEditingMotionId: (editingMotionId) => set({ editingMotionId }),
}));