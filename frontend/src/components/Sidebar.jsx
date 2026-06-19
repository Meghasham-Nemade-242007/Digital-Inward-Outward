import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Search, 
  FileText, 
  Users, 
  History, 
  Settings, 
  LogOut,
  FolderOpen,
  FileInput,
  FileOutput
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <aside className={`glass-panel sidebar-responsive ${isOpen ? 'open' : ''}`} style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 1rem',
      zIndex: 100,
      borderRight: '1px solid var(--border-color)',
      borderRadius: '0 20px 20px 0'
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '2rem',
        padding: '0.5rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1e40af 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 'bold',
          boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
        }}>
          <FolderOpen size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: '1.2' }}>
            Digital Register
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            v1.0.0
          </span>
        </div>
      </div>

      {/* Nav Menu Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flexGrow: 1 }}>
        <NavLink to="/dashboard" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/inward" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FileInput size={18} />
          <span>Inward Register</span>
        </NavLink>

        <NavLink to="/outward" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FileOutput size={18} />
          <span>Outward Register</span>
        </NavLink>

        <NavLink to="/tracking" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Search size={18} />
          <span>Track Documents</span>
        </NavLink>

        <NavLink to="/reports" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <FileText size={18} />
          <span>Reports</span>
        </NavLink>

        {/* Admin-only links */}
        {user.role === 'admin' && (
          <>
            <div style={{
              height: '1px',
              backgroundColor: 'var(--border-color)',
              margin: '0.75rem 0.5rem'
            }} />
            
            <NavLink to="/users" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Users size={18} />
              <span>User Management</span>
            </NavLink>

            <NavLink to="/logs" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <History size={18} />
              <span>Activity Logs</span>
            </NavLink>

            <NavLink to="/settings" onClick={onClose} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Settings size={18} />
              <span>System Settings</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Footer Profile & Logout */}
      <div style={{
        marginTop: 'auto',
        padding: '0.75rem 0.5rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}>
        <NavLink to="/profile" onClick={onClose} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          textDecoration: 'none',
          color: 'var(--text-primary)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: '0.875rem',
            border: '2px solid var(--border-color)'
          }}>
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, margin: 0 }}>{user.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
              {user.role} ({user.department})
            </p>
          </div>
        </NavLink>

        <button 
          onClick={logout}
          className="sidebar-link btn-logout" 
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
            textAlign: 'left',
            color: 'var(--accent-danger)'
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>

      {/* Inject custom sidebar CSS to complement index.css */}
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.65rem 0.85rem;
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .sidebar-link:hover {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background-color: rgba(59, 130, 246, 0.1);
          color: var(--accent-primary);
          font-weight: 600;
        }

        .sidebar-link.btn-logout:hover {
          background-color: rgba(239, 68, 68, 0.08);
          color: var(--accent-danger);
        }
      `}} />
    </aside>
  );
};

export default Sidebar;
