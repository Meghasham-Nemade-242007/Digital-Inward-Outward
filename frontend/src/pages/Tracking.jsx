import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { Search, QrCode, FileText, Calendar, Building, Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import StatusTimeline from '../components/StatusTimeline';
import QRScannerModal from '../components/QRScannerModal';

const Tracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const trackingIdParam = searchParams.get('id') || '';

  // State
  const [queryId, setQueryId] = useState(trackingIdParam);
  const [record, setRecord] = useState(null);
  const [recordType, setRecordType] = useState(''); // inward | outward
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Search trigger
  const handleSearch = async (targetId) => {
    if (!targetId || !targetId.trim()) return;
    
    setLoading(true);
    setError('');
    setRecord(null);

    const formattedId = targetId.trim().toUpperCase();
    const type = formattedId.startsWith('IN-') ? 'inward' : formattedId.startsWith('OUT-') ? 'outward' : '';

    if (!type) {
      setError('Invalid Document ID format. Must start with "IN-" or "OUT-" (e.g. IN-2026-0001).');
      setLoading(false);
      return;
    }

    try {
      const endpoint = type === 'inward' ? `/inward/${formattedId}` : `/outward/${formattedId}`;
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        setRecord(response.data.data);
        setRecordType(type);
        // Sync URL param
        setSearchParams({ id: formattedId });
      }
    } catch (err) {
      setError(err.response?.data?.message || `No record found with ID: ${formattedId}`);
    } finally {
      setLoading(false);
    }
  };

  // Run search if URL param is preset
  useEffect(() => {
    if (trackingIdParam) {
      setQueryId(trackingIdParam);
      handleSearch(trackingIdParam);
    }
  }, [trackingIdParam]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(queryId);
  };

  const handleScanSuccess = (qrObj) => {
    setQueryId(qrObj.id);
    handleSearch(qrObj.id);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Track Search Console */}
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Track Document Lifecycle</h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Enter a unique Inward or Outward Tracking ID, or scan the document QR code to view its movement history.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', maxWidth: '600px', margin: '0 auto', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexGrow: 1, minWidth: '240px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-control" 
              value={queryId}
              onChange={(e) => setQueryId(e.target.value)}
              placeholder="e.g. IN-2026-0001 or OUT-2026-0001"
              style={{ paddingLeft: '2.5rem', textTransform: 'uppercase' }}
            />
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flexGrow: 1 }}>
            {loading ? 'Searching...' : 'Track Document'}
          </button>
          
          <button 
            type="button" 
            onClick={() => setIsScannerOpen(true)}
            className="btn btn-secondary"
            style={{ border: '1px solid var(--border-color)' }}
            title="Scan printed QR Code"
          >
            <QrCode size={18} />
          </button>
        </form>

        {error && (
          <div style={{
            maxWidth: '600px',
            margin: '1rem auto 0',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: 'var(--accent-danger)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. Tracking details view */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--border-color)',
            borderTopColor: 'var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      )}

      {record && (
        <div className="grid-1-2" style={{ alignItems: 'start' }}>
          
          {/* Card: Document Info Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <span className={`badge badge-${recordType}`}>
                {recordType} register
              </span>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.5rem', color: 'var(--text-primary)' }}>
                {recordType === 'inward' ? record.inwardId : record.outwardId}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <Calendar size={12} /> Logged: {new Date(record.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Structured meta fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.8125rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>
                  {recordType === 'inward' ? 'Sender Details' : 'Receiver Details'}
                </span>
                <strong>{recordType === 'inward' ? record.senderName : record.receiverName}</strong>
                <span style={{ display: 'block', color: 'var(--text-secondary)' }}>{record.organization}</span>
              </div>

              {record.address && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Delivery Address</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{record.address}</span>
                </div>
              )}

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Subject</span>
                <span style={{ fontWeight: 500 }}>{record.subject}</span>
              </div>

              <div className="grid-2" style={{ gap: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Department</span>
                  <span>{record.department}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Doc Type</span>
                  <span>{record.documentType}</span>
                </div>
              </div>

              <div className="grid-2" style={{ gap: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Priority</span>
                  <span className={`badge badge-${record.priority.toLowerCase()}`} style={{ marginTop: '0.25rem' }}>
                    {record.priority}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Status</span>
                  <span className={`badge badge-${record.status.toLowerCase().replace(' ', '')}`} style={{ marginTop: '0.25rem' }}>
                    {record.status}
                  </span>
                </div>
              </div>

              {recordType === 'inward' && record.assignedStaff && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Staff</span>
                  <strong>{record.assignedStaff.name}</strong>
                  <span style={{ fontSize: '0.75rem', display: 'block', color: 'var(--text-secondary)' }}>
                    {record.assignedStaff.department} ({record.assignedStaff.email})
                  </span>
                </div>
              )}

              {recordType === 'outward' && record.courierService && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Courier Dispatch</span>
                  <strong>{record.courierService}</strong>
                  <span style={{ display: 'block', color: 'var(--text-secondary)' }}>AWB: {record.trackingNumber}</span>
                </div>
              )}
            </div>

            {/* Scanned file download link */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              {record.uploadedFile ? (
                <a 
                  href={`http://localhost:5000${record.uploadedFile}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}
                >
                  <FileText size={16} /> Open Scanned Document
                </a>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', display: 'block' }}>
                  No digital document attached
                </span>
              )}
            </div>
          </div>

          {/* Card: Document tracking timeline history */}
          <div className="card" style={{ padding: '2rem' }}>
            <StatusTimeline 
              type={recordType}
              currentStatus={record.status}
              history={record.history}
            />
          </div>

        </div>
      )}

      {/* QR scanner camera modal */}
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

export default Tracking;
