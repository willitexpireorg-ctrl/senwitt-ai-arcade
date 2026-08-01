import React, { useState } from 'react';
import { Lightbulb, ChevronDown } from 'lucide-react';
import type { EvidenceKey } from '../data/exerciseEvidence';
import { EXERCISE_EVIDENCE } from '../data/exerciseEvidence';
import { playClickSound } from '../services/sound';

interface EvidencePanelProps {
  evidenceKey: EvidenceKey;
  /** Renders expanded by default instead of collapsed. */
  defaultOpen?: boolean;
}

/** Compact "What this practises" panel shown at the start of a drill. Collapsed
 * by default to stay out of the way; expands to show the honest, non-hype
 * evidence copy for that exercise. */
export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidenceKey, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const card = EXERCISE_EVIDENCE[evidenceKey];
  if (!card) return null;

  return (
    <div
      className="w-full rounded-2xl mb-6 overflow-hidden transition-all"
      style={{ background: '#f0fdfa', border: '1px solid #99f6e4' }}
    >
      <button
        type="button"
        onClick={() => { playClickSound(); setIsOpen((v) => !v); }}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left focus-ring"
      >
        <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide" style={{ color: 'var(--accent-teal)' }}>
          <Lightbulb className="w-4 h-4 shrink-0" />
          What this practises
        </span>
        <ChevronDown
          className="w-4 h-4 shrink-0 transition-transform"
          style={{ color: 'var(--accent-teal)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {isOpen && (
        <div className="px-4 pb-4 text-left animate-fadeIn" style={{ color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.5, marginBottom: 6, color: 'var(--text-primary)' }}>
            {card.practises}
          </p>
          <p style={{ fontSize: '0.78rem', fontWeight: 600, lineHeight: 1.5, marginBottom: 6 }}>
            {card.explanation}
          </p>
          <p style={{ fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            {card.boundary}
          </p>
        </div>
      )}
    </div>
  );
};
