import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../../types/interview';

interface TranscriptLogProps {
  entries: TranscriptEntry[];
  interimText: string;
}

export function TranscriptLog({ entries, interimText }: TranscriptLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries, interimText]);

  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Interview transcript"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        color: '#FDFCF9',
        fontSize: '0.88rem',
      }}
    >
      {entries.length === 0 && !interimText && (
        <p style={{ color: '#808877', margin: 0, fontStyle: 'italic', fontSize: '0.85rem' }}>
          The conversation will appear here as it happens.
        </p>
      )}
      {entries
        .filter((entry) => !entry.text.includes('[SILENCE]'))
        .map((entry, i) => (
          <div key={i} style={{ margin: 0, lineHeight: 1.5 }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: '0.82rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: entry.speaker === 'candidate' ? '#B28B6A' : '#8DA382',
                marginRight: '6px',
              }}
            >
              {entry.speaker === 'candidate' ? 'You' : 'Interviewer'}:
            </span>
            <span style={{ color: entry.speaker === 'candidate' ? '#EAE8E3' : '#FDFCF9' }}>
              {entry.text}
            </span>
          </div>
        ))}
      {interimText && (
        <div style={{ margin: 0, color: '#808877', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: '#B28B6A', marginRight: '6px' }}>You:</span>
          <span style={{ fontStyle: 'italic' }}>{interimText}…</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
