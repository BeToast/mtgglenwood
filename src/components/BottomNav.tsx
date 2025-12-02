import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link
        to="/"
        className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
      >
        <span className="nav-icon">🏡</span>
      </Link>
      <Link
        to="/schedule"
        className={`nav-button ${location.pathname === '/schedule' ? 'active' : ''}`}
      >
        <span className="nav-icon">📅</span>
      </Link>
      <Link
        to="/ladder"
        className={`nav-button ${location.pathname === '/ladder' ? 'active' : ''}`}
      >
        <span className="nav-icon">🪜</span>
      </Link>
      <Link
        to="/matches"
        className={`nav-button ${location.pathname === '/matches' ? 'active' : ''}`}
      >
        <span className="nav-icon">🎴</span>
      </Link>
      <Link
        to="/profile"
        className={`nav-button ${location.pathname === '/profile' ? 'active' : ''}`}
      >
        <span className="nav-icon">🪞</span>
      </Link>
    </nav>
  );
}

export default BottomNav;
