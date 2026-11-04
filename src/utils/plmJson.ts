import type {
  PlmKeyframePos,
  PlmKeyframeRot,
  PlmKeyframeScl,
  PlmMotion,
  PlmTracks,
} from '../types/plm';

/**
 * Meng-export PlmMotion menjadi string JSON yang bersih dan sesuai spesifikasi:
 * 1. Mengurutkan keyframe berdasarkan t ascending.
 * 2. Menghapus field opsional jika undefined/default (px_scale jika tidak di-set, axis jika "2d").
 * 3. Menghapus field `e` jika undefined dan field `hold` jika false.
 */
export function exportMotion(motion: PlmMotion): string {
  const cleanedTracks: PlmTracks = {};

  if (motion.tracks.pos && motion.tracks.pos.length > 0) {
    cleanedTracks.pos = [...motion.tracks.pos]
      .sort((a, b) => a.t - b.t)
      .map((kf) => {
        const item: PlmKeyframePos = { t: kf.t, v: [kf.v[0], kf.v[1]] };
        if (kf.e) item.e = kf.e;
        if (kf.hold) item.hold = true;
        return item;
      });
  }

  if (motion.tracks.rot && motion.tracks.rot.length > 0) {
    cleanedTracks.rot = [...motion.tracks.rot]
      .sort((a, b) => a.t - b.t)
      .map((kf) => {
        const item: PlmKeyframeRot = { t: kf.t, v: kf.v };
        if (kf.e) item.e = kf.e;
        if (kf.hold) item.hold = true;
        return item;
      });
  }

  if (motion.tracks.scl && motion.tracks.scl.length > 0) {
    cleanedTracks.scl = [...motion.tracks.scl]
      .sort((a, b) => a.t - b.t)
      .map((kf) => {
        const item: PlmKeyframeScl = { t: kf.t, v: [kf.v[0], kf.v[1]] };
        if (kf.e) item.e = kf.e;
        if (kf.hold) item.hold = true;
        return item;
      });
  }

  const cleaned: Record<string, any> = {
    name: motion.name.slice(0, 64),
    format: 'plm-motion',
    version: Math.max(1, Math.floor(motion.version || 1)),
    duration: motion.duration,
  };

  if (motion.px_scale !== undefined && motion.px_scale !== null) {
    cleaned.px_scale = motion.px_scale;
  }

  // Hanya sertakan axis jika nilainya "3d" (default "2d" disembunyikan sesuai spec)
  if (motion.axis === '3d') {
    cleaned.axis = '3d';
  }

  cleaned.tracks = cleanedTracks;

  return JSON.stringify(cleaned, null, 2);
}

/**
 * Validasi ketat dan import JSON string menjadi objek PlmMotion.
 */
export function importMotion(
  jsonStr: string
): { ok: true; motion: PlmMotion } | { ok: false; error: string } {
  try {
    if (!jsonStr || jsonStr.trim().length === 0) {
      return { ok: false, error: 'Payload JSON tidak boleh kosong' };
    }

    const obj = JSON.parse(jsonStr);

    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return { ok: false, error: 'Payload JSON harus berupa objek valid' };
    }

    // 1. Validasi discriminator format
    if (obj.format !== 'plm-motion') {
      return {
        ok: false,
        error: 'Field "format" harus persis string literal "plm-motion"',
      };
    }

    // 2. Validasi nama motion
    if (typeof obj.name !== 'string' || obj.name.trim().length === 0) {
      return { ok: false, error: 'Field "name" wajib diisi dan berupa string' };
    }

    // 3. Validasi durasi
    if (
      typeof obj.duration !== 'number' ||
      isNaN(obj.duration) ||
      obj.duration <= 0
    ) {
      return { ok: false, error: 'Field "duration" harus berupa angka > 0' };
    }

    // 4. Validasi px_scale (opsional)
    if (obj.px_scale !== undefined && obj.px_scale !== null) {
      if (
        typeof obj.px_scale !== 'number' ||
        isNaN(obj.px_scale) ||
        obj.px_scale < 0.0005 ||
        obj.px_scale > 0.1
      ) {
        return {
          ok: false,
          error: 'Field "px_scale" harus berupa angka antara 0.0005 dan 0.1',
        };
      }
    }

    // 5. Validasi objek tracks
    if (
      !obj.tracks ||
      typeof obj.tracks !== 'object' ||
      Array.isArray(obj.tracks)
    ) {
      return { ok: false, error: 'Field "tracks" wajib ada dan berupa objek' };
    }

    const posLen = Array.isArray(obj.tracks.pos) ? obj.tracks.pos.length : 0;
    const rotLen = Array.isArray(obj.tracks.rot) ? obj.tracks.rot.length : 0;
    const sclLen = Array.isArray(obj.tracks.scl) ? obj.tracks.scl.length : 0;

    if (posLen === 0 && rotLen === 0 && sclLen === 0) {
      return {
        ok: false,
        error:
          'Minimal satu track (pos, rot, atau scl) harus berisi array keyframe non-kosong',
      };
    }

    // 6. Helper validasi keyframe per track
    const validateKfs = (
      kfs: any[],
      trackName: string,
      type: 'vec2' | 'scalar'
    ) => {
      if (!Array.isArray(kfs)) {
        return `Track "${trackName}" harus berupa array`;
      }

      for (let i = 0; i < kfs.length; i++) {
        const kf = kfs[i];
        if (typeof kf !== 'object' || kf === null) {
          return `Keyframe index [${i}] pada track "${trackName}" harus berupa objek`;
        }

        if (
          typeof kf.t !== 'number' ||
          isNaN(kf.t) ||
          kf.t < 0 ||
          kf.t > 1
        ) {
          return `Waktu keyframe (t) index [${i}] pada track "${trackName}" harus bernilai 0..1 (inklusif)`;
        }

        if (type === 'vec2') {
          if (
            !Array.isArray(kf.v) ||
            kf.v.length !== 2 ||
            typeof kf.v[0] !== 'number' ||
            typeof kf.v[1] !== 'number' ||
            isNaN(kf.v[0]) ||
            isNaN(kf.v[1])
          ) {
            return `Nilai v index [${i}] pada track "${trackName}" harus berupa pasangan koordinat [x, y] angka`;
          }
        } else if (type === 'scalar') {
          if (typeof kf.v !== 'number' || isNaN(kf.v)) {
            return `Nilai v index [${i}] pada track "${trackName}" harus berupa angka (derajat)`;
          }
        }

        if (kf.e !== undefined) {
          if (
            !Array.isArray(kf.e) ||
            kf.e.length !== 4 ||
            kf.e.some((val: any) => typeof val !== 'number' || isNaN(val))
          ) {
            return `Easing (e) index [${i}] pada track "${trackName}" harus berupa array bezier [cx1, cy1, cx2, cy2] dengan 4 angka`;
          }
        }
      }
      return null;
    };

    if (obj.tracks.pos) {
      const err = validateKfs(obj.tracks.pos, 'pos', 'vec2');
      if (err) return { ok: false, error: err };
    }
    if (obj.tracks.rot) {
      const err = validateKfs(obj.tracks.rot, 'rot', 'scalar');
      if (err) return { ok: false, error: err };
    }
    if (obj.tracks.scl) {
      const err = validateKfs(obj.tracks.scl, 'scl', 'vec2');
      if (err) return { ok: false, error: err };
    }

    const motion: PlmMotion = {
      name: obj.name.trim().slice(0, 64),
      format: 'plm-motion',
      version:
        typeof obj.version === 'number' && obj.version >= 1
          ? Math.floor(obj.version)
          : 1,
      duration: obj.duration,
      axis: obj.axis === '3d' ? '3d' : '2d',
      tracks: {
        pos: obj.tracks.pos
          ? [...obj.tracks.pos].sort((a: any, b: any) => a.t - b.t)
          : undefined,
        rot: obj.tracks.rot
          ? [...obj.tracks.rot].sort((a: any, b: any) => a.t - b.t)
          : undefined,
        scl: obj.tracks.scl
          ? [...obj.tracks.scl].sort((a: any, b: any) => a.t - b.t)
          : undefined,
      },
    };

    if (obj.px_scale !== undefined && obj.px_scale !== null) {
      motion.px_scale = obj.px_scale;
    }

    return { ok: true, motion };
  } catch (e) {
    return {
      ok: false,
      error: `Format JSON tidak valid: ${(e as Error).message}`,
    };
  }
}