import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, Mail, AlertTriangle, KeyRound, ArrowLeft, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Forgot Password / Reset Flow State
  const [flowState, setFlowState] = useState('login'); // login | forgot | reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [flowMessage, setFlowMessage] = useState('');
  const [flowError, setFlowError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
    // Check if redirected due to token expiry
    if (location.search.includes('expired=true')) {
      setSessionExpired(true);
    }
  }, [user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSessionExpired(false);
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setError(result.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setFlowError('');
    setFlowMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email: forgotEmail });
      if (response.data.success) {
        setFlowMessage('Verification code generated successfully.');
        setFlowState('reset');
      }
    } catch (err) {
      setFlowError(err.response?.data?.message || 'Failed to request reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setFlowError('');
    setFlowMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        email: forgotEmail,
        code: resetCode,
        newPassword
      });
      if (response.data.success) {
        setFlowState('login');
        setFlowMessage('Password reset successful. Please login with your new password.');
      }
    } catch (err) {
      setFlowError(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1) 0%, var(--bg-primary) 70%)'
    }}>
      <div className="glass-panel auth-card" style={{
        maxWidth: '440px',
        boxShadow: 'var(--card-shadow)'
      }}>
        
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, #1e40af 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            marginBottom: '1rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}>
            <KeyRound size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>
            {flowState === 'login' ? 'Welcome Back' : 
             flowState === 'forgot' ? 'Reset Password' : 'Enter Verification Code'}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {flowState === 'login' ? 'Digital Inward-Outward Management System' :
             flowState === 'forgot' ? 'Recover your account password register' :
             `Code sent to: ${forgotEmail}`}
          </p>
        </div>

        {/* Global Success / Expiry Messages */}
        {flowMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            color: 'var(--accent-success)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {flowMessage}
          </div>
        )}

        {sessionExpired && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            color: 'var(--accent-warning)',
            fontSize: '0.8125rem',
            fontWeight: 500,
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={16} />
            <span>Session expired. Please login again.</span>
          </div>
        )}

        {/* 1. Login Form */}
        {flowState === 'login' && (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-danger)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-control" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="admin@organization.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                <button 
                  type="button" 
                  onClick={() => setFlowState('forgot')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 2. Forgot Password Email Form */}
        {flowState === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            {flowError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-danger)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                marginBottom: '1.25rem'
              }}>
                {flowError}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="email" 
                  className="form-control" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  style={{ paddingLeft: '2.25rem' }}
                  placeholder="email@organization.com"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => setFlowState('login')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading ? 'Requesting...' : 'Get Reset Code'}
              </button>
            </div>
          </form>
        )}

        {/* 3. Reset Code Verification Form */}
        {flowState === 'reset' && (
          <form onSubmit={handleResetPassword}>
            {flowError && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--accent-danger)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                marginBottom: '1.25rem'
              }}>
                {flowError}
              </div>
            )}



            <div className="form-group">
              <label className="form-label">Verification Code (6-Digit)</label>
              <input 
                type="text" 
                className="form-control" 
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password (Min 6 Characters)</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  className="form-control" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                onClick={() => setFlowState('forgot')}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
