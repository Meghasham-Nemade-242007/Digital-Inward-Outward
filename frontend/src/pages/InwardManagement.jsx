import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  QrCode, 
  FileText, 
  Eye, 
  UserCheck, 
  ArrowLeft,
  ArrowRight,
  Upload,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Modal from '../components/Modal';
import StatusTimeline from '../components/StatusTimeline';
import QRScannerModal from '../components/QRScannerModal';

const InwardManagement = () => {
  const { user } = useContext(AuthContext);

  // Lists & pagination state
  const [records, setRecords] = useState([]);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState([]);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Target records for edit/details
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formMode, setFormMode] = useState('add'); // add | edit

  // Form Fields State
  const [senderName, setSenderName] = useState('');
  const [organization, setOrganization] = useState('');
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('');
  const [documentType, setDocumentType] = useState('Letter');
  const [priority, setPriority] = useState('Medium');
  const [remarks, setRemarks] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Status Change State
  const [newStatus, setNewStatus] = useState('Pending');
  const [statusRemarks, setStatusRemarks] = useState('');

  // Fetch Inward Records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search,
        department: filterDept,
        documentType: filterType,
        priority: filterPriority,
        status: filterStatus,
        startDate: filterStartDate,
        endDate: filterEndDate
      };

      const response = await api.get('/inward', { params });
      if (response.data.success) {
        setRecords(response.data.data);
        setCount(response.data.count);
        setPages(response.data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch inward records:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Admin Staff list for assignment dropdown
  const fetchStaffList = async () => {
    if (user && user.role === 'admin') {
      try {
        const response = await api.get('/users');
        if (response.data.success) {
          // Only show active staff/admin
          setStaffList(response.data.data.filter(u => u.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to load staff list:', err.message);
      }
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, filterDept, filterType, filterPriority, filterStatus, filterStartDate, filterEndDate]);

  useEffect(() => {
    fetchStaffList();
  }, [user]);

  // Handle Search Trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords();
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setFilterDept('');
    setFilterType('');
    setFilterPriority('');
    setFilterStatus('');
    setFilterStartDate('');
    setFilterEndDate('');
    setCurrentPage(1);
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    setFormMode('add');
    setSenderName('');
    setOrganization('');
    setSubject('');
    setDepartment(user?.department || '');
    setDocumentType('Letter');
    setPriority('Medium');
    setRemarks('');
    setAssignedStaff('');
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (record) => {
    setFormMode('edit');
    setSelectedRecord(record);
    setSenderName(record.senderName);
    setOrganization(record.organization);
    setSubject(record.subject);
    setDepartment(record.department);
    setDocumentType(record.documentType);
    setPriority(record.priority);
    setRemarks(record.remarks || '');
    setAssignedStaff(record.assignedStaff?._id || '');
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  // Open Status modal
  const handleOpenStatus = (record) => {
    setSelectedRecord(record);
    setNewStatus(record.status);
    setStatusRemarks('');
    setIsStatusOpen(true);
  };

  // Open Detail modal
  const handleOpenDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  // Form Submit Handler (Add / Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Create Multi-part Form Data
    const formData = new FormData();
    formData.append('senderName', senderName);
    formData.append('organization', organization);
    formData.append('subject', subject);
    formData.append('department', department);
    formData.append('documentType', documentType);
    formData.append('priority', priority);
    formData.append('remarks', remarks);
    if (assignedStaff) formData.append('assignedStaff', assignedStaff);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      let response;
      if (formMode === 'add') {
        response = await api.post('/inward', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          // Trigger in-app notification event
          window.dispatchEvent(new CustomEvent('app-notification', {
            detail: { message: `New inward document ${response.data.data.inwardId} created successfully.` }
          }));
        }
      } else {
        response = await api.put(`/inward/${selectedRecord._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data.success) {
        setIsFormOpen(false);
        fetchRecords();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Form submission failed');
    }
  };

  // Status Change handler
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(`/inward/${selectedRecord._id}/status`, {
        status: newStatus,
        remarks: statusRemarks
      });

      if (response.data.success) {
        setIsStatusOpen(false);
        fetchRecords();
        
        // Trigger in-app notification event
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: { message: `Document ${selectedRecord.inwardId} status updated to: ${newStatus}` }
        }));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Status update failed');
    }
  };

  // Delete Record (Admin Only)
  const handleDeleteRecord = async (id, idString) => {
    if (window.confirm(`Are you sure you want to permanently delete inward entry ${idString}?`)) {
      try {
        const response = await api.delete(`/inward/${id}`);
        if (response.data.success) {
          fetchRecords();
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  // QR Scan Success Callback
  const handleScanSuccess = (qrObj) => {
    if (qrObj.type === 'INWARD') {
      // Find and open details
      // Search matching record inside currently loaded list first
      const matched = records.find(r => r.inwardId === qrObj.id);
      if (matched) {
        handleOpenDetail(matched);
      } else {
        // Fetch from API directly using the sequential ID
        api.get(`/inward/${qrObj.id}`)
          .then(res => {
            if (res.data.success) {
              handleOpenDetail(res.data.data);
            }
          })
          .catch(() => alert(`Document ID ${qrObj.id} not found in the database.`));
      }
    } else {
      alert(`Scanned QR is for outward document. Please scan in Outward Register or search in Track Documents.`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Action Header */}
      <div className="action-header">
        <div className="action-buttons-group">
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} /> Add Inward Entry
          </button>
          
          <button 
            onClick={() => setIsScannerOpen(true)} 
            className="btn btn-secondary"
            style={{ border: '1px solid var(--border-color)' }}
          >
            <QrCode size={18} /> Scan Document QR
          </button>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="search-form-container">
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by ID, sender, subject..."
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
      </div>

      {/* Filter Options Expandable Panel */}
      <div className="card" style={{ padding: '1rem' }}>
        <div 
          onClick={() => setShowFilters(!showFilters)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} /> Advanced Query Filters
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {showFilters ? 'Hide Panel' : 'Show Panel'}
          </span>
        </div>

        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            {/* Department */}
            <div className="form-group">
              <label className="form-label">Department</label>
              <input 
                type="text" 
                className="form-control" 
                value={filterDept} 
                onChange={(e) => setFilterDept(e.target.value)} 
                placeholder="e.g. Accounts"
              />
            </div>
            
            {/* Doc Type */}
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select className="form-control" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {['Letter', 'Invoice', 'Report', 'Parcel', 'Certificate', 'Agreement', 'Complaint', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {['Pending', 'In Process', 'Approved', 'Completed', 'Rejected'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </div>

            {/* Reset */}
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1.25rem' }}>
              <button 
                type="button" 
                onClick={handleResetFilters}
                className="btn btn-secondary" 
                style={{ width: '100%', border: '1px solid var(--border-color)' }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Inward Records Grid Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
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
                <th>Doc ID</th>
                <th>Date</th>
                <th>Sender & Organization</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Staff</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    No inward records found.
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.inwardId}</td>
                    <td>{new Date(item.date).toLocaleDateString()}</td>
                    <td>
                      <p style={{ fontWeight: 500, margin: 0 }}>{item.senderName}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.organization}</span>
                    </td>
                    <td>
                      <p style={{ margin: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subject}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.documentType} ({item.department})</span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.status.toLowerCase().replace(' ', '')}`}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {item.assignedStaff ? (
                        <div>
                          <strong>{item.assignedStaff.name}</strong>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.assignedStaff.department}</p>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button 
                          onClick={() => handleOpenDetail(item)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', borderRadius: '8px' }}
                          title="View Life Cycle timeline & QR"
                        >
                          <Eye size={14} />
                        </button>
                        
                        <button 
                          onClick={() => handleOpenStatus(item)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--accent-warning)' }}
                          title="Update Tracking Status"
                        >
                          <UserCheck size={14} />
                        </button>

                        <button 
                          onClick={() => handleOpenEdit(item)}
                          className="btn btn-secondary" 
                          style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--accent-info)' }}
                          title="Edit Record"
                        >
                          <Edit2 size={14} />
                        </button>

                        {user?.role === 'admin' && (
                          <button 
                            onClick={() => handleDeleteRecord(item._id, item.inwardId)}
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--accent-danger)' }}
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer Controls */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Showing page <strong>{currentPage}</strong> of <strong>{pages}</strong> ({count} records)
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

      {/* 4. Modal: Add / Edit Form */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'add' ? 'Create Inward Document' : `Edit Inward Document: ${selectedRecord?.inwardId}`}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Sender Name</label>
              <input type="text" className="form-control" value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="e.g. Alice Smith" required />
            </div>
            
            <div className="form-group">
              <label className="form-label">Sender Organization</label>
              <input type="text" className="form-control" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Google LLC" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input type="text" className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Service Invoice for Q1 Audit" required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input type="text" className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Finance" required />
            </div>

            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select className="form-control" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
                {['Letter', 'Invoice', 'Report', 'Parcel', 'Certificate', 'Agreement', 'Complaint', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Staff Member</label>
              {user?.role === 'admin' ? (
                <select className="form-control" value={assignedStaff} onChange={(e) => setAssignedStaff(e.target.value)}>
                  <option value="">-- Unassigned / Select Staff --</option>
                  {staffList.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.department})</option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  className="form-control" 
                  value={assignedStaff ? 'Assigned' : 'Staff Mode (Assignment Locked)'} 
                  disabled 
                  placeholder="Only Admin can assign staff" 
                />
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Initial Notes</label>
            <textarea className="form-control" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Forwarded from reception desk" rows={2} />
          </div>

          <div className="form-group" style={{
            border: '2px dashed var(--border-color)',
            borderRadius: '10px',
            padding: '1.25rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-primary)',
            cursor: 'pointer',
            position: 'relative'
          }}>
            <input 
              type="file" 
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500, margin: 0, wordBreak: 'break-all' }}>
              {selectedFile ? selectedFile.name : 'Click to Upload Scanned Document'}
            </p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF, Images (Max 10MB)</span>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{formMode === 'add' ? 'Create Inward' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* 5. Modal: Status Update Form */}
      <Modal 
        isOpen={isStatusOpen} 
        onClose={() => setIsStatusOpen(false)}
        title={`Update Inward Status: ${selectedRecord?.inwardId}`}
      >
        <form onSubmit={handleStatusSubmit}>
          <div className="form-group">
            <label className="form-label">Select Current Status</label>
            <select className="form-control" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required>
              {['Pending', 'In Process', 'Approved', 'Completed', 'Rejected'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Status Update Remarks / Action Taken</label>
            <textarea 
              className="form-control" 
              value={statusRemarks} 
              onChange={(e) => setStatusRemarks(e.target.value)} 
              placeholder="e.g. Scanned document verified, forwarding to department head for processing." 
              rows={3} 
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
            <button type="button" onClick={() => setIsStatusOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Status</button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Detailed Tracking view */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)}
        title={`Inward File Lifecycle Details: ${selectedRecord?.inwardId}`}
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div className="grid-2" style={{
              backgroundColor: 'var(--bg-primary)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Sender Name</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.senderName}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Organization</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.organization}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Subject</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.subject}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Department</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.department}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Document Type</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.documentType}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Priority</p>
                <span className={`badge badge-${selectedRecord.priority.toLowerCase()}`}>
                  {selectedRecord.priority}
                </span>
              </div>
            </div>

            {/* QR display & Document link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              {selectedRecord.qrCode && (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={selectedRecord.qrCode} 
                    alt="Document QR Code"
                    style={{ width: '100px', height: '100px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem' }} 
                  />
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Scan QR to track instantly</p>
                </div>
              )}
              
              {selectedRecord.uploadedFile ? (
                <a 
                  href={`http://localhost:5000${selectedRecord.uploadedFile}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FileText size={16} /> Open Document File
                </a>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>No digital file attached.</span>
                </div>
              )}
            </div>

            {/* Tracking History Timeline component */}
            <StatusTimeline 
              type="inward"
              currentStatus={selectedRecord.status}
              history={selectedRecord.history}
            />

            <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
              <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* 7. Modal: QR Camera Scanner */}
      <QRScannerModal 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={handleScanSuccess} 
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default InwardManagement;
