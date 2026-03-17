import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import GateDashboard from './pages/gate/GateDashboard';
import ReceptionDashboard from './pages/reception/ReceptionDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVisitors from './pages/admin/AdminVisitors';
import Layout from './components/Layout';
import SignaturePage from './pages/SignaturePage';

const hasAccess = (user, access) =>
  user.role === 'admin' || user.role === access || (user.permissions || []).includes(access);

const PrivateRoute = ({ children, roles, access }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  if (access && !hasAccess(user, access)) return <Navigate to="/" replace />;
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'gate') return <Navigate to="/gate" replace />;
  if (user.role === 'reception') return <Navigate to="/reception" replace />;
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/gate" element={<PrivateRoute access="gate"><Layout><GateDashboard /></Layout></PrivateRoute>} />
          <Route path="/reception" element={<PrivateRoute access="reception"><Layout><ReceptionDashboard /></Layout></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><Layout><AdminDashboard /></Layout></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute roles={['admin']}><Layout><AdminReports /></Layout></PrivateRoute>} />
          <Route path="/admin/users" element={<PrivateRoute roles={['admin']}><Layout><AdminUsers /></Layout></PrivateRoute>} />
          <Route path="/admin/visitors" element={<PrivateRoute roles={['admin']}><Layout><AdminVisitors /></Layout></PrivateRoute>} />
          {/* Route publique — page de signature mobile (pas d'auth) */}
          <Route path="/sign/:token" element={<SignaturePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
