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
      s.sharpnessDelta
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel max-w-2xl w-full p-6 border border-indigo-500/30 text-left relative animate-fadeIn flex flex-col max-h-[85vh]">
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Workout History & Data Export</h2>
              <p className="text-xs text-gray-400">Review past daily sessions and export/restore progress data.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white bg-white/5 border border-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Export / Import Buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={handleExportCSV}
            className="gradient-btn text-xs px-4 py-2 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white border border-white/10 transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-xs font-semibold text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5"
          >
            <span>Restore JSON Backup</span>
          </button>
        </div>

        {/* History Log List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <p className="text-xs text-gray-500 italic text-center py-8">No completed sessions logged yet.</p>
          ) : (
            history.map((session) => {
              const accuracyPct = Math.round((session.correctCount / session.totalItems) * 100);
              return (
                <div key={session.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white uppercase">{session.mode.replace('_', ' ')}</span>
                      <span className="text-gray-400">• {session.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-300 text-[11px]">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {accuracyPct}% Accuracy ({session.correctCount}/{session.totalItems})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> {Math.round(session.totalTimeSpentMs / 1000)}s
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-indigo-300 flex items-center gap-1 justify-end">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" /> +{session.sharpnessDelta}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase">Delta</span>
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
