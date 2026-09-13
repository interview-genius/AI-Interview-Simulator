import { useEffect, useState } from 'react';
import { useNavigate, useLocation, NavLink } from 'react-router-dom';

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
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        <div className="fs-nav__links fs-nav__desktop-only">
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
              >
                New Interview
              </button>
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
              <NavLink to="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink to="/interviews" onClick={() => setMenuOpen(false)}>Interviews</NavLink>
              <button className="fs-nav__cta" onClick={() => { setMenuOpen(false); navigate('/setup'); }} style={{ marginTop: '24px' }}>New Interview</button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
