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
      <span aria-hidden="true" className={isListening ? 'animate-safe' : undefined}>
        {isListening ? '● ' : '🎤 '}
      </span>
      {isListening ? 'Stop listening' : 'Start speaking'}
    </button>
  );
}
