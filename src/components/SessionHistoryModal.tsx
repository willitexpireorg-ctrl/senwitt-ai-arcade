import React from 'react';
import { X, Download, Calendar, Zap, CheckCircle2, Clock } from 'lucide-react';
import type { SessionResult, UserProgress } from '../types';
import { playClickSound } from '../services/sound';
import { importUserDataJson } from '../services/storage';

interface SessionHistoryModalProps {
  history: SessionResult[];
  progress: UserProgress;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({ history, progress, onClose, onRefreshData }) => {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleExportCSV = () => {
    playClickSound();
    const headers = ['SessionID', 'Date', 'Mode', 'TotalItems', 'CorrectCount', 'AccuracyPct', 'DurationSeconds', 'SharpnessDelta'];
    const rows = history.map((s) => [
      s.id,
      s.date,
      s.mode,
      s.totalItems,
      s.correctCount,
      Math.round((s.correctCount / s.totalItems) * 100),
      Math.round(s.totalTimeSpentMs / 1000),
      s.sharpnessDelta,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `senwitt_sharpness_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    playClickSound();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify({ progress, history }, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `senwitt_progress_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importUserDataJson(content);
        if (success) {
          alert('Progress backup restored successfully!');
          if (onRefreshData) onRefreshData();
          onClose();
        } else {
          alert('Invalid backup JSON format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="surface max-w-2xl w-full p-6 text-left relative animate-modalPop flex flex-col max-h-[85vh]">
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        <div className="flex items-center justify-between pb-4 mb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#ccfbf1', border: '1px solid #99f6e4', color: 'var(--accent-teal)' }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Workout history</h2>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Review sessions and export or restore progress.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button onClick={handleExportCSV} className="btn-3d btn-3d-teal text-xs px-4 py-2.5 flex items-center gap-1.5">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5"
            style={{ background: '#ccfbf1', color: 'var(--accent-teal)', border: '1px solid #99f6e4' }}
          >
            <span>Restore backup</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <p className="text-xs italic text-center py-8 font-semibold" style={{ color: 'var(--text-muted)' }}>
              No completed sessions yet.
            </p>
          ) : (
            history.map((session) => {
              const accuracyPct = Math.round((session.correctCount / session.totalItems) * 100);
              return (
                <div key={session.id} className="surface-soft p-4 flex items-center justify-between text-xs gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-extrabold uppercase">{session.mode.replace('_', ' ')}</span>
                      <span style={{ color: 'var(--text-muted)' }}>• {session.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#059669' }} /> {accuracyPct}% ({session.correctCount}/{session.totalItems})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" style={{ color: '#0284c7' }} /> {Math.round(session.totalTimeSpentMs / 1000)}s
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black flex items-center gap-1 justify-end" style={{ color: 'var(--accent-teal)' }}>
                      <Zap className="w-3.5 h-3.5" /> +{session.sharpnessDelta}
                    </span>
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Delta</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
