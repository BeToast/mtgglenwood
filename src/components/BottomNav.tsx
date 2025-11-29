import { Link, useLocation } from 'react-router-dom';
import './BottomNav.css';

function BottomNav() {
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      <Link
        to="/ladder"
        className={`nav-button ${location.pathname === '/ladder' ? 'active' : ''}`}
      >
        <span className="nav-icon">🪜</span>
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
