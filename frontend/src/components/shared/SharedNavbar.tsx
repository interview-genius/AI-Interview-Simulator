import { useEffect, useRef, useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { supabase } from '../../api/supabase';

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <img 
      src="/logo.png" 
      alt="FlowState Logo" 
      style={{ height: size, width: 'auto', objectFit: 'contain' }} 
    />
  );
}

interface SharedNavbarProps {
  /** 'landing' shows Philosophy/Experience/Growth anchor links. 'app' shows Dashboard/Interviews links. */
  variant?: 'landing' | 'app';
}

export function SharedNavbar({ variant = 'app' }: SharedNavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; user_metadata?: Record<string, any> } | null>(null);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sync Supabase Auth & Local Storage User State
  useEffect(() => {
    const syncUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
          return;
        }
      } catch (e) {}

      const localEmail = localStorage.getItem('auth_email') || sessionStorage.getItem('auth_email');
      const localName = localStorage.getItem('auth_name');
      if (localEmail) {
        setUser({
          email: localEmail,
          user_metadata: { full_name: localName || localEmail.split('@')[0] },
        });
      } else {
        setUser(null);
      }
    };

    syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        syncUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close account dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setAccountDropdownOpen(false);
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_email');
    localStorage.removeItem('auth_name');
    localStorage.removeItem('auth_user_id');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_email');
    setUser(null);
    navigate('/auth');
  };


  const isLanding = variant === 'landing';

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    fontSize: '0.85rem',
    fontWeight: 500 as const,
    color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    textDecoration: 'none' as const,
    position: 'relative' as const,
    transition: 'color 0.2s ease',
  });

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'U';
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  return (
    <>
      <nav className={`fs-nav ${scrolled ? 'scrolled' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Hamburger Icon for Mobile */}
          <button 
            className="fs-nav__hamburger"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <a
            href={isLanding ? '/' : '/dashboard'}
            className="fs-nav__logo"
            onClick={e => {
              e.preventDefault();
              if (isLanding) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/dashboard');
              }
            }}
          >
            <LogoMark size={26} />
            <span className="fs-nav__brand">FlowState</span>
          </a>
        </div>

        {/* Desktop Links */}
        <div className="fs-nav__links fs-nav__desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isLanding ? (
            <>
              <a href="#philosophy" className="fs-nav__link">Philosophy</a>
              <a href="#experience" className="fs-nav__link">Experience</a>
              <a href="#growth" className="fs-nav__link">Growth</a>
              <button className="fs-nav__cta" onClick={() => navigate('/auth')}>Start practicing</button>
            </>
          ) : (
            <>
              <NavLink to="/dashboard" className="fs-nav__link" style={navLinkStyle}>Dashboard</NavLink>
              <NavLink to="/interviews" className="fs-nav__link" style={navLinkStyle}>Interviews</NavLink>
              <button
                className="fs-nav__cta"
                onClick={() => navigate('/setup')}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                New Interview
              </button>

              {/* User Account Avatar / Pill */}
              {user ? (
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(42, 48, 34, 0.6)',
                      border: '1px solid #363E2F',
                      padding: '4px 10px 4px 6px',
                      borderRadius: '20px',
                      color: '#FDFCF9',
                      fontSize: '0.82rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = '#6C7A63')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = '#363E2F')}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#6C7A63',
                        color: '#12150E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {userInitial}
                    </div>
                    <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {displayName}
                    </span>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: accountDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {accountDropdownOpen && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: '220px',
                        background: '#1A1D16',
                        border: '1px solid #2A3022',
                        borderRadius: '12px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                        padding: '8px',
                        zIndex: 100,
                        animation: 'fadeIn 0.15s ease-out',
                      }}
                    >
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid #2A3022', marginBottom: '6px' }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#808877', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Signed in as</p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#FDFCF9', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </p>
                      </div>

                      <button
                        onClick={() => { setAccountDropdownOpen(false); navigate('/dashboard'); }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: '8px 10px',
                          color: '#D5E0CC',
                          fontSize: '0.82rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = '#252A20')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Dashboard
                      </button>

                      <button
                        onClick={() => { setAccountDropdownOpen(false); navigate('/interviews'); }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: '8px 10px',
                          color: '#D5E0CC',
                          fontSize: '0.82rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = '#252A20')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>
                        Interview History
                      </button>

                      <div style={{ height: '1px', background: '#2A3022', margin: '6px 0' }} />

                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          background: 'transparent',
                          border: 'none',
                          padding: '8px 10px',
                          color: '#E06C75',
                          fontSize: '0.82rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontWeight: 500,
                        }}
                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(224, 108, 117, 0.1)')}
                        onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Log out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  style={{
                    background: 'transparent',
                    border: '1px solid #363E2F',
                    color: '#D5E0CC',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#6C7A63')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = '#363E2F')}
                >
                  Log in
                </button>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div 
          className="fs-nav__drawer-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`fs-nav__drawer ${menuOpen ? 'open' : ''}`}>
        <div className="fs-nav__drawer-header">
          <LogoMark size={32} />
          <button className="fs-nav__drawer-close" onClick={() => setMenuOpen(false)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="fs-nav__drawer-links">
          {isLanding ? (
            <>
              <a href="#philosophy" onClick={() => setMenuOpen(false)}>Philosophy</a>
              <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
              <a href="#growth" onClick={() => setMenuOpen(false)}>Growth</a>
              <button className="fs-nav__cta" onClick={() => { setMenuOpen(false); navigate('/auth'); }} style={{ marginTop: '24px' }}>Start practicing</button>
            </>
          ) : (
            <>
              {user && (
                <div style={{ padding: '8px 0', borderBottom: '1px solid #2A3022', marginBottom: '16px' }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#808877' }}>Signed in as</p>
                  <p style={{ margin: '2px 0 0', fontSize: '0.88rem', color: '#FDFCF9', fontWeight: 600 }}>{user.email}</p>
                </div>
              )}
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/interviews" onClick={() => setMenuOpen(false)}>Interviews</NavLink>
              <button className="fs-nav__cta" onClick={() => { setMenuOpen(false); navigate('/setup'); }} style={{ marginTop: '16px' }}>New Interview</button>

              {user ? (
                <button
                  onClick={handleLogout}
                  style={{
                    marginTop: '24px',
                    padding: '10px 16px',
                    background: 'rgba(224, 108, 117, 0.1)',
                    border: '1px solid rgba(224, 108, 117, 0.3)',
                    color: '#E06C75',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Log out
                </button>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                  style={{
                    marginTop: '24px',
                    padding: '10px 16px',
                    background: '#252A20',
                    border: '1px solid #363E2F',
                    color: '#FDFCF9',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  Log in
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

