import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import APIService from '../services/apiService';
import '../styles/Tasks.css';

export const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [machines, setMachines] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [availableTechnicians, setAvailableTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [assigningTask, setAssigningTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [reviewingTask, setReviewingTask] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState(user?.role === 'technician' ? 'in_progress' : 'open');
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [showTechnicianSelect, setShowTechnicianSelect] = useState(false);
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineSearchFilter, setMachineSearchFilter] = useState('');
  const [machineDepartmentFilter, setMachineDepartmentFilter] = useState('all');
  const [formData, setFormData] = useState({
    machineId: '',
    title: '',
    description: '',
    severity: 'moderate',
    assignedTo: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchMachines();
    if (user?.role === 'manager') {
      fetchTechnicians();
    }
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await APIService.get('/tasks');
      setTasks(response.data?.tasks || response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await APIService.get('/machines');
      setMachines(response.data?.machines || response.data || []);
    } catch (err) {
      console.error('Failed to fetch machines', err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await APIService.get('/users/manager/technicians/available');
      setTechnicians(response.data?.technicians || response.data || []);
    } catch (err) {
      console.error('Failed to fetch technicians', err);
    }
  };

  const fetchAvailableTechnicians = async () => {
    try {
      const response = await APIService.get('/users/manager/technicians/available');
      setAvailableTechnicians(response.data?.technicians || response.data || []);
    } catch (err) {
      console.error('Failed to fetch available technicians', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (!formData.machineId) {
        throw new Error('Please select a machine');
      }
      if (!formData.title || formData.title.trim() === '') {
        throw new Error('Please enter a task title');
      }
      if (!formData.description || formData.description.trim() === '') {
        throw new Error('Please enter a task description');
      }
      
      await APIService.post('/tasks', {
        machineId: formData.machineId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity
      });
      alert('Task reported successfully!');
      resetForm();
      await fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to report task');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      machineId: '',
      title: '',
      description: '',
      severity: 'moderate',
      assignedTo: ''
    });
    setSelectedMachine(null);
    setMachineSearchFilter('');
    setMachineDepartmentFilter('all');
    setShowForm(false);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
    fetchAvailableTechnicians();
  };

  const handleTechnicianClick = (technicianId) => {
    setSelectedTechnician(selectedTechnician === technicianId ? null : technicianId);
  };

  const handleConfirmAssign = async () => {
    if (!selectedTechnician) {
      setError('No technician selected');
      return;
    }
    setAssigningTask(selectedTask?.id);
    console.log('Assigning task:', selectedTask?.id, 'to technician:', selectedTechnician);
    if (!selectedTask) {
      setError('No task selected');
      setAssigningTask(null);
      return;
    }
    try {
      const response = await APIService.patch(`/tasks/${selectedTask.id}/assign`, {
        assignedTo: selectedTechnician
      });
      console.log('Assignment response:', response);
      alert('Task assigned to technician!');
      await fetchTasks();
      setShowTaskDetails(false);
      setShowTechnicianSelect(false);
      setSelectedTask(null);
      setSelectedTechnician(null);
    } catch (err) {
      console.error('Assignment error:', err);
      setError(err.message || 'Failed to assign task');
    } finally {
      setAssigningTask(null);
    }
  };

  const getFilteredTechnicians = () => {
    if (!specializationFilter) return availableTechnicians;
    return availableTechnicians.filter(tech =>
      tech.specialization?.toLowerCase() === specializationFilter.toLowerCase()
    );
  };

  const getUniqueSpecializations = () => {
    const specs = new Set(availableTechnicians.map(tech => tech.specialization).filter(Boolean));
    return Array.from(specs).sort();
  };

  const getUniqueDepartments = () => {
    const depts = new Set(machines.map(m => m.department).filter(Boolean));
    return Array.from(depts).sort();
  };

  const getFilteredMachines = () => {
    let filtered = machines;
    
    if (machineDepartmentFilter !== 'all') {
      filtered = filtered.filter(m => m.department === machineDepartmentFilter);
    }
    
    if (machineSearchFilter.trim()) {
      const search = machineSearchFilter.toLowerCase();
      filtered = filtered.filter(m => 
        m.name.toLowerCase().includes(search) || 
        m.machineId.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  };

  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
    setFormData({ ...formData, machineId: machine.id });
    setShowMachineModal(false);
    setMachineSearchFilter('');
    setMachineDepartmentFilter('all');
  };

  const handleMarkAsDone = async (taskId) => {
    setCompletingTask(taskId);
    try {
      await APIService.put(`/tasks/${taskId}`, {
        status: 'pending_manager_approval'
      });
      alert('Task submitted for manager approval!');
      await fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to update task');
    } finally {
      setCompletingTask(null);
    }
  };

  const handleApproveTask = async (taskId) => {
    setReviewingTask(taskId);
    try {
      await APIService.patch(`/tasks/${taskId}/review`, {
        decision: 'approve'
      });
      alert('Task approved and marked as resolved!');
      await fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to approve task');
    } finally {
      setReviewingTask(null);
    }
  };

  const handleRejectTask = async (taskId) => {
    setReviewingTask(taskId);
    try {
      await APIService.patch(`/tasks/${taskId}/review`, {
        decision: 'reject'
      });
      alert('Task rejected and moved back to in progress!');
      await fetchTasks();
    } catch (err) {
      setError(err.message || 'Failed to reject task');
    } finally {
      setReviewingTask(null);
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // For technicians: only show their own tasks for pending approval and resolved
    if (user?.role === 'technician') {
      filtered = filtered.filter(task => {
        // Show "In Progress" tasks - only their assigned tasks
        if (task.status === 'in_progress') {
          return task.assignee?.id === user.id;
        }
        // Show "Pending Approval" tasks - only their assigned tasks pending approval
        if (task.status === 'pending_manager_approval') {
          return task.assignee?.id === user.id;
        }
        // Show "Resolved" tasks - only their completed tasks
        if (task.status === 'resolved') {
          return task.assignee?.id === user.id;
        }
        return true; // Don't filter other statuses
      });
    }

    return filtered;
  };

  const getUnassignedTasks = () => {
    return tasks.filter(task => !task.assignee && task.status !== 'resolved');
  };

  const getTasksBySeverity = (severity) => {
    return getUnassignedTasks().filter(task => task.severity === severity);
  };

  const getSeverityColor = (severity) => {
    if (severity === 'critical') return '#d32f2f';
    if (severity === 'moderate') return '#ff9800';
    return '#fbc02d'; // low/warning
  };

  const getStatusColor = (status) => {
    if (status === 'open') return '#d32f2f';
    if (status === 'in_progress') return '#2196f3';
    if (status === 'pending_manager_approval') return '#9c27b0';
    return '#4caf50';
  };

  const getSeverityLabel = (severity) => {
    return severity.charAt(0).toUpperCase() + severity.slice(1);
  };

  return (
    <>
      <Navbar />
      <div className={`tasks-container ${showForm || showUnassigned || showTaskDetails ? 'blur-bg' : ''}`}>
        <div className="tasks-header">
          <h1>📋 Task Management</h1>
          <div className="header-buttons">
            {user?.role !== 'manager' && (
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary"
              >
                + Report Task
              </button>
            )}
            {user?.role === 'manager' && (
              <button
                onClick={() => setShowUnassigned(true)}
                className="btn btn-primary"
              >
                + View Unassigned Tasks
              </button>
            )}
          </div>
        </div>

        <div className="tasks-main-layout">
          {/* Left Sidebar - Tabs */}
          <aside className="tasks-sidebar">
            <div className="sidebar-tabs">
              {user?.role === 'manager' && (
                <button
                  className={`sidebar-tab ${statusFilter === 'open' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('open')}
                >
                  <span className="tab-icon">🔴</span>
                  <span className="tab-label">Open</span>
                </button>
              )}
              <button
                className={`sidebar-tab ${statusFilter === 'in_progress' ? 'active' : ''}`}
                onClick={() => setStatusFilter('in_progress')}
              >
                <span className="tab-icon">🔵</span>
                <span className="tab-label">In Progress</span>
              </button>
              <button
                className={`sidebar-tab ${statusFilter === 'pending_manager_approval' ? 'active' : ''}`}
                onClick={() => setStatusFilter('pending_manager_approval')}
              >
                <span className="tab-icon">🟣</span>
                <span className="tab-label">Pending Approval</span>
              </button>
              <button
                className={`sidebar-tab ${statusFilter === 'resolved' ? 'active' : ''}`}
                onClick={() => setStatusFilter('resolved')}
              >
                <span className="tab-icon">✅</span>
                <span className="tab-label">Resolved</span>
              </button>
            </div>
          </aside>

          {/* Right Content - Tasks List */}
          <main className="tasks-content">
            {error && <div className="error-message">{error}</div>}

            {loading && <div className="loading">⏳ Loading tasks...</div>}

            {getFilteredTasks().length === 0 && !loading ? (
              <div className="empty-state">
                <p>📭 No tasks found in this category</p>
              </div>
            ) : (
              <div className="tasks-list">
                {getFilteredTasks().map((task) => (
                  <div key={task.id} className="task-card">
                <div className="task-header">
                  <div className="task-title">
                    <h3>{task.title}</h3>
                    <p className="machine-ref">
                      Machine: {task.machine?.name || 'Unknown'} (ID: {task.machine?.machineId || 'N/A'})
                    </p>
                    {task.machine?.department && (
                      <p className="machine-dept">Department: {task.machine.department}</p>
                    )}
                  </div>
                  <div className="task-badges">
                    <span
                      className="badge severity"
                      style={{ color: getSeverityColor(task.severity) }}
                    >
                      {task.severity}
                    </span>
                  </div>
                </div>

                <div className="task-description">
                  {task.description?.split('\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>

                <div className="task-meta">
                  <div className="meta-item">
                    <span className="label">Reported by:</span>
                    <span className="value">{task.reporter?.fullName || 'Unknown'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Assigned to:</span>
                    <span className="value">
                      {task.assignee?.fullName || 'Unassigned'}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="label">Created:</span>
                    <span className="value">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="task-actions">
                  {/* Technician: Mark as Done on in_progress tasks */}
                  {user?.role === 'technician' && task.status === 'in_progress' && (
                    <button
                      onClick={() => handleMarkAsDone(task.id)}
                      disabled={completingTask === task.id}
                      className="btn btn-primary"
                    >
                      {completingTask === task.id ? '⏳ Submitting...' : '✓ Mark as Done'}
                    </button>
                  )}

                  {/* Manager: Approve/Reject pending approval tasks */}
                  {user?.role === 'manager' && task.status === 'pending_manager_approval' && (
                    <div className="approval-buttons">
                      <button
                        onClick={() => handleApproveTask(task.id)}
                        disabled={reviewingTask === task.id}
                        className="btn btn-approve"
                      >
                        {reviewingTask === task.id ? '⏳ Approving...' : '✓ Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectTask(task.id)}
                        disabled={reviewingTask === task.id}
                        className="btn btn-reject"
                      >
                        {reviewingTask === task.id ? '⏳ Rejecting...' : '✕ Reject'}
                      </button>
                    </div>
                  )}
                </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowForm(false)}
            >
              ✕
            </button>
            <h2>Report New Task</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Machine <span className="required">*</span></label>
                  <button
                    type="button"
                    onClick={() => setShowMachineModal(true)}
                    className={`machine-select-btn ${!selectedMachine ? 'not-selected' : ''}`}
                  >
                    {selectedMachine 
                      ? `${selectedMachine.name} (${selectedMachine.machineId})` 
                      : 'Select a machine'}
                  </button>
                </div>
                <div className="form-group">
                  <label>Severity</label>
                  <select name="severity" value={formData.severity} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="moderate">Moderate</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Title <span className="required">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Hydraulic leak detected"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description <span className="required">*</span></label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the issue in detail..."
                  rows={4}
                  required
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? '⏳ Reporting...' : '✓ Report Task'}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUnassigned && (
        <div className="modal-overlay" onClick={() => setShowUnassigned(false)}>
          <div className="kanban-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowUnassigned(false)}
            >
              ✕
            </button>
            <h2>Assign Tasks to Technicians</h2>
            {error && <div className="error-message">{error}</div>}

            <div className="kanban-board">
              {['critical', 'moderate', 'low'].map((severity) => (
                <div key={severity} className="kanban-column">
                  <div className="column-header">
                    <h3>
                      <span
                        className="severity-dot"
                        style={{ backgroundColor: getSeverityColor(severity) }}
                      ></span>
                      {getSeverityLabel(severity)}
                    </h3>
                    <span className="task-count">
                      {getTasksBySeverity(severity).length}
                    </span>
                  </div>

                  <div className="tasks-column">
                    {getTasksBySeverity(severity).length === 0 ? (
                      <div className="no-tasks">No tasks</div>
                    ) : (
                      getTasksBySeverity(severity).map((task) => (
                        <div
                          key={task.id}
                          className="task-card"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className="task-header">
                            <h4>{task.title}</h4>
                          </div>
                          <div className="task-description">
                            {task.description?.split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                          <div className="task-footer">
                            <small>Machine: {task.machine?.name || 'N/A'}</small>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showTaskDetails && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowTaskDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowTaskDetails(false)}
            >
              ✕
            </button>
            <h2>Task Details</h2>

            {!showTechnicianSelect ? (
              <>
                <div className="details-content">
                  <div className="detail-row">
                    <span className="label">Title:</span>
                    <span className="value">{selectedTask.title}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Description:</span>
                    <span className="value">
                      {selectedTask.description?.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Machine:</span>
                    <span className="value">{selectedTask.machine?.name || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Machine ID:</span>
                    <span className="value">{selectedTask.machine?.machineId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Department:</span>
                    <span className="value">{selectedTask.machine?.department || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Severity:</span>
                    <span
                      className="value severity-badge"
                      style={{ color: getSeverityColor(selectedTask.severity) }}
                    >
                      {selectedTask.severity}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Reported by:</span>
                    <span className="value">{selectedTask.reporter?.fullName || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Created:</span>
                    <span className="value">
                      {new Date(selectedTask.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="modal-buttons">
                  <button
                    onClick={() => setShowTechnicianSelect(true)}
                    disabled={assigningTask === selectedTask?.id}
                    className="btn btn-primary"
                  >
                    {assigningTask === selectedTask?.id ? '⏳ Assigning...' : '👤 Assign Technician'}
                  </button>
                  <button
                    onClick={() => setShowTaskDetails(false)}
                    disabled={assigningTask === selectedTask?.id}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="technician-list">
                  <h3>Available Technicians</h3>

                  {/* Specialization Filter */}
                  {getUniqueSpecializations().length > 0 && (
                    <div className="specialization-filter">
                      <button
                        className={`spec-btn ${specializationFilter === '' ? 'active' : ''}`}
                        onClick={() => setSpecializationFilter('')}
                      >
                        All
                      </button>
                      {getUniqueSpecializations().map((spec) => (
                        <button
                          key={spec}
                          className={`spec-btn ${specializationFilter === spec ? 'active' : ''}`}
                          onClick={() => setSpecializationFilter(spec)}
                        >
                          {spec}
                        </button>
                      ))}
                    </div>
                  )}

                  {getFilteredTechnicians().length === 0 ? (
                    <p className="no-technicians">No technicians with this specialization</p>
                  ) : (
                    <div className="technician-options">
                      {getFilteredTechnicians().map((tech) => (
                        <button
                          key={tech.id}
                          className={`technician-btn ${selectedTechnician === tech.id ? 'selected' : ''}`}
                          disabled={assigningTask === selectedTask?.id}
                          onClick={() => handleTechnicianClick(tech.id)}
                        >
                          <div className="tech-info">
                            <h4>{tech.fullName}</h4>
                            <p>{tech.specialization || 'General'}</p>
                          </div>
                          <span className="assign-arrow">
                            {selectedTechnician === tech.id ? '✓' : '→'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="modal-buttons">
                  <button
                    onClick={() => handleConfirmAssign()}
                    disabled={!selectedTechnician || assigningTask === selectedTask?.id}
                    className="btn btn-primary"
                  >
                    {assigningTask === selectedTask?.id ? '⏳ Assigning...' : '✓ Select'}
                  </button>
                  <button
                    onClick={() => {
                      setShowTechnicianSelect(false);
                      setSelectedTechnician(null);
                      setSpecializationFilter('');
                    }}
                    disabled={assigningTask === selectedTask?.id}
                    className="btn btn-secondary"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showMachineModal && (
        <div className="modal-overlay" onClick={() => setShowMachineModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowMachineModal(false)}
            >
              ×
            </button>
            <h2>Select Machine</h2>

            <div className="machine-filters">
              <div className="filter-group">
                <label>Search by Name or ID</label>
                <input
                  type="text"
                  placeholder="Search machine name or ID..."
                  value={machineSearchFilter}
                  onChange={(e) => setMachineSearchFilter(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="filter-group">
                <label>Filter by Department</label>
                <select
                  value={machineDepartmentFilter}
                  onChange={(e) => setMachineDepartmentFilter(e.target.value)}
                  className="department-select"
                >
                  <option value="all">All Departments</option>
                  {getUniqueDepartments().map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="machines-list">
              {getFilteredMachines().length === 0 ? (
                <p className="no-machines">No machines found</p>
              ) : (
                getFilteredMachines().map((machine) => (
                  <button
                    key={machine.id}
                    type="button"
                    className="machine-option"
                    onClick={() => handleSelectMachine(machine)}
                  >
                    <div className="machine-info">
                      <h4>{machine.name}</h4>
                      <p className="machine-id">ID: {machine.machineId}</p>
                      {machine.department && (
                        <p className="machine-dept">Department: {machine.department}</p>
                      )}
                    </div>
                    <span className="select-arrow">→</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
