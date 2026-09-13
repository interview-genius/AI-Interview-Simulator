import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/landing.css';
import { SharedNavbar, LogoMark } from '../shared/SharedNavbar';

/* ─── Scroll reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── Hero Section ─── */
function HeroSection() {
  const navigate = useNavigate();
  const revealText = useReveal();
  const revealMockup = useReveal();

  return (
    <section className="fs-hero">
      {/* Subtle organic shapes in background */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(108,122,99,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-30%', left: '-15%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(178,139,106,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="fs-hero__content">
        <div ref={revealText} className="fs-hero__text fs-reveal">
          <h1 className="fs-hero__headline">
            Practice under pressure.<br />
            Grow <em>without</em> the pressure.
          </h1>
          <p className="fs-hero__sub">
            FlowState simulates the full interview—voice, code, and presence—then turns every session into a map of your growth.
          </p>
          <div className="fs-hero__actions">
            <button className="fs-hero__btn-primary" onClick={() => navigate('/auth')}>
              Start your first interview
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="fs-hero__btn-secondary" onClick={() => { document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' }); }}>
              See how it works
            </button>
          </div>
        </div>

        <div ref={revealMockup} className="fs-hero__visual fs-reveal fs-reveal-delay-2">
          <div className="fs-hero__mockup">
            {/* Mini product mockup */}
            <div className="fs-mockup-inner" style={{ height: '380px', gridTemplateColumns: '220px 1fr' }}>
              <div className="fs-mockup-sidebar">
                <div className="fs-mockup-camera">
                  <div className="fs-mockup-camera__ring">
                    <div className="fs-mockup-camera__dot" />
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6C7A63', boxShadow: '0 0 6px #6C7A63' }} />
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.6rem', color: '#6C7A63', letterSpacing: '0.06em' }}>LISTENING</span>
                  </div>
                </div>
                <div className="fs-mockup-transcript">
                  <div className="fs-mockup-msg">
                    <span className="fs-mockup-msg__role fs-mockup-msg__role--ai">Interviewer</span>
                    <span className="fs-mockup-msg__text">Walk me through how you'd design a rate limiter for an API gateway.</span>
                  </div>
                  <div className="fs-mockup-msg">
                    <span className="fs-mockup-msg__role fs-mockup-msg__role--you">You</span>
                    <span className="fs-mockup-msg__text">I'd start with a sliding window approach using Redis...</span>
                  </div>
                  <div className="fs-mockup-msg">
                    <span className="fs-mockup-msg__role fs-mockup-msg__role--ai">Interviewer</span>
                    <span className="fs-mockup-msg__text">Interesting. What happens when Redis goes down?</span>
                  </div>
                </div>
              </div>
              <div className="fs-mockup-editor">
                <div className="fs-mockup-editor__bar">
                  <div className="fs-mockup-editor__dot" style={{ background: '#D36B5B' }} />
                  <div className="fs-mockup-editor__dot" style={{ background: '#B28B6A' }} />
                  <div className="fs-mockup-editor__dot" style={{ background: '#6C7A63' }} />
                  <div className="fs-mockup-editor__tab">solution.py</div>
                </div>
                <div className="fs-mockup-editor__code">
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">1</span><span style={{ color: '#C586C0' }}>class</span> <span style={{ color: '#DCDCAA' }}>RateLimiter</span><span style={{ color: '#808877' }}>:</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">2</span><span style={{ color: '#C586C0', paddingLeft: 16 }}>def</span> <span style={{ color: '#DCDCAA' }}>__init__</span><span style={{ color: '#808877' }}>(self, limit, window):</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">3</span><span style={{ color: '#A3AB9E', paddingLeft: 32 }}>self.limit = limit</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">4</span><span style={{ color: '#A3AB9E', paddingLeft: 32 }}>self.window = window</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">5</span><span style={{ color: '#A3AB9E', paddingLeft: 32 }}>self.requests = {'{}'}</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">6</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">7</span><span style={{ color: '#C586C0', paddingLeft: 16 }}>def</span> <span style={{ color: '#DCDCAA' }}>is_allowed</span><span style={{ color: '#808877' }}>(self, client_id):</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">8</span><span style={{ color: '#A3AB9E', paddingLeft: 32 }}>now = time.time()</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">9</span><span style={{ color: '#C586C0', paddingLeft: 32 }}>if</span><span style={{ color: '#A3AB9E' }}> client_id </span><span style={{ color: '#C586C0' }}>not in</span><span style={{ color: '#A3AB9E' }}> self.requests:</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">10</span><span style={{ color: '#A3AB9E', paddingLeft: 48 }}>self.requests[client_id] = []</span></div>
                </div>
              </div>
            </div>
          </div>
          {/* Floating badges around the mockup */}
          <div style={{ position: 'absolute', top: -16, right: -16, background: '#FDFCF9', borderRadius: 12, padding: '8px 14px', boxShadow: '0 4px 20px rgba(44,43,41,0.08)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-accent)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)' }} />
            AI Evaluating
          </div>
          <div style={{ position: 'absolute', bottom: -12, left: -20, background: '#FDFCF9', borderRadius: 12, padding: '8px 14px', boxShadow: '0 4px 20px rgba(44,43,41,0.08)', border: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-secondary-accent)' }}>Google</span> · SDE II · System Design
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Philosophy Section ─── */
function PhilosophySection() {
  const r1 = useReveal();
  const r2 = useReveal();

  return (
    <section id="philosophy" className="fs-section fs-philosophy">
      <div className="fs-section__inner">
        <div ref={r1} className="fs-reveal">
          <p className="fs-philosophy__statement">
            Interviews aren't just about getting the answer right.
          </p>
        </div>
        <div ref={r2} className="fs-philosophy__grid fs-reveal">
          <div className="fs-philosophy__item">
            <span className="fs-philosophy__number">01</span>
            <h3 className="fs-philosophy__title">How you think.</h3>
            <p className="fs-philosophy__desc">Do you jump straight to code, or explore trade-offs? FlowState evaluates your analytical breakdown, edge cases, and problem decomposition in real time.</p>
          </div>
          <div className="fs-philosophy__item">
            <span className="fs-philosophy__number">02</span>
            <h3 className="fs-philosophy__title">How you communicate.</h3>
            <p className="fs-philosophy__desc">Can you explain a complex optimization clearly? We track verbal articulation, structural clarity, and how well you walk the interviewer through your reasoning.</p>
          </div>
          <div className="fs-philosophy__item">
            <span className="fs-philosophy__number">03</span>
            <h3 className="fs-philosophy__title">How you respond.</h3>
            <p className="fs-philosophy__desc">When the interviewer pushes back, do you adapt or freeze? We simulate realistic pressure to help you build poise and confidence under scrutiny.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Product / Experience Section ─── */
function ProductSection() {
  const r1 = useReveal();
  const r2 = useReveal();

  return (
    <section id="experience" className="fs-section fs-product">
      <div className="fs-section__inner">
        <div ref={r1} className="fs-product__header fs-reveal">
          <h2 className="fs-product__title">The whole interview,<br />not just the code.</h2>
          <p className="fs-product__subtitle">Voice interaction, camera presence, live coding, and AI evaluation—working together in one session, just like a real interview.</p>
        </div>

        <div ref={r2} className="fs-reveal fs-reveal-delay-2">
          <div className="fs-mockup-container">
            <div className="fs-mockup-inner">
              <div className="fs-mockup-sidebar">
                <div className="fs-mockup-camera">
                  <div className="fs-mockup-camera__ring">
                    <div className="fs-mockup-camera__dot" />
                  </div>
                </div>
                <div className="fs-mockup-transcript">
                  <div className="fs-mockup-msg">
                    <span className="fs-mockup-msg__role fs-mockup-msg__role--ai">Interviewer</span>
                    <span className="fs-mockup-msg__text">Given an array of integers, return the two numbers that add up to a specific target.</span>
                  </div>
                  <div className="fs-mockup-msg">
                    <span className="fs-mockup-msg__role fs-mockup-msg__role--you">You</span>
                    <span className="fs-mockup-msg__text">I'll use a hash map to store complements as I iterate through the array...</span>
                  </div>
                  <div className="fs-mockup-msg">
                    <span className="fs-mockup-msg__role fs-mockup-msg__role--ai">Interviewer</span>
                    <span className="fs-mockup-msg__text">Good. What's the time and space complexity of your approach?</span>
                  </div>
                  <div className="fs-mockup-msg">
                    <span className="fs-mockup-msg__role fs-mockup-msg__role--you">You</span>
                    <span className="fs-mockup-msg__text">O(n) time since we iterate once, O(n) space for the hash map in the worst case.</span>
                  </div>
                </div>
              </div>
              <div className="fs-mockup-editor">
                <div className="fs-mockup-editor__bar">
                  <div className="fs-mockup-editor__dot" style={{ background: '#D36B5B' }} />
                  <div className="fs-mockup-editor__dot" style={{ background: '#B28B6A' }} />
                  <div className="fs-mockup-editor__dot" style={{ background: '#6C7A63' }} />
                  <div className="fs-mockup-editor__tab">solution.py</div>
                  <div style={{ marginLeft: 'auto' }}>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: '#6C7A63', padding: '3px 10px', background: 'rgba(108,122,99,0.15)', borderRadius: 4, display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Run</span>
                  </div>
                </div>
                <div className="fs-mockup-editor__code">
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">1</span><span style={{ color: '#C586C0' }}>def</span> <span style={{ color: '#DCDCAA' }}>two_sum</span><span style={{ color: '#808877' }}>(nums, target):</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">2</span><span style={{ color: '#A3AB9E', paddingLeft: 16 }}>seen = {'{}'}</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">3</span><span style={{ color: '#C586C0', paddingLeft: 16 }}>for</span> <span style={{ color: '#A3AB9E' }}>i, num </span><span style={{ color: '#C586C0' }}>in</span> <span style={{ color: '#DCDCAA' }}>enumerate</span><span style={{ color: '#808877' }}>(nums):</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">4</span><span style={{ color: '#A3AB9E', paddingLeft: 32 }}>diff = target - num</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">5</span><span style={{ color: '#C586C0', paddingLeft: 32 }}>if</span> <span style={{ color: '#A3AB9E' }}>diff </span><span style={{ color: '#C586C0' }}>in</span><span style={{ color: '#A3AB9E' }}> seen:</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">6</span><span style={{ color: '#C586C0', paddingLeft: 48 }}>return</span> <span style={{ color: '#A3AB9E' }}>[seen[diff], i]</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">7</span><span style={{ color: '#A3AB9E', paddingLeft: 32 }}>seen[num] = i</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">8</span></div>
                  <div className="fs-mockup-editor__line"><span className="fs-mockup-editor__num">9</span><span style={{ color: '#808877', paddingLeft: 0, display: 'flex', alignItems: 'center', gap: '4px' }}># <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> All test cases passed</span></div>
                </div>
                {/* Bottom bar */}
                <div style={{ borderTop: '1px solid #2A3022', padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: '#808877' }}>Python 3.11</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: '#6C7A63', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> 3/3 tests</span>
                    <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.65rem', color: '#808877' }}>32:14 remaining</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Dark Interview Room Section ─── */
function RoomSection() {
  const r1 = useReveal();

  return (
    <section className="fs-section fs-room">
      <div className="fs-section__inner">
        <div ref={r1} className="fs-room__grid fs-reveal">
          <div>
            <h2 className="fs-room__title">Warm outside.<br />Serious inside.</h2>
            <p className="fs-room__desc">Step into an environment built for focus. No distractions—just you, the problem, and an AI interviewer that adapts to your level.</p>
            <div className="fs-room__features">
              <div className="fs-room__feature"><div className="fs-room__feature-dot" /><span>Real-time voice conversation with follow-up questions</span></div>
              <div className="fs-room__feature"><div className="fs-room__feature-dot" /><span>Camera presence tracking for behavioral signals</span></div>
              <div className="fs-room__feature"><div className="fs-room__feature-dot" /><span>Professional IDE with live execution and test cases</span></div>
              <div className="fs-room__feature"><div className="fs-room__feature-dot" /><span>Company-specific interview style and difficulty</span></div>
              <div className="fs-room__feature"><div className="fs-room__feature-dot" /><span>Resume-aware questioning powered by RAG</span></div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Compact metrics mockup */}
            <div style={{ background: '#1A1D16', borderRadius: 16, border: '1px solid #2A3022', padding: 24 }}>
              <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '0.7rem', color: '#808877', letterSpacing: '0.05em' }}>LIVE EVALUATION</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
                {[
                  { label: 'Technical', val: '4.2', color: '#6C7A63' },
                  { label: 'Communication', val: '3.8', color: '#B28B6A' },
                  { label: 'Problem Solving', val: '4.5', color: '#6C7A63' },
                  { label: 'Presence', val: '3.5', color: '#B28B6A' }
                ].map(d => (
                  <div key={d.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: '#808877' }}>{d.label}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: 600, color: d.color, fontFamily: 'var(--font-family-heading)' }}>{d.val}</span>
                      <span style={{ fontSize: '0.7rem', color: '#555' }}>/5</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: '#2A3022' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: d.color, width: `${(parseFloat(d.val) / 5) * 100}%`, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Growth Section ─── */
function GrowthSection() {
  const [stage, setStage] = useState(0);
  const [inView, setInView] = useState(false);
  const r1 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = r1.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { 
        if (e.isIntersecting) { 
          el.classList.add('visible'); 
          setInView(true);
          obs.unobserve(el); 
        } 
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setStage(prev => (prev + 1) % 4);
    }, 2800);
    return () => clearInterval(interval);
  }, [inView]);

  const stages = [
    { key: 'seed', label: 'Seed', desc: 'Every journey starts small. Plant your seed by completing your first session.' },
    { key: 'sprout', label: 'Sprout', desc: 'Your first growth. Early patterns emerge across dimensions.' },
    { key: 'sapling', label: 'Sapling', desc: 'Consistent practice deepens your roots and strengthens weak areas.' },
    { key: 'tree', label: 'Mature', desc: 'Confidence earned through visible, measurable progress over time.' }
  ];

  // Kawaii-style SVG plants inspired by user inspiration
  const trees: Record<number, JSX.Element> = {
    0: (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        {/* Ground lines */}
        <path d="M60 160 L140 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M45 160 L50 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M150 160 L155 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        {/* Dirt mound */}
        <path d="M70 160 Q100 145 130 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        {/* Seed/tiny sprout */}
        <path d="M95 155 Q100 145 105 155 Z" fill="#88C462" stroke="#3E3E3E" strokeWidth="3" strokeLinejoin="round" />
      </svg>
    ),
    1: (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M60 160 L140 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M45 160 L50 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M150 160 L155 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 160 Q100 145 130 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 150 Q105 120 95 90" stroke="#3E3E3E" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M95 110 Q80 100 85 125 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M95 90 Q80 60 110 50 Q120 70 95 90 Z" fill="#88C462" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="102" cy="70" r="2" fill="#3E3E3E" />
        <circle cx="112" cy="73" r="2" fill="#3E3E3E" />
        <path d="M105 75 Q107 78 109 75" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    ),
    2: (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M60 160 L140 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M70 160 Q100 140 130 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 145 Q110 110 95 75" stroke="#3E3E3E" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M105 130 Q125 125 115 145 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 100 Q80 90 85 115 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M97 85 Q125 75 115 95 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M95 75 Q75 55 95 40 Q115 55 95 75 Z" fill="#88C462" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M90 45 Q95 35 100 45 Z" fill="#FF8BA7" stroke="#3E3E3E" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="90" cy="58" r="2.5" fill="#3E3E3E" />
        <circle cx="100" cy="58" r="2.5" fill="#3E3E3E" />
        <path d="M93 62 L95 65 L97 62" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
    3: (
      <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
        <path d="M50 160 L150 160" stroke="#3E3E3E" strokeWidth="4" strokeLinecap="round" />
        <path d="M60 160 Q100 135 140 160 Z" fill="#B37859" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M100 145 Q110 90 100 45" stroke="#3E3E3E" strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M102 120 Q130 110 120 135 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M98 100 Q70 90 80 115 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M103 80 Q135 70 120 95 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <path d="M97 60 Q65 50 80 75 Z" fill="#A8D672" stroke="#3E3E3E" strokeWidth="4" strokeLinejoin="round" />
        <circle cx="100" cy="40" r="18" fill="#FF8BA7" stroke="#3E3E3E" strokeWidth="4" />
        <circle cx="94" cy="38" r="2.5" fill="#3E3E3E" />
        <circle cx="106" cy="38" r="2.5" fill="#3E3E3E" />
        <path d="M98 43 Q100 46 102 43" stroke="#3E3E3E" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    )
  };

  return (
    <section id="growth" className="fs-section fs-growth">
      <div className="fs-section__inner">
        <div ref={r1} className="fs-reveal">
          <div className="fs-growth__header">
            <h2 className="fs-growth__title">Every interview leaves a trace.</h2>
            <p className="fs-growth__sub">Your growth isn't hidden in a spreadsheet. It's visible, dimensional, and uniquely yours.</p>
          </div>

          <div className="fs-tree-area">
            <div className="fs-tree-visual" style={{ height: 320, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i} 
                  className={`fs-tree-stage ${stage === i ? 'active' : 'inactive'}`} 
                  style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    transformOrigin: 'bottom center',
                    transform: stage === i ? 'scale(1.5)' : 'scale(1.2)',
                    opacity: stage === i ? 1 : 0,
                    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                  }}
                >
                  {trees[i]}
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center', minHeight: 60, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h4 style={{ fontFamily: 'var(--font-family-heading)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {stages[stage].label}
              </h4>
              <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', maxWidth: 400, lineHeight: 1.6, margin: '0 auto' }}>
                {stages[stage].desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Dimensions Section ─── */
function DimensionsSection() {
  const r1 = useReveal();

  const dims = [
    { label: 'Technical Ability', score: '64 → 78', desc: 'System design explanations became more structured.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
    { label: 'Communication', score: '72 → 85', desc: 'Fewer filler words, more precise answers.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { label: 'Problem Solving', score: '50 → 70', desc: 'Now explores edge cases before coding.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
    { label: 'Presence', score: '80 → 88', desc: 'Strong eye contact during difficult follow-ups.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> }
  ];

  return (
    <section className="fs-section fs-dimensions">
      <div className="fs-section__inner">
        <div ref={r1} className="fs-dimensions__grid fs-reveal">
          <div>
            <h2 style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Track what actually matters.
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, maxWidth: 400 }}>
              Every dimension of your interview performance is measured, compared, and connected to your growth over time.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {dims.map(d => (
              <div key={d.label} className="fs-dimension-card">
                <div className="fs-dimension-card__icon">
                  <span style={{ fontSize: '1rem', color: 'var(--color-accent)' }}>{d.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="fs-dimension-card__label">{d.label}</span>
                    <span className="fs-dimension-card__score">{d.score}</span>
                  </div>
                  <p className="fs-dimension-card__desc">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA Section ─── */
function CtaSection() {
  const navigate = useNavigate();
  const r1 = useReveal();

  return (
    <section className="fs-cta">
      <div className="fs-cta__bg">
        {/* Organic shapes in background */}
        <div style={{ position: 'absolute', top: '-50%', left: '-20%', width: '140%', height: '200%', borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
      </div>
      <div ref={r1} className="fs-reveal" style={{ position: 'relative', zIndex: 10 }}>
        <h2 className="fs-cta__title">
          Start with a seed.<br />See where it takes you.
        </h2>
        <button className="fs-cta__btn" onClick={() => navigate('/auth')}>
          Start your first interview
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="fs-footer">
      <div className="fs-footer__inner">
        <div className="fs-footer__grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogoMark size={22} />
              <span style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>FlowState</span>
            </div>
            <p className="fs-footer__brand-desc">
              Turning every interview into measurable progress and personal growth.
            </p>
          </div>
          <div>
            <h4 className="fs-footer__col-title">Product</h4>
            <a href="#" className="fs-footer__link">Features</a>
            <a href="#" className="fs-footer__link">Pricing</a>
            <a href="#" className="fs-footer__link">Success Stories</a>
          </div>
          <div>
            <h4 className="fs-footer__col-title">Resources</h4>
            <a href="#" className="fs-footer__link">Interview Guide</a>
            <a href="#" className="fs-footer__link">Blog</a>
            <a href="#" className="fs-footer__link">Support</a>
          </div>
          <div>
            <h4 className="fs-footer__col-title">Company</h4>
            <a href="#" className="fs-footer__link">About</a>
            <a href="#" className="fs-footer__link">Careers</a>
            <a href="#" className="fs-footer__link">Contact</a>
          </div>
        </div>
        <div className="fs-footer__bottom">
          <span>© {new Date().getFullYear()} FlowState. All rights reserved.</span>
          <div className="fs-footer__bottom-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Main Landing Page ─── */
export function LandingPage() {
  return (
    <div className="fs-grain" style={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden', background: 'var(--color-bg)' }}>
      <SharedNavbar variant="landing" />
      <HeroSection />
      <PhilosophySection />
      <ProductSection />
      <RoomSection />
      <GrowthSection />
      <DimensionsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
