import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { startMLSession, sendMLTurn } from '../../api/mlInterview';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';
import { VoiceConversationPanel } from '../voice/VoiceConversationPanel';

// company/role/level/resume_id come from the URL for now, since Person A's
// Config flow UI (Step 8) doesn't exist yet -- this is the seam it plugs
// into (?company=...&role=...&level=...&resume_id=...), with demo defaults
// so this page is testable standalone in the meantime.
export function MLRoundPage() {
  const [searchParams] = useSearchParams();
  const company = searchParams.get('company') ?? 'Google';
  const role = searchParams.get('role') ?? 'ML Engineer';
  const level = searchParams.get('level') ?? 'New Grad';
  const resumeIdParam = searchParams.get('resume_id');
  const resumeId = resumeIdParam ? Number(resumeIdParam) : undefined;

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
      <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: 'var(--font-size-xl)' }}>
        ML Round -- {company} / {role}
      </h1>

      {phase && (
        <output style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Current phase: {phase.replace(/_/g, ' ')}
        </output>
      )}

      {!sessionId ? (
        <output>Starting your ML round…</output>
      ) : (
        <VoiceConversationPanel conversation={conversation} />
      )}
    </main>
  );
}
