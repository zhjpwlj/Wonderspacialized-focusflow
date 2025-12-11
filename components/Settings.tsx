import React from 'react';
import { Database } from 'lucide-react';

interface SettingsProps {
  onExportData: () => void;
  onWipeData: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onExportData, onWipeData }) => {
  return (
    <div className="h-full flex">
      <aside className="w-48 bg-black/5 dark:bg-white/5 p-3 border-r border-white/20 dark:border-black/20">
        <nav className="space-y-1">
          <button
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-left bg-black/10 dark:bg-white/10 text-slate-900 dark:text-white'`}
            >
              <Database size={18} />
              <span>Data</span>
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-8">
            <section>
              <h3 className="text-lg font-bold mb-3 text-slate-900 dark:text-white">Manage Data</h3>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-gray-200 dark:border-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Export Data</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Download all your tasks, timers, and journal entries as a JSON file.</p>
                  </div>
                  <button onClick={onExportData} className="px-3 py-1.5 bg-[var(--accent-color)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-color-hover)]">Export</button>
                </div>
              </div>
            </section>
            <section>
              <h3 className="text-lg font-bold mb-3 text-red-500">Danger Zone</h3>
              <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-500/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Reset Application</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">This will permanently delete all your data and restore default settings.</p>
                  </div>
                  <button onClick={onWipeData} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Wipe Data</button>
                </div>
              </div>
            </section>
          </div>
      </main>
    </div>
  );
};

export default Settings;
