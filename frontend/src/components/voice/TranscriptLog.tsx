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
        padding: 'var(--space-4)',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}
    >
      {entries.length === 0 && !interimText && (
        <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
          The conversation will appear here as it happens.
        </p>
      )}
      {entries.map((entry, i) => (
        <p key={i} style={{ margin: 0 }}>
          <strong>{entry.speaker === 'candidate' ? 'You' : 'Interviewer'}:</strong>{' '}
          {entry.text}
        </p>
      ))}
      {interimText && (
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          <strong>You:</strong> {interimText}…
        </p>
      )}
    </div>
  );
}
