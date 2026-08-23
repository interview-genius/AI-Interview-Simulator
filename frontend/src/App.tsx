import { NavLink } from 'react-router-dom';
import { AppRouter } from './router';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: 'var(--space-2) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  color: isActive ? '#0b0d11' : 'var(--color-text-primary)',
  background: isActive ? 'var(--color-accent)' : 'transparent',
  textDecoration: 'none',
  fontWeight: 600,
});

function App() {
  return (
    <>
      <nav
        aria-label="Interview mode"
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <NavLink to="/coding" style={linkStyle}>
          Coding Round
        </NavLink>
        <NavLink to="/ml" style={linkStyle}>
          ML Round
        </NavLink>
      </nav>
      <AppRouter />
    </>
  );
}

export default App;
