import type { ConversationStatus } from '../../hooks/useVoiceConversation';

const LABELS: Record<ConversationStatus, string> = {
  idle: 'Ready',
  listening: 'Listening…',
  processing: 'Interviewer is thinking…',
  speaking: 'Interviewer is speaking…',
};

const ICONS: Record<ConversationStatus, string> = {
  idle: '○',
  listening: '●',
  processing: '◌',
  speaking: '◉',
};

const COLORS: Record<ConversationStatus, string> = {
  idle: 'var(--color-text-secondary)',
  listening: 'var(--color-listening)',
  processing: 'var(--color-accent)',
  speaking: 'var(--color-speaking)',
};

interface StateIndicatorProps {
  status: ConversationStatus;
}

/** Non-audio-only status: an icon + text label, itself announced to
 *  screen readers via aria-live so the same state change that's visible
 *  is also audible through assistive tech, not just through speech. */
export function StateIndicator({ status }: StateIndicatorProps) {
  return (
    <output
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        color: COLORS[status],
        fontSize: 'var(--font-size-sm)',
      }}
    >
      <span
        aria-hidden="true"
        className={status === 'listening' || status === 'speaking' ? 'animate-safe' : undefined}
      >
        {ICONS[status]}
      </span>
      {LABELS[status]}
    </output>
  );
}
