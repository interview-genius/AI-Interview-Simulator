import { useLocation } from 'react-router-dom';
import { AppRouter } from './router';
import { SharedNavbar } from './components/shared/SharedNavbar';
import './styles/landing.css';

function App() {
  const location = useLocation();
  
  // Routes that handle their own navigation or are immersive views
  const hideGlobalNav = ['/', '/auth', '/onboarding', '/coding', '/ml'];
  const showNav = !hideGlobalNav.includes(location.pathname);

  return (
    <div className="fs-grain" style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100vh', overflowX: 'hidden', background: 'var(--color-bg)' }}>
      {showNav && <SharedNavbar variant="app" />}
      <AppRouter />
    </div>
  );
}

export default App;
