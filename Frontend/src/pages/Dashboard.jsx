import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import APIService from '../services/apiService';
import '../styles/Layout.css';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMachines: 0,
    activeTasks: 0,
    teamMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch machines
      const machinesRes = await APIService.get('/machines');
      const machines = machinesRes.data?.machines || machinesRes.data || [];
      
      // Fetch tasks
      const tasksRes = await APIService.get('/tasks');
      const tasks = tasksRes.data?.tasks || tasksRes.data || [];
      const activeTasks = tasks.filter((t) => ['open', 'in_progress', 'pending_manager_approval'].includes(t.status));
      
      // Fetch users (team members)
      let teamMembers = 0;
      if (user?.role === 'manager') {
        try {
          const usersRes = await APIService.get('/users/manager/all-users');
          teamMembers = (usersRes.data?.users || usersRes.data || []).length;
        } catch (err) {
          console.error('Failed to fetch users');
        }
      }
      
      setStats({
        totalMachines: machines.length,
        activeTasks: activeTasks.length,
        teamMembers: teamMembers,
      });
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    ...(user?.role === 'manager'
      ? [
          {
            title: 'User Management',
            description: 'Register and manage team members',
            icon: '👥',
            onClick: () => navigate('/users'),
          },
          {
            title: 'Maintenance Schedule',
            description: 'View machines due for maintenance',
            icon: '🔧',
            onClick: () => navigate('/maintenance'),
          },
        ]
      : []),
    {
      title: 'Machines',
      description: 'View and manage machinery',
      icon: '🏭',
      onClick: () => navigate('/machines'),
    },
    {
      title: 'Tasks',
      description: 'Track maintenance tasks',
      icon: '📋',
      onClick: () => navigate('/tasks'),
    },
    {
      title: 'Profile',
      description: 'View your profile info',
      icon: '👤',
      onClick: () => navigate('/profile'),
    },
  ];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="welcome-section">
          <h1>Welcome back, {user?.fullName}! 👋</h1>
          <p>You are logged in as <strong>{user?.role}</strong></p>
        </div>

        <div className="dashboard-grid">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className="dashboard-card"
              onClick={item.onClick}
            >
              <div className="card-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <button className="card-button">Go →</button>
            </div>
          ))}
        </div>

        <div className="info-section">
          <h2>Quick Info</h2>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-number">{loading ? '-' : stats.totalMachines}</div>
              <div className="info-label">Total Machines</div>
            </div>
            <div className="info-card">
              <div className="info-number">{loading ? '-' : stats.activeTasks}</div>
              <div className="info-label">Active Tasks</div>
            </div>
            {user?.role === 'manager' && (
              <div className="info-card">
                <div className="info-number">{loading ? '-' : stats.teamMembers}</div>
                <div className="info-label">Team Members</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
