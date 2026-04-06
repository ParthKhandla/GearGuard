import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import APIService from '../services/apiService';
import '../styles/Layout.css';

export const Maintenance = () => {
  const { user } = useAuth();
  const [overdueMachines, setOverdueMachines] = useState([]);
  const [upcomingMachines, setUpcomingMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [daysFilter, setDaysFilter] = useState(7);
  const [technicians, setTechnicians] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === 'manager') {
      fetchMachinesDue();
      fetchTechnicians();
    }
  }, [user, daysFilter]);

  const fetchMachinesDue = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await APIService.get(`/machines/due-for-maintenance?days=${daysFilter}`);
      setOverdueMachines(response.data?.overdue || []);
      setUpcomingMachines(response.data?.upcoming || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch machines due for maintenance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await APIService.get('/users/manager/technicians/available-general');
      setTechnicians(response.data?.technicians || response.data || []);
    } catch (err) {
      console.error('Failed to fetch technicians', err);
    }
  };

  const handleAssignTask = (machine, isOverdue = false) => {
    setSelectedMachine({ ...machine, isOverdue });
    setSelectedTechnician('');
    setShowTaskModal(true);
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    
    if (!selectedTechnician) {
      alert('Please select a technician');
      return;
    }

    setTaskSubmitting(true);
    try {
      const taskData = {
        machineId: selectedMachine.id,
        title: `Periodic Maintenance: ${selectedMachine.name}`,
        description: `Perform scheduled maintenance on ${selectedMachine.name} (ID: ${selectedMachine.machineId}).\nLast maintenance: ${new Date(selectedMachine.lastMaintenanceDate).toLocaleDateString()}.\nMaintenance interval: ${selectedMachine.maintenanceIntervalDays} days.`,
        severity: selectedMachine.isOverdue ? 'critical' : 'moderate',
      };

      // Create the task first
      const taskResponse = await APIService.post('/tasks', taskData);
      const taskId = taskResponse.data?.task?.id || taskResponse.data?.id;

      if (taskId) {
        // Then assign it to the technician
        await APIService.patch(`/tasks/${taskId}/assign`, {
          assignedTo: parseInt(selectedTechnician),
        });
      }
      
      alert('Maintenance task assigned successfully!');
      setShowTaskModal(false);
      setSelectedMachine(null);
      setSelectedTechnician('');
    } catch (err) {
      alert(err.message || 'Failed to assign task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  if (user?.role !== 'manager') {
    return (
      <>
        <Navbar />
        <div className="container">
          <div className="error-box">
            ❌ Access Denied! Only managers can view maintenance schedules.
          </div>
        </div>
      </>
    );
  }

  const renderMachineTable = (machines, title, isOverdue = false) => (
    <div className="maintenance-section">
      <h2 style={{ color: isOverdue ? '#d32f2f' : '#2196f3' }}>
        {isOverdue ? '⚠️ ' : '📅 '}
        {title} ({machines.length})
      </h2>
      {machines.length === 0 ? (
        <p className="empty-message">No machines in this category</p>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Machine ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Department</th>
                <th>Last Maintenance</th>
                <th>Due Date</th>
                <th>Interval (Days)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id}>
                  <td>{machine.machineId}</td>
                  <td><strong>{machine.name}</strong></td>
                  <td>{machine.category}</td>
                  <td>{machine.department}</td>
                  <td>
                    {machine.lastMaintenanceDate
                      ? new Date(machine.lastMaintenanceDate).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td style={{ color: isOverdue ? '#d32f2f' : '#2196f3', fontWeight: 'bold' }}>
                    {machine.nextMaintenanceDate
                      ? new Date(machine.nextMaintenanceDate).toLocaleDateString()
                      : 'Not set'}
                  </td>
                  <td>{machine.maintenanceIntervalDays}</td>
                  <td>
                    <button
                      className="btn-assign"
                      onClick={() => handleAssignTask(machine, isOverdue)}
                      title="Assign maintenance task to technician"
                    >
                      Assign Task
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1>🔧 Periodic Maintenance Schedule</h1>
          <div className="header-actions">
            <select
              className="role-filter"
              value={daysFilter}
              onChange={(e) => setDaysFilter(parseInt(e.target.value))}
            >
              <option value={7}>Next 7 Days</option>
              <option value={14}>Next 14 Days</option>
              <option value={30}>Next 30 Days</option>
              <option value={90}>Next 90 Days</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading maintenance schedule...</div>
        ) : (
          <>
            {overdueMachines.length > 0 && renderMachineTable(overdueMachines, 'Overdue for Maintenance', true)}
            {renderMachineTable(upcomingMachines, 'Upcoming Maintenance Due', false)}

            {overdueMachines.length === 0 && upcomingMachines.length === 0 && (
              <div className="empty-state">
                <p>✅ No machines due for maintenance in the selected period</p>
              </div>
            )}
          </>
        )}

        <div className="maintenance-info">
          <h3>ℹ️ How to Use</h3>
          <ul>
            <li>Red machines are <strong>overdue</strong> for maintenance - assign tasks immediately</li>
            <li>Blue machines are <strong>upcoming</strong> - schedule maintenance tasks in advance</li>
            <li>Click <strong>"Assign Task"</strong> to create a maintenance task for a technician</li>
            <li>Select a technician and the task will be created with appropriate priority</li>
          </ul>
        </div>
      </div>

      {showTaskModal && selectedMachine && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowTaskModal(false)}
            >
              ×
            </button>
            <h2>Assign Maintenance Task</h2>
            
            <div className="details-content">
              <div className="detail-row">
                <span className="label">Machine:</span>
                <span className="value">{selectedMachine.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Machine ID:</span>
                <span className="value">{selectedMachine.machineId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Department:</span>
                <span className="value">{selectedMachine.department}</span>
              </div>
              <div className="detail-row">
                <span className="label">Priority:</span>
                <span className="value" style={{ color: selectedMachine.isOverdue ? '#d32f2f' : '#ff9800' }}>
                  {selectedMachine.isOverdue ? 'CRITICAL (Overdue)' : 'MODERATE (Upcoming)'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitTask}>
              <div className="form-group">
                <label>Assign to Technician <span className="required">*</span></label>
                <select 
                  value={selectedTechnician} 
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  required
                  className="form-control"
                >
                  <option value="">-- Select Technician --</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.fullName} ({tech.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSubmitting}
                  className="btn btn-primary"
                >
                  {taskSubmitting ? 'Assigning...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }

        .modal-close:hover {
          color: #333;
        }

        .modal-content h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
        }

        .details-content {
          margin: 20px 0;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .detail-row .label {
          color: #666;
          font-weight: 600;
        }

        .detail-row .value {
          color: #333;
          font-weight: 500;
        }

        .form-group {
          margin: 16px 0;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          font-size: 14px;
          font-family: inherit;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .modal-buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #5568d3;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .btn-secondary:hover {
          background: #d0d0d0;
        }

        .btn-assign {
          padding: 6px 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-assign:hover {
          background: #5568d3;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .maintenance-section {
          margin-bottom: 40px;
        }

        .maintenance-section h2 {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }

        .empty-message {
          color: #999;
          font-size: 16px;
          padding: 20px;
          text-align: center;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .maintenance-info {
          margin-top: 40px;
          padding: 24px;
          background: #f0f7ff;
          border-left: 4px solid #2196f3;
          border-radius: 8px;
        }

        .maintenance-info h3 {
          color: #2196f3;
          margin-top: 0;
        }

        .maintenance-info ul {
          margin: 16px 0 0 0;
          padding-left: 24px;
        }

        .maintenance-info li {
          margin: 8px 0;
          color: #333;
        }
      `}</style>
    </>
  );
};
