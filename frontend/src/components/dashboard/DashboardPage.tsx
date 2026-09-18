import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats, getDashboardTrends } from '../../api/dashboard';
import type { DashboardStats, DashboardTrends } from '../../api/dashboard';
import { TreeVisualization, type TreeStage } from './TreeVisualization';

// Helper to map total interviews or cumulative score to a tree stage.
function calculateTreeStage(interviews: number): TreeStage {
  if (interviews === 0) return 'Seed';
  if (interviews <= 2) return 'Little Sapling';
  if (interviews <= 5) return 'Bigger Sapling';
  if (interviews <= 9) return 'Plant';
  if (interviews <= 14) return 'Plant with flowers';
  if (interviews <= 19) return 'Plant with fruits';
  return 'Mature Tree';
}

/* ─── Greeting based on time ─── */
function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getDashboardTrends()
    ]).then(([s, t]) => {
      setStats(s);
      setTrends(t);
    }).catch(console.error);
  }, []);

  if (!stats || !trends) {
    return (
      <div className="fs-dashboard">
        <div className="fs-dashboard__loading">
          <div className="fs-dashboard__loading-icon" />
          <p>Tending to your garden...</p>
        </div>
      </div>
    );
  }

  const stage = calculateTreeStage(stats.total_interviews);
  const dims = [
    { key: 'technical_ability', label: 'Technical Ability', icon: '⟨/⟩' },
    { key: 'communication', label: 'Communication', icon: '◎' },
    { key: 'problem_solving', label: 'Problem Solving', icon: '◈' },
    { key: 'presence', label: 'Presence', icon: '◉' }
  ];

  const hasInterviews = stats.total_interviews > 0;
  const recentTrend = trends.trends.length > 0 ? trends.trends[trends.trends.length - 1] : null;

  return (
    <div className="fs-dashboard">
      {/* Background organic shapes */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,122,99,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-30%', left: '-15%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(178,139,106,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="fs-dashboard__inner" style={{ position: 'relative', zIndex: 1 }}>
        {/* ─── Greeting Header ─── */}
        <header className="fs-dashboard__header">
          <h1 className="fs-dashboard__title">
            {getGreeting()}. Ready to keep growing?
          </h1>
          <p className="fs-dashboard__subtitle">
            You've completed <strong>{stats.total_interviews}</strong> {stats.total_interviews === 1 ? 'interview' : 'interviews'}. 
            {hasInterviews && stats.top_strength !== 'N/A' && (
              <> Your top strength is <strong>{stats.top_strength}</strong>.</>
            )}
          </p>
        </header>

        {/* ─── Main Grid ─── */}
        <div className="fs-dashboard__grid">
          
          {/* Left: Tree & Quick Action */}
          <div className="fs-dashboard__left">
            {/* Tree Card */}
            <section className="fs-dashboard__tree-card">
              <div className="fs-dashboard__tree-card-header">
                <h2>Your FlowState</h2>
                <span className="fs-dashboard__stage-badge">{stage}</span>
              </div>
              <div className="fs-dashboard__tree-area">
                <TreeVisualization stage={stage} style={{ transform: 'scale(1.15)' }} />
              </div>
              <p className="fs-dashboard__tree-hint">
                Every interview grows your tree. Keep practicing to bloom.
              </p>
            </section>

            {/* Quick Action CTA */}
            <section className="fs-dashboard__action-card">
              <div>
                <h3 className="fs-dashboard__action-title">{hasInterviews ? "Continue your journey" : "Start your first interview"}</h3>
                <p className="fs-dashboard__action-desc">
                  {hasInterviews && stats.top_weakness !== 'N/A'
                    ? `Your ${stats.top_weakness.toLowerCase()} could use focus. Try a targeted session.`
                    : "Dive in and give your first practice interview to see your tree grow!"}
                </p>
              </div>
              <button className="fs-dashboard__action-btn" onClick={() => navigate('/setup')}>
                Start Interview
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </section>
          </div>

          {/* Right: Stats & Recent */}
          <div className="fs-dashboard__right">
            {/* Core Dimensions */}
            <section className="fs-dashboard__dimensions-card">
              <h3 className="fs-dashboard__card-title">Core Dimensions</h3>
              <div className="fs-dashboard__dimensions-list">
                {dims.map(d => {
                  const val = stats.dimensions[d.key] ?? 0;
                  return (
                    <div key={d.key} className="fs-dashboard__dim-item">
                      <div className="fs-dashboard__dim-icon">
                        <span>{d.icon}</span>
                      </div>
                      <div className="fs-dashboard__dim-info">
                        <div className="fs-dashboard__dim-header">
                          <span className="fs-dashboard__dim-label">{d.label}</span>
                          <span className="fs-dashboard__dim-score">{val}<span className="fs-dashboard__dim-max">/5</span></span>
                        </div>
                        <div className="fs-dashboard__dim-bar">
                          <div className="fs-dashboard__dim-fill" style={{ width: `${(val / 5) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent Interview */}
            <section className="fs-dashboard__recent-card">
              <h3 className="fs-dashboard__card-title">Recent Interview</h3>
              {recentTrend ? (
                <>
                  <div className="fs-dashboard__recent-content">
                    <div className="fs-dashboard__recent-info">
                      <span className="fs-dashboard__recent-company">{recentTrend.company} · {recentTrend.role}</span>
                      <span className="fs-dashboard__recent-meta">{recentTrend.type} · {recentTrend.date}</span>
                    </div>
                    <div className="fs-dashboard__recent-score">
                      <span className="fs-dashboard__recent-score-value">{recentTrend.average_score}</span>
                      <span className="fs-dashboard__recent-score-label">Overall</span>
                    </div>
                  </div>
                  <button className="fs-dashboard__recent-btn" onClick={() => navigate('/results')}>
                    View Feedback →
                  </button>
                </>
              ) : (
                <div style={{ padding: 'var(--space-4) 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem', textAlign: 'center' }}>
                  No interviews completed yet.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
