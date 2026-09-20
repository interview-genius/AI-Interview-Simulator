import { useCallback, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { startTechnicalSession, sendTechnicalTurn } from '../../api/technicalInterview';
import { useVoiceConversation } from '../../hooks/useVoiceConversation';
import { ConversationalInterviewLayout } from '../voice/ConversationalInterviewLayout';

export function TechnicalRoundPage() {
  const [searchParams] = useSearchParams();
  const company = searchParams.get('company') ?? 'Google';
  const role = searchParams.get('role') ?? 'Software Engineer';
  const level = searchParams.get('level') ?? 'Mid-Level';
  const resumeIdParam = searchParams.get('resume_id');
  const resumeId = resumeIdParam ? Number(resumeIdParam) : undefined;
  const navigate = useNavigate();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle browser native fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.warn('Error attempting to exit fullscreen:', err);
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const onSubmit = useCallback(
    async (text: string) => {
      if (!sessionId) throw new Error('No active session');
      const turn = await sendTechnicalTurn(sessionId, text);
      return turn.interviewer_response;
    },
    [sessionId]
  );

  const conversation = useVoiceConversation({ onSubmit });

  useEffect(() => {
    let cancelled = false;
    startTechnicalSession({ company, role, level, resume_id: resumeId }).then((res) => {
      if (cancelled) return;
      setSessionId(res.session_id);
      setPhase(res.phase);
      conversation.announceOpening(res.opening_question);
    }).catch((err) => {
      console.error('Failed to start Technical Discussion session:', err);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEndInterview = () => {
    const sessionData = {
      sessionId,
      company,
      role,
      level,
      round_type: 'technical',
      transcript: conversation.transcript,
    };
    try {
      sessionStorage.setItem('last_interview_session', JSON.stringify(sessionData));
    } catch (e) {}
    navigate('/results', { state: sessionData });
  };

  return (
    <ConversationalInterviewLayout
      conversation={conversation}
      company={company}
      role={role}
      level={level}
      roundTitle="Technical Discussion Round"
      phase={phase}
      onEndInterview={handleEndInterview}
      isFullscreen={isFullscreen}
      onToggleFullscreen={toggleFullscreen}
    />
  );
}
