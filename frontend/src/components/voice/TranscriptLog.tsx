import type { TranscriptEntry } from '../../types/interview';

interface TranscriptLogProps {
  entries: TranscriptEntry[];
  interimText: string;
}

/** Live captions for both sides of the conversation -- verbatim, never
 *  paraphrased, so it's a genuine accessible alternative to audio, not a
 *  summary. aria-live + role="log" means new lines are announced as they
 *  arrive without the whole region being re-read. */
export function TranscriptLog({ entries, interimText }: TranscriptLogProps) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-label="Interview transcript"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        maxHeight: '320px',
        overflowY: 'auto',
        padding: '24px',
        background: '#1A1D16',
        borderRadius: '16px',
        border: '1px solid #2A3022',
        color: '#FDFCF9',
      }}
    >
      {entries.length === 0 && !interimText && (
        <p style={{ color: '#808877', margin: 0 }}>
          The conversation will appear here as it happens.
        </p>
      )}
      {entries
        .filter(entry => !entry.text.includes('[SILENCE]'))
        .map((entry, i) => (
        <p key={i} style={{ margin: 0, lineHeight: 1.6 }}>
          <strong style={{ color: entry.speaker === 'candidate' ? '#B28B6A' : '#6C7A63' }}>{entry.speaker === 'candidate' ? 'You' : 'Interviewer'}:</strong>{' '}
          {entry.text}
        </p>
      ))}
      {interimText && (
        <p style={{ margin: 0, color: '#808877', lineHeight: 1.6 }}>
          <strong style={{ color: '#B28B6A' }}>You:</strong> {interimText}…
        </p>
      )}
    </div>
  );
}
