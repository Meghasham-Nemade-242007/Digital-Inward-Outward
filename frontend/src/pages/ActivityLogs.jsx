import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { History, Search, Calendar, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';

const ActivityLogs = () => {
  // Lists & Pagination
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters State
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 15,
        search,
        action: actionType
      };

      const response = await api.get('/system/logs', { params });
      if (response.data.success) {
        setLogs(response.data.data);
        setCount(response.data.count);
        setPages(response.data.pages);
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLogs();
  };

  const handleResetSearch = () => {
    setSearch('');
    setActionType('');
    setCurrentPage(1);
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE')) return 'var(--accent-danger)';
    if (action.includes('CREATE') || action.includes('RESTORE')) return 'var(--accent-success)';
    if (action.includes('UPDATE')) return 'var(--accent-warning)';
    if (action.includes('LOGIN')) return 'var(--accent-primary)';
    return 'var(--text-secondary)';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search & Category Filter Console */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          {/* Action type selector */}
          <div className="form-group" style={{ marginBottom: 0, flexGrow: 1, minWidth: '180px' }}>
            <label className="form-label">Audit Action Category</label>
            <select className="form-control" value={actionType} onChange={(e) => { setActionType(e.target.value); setCurrentPage(1); }}>
              <option value="">All Actions</option>
              <option value="LOGIN">User Logins (LOGIN)</option>
              <option value="REGISTER">User Signups (REGISTER)</option>
              <option value="CREATE_INWARD">Create Inward (CREATE_INWARD)</option>
              <option value="UPDATE_INWARD">Update Inward details</option>
              <option value="UPDATE_INWARD_STATUS">Change Inward status</option>
              <option value="DELETE_INWARD">Delete Inward records</option>
              <option value="CREATE_OUTWARD">Create Outward (CREATE_OUTWARD)</option>
              <option value="UPDATE_OUTWARD_STATUS">Change Outward status</option>
              <option value="DELETE_OUTWARD">Delete Outward records</option>
              <option value="CREATE_USER">Admin create user</option>
              <option value="DELETE_USER">Admin delete user</option>
              <option value="DATABASE_BACKUP">Database Backups</option>
              <option value="DATABASE_RESTORE">Database Restorations</option>
            </select>
          </div>

          {/* Text Search */}
          <div className="form-group" style={{ marginBottom: 0, flexGrow: 2, minWidth: '240px' }}>
            <label className="form-label">Keyword Query</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                placeholder="Search user name, email, action description..."
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
          </div>

          {/* Action triggers */}
          <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'flex-end', height: '40px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 1.25rem' }}>Query</button>
            <button type="button" onClick={handleResetSearch} className="btn btn-secondary" style={{ border: '1px solid var(--border-color)' }}>Reset</button>
          </div>
        </form>
      </div>

      {/* Grid List Table */}
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
          <table className="table" style={{ fontSize: '0.8125rem' }}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Operator User</th>
                <th>Action Code</th>
                <th>IP Address</th>
                <th>Activity Description Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    No audit log entries found in database.
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item._id}>
                    <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{item.userName}</strong>
                        {item.userEmail && (
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.userEmail}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: 'var(--bg-primary)',
                        color: getActionColor(item.action),
                        border: `1px solid ${getActionColor(item.action)}`,
                        fontSize: '0.6875rem'
                      }}>
                        {item.action}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{item.ipAddress}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Showing page <strong>{currentPage}</strong> of <strong>{pages}</strong> ({count} logs)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}
            >
              <ArrowLeft size={16} /> Prev
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pages))}
              disabled={currentPage === pages}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 1rem' }}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default ActivityLogs;
