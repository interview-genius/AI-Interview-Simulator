import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function OnboardingFlow() {
  const [step, setStep] = useState<1 | 2>(1);
  const navigate = useNavigate();

  const nextStep = () => setStep(2);
  
  const handleFinish = () => {
    navigate('/dashboard');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg)',
      padding: 'var(--space-4)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(136, 196, 98, 0.05) 0%, transparent 60%)',
        borderRadius: '50%',
        animation: 'floatSlow 10s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-15%',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(179, 120, 89, 0.04) 0%, transparent 60%)',
        borderRadius: '50%',
        animation: 'floatSlow 15s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      <div style={{
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255, 255, 255, 0.02)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        borderRadius: '24px',
        padding: 'var(--space-12) var(--space-8)',
        maxWidth: '640px',
        width: '100%',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        
        {step === 1 && (
          <div style={{ animation: 'fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              fontFamily: 'var(--font-family-heading)', 
              marginBottom: 'var(--space-4)',
              background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              Welcome to FlowState
            </h1>
            <p style={{ 
              fontSize: '1.2rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--space-12)',
              maxWidth: '400px',
              margin: '0 auto var(--space-12) auto',
              lineHeight: 1.6
            }}>
              Every candidate starts somewhere. This is your seed. Nurture it with practice, and watch it grow.
            </p>

            <div style={{ 
              margin: 'var(--space-12) 0',
              position: 'relative',
              display: 'inline-block'
            }}>
              <div style={{
                position: 'absolute',
                inset: -20,
                background: 'rgba(179, 120, 89, 0.15)',
                borderRadius: '50%',
                filter: 'blur(20px)',
                animation: 'pulse 3s infinite ease-in-out'
              }} />
              <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 2 }}>
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M12 16v-6"/>
                <path d="M12 10c-1.5-1.5-3-1-3 1s1.5 2.5 3 2.5"/>
                <path d="M12 13.5c1.5-1.5 3-1 3 1s-1.5 2.5-3 2.5"/>
              </svg>
            </div>

            <div>
              <button 
                onClick={nextStep}
                className="fs-onboarding__btn"
              >
                Plant your seed
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <div style={{ margin: 'var(--space-8) 0', animation: 'sinkDown 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--color-secondary-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M12 16v-6"/>
                <path d="M12 10c-1.5-1.5-3-1-3 1s1.5 2.5 3 2.5"/>
                <path d="M12 13.5c1.5-1.5 3-1 3 1s-1.5 2.5-3 2.5"/>
              </svg>
            </div>
            
            <div style={{ 
              width: '1px', 
              height: '40px', 
              background: 'linear-gradient(to bottom, var(--color-border), transparent)', 
              margin: '0 auto var(--space-8) auto' 
            }} />

            <h2 style={{ 
              fontSize: '2.5rem', 
              fontFamily: 'var(--font-family-heading)', 
              marginBottom: 'var(--space-4)',
              color: 'var(--color-text-primary)'
            }}>
              This is your starting point
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              color: 'var(--color-text-secondary)', 
              marginBottom: 'var(--space-12)',
              maxWidth: '480px',
              margin: '0 auto var(--space-12) auto',
              lineHeight: 1.6
            }}>
              Your tree will evolve and grow stronger as you practice. We will guide you step by step to interview mastery.
            </p>

            <button 
              onClick={handleFinish}
              className="fs-onboarding__btn-secondary"
            >
              Enter FlowState
            </button>
          </div>
        )}
      </div>

      <style>{`
        .fs-onboarding__btn {
          padding: 16px 40px;
          background: var(--color-accent);
          color: var(--color-accent-fg);
          border: none;
          border-radius: 40px;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(136, 196, 98, 0.3);
        }
        .fs-onboarding__btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(136, 196, 98, 0.4);
        }
        .fs-onboarding__btn:active {
          transform: translateY(0);
        }
        
        .fs-onboarding__btn-secondary {
          padding: 16px 40px;
          background: transparent;
          color: var(--color-text-primary);
          border: 1px solid var(--color-border);
          border-radius: 40px;
          font-size: 1.1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .fs-onboarding__btn-secondary:hover {
          background: rgba(255, 255, 255, 0.03);
          border-color: var(--color-text-secondary);
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes floatSlow {
          0% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(20px, -20px) rotate(5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.05); opacity: 0.8; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes sinkDown {
          0% { transform: translateY(-40px); opacity: 0; }
          40% { opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
