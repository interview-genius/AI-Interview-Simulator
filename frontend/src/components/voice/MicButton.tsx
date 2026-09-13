import type { ConversationStatus } from '../../hooks/useVoiceConversation';

interface MicButtonProps {
  status: ConversationStatus;
  disabled: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({ status, disabled, onStart, onStop }: MicButtonProps) {
  const isListening = status === 'listening';

  return (
    <button
      type="button"
      aria-pressed={isListening}
      disabled={disabled}
      onClick={isListening ? onStop : onStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-3) var(--space-6)',
        borderRadius: 'var(--radius-lg)',
        border: 'none',
        background: isListening ? 'var(--color-listening)' : 'var(--color-accent-bg)',
        color: '#0b0d11',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span aria-hidden="true" className={isListening ? 'animate-safe' : undefined} style={{ display: 'flex', alignItems: 'center' }}>
        {isListening ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </span>
      {isListening ? 'Stop listening' : 'Start speaking'}
    </button>
  );
}
