import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import APIService from '../services/apiService';
import '../styles/Layout.css';

export const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    employeeId: '',
    specialization: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await APIService.get('/users/manager/all-users');
      setUsers(response.data?.users || response.data || []);
    } catch (err) {
      setError('Failed to fetch users');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await APIService.post('/users/manager/create-user', formData);
      alert('User registered successfully!');
      setFormData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        employeeId: '',
        specialization: '',
      });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.message || 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (user?.id === userId) {
      alert('You cannot delete your own account!');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        await APIService.delete(`/users/manager/delete-user?username=${encodeURIComponent(username)}`);
        alert('User deleted successfully!');
        fetchUsers();
      } catch (err) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  const handleViewProfile = (userData) => {
    setSelectedUser(userData);
    setShowProfile(true);
  };

  if (user?.role !== 'manager') {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error-box">
            ❌ Access Denied! Only managers can manage users.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={`container ${showForm ? 'blur-bg' : ''}`}>
        <div className="page-header">
          <h1>User Management</h1>
          <div className="header-actions">
            <select
              className="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="technician">Technician</option>
              <option value="manager">Manager</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              + Add New User
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((u) => roleFilter === 'all' || u.role === roleFilter)
                .map((u) => (
                  <tr key={u.id} onClick={() => handleViewProfile(u)} style={{ cursor: 'pointer' }}>
                    <td><span style={{ color: '#667eea', fontWeight: 600 }}>{u.fullName}</span></td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="btn-delete"
                        title="Delete user"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowForm(false)}
            >
              ×
            </button>
            <h2>Register New User</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Username <span className="required">*</span></label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Role <span className="required">*</span></label>
                  <select name="role" value={formData.role} onChange={handleChange}>
                    <option value="employee">Employee</option>
                    <option value="technician">Technician</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              {(formData.role === 'technician' || formData.role === 'employee') && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Department <span className="required">*</span></label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    >
                      <option value="">Select Department</option>
                      <option value="DEP-1">DEP-1</option>
                      <option value="DEP-2">DEP-2</option>
                      <option value="DEP-3">DEP-3</option>
                      <option value="DEP-4">DEP-4</option>
                      <option value="DEP-5">DEP-5</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      placeholder="e.g., EMP001"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Specialization</label>
                <select 
                  name="specialization" 
                  value={formData.specialization} 
                  onChange={handleChange}
                >
                  <option value="">Select Specialization (Optional)</option>
                  <option value="general">General</option>
                  <option value="electronics">Electronics</option>
                  <option value="electrical">Electrical</option>
                  <option value="mechanical">Mechanical</option>
                  <option value="IT">IT</option>
                  <option value="civil">Civil</option>
                </select>
              </div>

              <div className="form-group">
                <label>Password <span className="required">*</span></label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                >
                  {loading ? 'Registering...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProfile && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowProfile(false)}
            >
              ×
            </button>
            <h2>User Profile</h2>
            
            <div className="profile-content">
              <div className="profile-header">
                <div className="profile-avatar">
                  <span className="avatar-text">{selectedUser.fullName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="profile-title-info">
                  <h3>{selectedUser.fullName}</h3>
                  <span className={`badge badge-${selectedUser.role}`}>{selectedUser.role}</span>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-section">
                  <h4>Account Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{selectedUser.username}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">
                      <span className={`status-badge ${selectedUser.isActive ? 'active' : 'inactive'}`}>
                        {selectedUser.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Work Information</h4>
                  <div className="detail-row">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{selectedUser.department || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Employee ID:</span>
                    <span className="detail-value">{selectedUser.employeeId || 'N/A'}</span>
                  </div>
                  {selectedUser.specialization && (
                    <div className="detail-row">
                      <span className="detail-label">Specialization:</span>
                      <span className="detail-value">{selectedUser.specialization}</span>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h4>Account Created</h4>
                  <div className="detail-row">
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">
                      {new Date(selectedUser.createdAt).toLocaleDateString()} {new Date(selectedUser.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
