export function PhilosophySection() {
  return (
    <section id="philosophy" style={{ 
      padding: 'var(--space-24) var(--space-8)',
      background: 'var(--color-bg)',
      color: 'var(--color-text-primary)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Large Editorial Statement */}
        <div style={{ 
          maxWidth: '800px', 
          marginBottom: 'var(--space-24)' 
        }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-3xl)', 
            fontFamily: 'var(--font-family-heading)',
            lineHeight: 1.2,
            letterSpacing: '-0.01em'
          }}>
            Interviews aren't just about getting the answer right.
          </h2>
          <p style={{ 
            fontSize: 'var(--font-size-xl)', 
            color: 'var(--color-text-secondary)',
            marginTop: 'var(--space-6)',
            maxWidth: '600px'
          }}>
            They are high-pressure environments that test more than your technical knowledge. They test your resilience, your articulation, and your presence.
          </p>
        </div>

        {/* Asymmetrical 3-Part Layout */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: 'var(--space-12)',
          paddingTop: 'var(--space-12)',
          borderTop: '1px solid var(--color-border)'
        }}>
          
          <div style={{ transform: 'translateY(0px)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontFamily: 'var(--font-family-mono)', textTransform: 'uppercase' }}>01</span>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontFamily: 'var(--font-family-heading)', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
              How you think.
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Do you jump straight to coding, or do you explore trade-offs? FlowState evaluates your analytical breakdown and edge-case testing.
            </p>
          </div>

          <div style={{ transform: 'translateY(40px)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontFamily: 'var(--font-family-mono)', textTransform: 'uppercase' }}>02</span>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontFamily: 'var(--font-family-heading)', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
              How you communicate.
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Can you explain a complex optimization clearly? We track your verbal articulation and structural clarity throughout the session.
            </p>
          </div>

          <div style={{ transform: 'translateY(80px)' }}>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-accent)', fontFamily: 'var(--font-family-mono)', textTransform: 'uppercase' }}>03</span>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontFamily: 'var(--font-family-heading)', marginTop: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
              How you respond.
            </h3>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              When the interviewer throws a curveball, do you freeze? We simulate realistic pressure to build your confidence and poise.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
