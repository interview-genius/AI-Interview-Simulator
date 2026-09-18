import { useNavigate } from 'react-router-dom';
import { useScrollY } from '../../hooks/useScrollY';
import { Logo } from '../shared/Logo';

export function HeroSection() {
  const navigate = useNavigate();
  const scrollY = useScrollY();

  // Parallax calculations
  const skyY = scrollY * 0.1;
  const backHillsY = scrollY * 0.3;
  const midHillsY = scrollY * 0.5;
  const frontHillsY = scrollY * 0.7;
  const textY = scrollY * 0.4;
  const opacity = Math.max(0, 1 - scrollY / 600);

  return (
    <section style={{ 
      position: 'relative', 
      height: '110vh', // Extend slightly beyond viewport to allow scrolling overlap
      overflow: 'hidden',
      background: '#FDFCF9', // Base cream color
    }}>
      
      {/* Navigation (Sticky or Fixed overlay) */}
      <nav style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: 'var(--space-6) var(--space-8)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Logo />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-8)', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 'var(--space-6)', fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
            <a href="#philosophy" style={{ color: 'var(--color-text-secondary)' }}>Philosophy</a>
            <a href="#experience" style={{ color: 'var(--color-text-secondary)' }}>Experience</a>
            <a href="#growth" style={{ color: 'var(--color-text-secondary)' }}>Growth</a>
          </div>
          
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
            <button onClick={() => navigate('/auth')} style={{ background: 'transparent', color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
              Log in
            </button>
            <button onClick={() => navigate('/auth')} style={{ 
              background: 'var(--color-text-primary)', 
              color: 'var(--color-bg)', 
              padding: 'var(--space-2) var(--space-4)', 
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--font-size-sm)'
            }}>
              Start practicing
            </button>
          </div>
        </div>
      </nav>

      {/* Background / Sky Layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        transform: `translateY(${skyY}px)`,
        background: 'linear-gradient(180deg, #FDFCF9 0%, #F5F1E4 100%)',
        zIndex: 1
      }}>
        {/* Subtle clouds or sun could go here */}
        <svg width="100%" height="100%" viewBox="0 0 1440 800" preserveAspectRatio="none">
          <circle cx="1200" cy="200" r="150" fill="#FDF8ED" filter="blur(40px)" />
        </svg>
      </div>

      {/* Back Hills */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: 0,
        right: 0,
        height: '60%',
        transform: `translateY(${backHillsY}px)`,
        zIndex: 2
      }}>
        <svg viewBox="0 0 1440 600" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M0,300 C300,100 600,400 900,200 C1200,0 1440,300 1440,300 L1440,600 L0,600 Z" fill="#E6DFCE" />
        </svg>
      </div>

      {/* Mid Hills */}
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: 0,
        right: 0,
        height: '50%',
        transform: `translateY(${midHillsY}px)`,
        zIndex: 3
      }}>
        <svg viewBox="0 0 1440 500" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M0,200 C400,400 800,0 1200,200 C1300,250 1440,150 1440,150 L1440,500 L0,500 Z" fill="#D6D1C1" />
        </svg>
      </div>

      {/* Front Landscape (Soil/Grass) */}
      <div style={{
        position: 'absolute',
        bottom: '-5%',
        left: 0,
        right: 0,
        height: '40%',
        transform: `translateY(${frontHillsY}px)`,
        zIndex: 4
      }}>
        <svg viewBox="0 0 1440 400" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
          <path d="M0,150 C500,50 900,250 1440,100 L1440,400 L0,400 Z" fill="#6C7A63" /> {/* Sage Green */}
        </svg>

        {/* The Seed */}
        <div style={{
          position: 'absolute',
          bottom: '25%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-2)'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#E6DFCE" strokeWidth="1.5">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M12 16v-6"/>
            <path d="M12 10c-1.5-1.5-3-1-3 1s1.5 2.5 3 2.5"/>
            <path d="M12 13.5c1.5-1.5 3-1 3 1s-1.5 2.5-3 2.5"/>
          </svg>
          <div style={{
            width: '6px',
            height: '6px',
            background: '#E6DFCE',
            borderRadius: '50%',
            animation: 'pulse 2s infinite ease-in-out'
          }} />
        </div>
      </div>

      {/* Typography Overlay */}
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '10%',
        transform: `translateY(${textY}px)`,
        opacity: opacity,
        zIndex: 5,
        maxWidth: '800px'
      }}>
        <h1 style={{ 
          fontSize: 'var(--font-size-4xl)', 
          fontFamily: 'var(--font-family-heading)',
          color: 'var(--color-text-primary)',
          lineHeight: 1.1,
          marginBottom: 'var(--space-4)',
          letterSpacing: '-0.02em'
        }}>
          Your interviews shape<br />your growth.
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-text-secondary)',
          maxWidth: '500px'
        }}>
          FlowState simulates the entire interview experience—evaluating how you think, communicate, and code—turning practice into measurable progress.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 0.5; box-shadow: 0 0 0px rgba(230,223,206,0.2); }
          50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 12px rgba(230,223,206,0.6); }
          100% { transform: scale(0.9); opacity: 0.5; box-shadow: 0 0 0px rgba(230,223,206,0.2); }
        }
      `}</style>

    </section>
  );
}
