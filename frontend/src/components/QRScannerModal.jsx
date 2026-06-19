import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Create the scanner instance when the modal opens
    // ID of the target element must match the first arg
    const scanner = new Html5QrcodeScanner(
      'qr-reader-target',
      { 
        fps: 10, 
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    const handleSuccess = (decodedText) => {
      try {
        // Parse scanned text. In our system, QR codes are JSON objects:
        // { type: 'INWARD', id: 'IN-2026-0001', ... }
        const qrObj = JSON.parse(decodedText);
        onScanSuccess(qrObj);
      } catch (err) {
        // Try fallback raw parsing if not valid JSON
        onScanSuccess({ raw: decodedText });
      }
      
      // Stop scanner and close modal
      scanner.clear().catch(e => console.warn('Failed clearing scanner:', e));
      onClose();
    };

    const handleFailure = (error) => {
      // Quietly log scanner frame lookup fails (this fires repeatedly while looking for a QR)
    };

    // Render scanner to the DOM element
    scanner.render(handleSuccess, handleFailure);
    scannerRef.current = scanner;

    // Cleanup: Clear scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.warn('Clean up scanner on close failed:', e));
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay animate-fade-in"
      onClick={onClose}
      style={{ zIndex: 1100 }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px' }}
      >
        <div className="modal-header">
          <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Webcam QR Code Scanner</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-primary)'
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Hold the printed document's QR code up to your camera to scan and track details instantly.
          </p>
          <div 
            id="qr-reader-target" 
            style={{ 
              width: '100%', 
              overflow: 'hidden', 
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
