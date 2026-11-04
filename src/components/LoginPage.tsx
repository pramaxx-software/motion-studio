import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiFetch } from '../utils/api';
import type { AuthResponse } from '../types/auth';
import LogoIcon from "../assets/icon.png";

export const LoginPage: React.FC = () => {
  const { setAuth } = useAuthStore();
  const [machine_id, setMachineId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await apiFetch<AuthResponse>('/motion/auth/login', {
        method: 'POST',
        body: JSON.stringify({  machine_id}),
      });

      setAuth(res.user, res.token);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-3">
          <img src={LogoIcon} alt="" />
          </div>
          <h1 className="text-xl font-bold text-white">PLM-Motion Studio</h1>
          <p className="text-xs text-slate-400 mt-1">Masuk untuk mengelola dan membuat animasi motion</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Device ID</label>
            <input
              type="string"
              required
              value={machine_id}
              onChange={(e) => setMachineId(e.target.value)}
              placeholder="Contoh: ABCD-1234-EFGH"
              className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full cursor-pointer py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-600/20 transition disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Masuk Studio'}
          </button>
        </form>
      </div>
    </div>
  );
};