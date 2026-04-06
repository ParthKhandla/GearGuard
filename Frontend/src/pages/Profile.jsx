import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import '../styles/Layout.css';
import '../styles/Profile.css';

export const Profile = () => {
  const { user } = useAuth();

  const getRoleLabel = (role) => {
    const roleMap = {
      manager: 'Manager',
      technician: 'Technician',
      employee: 'Employee'
    };
    return roleMap[role] || role;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-section">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </div>
            </div>

            <div className="profile-info">
              <div className="profile-field">
                <label>Full Name</label>
                <p>{user?.fullName}</p>
              </div>

              <div className="profile-field">
                <label>Username</label>
                <p>{user?.username}</p>
              </div>

              <div className="profile-field">
                <label>Email</label>
                <p>{user?.email}</p>
              </div>

              <div className="profile-field">
                <label>Role</label>
                <p className="role-badge">{getRoleLabel(user?.role)}</p>
              </div>

              {user?.role === 'technician' && user?.specialization && (
                <div className="profile-field">
                  <label>Specialization</label>
                  <p>{user?.specialization}</p>
                </div>
              )}

              {user?.department && (
                <div className="profile-field">
                  <label>Department</label>
                  <p>{user?.department}</p>
                </div>
              )}
            </div>
          </div>

          <div className="profile-stats">
            <h3>Account Information</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Account Status</div>
                <div className="stat-value active">Active</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Member Since</div>
                <div className="stat-value">{formatDate(user?.createdAt)}</div>
                <div className="stat-time">{formatTime(user?.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
