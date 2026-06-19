import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { exportToCSV, exportToPDF } from '../utils/export';
import { FileText, Download, Filter, FileSpreadsheet, Printer, Search, RefreshCw } from 'lucide-react';

const Reports = () => {
  // Query State
  const [registerType, setRegisterType] = useState('inward'); // inward | outward
  const [department, setDepartment] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [priority, setPriority] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Results State
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Fetch report data
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();

    setLoading(true);
    setSearched(true);
    
    try {
      const endpoint = registerType === 'inward' ? '/inward' : '/outward';
      const params = {
        limit: 1000, // Load a large limit for comprehensive reporting
        page: 1,
        department,
        documentType,
        priority,
        status,
        startDate,
        endDate
      };

      const response = await api.get(endpoint, { params });
      if (response.data.success) {
        setRecords(response.data.data);
      }
    } catch (err) {
      alert('Failed to generate report records. Please check the network connection.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Report automatically on load
  useEffect(() => {
    handleGenerateReport();
  }, [registerType]);

  // Export to CSV trigger
  const handleExportCSV = () => {
    const filename = `${registerType}-report-${Date.now()}`;
    if (registerType === 'inward') {
      const headers = ['inwardId', 'date', 'senderName', 'organization', 'department', 'documentType', 'priority', 'status', 'remarks'];
      exportToCSV(records, headers, filename);
    } else {
      const headers = ['outwardId', 'dispatchDate', 'receiverName', 'organization', 'department', 'documentType', 'priority', 'status', 'courierService', 'trackingNumber', 'remarks'];
      exportToCSV(records, headers, filename);
    }
  };

  // Export to PDF trigger
  const handleExportPDF = () => {
    const filename = `${registerType}-report-${Date.now()}`;
    const reportTitle = `${registerType.toUpperCase()} REGISTER REPORT`;
    
    if (registerType === 'inward') {
      const headers = ['Doc ID', 'Date', 'Sender', 'Organization', 'Department', 'Type', 'Priority', 'Status'];
      const fields = ['inwardId', 'date', 'senderName', 'organization', 'department', 'documentType', 'priority', 'status'];
      exportToPDF(reportTitle, headers, fields, records, filename);
    } else {
      const headers = ['Doc ID', 'Date', 'Receiver', 'Organization', 'Dept', 'Priority', 'Status', 'Courier Details'];
      // Custom mapping helper since courier details is two fields
      const formattedRecords = records.map(r => ({
        ...r,
        courierDetails: r.courierService ? `${r.courierService} (${r.trackingNumber})` : 'Self'
      }));
      const fields = ['outwardId', 'dispatchDate', 'receiverName', 'organization', 'department', 'priority', 'status', 'courierDetails'];
      exportToPDF(reportTitle, headers, fields, formattedRecords, filename);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Report Filters Control Console */}
      <div className="card">
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--accent-primary)" /> Filter Custom Register Reports
        </h3>

        <form onSubmit={handleGenerateReport} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {/* Register Type */}
          <div className="form-group">
            <label className="form-label">Register Book</label>
            <select className="form-control" value={registerType} onChange={(e) => setRegisterType(e.target.value)}>
              <option value="inward">Inward Document Register</option>
              <option value="outward">Outward Dispatch Register</option>
            </select>
          </div>

          {/* Department */}
          <div className="form-group">
            <label className="form-label">Department</label>
            <input type="text" className="form-control" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Finance" />
          </div>

          {/* Document Type */}
          <div className="form-group">
            <label className="form-label">Document Type</label>
            <select className="form-control" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="">All Types</option>
              {['Letter', 'Invoice', 'Report', 'Parcel', 'Certificate', 'Agreement', 'Complaint', 'Other'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {registerType === 'inward' 
                ? ['Pending', 'In Process', 'Approved', 'Completed', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)
                : ['Prepared', 'Dispatched', 'Delivered', 'Returned'].map(s => <option key={s} value={s}>{s}</option>)
              }
            </select>
          </div>

          {/* Start Date */}
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          {/* End Date */}
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', paddingBottom: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Generate Report
            </button>
          </div>
        </form>
      </div>

      {/* 2. Download / Action bar */}
      {searched && records.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button 
            onClick={handleExportCSV}
            className="btn btn-secondary" 
            style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <FileSpreadsheet size={16} color="var(--accent-success)" /> Export Spreadsheet (CSV)
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="btn btn-secondary"
            style={{ border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Printer size={16} color="var(--accent-primary)" /> Export PDF Document
          </button>
        </div>
      )}

      {/* 3. Preview Records Grid */}
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
              {registerType === 'inward' ? (
                <tr>
                  <th>Doc ID</th>
                  <th>Date</th>
                  <th>Sender</th>
                  <th>Organization</th>
                  <th>Department</th>
                  <th>Document Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              ) : (
                <tr>
                  <th>Doc ID</th>
                  <th>Dispatch Date</th>
                  <th>Receiver</th>
                  <th>Organization</th>
                  <th>Department</th>
                  <th>Document Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              )}
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>
                    {searched ? 'No records match selected query filters.' : 'Click "Generate Report" to preview database records.'}
                  </td>
                </tr>
              ) : (
                records.map((item) => (
                  <tr key={item._id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                      {registerType === 'inward' ? item.inwardId : item.outwardId}
                    </td>
                    <td>
                      {new Date(registerType === 'inward' ? item.date : item.dispatchDate).toLocaleDateString()}
                    </td>
                    <td>
                      {registerType === 'inward' ? item.senderName : item.receiverName}
                    </td>
                    <td>{item.organization}</td>
                    <td>{item.department}</td>
                    <td>{item.documentType}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default Reports;
