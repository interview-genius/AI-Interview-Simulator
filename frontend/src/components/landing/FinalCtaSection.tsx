import { useNavigate } from 'react-router-dom';

export function FinalCtaSection() {
  const navigate = useNavigate();

  return (
    <section style={{ 
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Upper CTA Area - Rich color block (Inspired by the mixed color theme reference) */}
      <div style={{
        position: 'relative',
        background: '#5C7A8C', // Rich slate blue
        padding: 'var(--space-32) var(--space-8) var(--space-48)',
        color: '#FDFCF9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Abstract painted clouds / landscape elements */}
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '120%', height: '50%', background: '#FDFCF9', borderRadius: '50% 50% 0 0', opacity: 0.1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '10%', width: '80%', height: '30%', background: '#FDFCF9', borderRadius: '50% 50% 0 0', opacity: 0.15, pointerEvents: 'none' }} />
        
        <div style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '800px'
        }}>
          <h2 style={{ 
            fontSize: 'var(--font-size-4xl)', 
            fontFamily: 'var(--font-family-heading)',
            lineHeight: 1.1,
            marginBottom: 'var(--space-8)'
          }}>
            Start with a seed.<br />
            See where it takes you.
          </h2>
          
          <button 
            onClick={() => navigate('/auth')}
            style={{
              padding: 'var(--space-4) var(--space-8)',
              background: '#FDFCF9',
              color: '#5C7A8C',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 600,
              boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
              transition: 'transform var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Start your first interview
          </button>
        </div>
      </div>

      {/* Actual Footer Area - Cream */}
      <footer style={{
        background: '#FDFCF9',
        padding: 'var(--space-12) var(--space-8)',
        color: 'var(--color-text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-8)',
        borderTop: '2px solid #5C7A8C'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: 'var(--space-16)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <img src="/logo.png" alt="FlowState" style={{ height: '24px', width: 'auto' }} />
              <span style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 800, color: 'var(--color-text-primary)' }}>FlowState</span>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', maxWidth: '250px' }}>
              Turning every interview into measurable progress and personal growth.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-8)', fontSize: 'var(--font-size-sm)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Product</strong>
              <a href="#" style={{ color: 'inherit' }}>Features</a>
              <a href="#" style={{ color: 'inherit' }}>Pricing</a>
              <a href="#" style={{ color: 'inherit' }}>Success Stories</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Resources</strong>
              <a href="#" style={{ color: 'inherit' }}>Interview Guide</a>
              <a href="#" style={{ color: 'inherit' }}>Blog</a>
              <a href="#" style={{ color: 'inherit' }}>Support</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <strong style={{ color: 'var(--color-text-primary)' }}>Company</strong>
              <a href="#" style={{ color: 'inherit' }}>About Us</a>
              <a href="#" style={{ color: 'inherit' }}>Careers</a>
              <a href="#" style={{ color: 'inherit' }}>Contact</a>
            </div>
          </div>
        </div>

        <div style={{ 
          maxWidth: '1200px', 
          margin: 'var(--space-8) auto 0', 
          width: '100%', 
          display: 'flex', 
          justifyContent: 'space-between',
          borderTop: '1px solid var(--color-border)',
          paddingTop: 'var(--space-6)',
          fontSize: 'var(--font-size-xs)'
        }}>
          <span>© {new Date().getFullYear()} FlowState. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <a href="#" style={{ color: 'inherit' }}>Terms of Service</a>
            <a href="#" style={{ color: 'inherit' }}>Privacy Policy</a>
          </div>
        </div>
      </footer>

    </section>
  );
}
