import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Shield, User, Mail, Building, KeyRound, Power, Search, Eye, EyeOff } from 'lucide-react';
import Modal from '../components/Modal';

const UserManagement = () => {
  const { user: currentUser } = useContext(AuthContext);

  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals state
  const [isOpen, setIsOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // add | edit
  const [selectedUser, setSelectedUser] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('staff');
  const [status, setStatus] = useState('active');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load user accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormMode('add');
    setName('');
    setEmail('');
    setPassword('');
    setDepartment('');
    setRole('staff');
    setStatus('active');
    setShowPassword(false);
    setIsOpen(true);
  };

  const handleOpenEdit = (user) => {
    setFormMode('edit');
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(''); // leave blank unless changing
    setDepartment(user.department);
    setRole(user.role);
    setStatus(user.status);
    setShowPassword(false);
    setIsOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (formMode === 'add') {
        response = await api.post('/users', { name, email, password, role, department });
      } else {
        response = await api.put(`/users/${selectedUser._id}`, {
          name,
          email,
          role,
          department,
          status,
          password: password || undefined // only update if typed
        });
      }

      if (response.data.success) {
        setIsOpen(false);
        fetchUsers();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (userObj) => {
    if (userObj._id === currentUser.id) {
      alert('You cannot delete your own admin account.');
      return;
    }

    if (window.confirm(`Are you sure you want to permanently delete user account: ${userObj.name}?`)) {
      try {
        const response = await api.delete(`/users/${userObj._id}`);
        if (response.data.success) {
          fetchUsers();
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (userObj) => {
    if (userObj._id === currentUser.id) {
      alert('You cannot deactivate your own admin account.');
      return;
    }

    const nextStatus = userObj.status === 'active' ? 'inactive' : 'active';
    try {
      const response = await api.put(`/users/${userObj._id}`, {
        status: nextStatus
      });
      if (response.data.success) {
        fetchUsers();
      }
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button onClick={handleOpenAdd} className="btn btn-primary">
          <Plus size={18} /> Add New User
        </button>

        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search users by name, email..."
          />
        </div>
      </div>

      {/* Grid Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid var(--border-color)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Email Address</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--bg-tertiary)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.8125rem'
                        }}>
                          {item.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.875rem' }}>{item.name}</strong>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Created: {new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td>{item.email}</td>
                    <td>{item.department}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: item.role === 'admin' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: item.role === 'admin' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                      }}>
                        {item.role}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleStatus(item)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: item.status === 'active' ? 'var(--accent-success)' : 'var(--text-muted)'
                        }}
                        title={item._id === currentUser.id ? 'Self account' : `Toggle status to ${item.status === 'active' ? 'inactive' : 'active'}`}
                        disabled={item._id === currentUser.id}
                      >
                        <Power size={14} />
                        <span style={{ textTransform: 'capitalize' }}>{item.status}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', borderRadius: '8px' }}
                          title="Edit User properties"
                        >
                          <Edit2 size={14} />
                        </button>
                        
                        <button 
                          onClick={() => handleDelete(item)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--accent-danger)' }}
                          disabled={item._id === currentUser.id}
                          title="Delete User account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Add / Edit form */}
      <Modal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={formMode === 'add' ? 'Create Staff User Account' : 'Edit User Settings'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" style={{ paddingLeft: '2.25rem' }} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. staff@organization.com" style={{ paddingLeft: '2.25rem' }} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department / Branch</label>
              <div style={{ position: 'relative' }}>
                <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Logistics" style={{ paddingLeft: '2.25rem' }} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Security Role</label>
              <div style={{ position: 'relative' }}>
                <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)} style={{ paddingLeft: '2.25rem' }} required>
                  <option value="staff">Staff User (Read-Write CRUD)</option>
                  <option value="admin">Administrator (Full Access)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              {formMode === 'add' ? 'Password' : 'Password (Leave blank to keep current)'}
            </label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder={formMode === 'add' ? '••••••••' : 'Unchanged'} 
                style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                minLength={formMode === 'add' ? 6 : undefined}
                required={formMode === 'add'} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {formMode === 'edit' && (
            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)} disabled={selectedUser?._id === currentUser.id}>
                <option value="active">Active (Access Granted)</option>
                <option value="inactive">Inactive (Deactivated)</option>
              </select>
            </div>
          )}

          <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
            <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{formMode === 'add' ? 'Create User' : 'Save Settings'}</button>
          </div>
        </form>
      </Modal>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default UserManagement;
