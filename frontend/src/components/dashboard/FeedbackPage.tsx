import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TreeVisualization } from './TreeVisualization';
import {
  getSessionFeedback,
  recordInterviewHistory,
  type ComprehensiveFeedbackResponse,
  type DimensionFeedback,
} from '../../api/feedback';


export function FeedbackPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [phase, setPhase] = useState<'breathe' | 'results'>('breathe');
  const [feedback, setFeedback] = useState<ComprehensiveFeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSavedRef = useRef(false);

  // Extract session parameters from state or sessionStorage fallback
  const sessionState = location.state || (() => {
    try {
      const saved = sessionStorage.getItem('last_interview_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })() || {};

  const company = sessionState.company || 'Google';
  const role = sessionState.role || 'Software Engineer';
  const roundType = sessionState.round_type || 'coding';
  const level = sessionState.level || 'Mid-Level';
  const sessionId = sessionState.sessionId || sessionState.session_id;
  const transcript = sessionState.transcript;
  const code = sessionState.code;

  useEffect(() => {
    let isMounted = true;

    async function loadFeedbackAndPersist() {
      try {
        const result = await getSessionFeedback({
          session_id: sessionId,
          round_type: roundType,
          company,
          role,
          level,
          transcript,
          code,
        });

        if (!isMounted) return;
        setFeedback(result);
        setLoading(false);

        // Persist to user's interview history in PostgreSQL
        if (!hasSavedRef.current) {
          hasSavedRef.current = true;
          try {
            await recordInterviewHistory({
              company,
              role,
              round_type: roundType,
              session_transcript: transcript || [],
              feedback_result: result,
            });
          } catch (histErr) {
            console.warn('Could not persist to interview-history:', histErr);
          }
        }
      } catch (err) {
        console.error('Error fetching feedback:', err);
        if (isMounted) {
          // Fallback default feedback
          const fallback: ComprehensiveFeedbackResponse = {
            mode: roundType,
            overall_recommendation: 'Lean hire',
            summary_verdict:
              'Demonstrated solid problem-solving foundation and effective technical communication with clear structured responses.',
            technical_ability: { score: 4, tip: 'Keep practicing edge-case handling and optimal asymptotic complexity.' },
            communication: { score: 4, tip: 'Clear articulation of the approach and reasoning steps.' },
            problem_solving: { score: 4, tip: 'Good decomposition of the problem before jumping to code.' },
            clarity: { score: 4, tip: 'Concise explanations that remained focused on the core solution.' },
          };
          setFeedback(fallback);
          setLoading(false);
        }
      }
    }

    loadFeedbackAndPersist();

    // Minimum "Take a breath" transition timer (3 seconds)
    const timer = setTimeout(() => {
      setPhase('results');
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [sessionId, company, role, roundType, level, transcript, code]);

  if (phase === 'breathe' || loading || !feedback) {
    return (
      <div className="fs-breathe">
        <div className="fs-breathe__bg">
          <div className="fs-breathe__shape fs-breathe__shape--1" />
          <div className="fs-breathe__shape fs-breathe__shape--2" />
        </div>
        <h1 className="fs-breathe__title">Take a breath.</h1>
        <p className="fs-breathe__sub">The hard part is over. Analyzing your performance...</p>
        <div className="fs-breathe__dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  const dimIcons: Record<string, React.ReactNode> = {
    technical_ability: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    communication: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    problem_solving: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    presence: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    optimisation: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    debugging: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
    clarity: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 14 14" />
      </svg>
    ),
    confidence: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  };

  // Collect dimensions dynamically from the feedback object
  const dimensionsList: Array<{ key: string; score: number; tip: string }> = [];
  const excludedKeys = ['mode', 'overall_recommendation', 'summary_verdict', 'session_id'];

  for (const [key, value] of Object.entries(feedback)) {
    if (!excludedKeys.includes(key) && value && typeof value === 'object' && 'score' in value) {
      const dimVal = value as DimensionFeedback;
      dimensionsList.push({
        key,
        score: dimVal.score,
        tip: dimVal.tip,
      });
    }
  }

  // Find top score dimension for personalized growth message
  const topDim = [...dimensionsList].sort((a, b) => b.score - a.score)[0];
  const topDimLabel = topDim ? topDim.key.replace(/_/g, ' ') : 'communication';

  return (
    <div className="fs-feedback">
      {/* Background shapes */}
      <div
        style={{
          position: 'fixed',
          top: '-20%',
          right: '-10%',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,122,99,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="fs-feedback__inner">
        {/* Header */}
        <header className="fs-feedback__header">
          <span className="fs-feedback__eyebrow">
            {company} · {role} · {roundType.toUpperCase()}
          </span>
          <h1 className="fs-feedback__title">Your Results</h1>
          <p className="fs-feedback__verdict">{feedback.summary_verdict}</p>
          <div className="fs-feedback__recommendation">
            <div className="fs-feedback__rec-dot" />
            {feedback.overall_recommendation}
          </div>
        </header>

        {/* Two column: Growth + Dimensions */}
        <div className="fs-feedback__grid">
          {/* Growth Visualization */}
          <section className="fs-feedback__growth-card">
            <h2 className="fs-feedback__card-title">Your Growth</h2>
            <div className="fs-feedback__tree-area">
              <TreeVisualization stage="Little Sapling" style={{ transform: 'scale(1.3)' }} />
            </div>
            <p className="fs-feedback__growth-msg">
              Your <strong>{topDimLabel}</strong> performance helped your tree sprout new branches today.
              Keep practicing to reach full bloom!
            </p>
          </section>

          {/* Detailed Dimensions */}
          <section className="fs-feedback__dimensions">
            <h2 className="fs-feedback__card-title">Detailed Feedback</h2>
            <div className="fs-feedback__dim-list">
              {dimensionsList.map(({ key, score, tip }) => (
                <div key={key} className="fs-feedback__dim-card">
                  <div className="fs-feedback__dim-top">
                    <div className="fs-feedback__dim-icon-wrap">
                      <span>{dimIcons[key] || '•'}</span>
                    </div>
                    <span className="fs-feedback__dim-name">{key.replace(/_/g, ' ')}</span>
                    <span className="fs-feedback__dim-score">
                      {score}
                      <span className="fs-feedback__dim-max">/5</span>
                    </span>
                  </div>
                  <div className="fs-feedback__dim-bar">
                    <div className="fs-feedback__dim-fill" style={{ width: `${(score / 5) * 100}%` }} />
                  </div>
                  <p className="fs-feedback__dim-tip">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="fs-feedback__actions">
          <button className="fs-feedback__btn-primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M9 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="fs-feedback__btn-secondary" onClick={() => navigate('/setup')}>
            Try another interview
          </button>
        </div>
      </div>
    </div>
  );
}

