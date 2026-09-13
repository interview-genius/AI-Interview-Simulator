import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabase';
import { LogoMark } from '../shared/SharedNavbar';

export function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let authError = null;

    if (isRegistering) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      authError = error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      authError = error;
    }

    if (authError) {
      setError(authError.message);
    } else {
      navigate('/onboarding');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`
      }
    });
    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="fs-auth-page">
      <div className="fs-auth-split">
        {/* Left Side: Graphic / Illustration */}
        <div className="fs-auth-split__left">
          <img src="/auth-hero.jpg" alt="FlowState Environment" className="fs-auth-split__img" />
          <div className="fs-auth-split__overlay">
            <h2 className="fs-auth-split__quote">
              "Practice under pressure.<br />Grow without the pressure."
            </h2>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="fs-auth-split__right">
          <div className="fs-auth-form-container">
            <div className="fs-auth-form__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
                <LogoMark size={32} />
                <span style={{ fontFamily: 'var(--font-family-heading)', fontWeight: 700, fontSize: '1.4rem', color: 'var(--color-text-primary)', letterSpacing: '-0.02em' }}>
                  FlowState
                </span>
              </div>
              
              <h1 className="fs-auth-form__title">
                {isRegistering ? 'Create account' : 'Welcome back'}
              </h1>
            </div>

            {error && <div className="fs-auth-form__error">{error}</div>}

            <form onSubmit={handleAuth} className="fs-auth-form">
              {isRegistering && (
                <div className="fs-auth-form__field">
                  <input 
                    id="name"
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="fs-auth-form__input"
                    placeholder="Full name"
                    required={isRegistering}
                  />
                </div>
              )}

              <div className="fs-auth-form__field">
                <input 
                  id="email"
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="fs-auth-form__input"
                  placeholder="Email address"
                  required
                />
              </div>

              <div className="fs-auth-form__field">
                <input 
                  id="password"
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="fs-auth-form__input"
                  placeholder="Password"
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" disabled={loading} className="fs-auth-form__submit">
                {loading ? 'Processing...' : (isRegistering ? 'Create account' : 'Sign in')}
              </button>

              <div className="fs-auth-form__divider">
                <span>or continue with</span>
              </div>

              <div className="fs-auth-form__socials">
                <button type="button" onClick={handleGoogleAuth} className="fs-auth-form__social-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </button>
              </div>

              <button 
                type="button" 
                onClick={() => navigate('/onboarding')} 
                className="fs-auth-form__submit"
                style={{ 
                  marginTop: '16px', 
                  background: 'transparent', 
                  border: '1px solid var(--color-border)', 
                  color: 'var(--color-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Continue as Guest (Bypass Auth)
              </button>

              <div className="fs-auth-form__terms">
                By continuing, you agree to FlowState's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </div>

              <div className="fs-auth-form__toggle">
                {isRegistering ? 'Have an account?' : "Don't have an account?"} 
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(null); }}>
                  {isRegistering ? 'Log in' : 'Sign up'}
                </button>
              </div>
            </form>
          </div>
          
          <button className="fs-auth-form__back" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
