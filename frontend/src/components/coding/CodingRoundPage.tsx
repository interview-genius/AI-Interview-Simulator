import { useCallback, useEffect, useRef, useState } from 'react';
import { startCodingSession, sendCodingTurn } from '../../api/codingInterview';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';
import type { CodingProblem } from '../../types/interview';
import { ProblemStatementPanel } from './ProblemStatementPanel';
import { CodeEditor } from './CodeEditor';
import { VoiceConversationPanel } from '../voice/VoiceConversationPanel';

export function CodingRoundPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const [code, setCode] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  const onSubmit = useCallback(
    async (text: string) => {
      if (!sessionId) throw new Error('No active session');
      const turn = await sendCodingTurn(sessionId, text, code);
      return turn.interviewer_response;
    },
    [sessionId, code]
  );

  const conversation = useVoiceConversation({ onSubmit });

  useEffect(() => {
    headingRef.current?.focus();

    let cancelled = false;
    startCodingSession().then((res) => {
      if (cancelled) return;
      setSessionId(res.session_id);
      setProblem(res.problem);
      setCode(res.problem.starter_code);
      conversation.announceOpening(res.opening_line);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  return (
    <main>
      <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: 'var(--font-size-xl)' }}>
        Coding Round
      </h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Talk through your approach with the interviewer. They can hear you, but can't see
        your code yet -- describe what you're doing as you go.
      </p>

      {!problem ? (
        <output>Starting your coding round…</output>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <ProblemStatementPanel problem={problem} />
          <CodeEditor
            code={code}
            language={problem.language}
            problemTitle={problem.title}
            onChange={setCode}
          />
          <VoiceConversationPanel conversation={conversation} />
        </div>
      )}
    </main>
  );
}
