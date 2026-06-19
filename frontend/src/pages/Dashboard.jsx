import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { 
  FileInput, 
  FileOutput, 
  Clock, 
  CheckCircle, 
  Activity, 
  ArrowRight,
  TrendingUp,
  PieChart,
  Eye,
  FileText
} from 'lucide-react';
import Modal from '../components/Modal';
import StatusTimeline from '../components/StatusTimeline';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Dashboard states
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Quick View Modal states
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedType, setSelectedType] = useState('inward'); // inward | outward

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/system/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleOpenQuickView = async (docId, type) => {
    try {
      setSelectedType(type);
      const endpoint = type === 'inward' ? `/inward/${docId}` : `/outward/${docId}`;
      const response = await api.get(endpoint);
      if (response.data.success) {
        setSelectedDoc(response.data.data);
      }
    } catch (err) {
      alert('Failed to load document details.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--border-color)',
          borderTopColor: 'var(--accent-primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ marginLeft: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Loading dashboard metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--accent-danger)' }}>
        <h3>Error: {error}</h3>
        <button onClick={fetchStats} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    );
  }

  const { cards, recent, monthlyStats, departmentStats } = stats;

  // Chart 1: Monthly Trends (Inward vs Outward Bar Chart)
  const monthlyData = {
    labels: monthlyStats.map(s => s.month),
    datasets: [
      {
        label: 'Inward Entries',
        data: monthlyStats.map(s => s.inward),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Primary blue
        borderRadius: 6
      },
      {
        label: 'Outward Entries',
        data: monthlyStats.map(s => s.outward),
        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Success green
        borderRadius: 6
      }
    ]
  };

  const monthlyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: 'var(--text-secondary)', font: { family: 'Inter', size: 11 } }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-secondary)' } },
      y: { grid: { color: 'var(--border-color)' }, ticks: { color: 'var(--text-secondary)', stepSize: 1 } }
    }
  };

  // Chart 2: Department Distribution (Doughnut Chart)
  const deptLabels = departmentStats.map(d => d.department);
  const deptData = {
    labels: deptLabels.length > 0 ? deptLabels : ['No Data'],
    datasets: [
      {
        data: departmentStats.map(d => d.count).length > 0 ? departmentStats.map(d => d.count) : [1],
        backgroundColor: [
          '#3b82f6', // blue
          '#10b981', // green
          '#f59e0b', // warning
          '#06b6d4', // info
          '#8b5cf6', // purple
          '#ec4899'  // pink
        ],
        borderWidth: 1,
        borderColor: 'var(--bg-secondary)'
      }
    ]
  };

  const deptOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { color: 'var(--text-secondary)', font: { family: 'Inter', size: 11 } }
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Metric Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Total Inwards */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>
            <FileInput size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Inward Entries</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>{cards.totalInward}</h3>
          </div>
        </div>

        {/* Total Outwards */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)' }}>
            <FileOutput size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Outward Entries</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>{cards.totalOutward}</h3>
          </div>
        </div>

        {/* Pending Action */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-warning)' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Pending Items</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>{cards.totalPending}</h3>
          </div>
        </div>

        {/* Completed Action */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(6, 182, 212, 0.1)', color: 'var(--accent-info)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Completed</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>{cards.totalCompleted}</h3>
          </div>
        </div>

        {/* Daily Activities */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>
            <Activity size={24} />
          </div>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase' }}>Today's Activities</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>{cards.todayActivities}</h3>
          </div>
        </div>
      </div>

      {/* 2. Charts Section */}
      <div className="grid-auto-dashboard">
        {/* Monthly Registration Trends */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} color="var(--accent-primary)" />
            <span>Monthly Inward-Outward Statistics</span>
          </h3>
          <div style={{ flexGrow: 1, position: 'relative' }}>
            <Bar data={monthlyData} options={monthlyOptions} />
          </div>
        </div>

        {/* Department-wise Breakdown */}
        <div className="card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={16} color="var(--accent-info)" />
            <span>Department-wise Document Share</span>
          </h3>
          <div style={{ flexGrow: 1, position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Doughnut data={deptData} options={deptOptions} />
          </div>
        </div>
      </div>

      {/* 3. Recent Entries Section */}
      <div className="grid-auto-dashboard">
        
        {/* Recent Inwards */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Inward Documents</h3>
            <button 
              onClick={() => navigate('/inward')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
            >
              View Register <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Doc ID</th>
                  <th>Sender</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.inwards.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No recent inward records
                    </td>
                  </tr>
                ) : (
                  recent.inwards.map(item => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.inwardId}</td>
                      <td>
                        <p style={{ fontWeight: 500, margin: 0 }}>{item.senderName}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.organization}</span>
                      </td>
                      <td>{item.department}</td>
                      <td>
                        <span className={`badge badge-${item.status.toLowerCase().replace(' ', '')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleOpenQuickView(item._id, 'inward')}
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '6px' }}
                          title="Quick View Document Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Outwards */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Outward Dispatches</h3>
            <button 
              onClick={() => navigate('/outward')}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}
            >
              View Register <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-container">
            <table className="table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Doc ID</th>
                  <th>Receiver</th>
                  <th>Courier Status</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recent.outwards.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No recent outward records
                    </td>
                  </tr>
                ) : (
                  recent.outwards.map(item => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.outwardId}</td>
                      <td>
                        <p style={{ fontWeight: 500, margin: 0 }}>{item.receiverName}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.organization}</span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {item.courierService ? `${item.courierService} (${item.trackingNumber})` : 'Self-Dispatched'}
                      </td>
                      <td>
                        <span className={`badge badge-${item.status.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleOpenQuickView(item._id, 'outward')}
                          className="btn btn-secondary" 
                          style={{ padding: '0.25rem 0.5rem', borderRadius: '6px' }}
                          title="Quick View Document Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Quick View Detail Modal */}
      <Modal 
        isOpen={selectedDoc !== null}
        onClose={() => setSelectedDoc(null)}
        title={`Document Quick View: ${selectedType === 'inward' ? selectedDoc?.inwardId : selectedDoc?.outwardId}`}
      >
        {selectedDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Split Info Panel */}
            <div className="grid-2" style={{
              backgroundColor: 'var(--bg-primary)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>
                  {selectedType === 'inward' ? 'Sender Name' : 'Receiver Name'}
                </p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  {selectedType === 'inward' ? selectedDoc.senderName : selectedDoc.receiverName}
                </p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Organization</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedDoc.organization}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Subject</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedDoc.subject}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Department</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedDoc.department}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Document Type</p>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{selectedDoc.documentType}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>Priority</p>
                <span className={`badge badge-${selectedDoc.priority.toLowerCase()}`}>
                  {selectedDoc.priority}
                </span>
              </div>
            </div>

            {/* QR display & File Link */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              {selectedDoc.qrCode && (
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={selectedDoc.qrCode} 
                    alt="Document QR Code"
                    style={{ width: '80px', height: '80px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.25rem' }} 
                  />
                  <p style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Scan to track</p>
                </div>
              )}
              
              {selectedDoc.uploadedFile ? (
                <a 
                  href={`http://localhost:5000${selectedDoc.uploadedFile}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FileText size={16} /> View Scanned Document
                </a>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', italic: true }}>No attachment uploaded</p>
              )}
            </div>

            {/* Progress status timeline */}
            <div>
              <StatusTimeline 
                type={selectedType}
                currentStatus={selectedDoc.status}
                history={selectedDoc.history}
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                onClick={() => {
                  setSelectedDoc(null);
                  navigate(`/tracking?id=${selectedType === 'inward' ? selectedDoc.inwardId : selectedDoc.outwardId}`);
                }}
                className="btn btn-primary"
              >
                Track Detail Life Cycle
              </button>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Spinner animation keyframes */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}} />

    </div>
  );
};

export default Dashboard;
