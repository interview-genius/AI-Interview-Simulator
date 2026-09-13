export function ImmersiveProductSections() {
  return (
    <>
      {/* Section 3 & 4: The Experience */}
      <section id="experience" style={{ 
        padding: 'var(--space-24) var(--space-8)',
        background: 'var(--color-bg)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-16)' }}>
            <h2 style={{ fontSize: 'var(--font-size-4xl)', fontFamily: 'var(--font-family-heading)', color: 'var(--color-text-primary)' }}>
              Experience the whole interview.
            </h2>
            <p style={{ fontSize: 'var(--font-size-xl)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: 'var(--space-6) auto 0' }}>
              We simulate the complete environment. Voice, presence, and code—all working together in real-time.
            </p>
          </div>

          {/* Refined Minimalistic Layout instead of clunky SVG diagram */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--space-8)',
            marginBottom: 'var(--space-24)'
          }}>
            {/* Voice */}
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--radius-xl)', 
              padding: 'var(--space-8)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--color-accent-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)', color: 'var(--color-accent)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontFamily: 'var(--font-family-heading)', marginBottom: 'var(--space-2)' }}>Natural Voice</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>Low-latency conversational AI that interrupts, probes, and listens just like a real interviewer.</p>
            </div>

            {/* Code */}
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--radius-xl)', 
              padding: 'var(--space-8)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transform: 'translateY(24px)'
            }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)', color: 'var(--color-text-secondary)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontFamily: 'var(--font-family-heading)', marginBottom: 'var(--space-2)' }}>Live Code</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>A professional IDE with syntax highlighting, live execution, and hidden test cases.</p>
            </div>

            {/* Context */}
            <div style={{ 
              background: 'var(--color-surface)', 
              borderRadius: 'var(--radius-xl)', 
              padding: 'var(--space-8)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transform: 'translateY(48px)'
            }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--color-accent-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-6)', color: 'var(--color-accent)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--font-size-lg)', fontFamily: 'var(--font-family-heading)', marginBottom: 'var(--space-2)' }}>Deep Context</h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>The AI knows your resume, your target role, and the specific company style.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Section 8: The Interview Room */}
      <section style={{ 
        padding: 'var(--space-32) var(--space-8)',
        background: '#181C14', // Very dark sage/black for realism
        color: '#FDFCF9',
        borderTop: '1px solid #2A3324'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-16)', alignItems: 'center' }}>
          
          <div>
            <h2 style={{ fontSize: 'var(--font-size-4xl)', fontFamily: 'var(--font-family-heading)', color: '#FDFCF9', lineHeight: 1.1 }}>
              Warm outside.<br/>Serious inside.
            </h2>
            <p style={{ fontSize: 'var(--font-size-xl)', color: '#A3B19B', maxWidth: '400px', marginTop: 'var(--space-6)' }}>
              Step into an immersive, professional environment. No distractions, just you and the problem.
            </p>
          </div>

          {/* High-Fidelity Mock UI */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            gap: 'var(--space-4)',
            height: '400px',
            background: '#0D0F0A',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid #2A3324',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>
            {/* Left Panel: Interviewer */}
            <div style={{ background: '#12150E', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', border: '1px solid #1A2213' }}>
              <div style={{ height: '140px', background: '#181C14', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', position: 'relative', borderBottom: '1px solid #1A2213' }}>
                 <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-accent)', boxShadow: '0 0 8px var(--color-accent)' }} />
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-family-mono)', color: 'var(--color-accent)', letterSpacing: '0.05em' }}>LISTENING</span>
                 </div>
              </div>
              <div style={{ padding: 'var(--space-4)', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', opacity: 0.5 }}>
                <div style={{ width: '80%', height: '6px', background: '#2A3324', borderRadius: '3px' }} />
                <div style={{ width: '90%', height: '6px', background: '#2A3324', borderRadius: '3px' }} />
                <div style={{ width: '60%', height: '6px', background: '#2A3324', borderRadius: '3px' }} />
              </div>
            </div>

            {/* Right Panel: IDE */}
            <div style={{ background: '#12150E', borderRadius: 'var(--radius-lg)', border: '1px solid #1A2213', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '40px', borderBottom: '1px solid #1A2213', display: 'flex', alignItems: 'center', padding: '0 var(--space-4)', justifyContent: 'space-between' }}>
                <span style={{ color: '#888', fontSize: '12px', fontFamily: 'var(--font-family-mono)' }}>Python 3</span>
                <div style={{ width: '50px', height: '20px', background: 'var(--color-accent)', borderRadius: '4px', opacity: 0.8 }} />
              </div>
              <div style={{ padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <span style={{ color: '#569CD6', fontFamily: 'var(--font-family-mono)' }}>def <span style={{ color: '#DCDCAA' }}>two_sum</span>(nums, target):</span>
                <span style={{ color: '#CE9178', fontFamily: 'var(--font-family-mono)', paddingLeft: '20px' }}>seen = {'{}'}</span>
                <span style={{ color: '#C586C0', fontFamily: 'var(--font-family-mono)', paddingLeft: '20px' }}>for i, num in enumerate(nums):</span>
                <span style={{ color: '#D4D4D4', fontFamily: 'var(--font-family-mono)', paddingLeft: '40px' }}>diff = target - num</span>
                <span style={{ color: '#C586C0', fontFamily: 'var(--font-family-mono)', paddingLeft: '40px' }}>if diff in seen:</span>
                <span style={{ color: '#D4D4D4', fontFamily: 'var(--font-family-mono)', paddingLeft: '60px' }}>return [seen[diff], i]</span>
                <span style={{ color: '#D4D4D4', fontFamily: 'var(--font-family-mono)', paddingLeft: '40px' }}>seen[num] = i</span>
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
