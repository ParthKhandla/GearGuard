import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navbar } from '../components/Navbar';
import APIService from '../services/apiService';
import '../styles/Machines.css';

export const Machines = () => {
  const { user } = useAuth();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    machineId: '',
    name: '',
    category: '',
    department: '',
    maintenanceIntervalDays: '',
    lastMaintenanceDate: '',
  });

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await APIService.get('/machines');
      const machinesData = response.data?.machines || response.data || [];
      setMachines(machinesData);
      
      // Extract unique categories and departments
      const uniqueCategories = [...new Set(machinesData.map(m => m.category))];
      const uniqueDepartments = [...new Set(machinesData.map(m => m.department))];
      setCategories(uniqueCategories);
      setDepartments(uniqueDepartments);
    } catch (err) {
      setError(err.message || 'Failed to fetch machines');
    } finally {
      setLoading(false);
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
    setError('');
    setLoading(true);

    try {
      if (editingId) {
        await APIService.put(`/machines/${editingId}`, formData);
        alert('Machine updated!');
      } else {
        await APIService.post('/machines', formData);
        alert('Machine created!');
      }
      resetForm();
      fetchMachines();
      setShowDetails(false);
      setSelectedMachine(null);
    } catch (err) {
      setError(err.message || 'Failed to save machine');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (machine) => {
    setFormData({
      machineId: machine.machineId,
      name: machine.name,
      category: machine.category,
      department: machine.department,
      maintenanceIntervalDays: machine.maintenanceIntervalDays,
      lastMaintenanceDate: machine.lastMaintenanceDate
        ? machine.lastMaintenanceDate.split('T')[0]
        : '',
    });
    setEditingId(machine.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await APIService.delete(`/machines/${id}`);
        alert('Machine deleted!');
        fetchMachines();
        setShowDetails(false);
        setSelectedMachine(null);
      } catch (err) {
        setError(err.message || 'Failed to delete machine');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      machineId: '',
      name: '',
      category: '',
      department: '',
      maintenanceIntervalDays: '',
      lastMaintenanceDate: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getMaintenanceStatus = (machine) => {
    if (!machine.nextMaintenanceDate) return 'ℹ️ Not scheduled';
    
    const nextDate = new Date(machine.nextMaintenanceDate);
    const today = new Date();
    const daysUntil = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return '🔴 Overdue';
    if (daysUntil <= 7) return '🟡 Due soon';
    return '🟢 On track';
  };

  const filteredMachines = machines.filter((m) =>
    (searchTerm === '' || 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.machineId.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (categoryFilter === 'all' || m.category === categoryFilter) &&
    (departmentFilter === 'all' || m.department === departmentFilter)
  );

  return (
    <>
      <Navbar />
      <div className={`container ${showForm || showDetails ? 'blur-bg' : ''}`}>
        <div className="page-header">
          <h1>🏭 Machine Management</h1>
          {user?.role === 'manager' && (
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="btn btn-primary"
            >
              + Add Machine
            </button>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="filters-section">
          <input
            type="text"
            placeholder="Search by name or machine ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="loading">Loading machines...</div>}

        {!loading && filteredMachines.length === 0 ? (
          <div className="placeholder">
            <p>📭 No machines found.</p>
          </div>
        ) : (
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Machine ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Maintenance Interval</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMachines.map((machine) => (
                  <tr
                    key={machine.id}
                    onClick={() => {
                      setSelectedMachine(machine);
                      setShowDetails(true);
                    }}
                    className="clickable-row"
                  >
                    <td>{machine.machineId}</td>
                    <td>{machine.name}</td>
                    <td>{machine.category}</td>
                    <td>{machine.department}</td>
                    <td>{machine.maintenanceIntervalDays} days</td>
                    <td>{getMaintenanceStatus(machine)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => resetForm()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => resetForm()}>
              ✕
            </button>
            <h2>{editingId ? 'Edit Machine' : 'Add New Machine'}</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Machine ID <span className="required">*</span></label>
                  <input
                    type="text"
                    name="machineId"
                    value={formData.machineId}
                    onChange={handleChange}
                    placeholder="e.g., MACH001"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Machine Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., CNC Machine"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category <span className="required">*</span></label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g., Heavy Industrial"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Department <span className="required">*</span></label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="DEP-1">DEP-1</option>
                    <option value="DEP-2">DEP-2</option>
                    <option value="DEP-3">DEP-3</option>
                    <option value="DEP-4">DEP-4</option>
                    <option value="DEP-5">DEP-5</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Maintenance Interval (Days) <span className="required">*</span></label>
                  <input
                    type="number"
                    name="maintenanceIntervalDays"
                    value={formData.maintenanceIntervalDays}
                    onChange={handleChange}
                    placeholder="e.g., 30"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Maintenance Date</label>
                  <input
                    type="date"
                    name="lastMaintenanceDate"
                    value={formData.lastMaintenanceDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? 'Saving...' : editingId ? 'Update Machine' : 'Create Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedMachine && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowDetails(false)}>
              ✕
            </button>
            <h2>Machine Details</h2>
            <div className="details-content">
              <div className="detail-row">
                <span className="label">Machine ID:</span>
                <span className="value">{selectedMachine.machineId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Name:</span>
                <span className="value">{selectedMachine.name}</span>
              </div>
              <div className="detail-row">
                <span className="label">Category:</span>
                <span className="value">{selectedMachine.category}</span>
              </div>
              <div className="detail-row">
                <span className="label">Department:</span>
                <span className="value">{selectedMachine.department}</span>
              </div>
              <div className="detail-row">
                <span className="label">Maintenance Interval:</span>
                <span className="value">{selectedMachine.maintenanceIntervalDays} days</span>
              </div>
              <div className="detail-row">
                <span className="label">Status:</span>
                <span className="value">{getMaintenanceStatus(selectedMachine)}</span>
              </div>
              {selectedMachine.nextMaintenanceDate && (
                <div className="detail-row">
                  <span className="label">Next Maintenance:</span>
                  <span className="value">
                    {new Date(selectedMachine.nextMaintenanceDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            {user?.role === 'manager' && (
              <div className="modal-buttons">
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedMachine);
                  }}
                  className="btn btn-primary"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(selectedMachine.id)}
                  className="btn btn-delete"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
