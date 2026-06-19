import React, { useState } from 'react';
import api from '../utils/api';
import { Database, Download, Upload, AlertOctagon, CheckCircle, ShieldAlert } from 'lucide-react';

const Settings = () => {
  const [restoreFile, setRestoreFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Backup downloader handler
  const handleDownloadBackup = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.get('/system/backup', { responseType: 'blob' });
      
      // Setup file download blob stream
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `register-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up local URL object
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess('Database backup file compiled and downloaded successfully.');
    } catch (err) {
      setError('Failed to generate database backup file. Check server status.');
    } finally {
      setLoading(false);
    }
  };

  // Restore database form submit handler
  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!restoreFile) {
      setError('Please select a JSON backup file to upload.');
      return;
    }

    const confirmRestore = window.confirm(
      '⚠️ WARNING: Restoring the database will PERMANENTLY delete all current users, inward registers, outward registers, and activity logs. Are you sure you want to overwrite all data?'
    );

    if (!confirmRestore) return;

    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', restoreFile);

    try {
      const response = await api.post('/system/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSuccess('Database collections restored successfully! All data replaced.');
        setRestoreFile(null);
        // Clear input element manually
        document.getElementById('restore-file-input').value = '';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore database. Ensure the file is a valid JSON backup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Settings Description banner */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>
          <Database size={28} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Database Maintenance</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Admin utilities to backup documents and restore registers. Keep records safe by generating regular offsite copies.
          </p>
        </div>
      </div>

      {/* Status Alerts */}
      {success && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          color: 'var(--accent-success)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          color: 'var(--accent-danger)',
          fontSize: '0.8125rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid containing Backup and Restore blocks */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        
        {/* Card 1: Backup */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Export Data Backup</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Compile all Mongoose collections (Users accounts, Inward logs, Outward dispatches, and Audit activity history) into a portable JSON document.
            </p>
          </div>
          
          <button 
            onClick={handleDownloadBackup}
            disabled={loading}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}
          >
            <Download size={18} /> {loading ? 'Compiling JSON...' : 'Download Data Backup'}
          </button>
        </div>

        {/* Card 2: Restore */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Import Data Restore</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Upload a previously downloaded JSON register backup file.
            </p>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            padding: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.06)',
            borderRadius: '8px',
            border: '1px solid rgba(239, 68, 68, 0.12)'
          }}>
            <AlertOctagon size={16} style={{ color: 'var(--accent-danger)', flexShrink: 0, marginTop: '2px' }} />
            <span style={{ fontSize: '0.725rem', color: 'var(--accent-danger)', fontWeight: 500, lineHeight: '1.3' }}>
              WARNING: Overwrites active data. Current records will be deleted. Ensure backup file integrity beforehand.
            </span>
          </div>

          <form onSubmit={handleRestoreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input 
                id="restore-file-input"
                type="file" 
                className="form-control" 
                accept=".json"
                onChange={(e) => setRestoreFile(e.target.files[0])}
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="btn btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}
            >
              <Upload size={18} /> {loading ? 'Restoring Database...' : 'Upload & Restore database'}
            </button>
          </form>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default Settings;
