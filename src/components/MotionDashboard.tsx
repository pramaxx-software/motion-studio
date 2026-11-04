import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useEditorStore } from '../store/editorStore';
import { apiFetch } from '../utils/api';
import { importMotion } from '../utils/plmJson';
import type { MotionRecord } from '../types/auth';
import LogoIcon from "../assets/icon.png"

export const MotionDashboard: React.FC = () => {
  const { user, logout, setView } = useAuthStore();
  const { setMotion, setEditingMotionId } = useEditorStore();

  const [motions, setMotions] = useState<MotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchMotions = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch<MotionRecord[]>('/motion/list');
      setMotions(data);
    } catch (err) {
      console.error('Gagal mengambil daftar motion:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMotions();
  }, []);

  const handleCreateNew = () => {
    setEditingMotionId(null);
    setMotion({
      name: 'Motion Baru',
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
    });
    setView('editor');
  };

  const handleEdit = (record: MotionRecord) => {
    const rawPayload =
      typeof record.payload === 'string'
        ? record.payload
        : JSON.stringify(record.payload);

    const res = importMotion(rawPayload);
    if (res.ok) {
      setEditingMotionId(record.id);
      setMotion(res.motion);
      setView('editor');
    } else {
      alert(`Gagal memuat motion: ${res.error}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus gerakan ini?')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/motion/delete/${id}`, { method: 'DELETE' });
      setMotions((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredMotions = motions.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full bg-[#1a1a2e] text-slate-200 flex flex-col">
      {/* Top Navbar Dashboard */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
            <img src={LogoIcon} alt="" />
          </div>
          <h1 className="text-base font-bold text-white hidden sm:block">Motion Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-medium">
            Halo, <strong className="text-indigo-400">{user?.name}</strong>
          </span>
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg border border-slate-700 transition"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Daftar Gerakan PLM</h2>
            <p className="text-xs text-slate-400 mt-1">Kelola preset animasi motion untuk LED Videotron</p>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <span>+ Bikin Motion Baru</span>
          </button>
        </div>

        {/* Filter Input Search */}
        <div className="w-full max-w-md">
          <input
            type="text"
            placeholder="Cari preset motion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Grid List Motion */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500 text-xs">Memuat daftar motion...</div>
        ) : filteredMotions.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/40">
            <p className="text-slate-400 text-sm font-semibold">Belum Ada Motion Tersimpan</p>
            <p className="text-xs text-slate-500 mt-1">Klik "+ Bikin Motion Baru" untuk mulai mendesain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMotions.map((item) => {
              const payloadObj =
                typeof item.payload === 'string'
                  ? JSON.parse(item.payload)
                  : item.payload;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition shadow-lg group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-indigo-400 font-semibold uppercase">
                        {payloadObj.axis || '2d'} Axis
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {payloadObj.duration}s
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition">
                      {item.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-4">
                    <button
                      type="button"
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded border border-indigo-500/30 transition"
                    >
                      Edit Visual
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition"
                    >
                      {deletingId === item.id ? 'Menghapus...' : 'Hapus'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};