import React from 'react';
import { Calendar, User, MessageSquare } from 'lucide-react';

const StatusTimeline = ({ type, currentStatus, history = [] }) => {
  // Define steps based on type
  const inwardSteps = ['Pending', 'In Process', 'Approved', 'Completed'];
  const outwardSteps = ['Prepared', 'Dispatched', 'Delivered'];

  const steps = type.toLowerCase() === 'inward' ? inwardSteps : outwardSteps;
  
  // Find current step index
  let currentIndex = steps.indexOf(currentStatus);
  if (currentStatus === 'Rejected') {
    // Treat rejected special
    currentIndex = steps.indexOf('In Process'); // Visual fallback
  }
  if (currentStatus === 'Returned') {
    currentIndex = steps.indexOf('Dispatched'); // Visual fallback
  }

  const getStepStatus = (index) => {
    if (currentStatus === 'Rejected' && index === steps.indexOf('Approved')) {
      return 'rejected';
    }
    if (currentStatus === 'Returned' && index === steps.indexOf('Delivered')) {
      return 'returned';
    }
    if (index < currentIndex || currentStatus === steps[steps.length - 1]) {
      return 'completed';
    }
    if (index === currentIndex && currentStatus !== 'Rejected' && currentStatus !== 'Returned') {
      return 'active';
    }
    return 'pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 1. Visual Progress Flow Line */}
      <div className="timeline-container" style={{ margin: '1rem 0' }}>
        <div className="timeline">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            let displayNode = index + 1;
            let stepClass = '';
            let customStyle = {};

            if (status === 'completed') {
              stepClass = 'completed';
              displayNode = '✓';
            } else if (status === 'active') {
              stepClass = 'active';
            } else if (status === 'rejected') {
              displayNode = '✗';
              customStyle = { borderColor: 'var(--accent-danger)', backgroundColor: 'var(--accent-danger)', color: '#ffffff' };
            } else if (status === 'returned') {
              displayNode = '⟲';
              customStyle = { borderColor: 'var(--accent-danger)', backgroundColor: 'var(--accent-danger)', color: '#ffffff' };
            }

            return (
              <div key={step} className={`timeline-step ${stepClass}`}>
                <div 
                  className="timeline-node" 
                  style={customStyle}
                >
                  {displayNode}
                </div>
                <div className="timeline-label">
                  {step}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Rejected or Returned special messages */}
        {(currentStatus === 'Rejected' || currentStatus === 'Returned') && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            padding: '0.75rem 1rem',
            textAlign: 'center',
            color: 'var(--accent-danger)',
            fontSize: '0.8125rem',
            fontWeight: 600
          }}>
            ⚠️ This document has been marked as {currentStatus}
          </div>
        )}
      </div>

      {/* 2. Chronological Status Change Audit Logs */}
      <div>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Document Tracking History Timeline</span>
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border-color)', paddingLeft: '1.25rem', marginLeft: '0.75rem' }}>
          {history.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>No history logs recorded.</p>
          ) : (
            [...history].reverse().map((item, idx) => (
              <div key={item._id || idx} style={{ position: 'relative' }}>
                {/* Timeline bullet dot */}
                <div style={{
                  position: 'absolute',
                  left: '-26px',
                  top: '4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: item.status === 'Completed' || item.status === 'Delivered' ? 'var(--accent-success)' :
                                 item.status === 'Rejected' || item.status === 'Returned' ? 'var(--accent-danger)' :
                                 'var(--accent-primary)',
                  border: '2px solid var(--bg-secondary)'
                }} />

                <div style={{
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      color: item.status === 'Completed' || item.status === 'Delivered' ? 'var(--accent-success)' :
                             item.status === 'Rejected' || item.status === 'Returned' ? 'var(--accent-danger)' :
                             'var(--text-primary)'
                    }}>
                      Status: {item.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Calendar size={12} /> {new Date(item.updatedAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={12} /> Updated by: <strong>{item.updatedByName}</strong>
                    </span>
                    {item.remarks && (
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: '0.35rem', fontStyle: 'italic', marginTop: '0.25rem' }}>
                        <MessageSquare size={12} style={{ marginTop: '2px' }} /> Remarks: "{item.remarks}"
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StatusTimeline;
