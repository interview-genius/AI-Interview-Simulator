import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TreeVisualization } from './TreeVisualization';

export function FeedbackPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'breathe' | 'results'>('breathe');

  // In a real flow, this data would be fetched from the backend's `/api/feedback/:session_id`
  // Here we use mock data representing the new holistic evaluation.
  const mockFeedback = {
    overall_recommendation: 'Lean hire',
    summary_verdict: 'Strong problem-solving skills and good communication, but struggled with optimal time complexity on the second approach.',
    dimensions: {
      technical_ability: { score: 4, tip: 'Solid grasp of hash maps.' },
      communication: { score: 4, tip: 'Clear articulation of the naive approach.' },
      presence: { score: 3, tip: 'Eye contact dropped while coding, remember to check in.' }, // The new dimension
      optimisation: { score: 2, tip: 'Practice identifying overlapping subproblems.' }
    }
  };

  useEffect(() => {
    // "Take a breath" transition
    const timer = setTimeout(() => {
      setPhase('results');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (phase === 'breathe') {
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
    technical_ability: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    communication: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    presence: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    optimisation: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
  };

  return (
    <div className="fs-feedback">
      {/* Background shapes */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,122,99,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="fs-feedback__inner">
        {/* Header */}
        <header className="fs-feedback__header">
          <span className="fs-feedback__eyebrow">Interview Complete</span>
          <h1 className="fs-feedback__title">Your Results</h1>
          <p className="fs-feedback__verdict">{mockFeedback.summary_verdict}</p>
          <div className="fs-feedback__recommendation">
            <div className="fs-feedback__rec-dot" />
            {mockFeedback.overall_recommendation}
          </div>
        </header>

        {/* Two column: Growth + Dimensions */}
        <div className="fs-feedback__grid">
          {/* Growth Visualization */}
          <section className="fs-feedback__growth-card">
            <h2 className="fs-feedback__card-title">Your Growth</h2>
            <div className="fs-feedback__tree-area">
              <TreeVisualization stage="Sapling" style={{ transform: 'scale(1.3)' }} />
            </div>
            <p className="fs-feedback__growth-msg">
              Your communication score helped your tree grow new branches today. Keep it up!
            </p>
          </section>

          {/* Detailed Dimensions */}
          <section className="fs-feedback__dimensions">
            <h2 className="fs-feedback__card-title">Detailed Feedback</h2>
            <div className="fs-feedback__dim-list">
              {Object.entries(mockFeedback.dimensions).map(([key, data]) => (
                <div key={key} className="fs-feedback__dim-card">
                  <div className="fs-feedback__dim-top">
                    <div className="fs-feedback__dim-icon-wrap">
                      <span>{dimIcons[key] || '•'}</span>
                    </div>
                    <span className="fs-feedback__dim-name">{key.replace(/_/g, ' ')}</span>
                    <span className="fs-feedback__dim-score">{data.score}<span className="fs-feedback__dim-max">/5</span></span>
                  </div>
                  <div className="fs-feedback__dim-bar">
                    <div className="fs-feedback__dim-fill" style={{ width: `${(data.score / 5) * 100}%` }} />
                  </div>
                  <p className="fs-feedback__dim-tip">{data.tip}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Actions */}
        <div className="fs-feedback__actions">
          <button className="fs-feedback__btn-primary" onClick={() => navigate('/dashboard')}>
            Return to Dashboard
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button className="fs-feedback__btn-secondary" onClick={() => navigate('/setup')}>
            Try another interview
          </button>
        </div>
      </div>
    </div>
  );
}
