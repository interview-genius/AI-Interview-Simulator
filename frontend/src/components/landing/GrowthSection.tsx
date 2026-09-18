import { useEffect, useState, useRef } from 'react';

export function GrowthSection() {
  const [inView, setInView] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState(3);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.3 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const stages = [
    { title: "Performance becomes progress.", desc: "After each session, your holistic score is calculated." },
    { title: "Every interview tells you what to work on next.", desc: "Start small. Keep practicing." },
    { title: "Your progress shouldn't disappear into a spreadsheet.", desc: "Detailed feedback drives your evolution." },
    { title: "FlowState turns every interview into a visible record of your growth.", desc: "Watch yourself grow into a mature, confident candidate." }
  ];

  return (
    <section id="growth" ref={sectionRef} style={{ 
      padding: 'var(--space-24) var(--space-8)',
      background: 'var(--color-bg)',
      borderTop: '1px solid var(--color-border)',
      borderBottom: '1px solid var(--color-border)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        {/* Editorial Text matching the stage */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)', height: '120px', transition: 'opacity 0.5s ease', opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(20px)' }}>
          <h2 style={{ fontSize: 'var(--font-size-3xl)', fontFamily: 'var(--font-family-heading)', marginBottom: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
            {stages[activeStage].title}
          </h2>
          <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            {stages[activeStage].desc}
          </p>
        </div>

        {/* Interactive Tree Stages */}
        <div style={{ display: 'flex', gap: 'var(--space-16)', alignItems: 'flex-end', height: '300px', opacity: inView ? 1 : 0, transition: 'opacity 1s ease 0.3s' }}>
          
          {/* Stage 0 */}
          <div 
            onClick={() => setActiveStage(0)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: activeStage === 0 ? 1 : 0.4, transition: 'opacity 0.3s' }}
          >
            <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', paddingBottom: '20px' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <circle cx="12" cy="12" r="3" fill="var(--color-accent)" fillOpacity="0.2"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>SEED</span>
          </div>

          {/* Stage 1 */}
          <div 
            onClick={() => setActiveStage(1)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: activeStage === 1 ? 1 : 0.4, transition: 'opacity 0.3s' }}
          >
            <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', paddingBottom: '20px' }}>
              <svg width="80" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1">
                <path d="M12 22V12" />
                <path d="M12 16c-2-2-4-2-6 0" />
                <path d="M12 14c2-2 4-2 6 0" />
                <circle cx="12" cy="22" r="2" fill="var(--color-secondary-accent)" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>SPROUT</span>
          </div>

          {/* Stage 2 */}
          <div 
            onClick={() => setActiveStage(2)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: activeStage === 2 ? 1 : 0.4, transition: 'opacity 0.3s' }}
          >
            <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', paddingBottom: '20px' }}>
              <svg width="120" height="180" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1">
                <path d="M12 22V8" />
                <path d="M12 16c-3-3-5-2-7 1" />
                <path d="M12 12c3-3 5-2 7 1" />
                <path d="M12 10c-2-2-3-1-4 1" />
                <circle cx="12" cy="22" r="3" fill="var(--color-secondary-accent)" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>SAPLING</span>
          </div>

          {/* Stage 3 */}
          <div 
            onClick={() => setActiveStage(3)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', opacity: activeStage === 3 ? 1 : 0.4, transition: 'opacity 0.3s' }}
          >
            <div style={{ height: '240px', display: 'flex', alignItems: 'flex-end', paddingBottom: '20px' }}>
              <svg width="180" height="240" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.2">
                <path d="M12 22V4" strokeWidth="2" stroke="var(--color-secondary-accent)" />
                <path d="M12 16c-5-5-7-2-9 3" />
                <path d="M12 12c5-5 7-2 9 3" />
                <path d="M12 8c-4-4-5-1-7 3" />
                <path d="M12 6c4-3 5-1 6 2" />
                <circle cx="12" cy="4" r="8" fill="var(--color-accent-bg)" stroke="var(--color-accent)" />
                <circle cx="6" cy="9" r="6" fill="var(--color-accent-bg)" stroke="var(--color-accent)" />
                <circle cx="18" cy="11" r="5" fill="var(--color-accent-bg)" stroke="var(--color-accent)" />
                <circle cx="8" cy="15" r="4" fill="var(--color-accent-bg)" stroke="var(--color-accent)" />
                <circle cx="12" cy="22" r="5" fill="var(--color-secondary-accent)" />
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontSize: '12px', color: 'var(--color-text-secondary)' }}>MATURE TREE</span>
          </div>
          
        </div>

      </div>
    </section>
  );
}
