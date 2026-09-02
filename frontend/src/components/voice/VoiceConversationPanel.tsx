import { MicButton } from './MicButton';
import { StateIndicator } from './StateIndicator';
import { TranscriptLog } from './TranscriptLog';
import { TypeInsteadInput } from './TypeInsteadInput';
import type { useVoiceConversation } from '../../hooks/useVoiceConversation';

interface VoiceConversationPanelProps {
  conversation: ReturnType<typeof useVoiceConversation>;
}

/** The shared, mode-agnostic voice UI reused by both Coding and ML round
 *  pages. Everything mode-specific (problem statement, phase indicator)
 *  lives outside this component. */
export function VoiceConversationPanel({ conversation }: VoiceConversationPanelProps) {
  const {
    status,
    transcript,
    interimText,
    isSpeechSupported,
    error,
    startListening,
    stopListening,
    submitTypedAnswer,
  } = conversation;

  const busy = status === 'processing' || status === 'speaking';

  return (
    <section
      aria-label="Voice interview conversation"
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
    >
      {!isSpeechSupported && (
        <output style={{ display: 'block', color: 'var(--color-speaking)' }}>
          Voice isn't supported in this browser -- use the text field below instead.
        </output>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--color-error)' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <MicButton
          status={status}
          disabled={!isSpeechSupported || busy}
          onStart={startListening}
          onStop={stopListening}
        />
        <StateIndicator status={status} />
      </div>

      <TranscriptLog entries={transcript} interimText={interimText} />

      <TypeInsteadInput onSubmit={submitTypedAnswer} disabled={busy} />
    </section>
  );
}
