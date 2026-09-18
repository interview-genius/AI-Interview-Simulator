import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const companies = [
  { name: 'Google', color: '#4285F4' },
  { name: 'Meta', color: '#1877F2' },
  { name: 'Amazon', color: '#FF9900' },
  { name: 'Apple', color: '#A2AAAD' },
  { name: 'Microsoft', color: '#00A4EF' },
  { name: 'Netflix', color: '#E50914' },
];

const levels = ['Intern', 'New Grad', 'Entry-Level', 'Mid-Level', 'Senior', 'Staff'];

export function SetupPage() {
  const navigate = useNavigate();
  const [company, setCompany] = useState('');
  const [customCompany, setCustomCompany] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [level, setLevel] = useState('Mid-Level');
  const [roundType, setRoundType] = useState<'coding' | 'ml'>('coding');
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCompany = company || customCompany || 'Google';
    const params = new URLSearchParams({
      company: selectedCompany,
      role,
      level,
      mode: roundType
    });
    navigate(`/prep?${params.toString()}`);
  };

  return (
    <div className="fs-setup">
      {/* Background organic shapes */}
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,122,99,0.03) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="fs-setup__inner">
        <header className="fs-setup__header">
          <span className="fs-setup__eyebrow">Interview Setup</span>
          <h1 className="fs-setup__title">Configure your session</h1>
          <p className="fs-setup__subtitle">Tailor the experience to match the company and role you're targeting.</p>
        </header>

        <form onSubmit={handleNext} className="fs-setup__form">
          {/* Company Selection */}
          <div className="fs-setup__field">
            <label className="fs-setup__label">Target Company</label>
            <div className="fs-setup__company-grid">
              {companies.map(c => (
                <button
                  key={c.name}
                  type="button"
                  className={`fs-setup__company-btn ${company === c.name ? 'active' : ''}`}
                  onClick={() => { setCompany(c.name); setCustomCompany(''); }}
                >
                  <div className="fs-setup__company-dot" style={{ background: c.color }} />
                  {c.name}
                </button>
              ))}
            </div>
            <input
              value={customCompany}
              onChange={e => { setCustomCompany(e.target.value); setCompany(''); }}
              placeholder="Or type a custom company..."
              className="fs-setup__input"
            />
          </div>

          {/* Role */}
          <div className="fs-setup__field">
            <label className="fs-setup__label">Role</label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              required
              className="fs-setup__input"
            />
          </div>

          {/* Level */}
          <div className="fs-setup__field">
            <label className="fs-setup__label">Level</label>
            <div className="fs-setup__level-grid">
              {levels.map(l => (
                <button
                  key={l}
                  type="button"
                  className={`fs-setup__level-btn ${level === l ? 'active' : ''}`}
                  onClick={() => setLevel(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Mode */}
          <div className="fs-setup__field">
            <label className="fs-setup__label">Interview Mode</label>
            <div className="fs-setup__mode-grid">
              <button
                type="button"
                className={`fs-setup__mode-card ${roundType === 'coding' ? 'active' : ''}`}
                onClick={() => setRoundType('coding')}
              >
                <div className="fs-setup__mode-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>
                <div>
                  <div className="fs-setup__mode-title">Technical Coding</div>
                  <div className="fs-setup__mode-desc">Data structures, algorithms, and system design</div>
                </div>
              </button>
              <button
                type="button"
                className={`fs-setup__mode-card ${roundType === 'ml' ? 'active' : ''}`}
                onClick={() => setRoundType('ml')}
              >
                <div className="fs-setup__mode-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 12 12 22 2 12 12 2"/></svg></div>
                <div>
                  <div className="fs-setup__mode-title">Machine Learning</div>
                  <div className="fs-setup__mode-desc">ML concepts, model design, and optimization</div>
                </div>
              </button>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="fs-setup__field">
            <label className="fs-setup__label">Resume Context <span className="fs-setup__optional">(Optional)</span></label>
            <p className="fs-setup__hint">Upload your resume for personalized, context-aware questions.</p>
            <div className="fs-setup__upload-area">
              <input
                type="file"
                accept="application/pdf"
                onChange={e => setResumeFile(e.target.files?.[0] || null)}
                className="fs-setup__file-input"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="fs-setup__upload-label">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {resumeFile ? resumeFile.name : 'Click to upload PDF'}
              </label>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="fs-setup__submit">
            Continue to Preparation
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
