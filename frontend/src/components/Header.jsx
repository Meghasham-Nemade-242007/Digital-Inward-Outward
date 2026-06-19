import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sun, Moon, Bell, Menu, Check } from 'lucide-react';

const Header = ({ toggleSidebar }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Set initial theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Toggle Theme Handler
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Setup simulated demo notifications based on path changes
  useEffect(() => {
    if (!user) return;
    
    const welcomeAlert = {
      id: 1,
      text: `Welcome back, ${user.name}! Database connected successfully.`,
      time: 'Just now',
      read: false
    };

    setNotifications([welcomeAlert]);

    // Listen to custom event for in-app notifications
    const handleNewNotification = (event) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          text: event.detail.message,
          time: 'Just now',
          read: false
        },
        ...prev
      ]);
    };

    window.addEventListener('app-notification', handleNewNotification);
    return () => {
      window.removeEventListener('app-notification', handleNewNotification);
    };
  }, [user]);

  // Clear or read all notifications
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Get human readable path title
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Analytics';
    if (path.startsWith('/inward')) return 'Inward Document Register';
    if (path.startsWith('/outward')) return 'Outward Document Register';
    if (path.startsWith('/tracking')) return 'Real-time Document Tracking';
    if (path.startsWith('/reports')) return 'System Reports & Export';
    if (path.startsWith('/users')) return 'User Account Management';
    if (path.startsWith('/logs')) return 'System Activity Logs';
    if (path.startsWith('/settings')) return 'System Configuration';
    if (path.startsWith('/profile')) return 'My Profile & Settings';
    return 'Digital Inward-Outward Register';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) return null;

  return (
    <header className="glass-panel" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1.5rem',
      borderRadius: '16px',
      marginBottom: '2rem',
      position: 'sticky',
      top: '1rem',
      zIndex: 90,
      border: '1px solid var(--border-color)'
    }}>
      {/* Title & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button 
          onClick={toggleSidebar}
          className="sidebar-toggle-btn"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '8px',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)'
          }}
          title="Toggle Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        
        {/* Theme Switcher */}
        <button 
          onClick={toggleTheme}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-primary)',
            transition: 'background-color 0.2s'
          }}
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--bg-primary)',
              transition: 'background-color 0.2s'
            }}
            title="System Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                backgroundColor: 'var(--accent-danger)',
                color: '#ffffff',
                fontSize: '0.625rem',
                fontWeight: 700,
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: '120%',
              width: '320px',
              borderRadius: '12px',
              padding: '1rem',
              boxShadow: 'var(--card-shadow)',
              zIndex: 100,
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem'
              }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600 }}>System Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                  >
                    <Check size={14} /> Mark Read
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                    No notifications
                  </p>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        backgroundColor: notif.read ? 'transparent' : 'var(--bg-primary)',
                        borderLeft: notif.read ? 'none' : '3px solid var(--accent-primary)',
                        fontSize: '0.75rem'
                      }}
                    >
                      <p style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{notif.text}</p>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6875rem' }}>{notif.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Local CSS overrides for responsive header components */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1024px) {
          .sidebar-toggle-btn {
            display: flex !important;
          }
        }
      `}} />
    </header>
  );
};

export default Header;
