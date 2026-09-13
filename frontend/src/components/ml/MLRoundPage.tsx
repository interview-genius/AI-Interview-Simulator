import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { startMLSession, sendMLTurn } from '../../api/mlInterview';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';
import { VoiceConversationPanel } from '../voice/VoiceConversationPanel';

export function MLRoundPage() {
  const [searchParams] = useSearchParams();
  const company = searchParams.get('company') ?? 'Google';
  const role = searchParams.get('role') ?? 'ML Engineer';
  const level = searchParams.get('level') ?? 'New Grad';
  const resumeIdParam = searchParams.get('resume_id');
  const resumeId = resumeIdParam ? Number(resumeIdParam) : undefined;
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const onSubmit = useCallback(
    async (text: string) => {
      if (!sessionId) throw new Error('No active session');
      const turn = await sendMLTurn(sessionId, text);
      return turn.interviewer_response;
    },
    [sessionId]
  );

  const conversation = useVoiceConversation({ onSubmit });

  useEffect(() => {
    headingRef.current?.focus();

    let cancelled = false;
    startMLSession({ company, role, level, resume_id: resumeId }).then((res) => {
      if (cancelled) return;
      setSessionId(res.session_id);
      setPhase(res.phase);
      conversation.announceOpening(res.opening_question);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  return (
    <main>
      <header style={{ marginBottom: 'var(--space-6)' }}>
        <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-accent)' }}>
          ML System Design
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-family-mono)' }}>
          [{company}] // {role} // {level}
        </p>
        
        <button 
          onClick={() => navigate('/results')}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            background: 'var(--color-error, #D9534F)',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          End Interview
        </button>
      </header>

      {phase && (
        <div style={{ 
          display: 'inline-block',
          padding: 'var(--space-2) var(--space-4)',
          background: 'var(--color-surface-raised)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-6)',
          fontFamily: 'var(--font-family-mono)',
          color: 'var(--color-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          PHASE: {phase.replace(/_/g, ' ')}
        </div>
      )}

      {!sessionId ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <span className="animate-safe" style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-family-mono)' }}>INITIALIZING GRID...</span>
        </div>
      ) : (
        <VoiceConversationPanel conversation={conversation} />
      )}
    </main>
  );
}

