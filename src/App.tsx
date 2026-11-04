import React from 'react';
import { useAuthStore } from './store/authStore';
import { LoginPage } from './components/LoginPage';
import { MotionDashboard } from './components/MotionDashboard';
import { Toolbar } from './components/Toolbar';
import { PreviewPanel } from './components/PreviewPanel';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Timeline } from './components/Timeline';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export const App: React.FC = () => {
  const { currentView } = useAuthStore();

  useKeyboardShortcuts();

  if (currentView === 'login') {
    return <LoginPage />;
  }

  if (currentView === 'dashboard') {
    return <MotionDashboard />;
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-[#1a1a2e] text-white overflow-hidden">
      <Toolbar />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-4 overflow-hidden flex items-center justify-center">
          <PreviewPanel />
        </div>

        <div className="w-80 h-full border-l border-slate-800">
          <PropertiesPanel />
        </div>
      </div>

      <div className="h-52 w-full">
        <Timeline />
      </div>
    </div>
  );
};

export default App;