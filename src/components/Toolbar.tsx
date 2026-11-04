import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useAuthStore } from '../store/authStore';
import { exportMotion, importMotion } from '../utils/plmJson';
import { apiFetch } from '../utils/api';

export const Toolbar: React.FC = () => {
  const { motion, setMotionField, setMotion, editingMotionId, setEditingMotionId } =
    useEditorStore();
  const { setView } = useAuthStore();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const hasKeyframes =
    (motion.tracks.pos && motion.tracks.pos.length > 0) ||
    (motion.tracks.rot && motion.tracks.rot.length > 0) ||
    (motion.tracks.scl && motion.tracks.scl.length > 0);

  const isValid = motion.duration > 0 && hasKeyframes;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSaveToCloud = async () => {
    if (!isValid) return alert('Payload motion belum valid!');

    setIsSaving(true);
    const jsonPayload = exportMotion(motion);

    try {
      if (editingMotionId) {
        // PUT /api/motions/:id
        await apiFetch(`/motion/update/${editingMotionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: motion.name,
            payload: jsonPayload,
          }),
        });
        showToast('Motion Berhasil Diperbarui!');
      } else {
        // POST /api/motions
        const res = await apiFetch<{ id: number }>('/motion/create', {
          method: 'POST',
          body: JSON.stringify({
            name: motion.name,
            payload: jsonPayload,
          }),
        });
        setEditingMotionId(res.id);
        showToast('Motion Baru Disimpan!');
      }
    } catch (err) {
      alert(`Gagal menyimpan: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const jsonStr = exportMotion(motion);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${motion.name.toLowerCase().replace(/\s+/g, '-')}.plm-motion.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON Berhasil Diekspor!');
  };

//   const handleCopy = async () => {
//     const jsonStr = exportMotion(motion);
//     await navigator.clipboard.writeText(jsonStr);
//     showToast('Disalin ke Clipboard!');
//   };

  const handleImportSubmit = () => {
    const res = importMotion(importText);
    if (res.ok) {
      setMotion(res.motion);
      setIsImportOpen(false);
      setImportText('');
      setImportError(null);
      showToast('JSON Berhasil Diimport!');
    } else {
      setImportError(res.error);
    }
  };

  return (
    <div className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setView('dashboard')}
          className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
        >
          ← Dashboard
        </button>

        <div
          className={`w-3 h-3 rounded-full ${
            isValid ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-rose-500'
          }`}
          title={isValid ? 'Payload Motion Valid' : 'Payload Tidak Valid!'}
        />

        <input
          type="text"
          maxLength={64}
          value={motion.name}
          onChange={(e) => setMotionField('name', e.target.value)}
          className="bg-slate-800 border border-slate-700 text-white font-bold text-sm px-3 py-1.5 rounded focus:outline-none focus:border-indigo-500 w-48 sm:w-64"
          placeholder="Nama Motion..."
        />
      </div>

      <div className="flex items-center gap-2">
        {toastMessage && (
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded border border-emerald-800 hidden sm:inline-block">
            {toastMessage}
          </span>
        )}

        <button
          type="button"
          disabled={isSaving}
          onClick={handleSaveToCloud}
          className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded border border-emerald-500 transition shadow-sm disabled:opacity-50"
        >
          {isSaving ? 'Menyimpan...' : editingMotionId ? 'Update API' : 'Simpan API'}
        </button>

        <button
          type="button"
          onClick={() => setIsShortcutsOpen(true)}
          className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded border border-slate-700 transition hidden md:inline-block"
        >
          Shortcuts (?)
        </button>

        <button
          type="button"
          onClick={() => setIsImportOpen(true)}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition hidden sm:inline-block"
        >
          Import JSON
        </button>

        <button
          type="button"
          onClick={handleExport}
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded border border-indigo-500 transition shadow-sm"
        >
          Export
        </button>
      </div>

      {/* Modal Shortcuts */}
      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400">Play / Pause</span>
                <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-mono">Space</kbd>
              </div>
              <div className="flex justify-between p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-400">Quick Export</span>
                <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-mono">Ctrl + S</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-xl p-4 flex flex-col gap-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Import Payload plm-motion JSON</h3>
            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Tempel teks payload JSON plm-motion..."
              className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-200 p-3 rounded focus:outline-none"
            />
            {importError && (
              <span className="text-xs text-rose-400 font-semibold">{importError}</span>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded font-semibold"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};