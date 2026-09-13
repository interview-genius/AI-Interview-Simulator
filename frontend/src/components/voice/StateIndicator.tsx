import type { ConversationStatus } from '../../hooks/useVoiceConversation';

const LABELS: Record<ConversationStatus, string> = {
  idle: 'Ready',
  listening: 'Listening…',
  processing: 'Interviewer is thinking…',
  speaking: 'Interviewer is speaking…',
};

import { ReactNode } from 'react';

const ICONS: Record<ConversationStatus, ReactNode> = {
  idle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg>,
  listening: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>,
  processing: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4"><circle cx="12" cy="12" r="10" /></svg>,
  speaking: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>,
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
