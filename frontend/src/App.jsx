import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InwardManagement from './pages/InwardManagement';
import OutwardManagement from './pages/OutwardManagement';
import Tracking from './pages/Tracking';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      {/* Fixed Responsive Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Scrollable Main content viewport */}
      <main className="main-content">
        {/* Sticky top header bar */}
        <Header toggleSidebar={toggleSidebar} />
        
        {/* Active Route page body */}
        <div style={{ marginTop: '1rem' }}>
          {children}
        </div>
      </main>

      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar} />
      )}
    </div>
  );
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        {/* Public Guest Routes */}
        <Route path="/login" element={<Login />} />

        {/* Private Protected Pages (Require JWT) */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/inward" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <InwardManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/outward" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <OutwardManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/tracking" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tracking />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/reports" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Reports />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Admin-only restricted menus */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <UserManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/logs" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <ActivityLogs />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            </ProtectedRoute>
          } 
        />

        {/* Fallback Redirect Router */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
