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
  Truck, 
  ArrowLeft,
  ArrowRight,
  Upload,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Modal from '../components/Modal';
import StatusTimeline from '../components/StatusTimeline';
import QRScannerModal from '../components/QRScannerModal';

const OutwardManagement = () => {
  const { user } = useContext(AuthContext);

  // States
  const [records, setRecords] = useState([]);
  const [count, setCount] = useState(0);
  const [pages, setPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters State
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

  // Selected Target
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formMode, setFormMode] = useState('add');

  // Form Fields State
  const [receiverName, setReceiverName] = useState('');
  const [organization, setOrganization] = useState('');
  const [address, setAddress] = useState('');
  const [courierService, setCourierService] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [documentType, setDocumentType] = useState('Letter');
  const [priority, setPriority] = useState('Medium');
  const [remarks, setRemarks] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Status Form State
  const [newStatus, setNewStatus] = useState('Prepared');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [courierInput, setCourierInput] = useState('');
  const [trackingInput, setTrackingInput] = useState('');

  // Fetch Outward Records
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

      const response = await api.get('/outward', { params });
      if (response.data.success) {
        setRecords(response.data.data);
        setCount(response.data.count);
        setPages(response.data.pages);
      }
    } catch (err) {
      console.error('Failed to fetch outward records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentPage, filterDept, filterType, filterPriority, filterStatus, filterStartDate, filterEndDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords();
  };

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

  // Open Add modal
  const handleOpenAdd = () => {
    setFormMode('add');
    setReceiverName('');
    setOrganization('');
    setAddress('');
    setCourierService('');
    setTrackingNumber('');
    setDepartment(user?.department || '');
    setDocumentType('Letter');
    setPriority('Medium');
    setRemarks('');
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (record) => {
    setFormMode('edit');
    setSelectedRecord(record);
    setReceiverName(record.receiverName);
    setOrganization(record.organization);
    setAddress(record.address);
    setCourierService(record.courierService || '');
    setTrackingNumber(record.trackingNumber || '');
    setDepartment(record.department);
    setDocumentType(record.documentType);
    setPriority(record.priority);
    setRemarks(record.remarks || '');
    setSelectedFile(null);
    setIsFormOpen(true);
  };

  // Open Status modal
  const handleOpenStatus = (record) => {
    setSelectedRecord(record);
    setNewStatus(record.status);
    setCourierInput(record.courierService || '');
    setTrackingInput(record.trackingNumber || '');
    setStatusRemarks('');
    setIsStatusOpen(true);
  };

  const handleOpenDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  // Form Submit (Add/Edit)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('receiverName', receiverName);
    formData.append('organization', organization);
    formData.append('address', address);
    formData.append('courierService', courierService);
    formData.append('trackingNumber', trackingNumber);
    formData.append('department', department);
    formData.append('subject', subject);
    formData.append('documentType', documentType);
    formData.append('priority', priority);
    formData.append('remarks', remarks);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      let response;
      if (formMode === 'add') {
        response = await api.post('/outward', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (response.data.success) {
          window.dispatchEvent(new CustomEvent('app-notification', {
            detail: { message: `New outward document ${response.data.data.outwardId} prepared successfully.` }
          }));
        }
      } else {
        response = await api.put(`/outward/${selectedRecord._id}`, formData, {
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

  // Status Change Submit
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(`/outward/${selectedRecord._id}/status`, {
        status: newStatus,
        remarks: statusRemarks,
        courierService: newStatus === 'Dispatched' ? courierInput : undefined,
        trackingNumber: newStatus === 'Dispatched' ? trackingInput : undefined
      });

      if (response.data.success) {
        setIsStatusOpen(false);
        fetchRecords();
        
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: { message: `Outward document ${selectedRecord.outwardId} status updated to: ${newStatus}` }
        }));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Status update failed');
    }
  };

  // Delete Record (Admin Only)
  const handleDeleteRecord = async (id, idString) => {
    if (window.confirm(`Are you sure you want to permanently delete outward entry ${idString}?`)) {
      try {
        const response = await api.delete(`/outward/${id}`);
        if (response.data.success) {
          fetchRecords();
        }
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  // QR Scanning Success
  const handleScanSuccess = (qrObj) => {
    if (qrObj.type === 'OUTWARD') {
      const matched = records.find(r => r.outwardId === qrObj.id);
      if (matched) {
        handleOpenDetail(matched);
      } else {
        api.get(`/outward/${qrObj.id}`)
          .then(res => {
            if (res.data.success) {
              handleOpenDetail(res.data.data);
            }
          })
          .catch(() => alert(`Document ID ${qrObj.id} not found in the database.`));
      }
    } else {
      alert(`Scanned QR is for inward document. Please scan in Inward Register or search in Track Documents.`);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Actions */}
      <div className="action-header">
        <div className="action-buttons-group">
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus size={18} /> Add Outward Entry
          </button>
          
          <button 
            onClick={() => setIsScannerOpen(true)} 
            className="btn btn-secondary"
            style={{ border: '1px solid var(--border-color)' }}
          >
            <QrCode size={18} /> Scan Document QR
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="search-form-container">
          <div style={{ position: 'relative', flexGrow: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search by ID, receiver, subject..."
            />
          </div>
          <button type="submit" className="btn btn-secondary">Search</button>
        </form>
      </div>

      {/* Query Filters */}
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
            <div className="form-group">
              <label className="form-label">Department</label>
              <input type="text" className="form-control" value={filterDept} onChange={(e) => setFilterDept(e.target.value)} placeholder="e.g. Sales" />
            </div>
            
            <div className="form-group">
              <label className="form-label">Document Type</label>
              <select className="form-control" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="">All Types</option>
                {['Letter', 'Invoice', 'Report', 'Parcel', 'Certificate', 'Agreement', 'Complaint', 'Other'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-control" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {['Prepared', 'Dispatched', 'Delivered', 'Returned'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} />
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '1.25rem' }}>
              <button type="button" onClick={handleResetFilters} className="btn btn-secondary" style={{ width: '100%', border: '1px solid var(--border-color)' }}>
                Reset All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grid Table */}
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
                <th>Dispatch Date</th>
                <th>Receiver & Organization</th>
                <th>Subject</th>
                <th>Courier Details</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    No outward records found.
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.outwardId}</td>
                    <td>{new Date(item.dispatchDate).toLocaleDateString()}</td>
                    <td>
                      <p style={{ fontWeight: 500, margin: 0 }}>{item.receiverName}</p>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.organization}</span>
                    </td>
                    <td>
                      <p style={{ margin: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.subject}
                      </p>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.documentType} ({item.department})</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {item.courierService ? (
                        <div>
                          <strong>{item.courierService}</strong>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tracking: {item.trackingNumber}</p>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>Pending Dispatch</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${item.priority.toLowerCase()}`}>
                        {item.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button onClick={() => handleOpenDetail(item)} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px' }} title="View Timeline">
                          <Eye size={14} />
                        </button>
                        
                        <button onClick={() => handleOpenStatus(item)} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--accent-warning)' }} title="Dispatch Update">
                          <Truck size={14} />
                        </button>

                        <button onClick={() => handleOpenEdit(item)} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--accent-info)' }} title="Edit">
                          <Edit2 size={14} />
                        </button>

                        {user?.role === 'admin' && (
                          <button onClick={() => handleDeleteRecord(item._id, item.outwardId)} className="btn btn-secondary" style={{ padding: '0.35rem', borderRadius: '8px', color: 'var(--accent-danger)' }} title="Delete">
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

      {/* Pagination */}
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

      {/* Modal Form: Add / Edit */}
      <Modal 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)}
        title={formMode === 'add' ? 'Create Outward Dispatch' : `Edit Outward Dispatch: ${selectedRecord?.outwardId}`}
      >
        <form onSubmit={handleFormSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Receiver Name</label>
              <input type="text" className="form-control" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="e.g. Bob Jones" required />
            </div>
            <div className="form-group">
              <label className="form-label">Receiver Organization</label>
              <input type="text" className="form-control" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="e.g. Microsoft Corp" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <input type="text" className="form-control" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. 123 Tech Blvd, Suite 400, Seattle, WA" required />
          </div>

          <div className="form-group">
            <label className="form-label">Subject</label>
            <input type="text" className="form-control" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Partnership Agreement Execution Copy" required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <input type="text" className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Legal" required />
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
              <label className="form-label">Remarks</label>
              <input type="text" className="form-control" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Urgent review required" />
            </div>
          </div>

          <div className="grid-2" style={{ backgroundColor: 'var(--bg-primary)', padding: '0.75rem', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Courier Service</label>
              <input type="text" className="form-control" value={courierService} onChange={(e) => setCourierService(e.target.value)} placeholder="e.g. FedEx / DHL" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tracking Number</label>
              <input type="text" className="form-control" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="e.g. FX-9821-331" />
            </div>
          </div>

          <div className="form-group" style={{ border: '2px dashed var(--border-color)', borderRadius: '10px', padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-primary)', position: 'relative' }}>
            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
            <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }} />
            <p style={{ fontSize: '0.8125rem', fontWeight: 500, margin: 0, wordBreak: 'break-all' }}>
              {selectedFile ? selectedFile.name : 'Click to Upload Dispatch Scan / Proof'}
            </p>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PDF, Images (Max 10MB)</span>
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
            <button type="button" onClick={() => setIsFormOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">{formMode === 'add' ? 'Create Outward' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Status Update */}
      <Modal 
        isOpen={isStatusOpen} 
        onClose={() => setIsStatusOpen(false)}
        title={`Update Outward Dispatch Status: ${selectedRecord?.outwardId}`}
      >
        <form onSubmit={handleStatusSubmit}>
          <div className="form-group">
            <label className="form-label">Select Current Status</label>
            <select className="form-control" value={newStatus} onChange={(e) => setNewStatus(e.target.value)} required>
              {['Prepared', 'Dispatched', 'Delivered', 'Returned'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {newStatus === 'Dispatched' && (
            <div className="grid-2" style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: '10px', marginBottom: '1.25rem', border: '1px solid var(--border-color)' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Courier Service Provider</label>
                <input type="text" className="form-control" value={courierInput} onChange={(e) => setCourierInput(e.target.value)} placeholder="e.g. UPS / FedEx" required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">AWB Tracking Number</label>
                <input type="text" className="form-control" value={trackingInput} onChange={(e) => setTrackingInput(e.target.value)} placeholder="e.g. Tracking ID" required />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Tracking Update Remarks / Delivery Notes</label>
            <textarea className="form-control" value={statusRemarks} onChange={(e) => setStatusRemarks(e.target.value)} placeholder="e.g. Document handed over to courier agent." rows={3} required />
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
            <button type="button" onClick={() => setIsStatusOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Update Dispatch State</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detailed View */}
      <Modal 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)}
        title={`Outward File Dispatch Lifecycle: ${selectedRecord?.outwardId}`}
      >
        {selectedRecord && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="grid-2" style={{ backgroundColor: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Receiver Name</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.receiverName}</p>
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
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Courier Service</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.courierService || 'Not Dispatched yet'}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Tracking ID</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.trackingNumber || '-'}</p>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Delivery Address</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedRecord.address}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              {selectedRecord.qrCode && (
                <div style={{ textAlign: 'center' }}>
                  <img src={selectedRecord.qrCode} alt="QR Code" style={{ width: '100px', height: '100px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem' }} />
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Scan QR to track instantly</p>
                </div>
              )}
              
              {selectedRecord.uploadedFile ? (
                <a href={selectedRecord.uploadedFile.startsWith('http') ? selectedRecord.uploadedFile : `http://localhost:5000${selectedRecord.uploadedFile}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={16} /> Open Document File
                </a>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={16} />
                  <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>No digital file attached.</span>
                </div>
              )}
            </div>

            <StatusTimeline type="outward" currentStatus={selectedRecord.status} history={selectedRecord.history} />

            <div className="modal-footer" style={{ padding: '1rem 0 0' }}>
              <button onClick={() => setIsDetailOpen(false)} className="btn btn-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* QR Scanner modal */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={handleScanSuccess} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default OutwardManagement;
