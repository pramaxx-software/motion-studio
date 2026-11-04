import React, { useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { exportMotion } from '../utils/plmJson';
import { KeyframeInspector } from './KeyframeInspector';

export const PropertiesPanel: React.FC = () => {
  const { motion, setMotionField } = useEditorStore();
  const [activeTab, setActiveTab] = useState<'properties' | 'inspector' | 'json'>('properties');

  const jsonOutput = exportMotion(motion);

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 overflow-hidden">
      <div className="flex border-b border-slate-800 bg-slate-950 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'properties'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Properties
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'inspector'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Inspector
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`flex-1 py-2.5 text-center border-b-2 transition ${
            activeTab === 'json'
              ? 'border-indigo-500 text-indigo-400 bg-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          JSON Output
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'properties' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Nama Motion (Max 64 Karakter)</label>
              <input
                type="text"
                maxLength={64}
                value={motion.name}
                onChange={(e) => setMotionField('name', e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Durasi (Detik per Loop)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={motion.duration}
                onChange={(e) =>
                  setMotionField('duration', Math.max(0.1, parseFloat(e.target.value) || 1))
                }
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Mode Axis</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMotionField('axis', '2d')}
                  className={`py-1.5 text-xs font-semibold rounded border transition ${
                    motion.axis !== '3d'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2D (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => setMotionField('axis', '3d')}
                  className={`py-1.5 text-xs font-semibold rounded border transition ${
                    motion.axis === '3d'
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  3D (+ Y-Spin)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">
                Pixel Scale (0.0005 - 0.1, Opsional)
              </label>
              <input
                type="number"
                step="0.0005"
                min="0.0005"
                max="0.1"
                value={motion.px_scale ?? ''}
                placeholder="Unset"
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setMotionField('px_scale', isNaN(val) ? undefined : val);
                }}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-300">Versi Format</label>
              <input
                type="number"
                min="1"
                value={motion.version}
                onChange={(e) =>
                  setMotionField('version', Math.max(1, parseInt(e.target.value, 10) || 1))
                }
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        )}

        {activeTab === 'inspector' && <KeyframeInspector />}

        {activeTab === 'json' && (
          <div className="flex flex-col h-full gap-2">
            <span className="text-xs font-semibold text-slate-400">Payload JSON Output</span>
            <textarea
              readOnly
              value={jsonOutput}
              className="flex-1 min-h-[350px] w-full bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300 p-3 rounded focus:outline-none select-all"
            />
          </div>
        )}
      </div>
    </div>
  );
};