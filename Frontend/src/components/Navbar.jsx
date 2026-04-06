import { useAuth } from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="navbar-logo">⚙️</span>
          <h1>GearGuard</h1>
        </div>

        <div className="navbar-menu">
          <a
            href="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </a>
          {user?.role === 'manager' && (
            <a
              href="/users"
              className={`nav-link ${isActive('/users') ? 'active' : ''}`}
            >
              Users
            </a>
          )}
          {user?.role === 'manager' && (
            <a
              href="/maintenance"
              className={`nav-link ${isActive('/maintenance') ? 'active' : ''}`}
            >
              Maintenance
            </a>
          )}
          <a
            href="/machines"
            className={`nav-link ${isActive('/machines') ? 'active' : ''}`}
          >
            Machines
          </a>
          <a
            href="/tasks"
            className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}
          >
            Tasks
          </a>
        </div>

        <div className="navbar-user">
          <button 
            className="profile-btn"
            onClick={() => navigate('/profile')}
            title="View your profile"
          >
            <span className="user-role">{user?.role}</span>
            <span className="user-name">{user?.fullName}</span>
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
