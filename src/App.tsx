import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './api/queryClient';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Setting from './pages/Setting';
import About from './pages/About';
import { SidebarProvider } from './components/ui/Sidebar/Sidebar.context';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Helmet } from 'react-helmet';
import { Loader } from 'lucide-react';

const Home = React.lazy(() => import('./pages/Home'));
const UsersComponent = React.lazy(() => import('./pages/Users'));
const ProfilesComponent = React.lazy(() => import('./pages/Profiles'));
const OnlineUsersComponent = React.lazy(() => import('./pages/OnlineUsers'));
const NasComponent = React.lazy(() => import('./pages/Nas'));
const Login = React.lazy(() => import('./pages/Login'));
const AuthUsers = React.lazy(() => import('./pages/AuthUsers'));
const InvoicesComponent = React.lazy(() => import('./pages/Invoices'));
const InvoiceUpload = React.lazy(() => import('./pages/InvoiceUpload'));
const ExternalInvoicesComponent = React.lazy(() => import('./pages/Externalnvoices'));

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<div><Loader width={20} height={20}/>Loading...</div>}>
        <SidebarProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
                <Route index element={<ProtectedRoute element={<Home />} />} />
                <Route path="dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="auth-users" element={<ProtectedRoute element={<AuthUsers />} />} />
                <Route path="settings" element={<ProtectedRoute element={<Setting />} />} />
                <Route path="about" element={<ProtectedRoute element={<About />} />} />
                <Route path="invoices" element={<ProtectedRoute element={<InvoicesComponent />} />} />
                <Route path="nas" element={<ProtectedRoute element={<NasComponent />} />} />
                <Route path="users/list" element={<ProtectedRoute element={<UsersComponent />} />} />
                <Route path="profiles/list" element={<ProtectedRoute element={<ProfilesComponent />} />} />
                <Route path="/online-users" element={<ProtectedRoute element={<OnlineUsersComponent />} />} />
                <Route path="/invoice-upload" element={<InvoiceUpload />} />
                <Route path="/external-invoices" element={<ExternalInvoicesComponent />} />
              </Route>
            </Routes>
          </AuthProvider>
        </SidebarProvider>
      </Suspense>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Xnet Pro Radius</title>
        <meta name="description" content="Xnet Radius Server" />
      </Helmet>
      <QueryClientProvider client={queryClient}>
        <AppRoutes />
      </QueryClientProvider>
      <ToastContainer />
    </>
  );
};

export default App;