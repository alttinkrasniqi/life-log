import { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function Settings() {
  const resetToSeed = useStore((s) => s.resetToSeed);
  const clearAll = useStore((s) => s.clearAll);
  const state = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const counts = {
    categories: Object.keys(state.categories).length,
    metrics: Object.keys(state.metrics).length,
    entries: Object.keys(state.entries).length,
    targets: Object.keys(state.targets).length,
  };

  const handleExport = () => {
    const payload = {
      schemaVersion: state.schemaVersion,
      exportedAt: new Date().toISOString(),
      categories: state.categories,
      metrics: state.metrics,
      entries: state.entries,
      targets: state.targets,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-log-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (
          !data.categories ||
          !data.metrics ||
          !data.entries ||
          typeof data.schemaVersion !== 'number'
        ) {
          throw new Error('Invalid backup file');
        }
        if (
          !confirm(
            'This will replace all your current data with the imported data. Continue?',
          )
        ) {
          return;
        }
        useStore.setState({
          categories: data.categories,
          metrics: data.metrics,
          entries: data.entries,
          targets: data.targets ?? {},
          schemaVersion: data.schemaVersion,
        });
        setImportStatus('Import successful.');
        setTimeout(() => setImportStatus(null), 3000);
      } catch (err) {
        setImportStatus(`Import failed: ${(err as Error).message}`);
        setTimeout(() => setImportStatus(null), 5000);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (
      confirm(
        'Reset to default categories and metrics? This will DELETE all your entries and current categories. This cannot be undone.',
      )
    ) {
      resetToSeed();
    }
  };

  const handleClear = () => {
    if (
      confirm(
        'Delete EVERYTHING — all categories, metrics, and entries? This cannot be undone.',
      )
    ) {
      clearAll();
    }
  };

  return (
    <div className="px-10 py-10 max-w-[800px]">
      <header className="mb-12">
        <div className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-3">Settings</div>
        <h1 className="font-serif text-display tracking-tight italic">Manage your data</h1>
      </header>

      {/* Stats */}
      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-4">Storage</h2>
        <div className="bg-surface border border-border rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">Categories</div>
            <div className="font-serif text-2xl mt-1">{counts.categories}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">Metrics</div>
            <div className="font-serif text-2xl mt-1">{counts.metrics}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">Entries</div>
            <div className="font-serif text-2xl mt-1">{counts.entries}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-text-3">Targets</div>
            <div className="font-serif text-2xl mt-1">{counts.targets}</div>
          </div>
        </div>
        <div className="text-xs text-text-3 mt-3">
          Data is stored locally in your browser via localStorage. Clearing browser data or using
          incognito mode will erase your log.
        </div>
      </section>

      {/* Backup */}
      <section className="mb-12">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-text-3 mb-4">Backup</h2>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors text-left"
          >
            <Download className="w-4 h-4 text-text-2" />
            <div className="flex-1">
              <div className="text-sm">Export as JSON</div>
              <div className="text-xs text-text-3">Download a backup of all your data</div>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-5 py-4 hover:border-border-strong transition-colors text-left"
          >
            <Upload className="w-4 h-4 text-text-2" />
            <div className="flex-1">
              <div className="text-sm">Import from JSON</div>
              <div className="text-xs text-text-3">
                Replace all current data with a previously exported backup
              </div>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
          {importStatus && (
            <div className="text-xs text-text-2 px-2">{importStatus}</div>
          )}
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-rose-400/80 mb-4">
          Danger zone
        </h2>
        <div className="space-y-3">
          <button
            onClick={handleReset}
            className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-5 py-4 hover:border-rose-400/30 transition-colors text-left"
          >
            <RefreshCw className="w-4 h-4 text-text-2" />
            <div className="flex-1">
              <div className="text-sm">Reset to defaults</div>
              <div className="text-xs text-text-3">
                Restore the default categories and metrics. Erases all entries.
              </div>
            </div>
          </button>

          <button
            onClick={handleClear}
            className="w-full flex items-center gap-3 bg-surface border border-border rounded-xl px-5 py-4 hover:border-rose-400/30 transition-colors text-left"
          >
            <Trash2 className="w-4 h-4 text-rose-400/80" />
            <div className="flex-1">
              <div className="text-sm text-rose-400/90">Clear all data</div>
              <div className="text-xs text-text-3">
                Permanently delete every category, metric, and entry.
              </div>
            </div>
          </button>
        </div>
      </section>

      <footer className="mt-16 pt-8 border-t border-border text-xs text-text-3">
        Life Log · Local-first personal analytics · Built with React, Vite, Zustand
      </footer>
    </div>
  );
}
