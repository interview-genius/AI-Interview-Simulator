import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardTrends } from '../../api/dashboard';
import type { DashboardTrends } from '../../api/dashboard';

export function InterviewHistoryPage() {
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardTrends()
      .then(setTrends)
      .catch(console.error);
  }, []);

  if (!trends) {
    return (
      <div className="fs-dashboard">
        <div className="fs-dashboard__loading">
          <div className="fs-dashboard__loading-icon" />
          <p>Loading history...</p>
        </div>
      </div>
    );
  }

  const history = [...trends.trends].reverse(); // latest first

  return (
    <div className="fs-dashboard" style={{ overflowY: 'auto' }}>
      <div className="fs-dashboard__inner" style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
        <header className="fs-dashboard__header">
          <h1 className="fs-dashboard__title" style={{ fontSize: '2rem' }}>
            Interview History
          </h1>
          <p className="fs-dashboard__subtitle">
            Review your past performances and watch your growth over time.
          </p>
        </header>

        <section className="fs-dashboard__history-card" style={{ marginTop: 'var(--space-8)' }}>
          {history.length === 0 ? (
            <div style={{ padding: 'var(--space-12) 0', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
              <p>You haven't completed any interviews yet.</p>
              <button 
                onClick={() => navigate('/setup')} 
                className="fs-dashboard__action-btn" 
                style={{ marginTop: 'var(--space-4)', display: 'inline-flex' }}
              >
                Start an Interview
              </button>
            </div>
          ) : (
            <div className="fs-dashboard__timeline">
              {history.map((t, i) => (
                <div key={i} className="fs-dashboard__timeline-item" style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--color-border)' }}>
                  <div className="fs-dashboard__timeline-dot" style={{ marginTop: '8px' }} />
                  <div className="fs-dashboard__timeline-content" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="fs-dashboard__timeline-label" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                        {t.company} · {t.role}
                      </span>
                      <span className="fs-dashboard__timeline-score" style={{ fontSize: '1.4rem' }}>
                        {t.average_score}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span className="fs-dashboard__timeline-date" style={{ color: 'var(--color-text-secondary)' }}>
                        {t.date}
                      </span>
                      <span style={{ color: 'var(--color-accent)', fontSize: '0.9rem', fontFamily: 'var(--font-family-mono)' }}>
                        {t.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
