import React, { Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './api/queryClient';
import Layout from './components/Layout';
import { SidebarProvider } from './components/ui/Sidebar/Sidebar.context';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { canAny } from './lib/permissions';
import { isFeatureEnabled } from "@/lib/featureFlags";
import { Helmet } from 'react-helmet';
import { Loader } from 'lucide-react';
import { websocketService } from './services/websocket';
import { Toaster } from './components/ui/toaster';
import { ErrorBoundary } from './components/ErrorBoundary';
import CommandPalette from './components/CommandPalette';

const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const UsersComponent = React.lazy(() => import('./pages/Users'));
const ProfilesComponent = React.lazy(() => import('./pages/Profiles'));
const OnlineUsersComponent = React.lazy(() => import('./pages/OnlineUsers'));
const UserSessionsComponent = React.lazy(() => import('./pages/UserSessions'));
const AuthFailuresComponent = React.lazy(() => import('./pages/AuthFailures'));
const UserDetailComponent = React.lazy(() => import('./pages/UserDetail'));
const AddUserComponent = React.lazy(() => import('./pages/AddUser'));
const NasComponent = React.lazy(() => import('./pages/Nas'));
const Login = React.lazy(() => import('./pages/Login'));
const AuthUsers = React.lazy(() => import('./pages/AuthUsers'));
const InvoicesComponent = React.lazy(() => import('./pages/Invoices'));
const InvoiceUpload = React.lazy(() => import('./pages/InvoiceUpload'));
const ExternalInvoicesComponent = React.lazy(() => import('./pages/Externalnvoices'));
const AnalyticsComponent = React.lazy(() => import('./pages/Analytics'));
const AlertsComponent = React.lazy(() => import('./pages/Alerts'));
const CollectionsComponent = React.lazy(() => import('./pages/Collections'));
const ExpensesComponent = React.lazy(() => import('./pages/Expenses'));
const AccessComponent = React.lazy(() => import('./pages/Access'));
const BackupsComponent = React.lazy(() => import('./pages/Backups'));
const ResellersComponent = React.lazy(() => import('./pages/Resellers'));
const ChangePasswordComponent = React.lazy(() => import('./pages/ChangePassword'));
const NotFoundComponent = React.lazy(() => import('./pages/NotFound'));
const ForbiddenComponent = React.lazy(() => import('./pages/Forbidden'));
const Setting = React.lazy(() => import('./pages/Setting'));
const About = React.lazy(() => import('./pages/About'));
const CableVisionComponent = React.lazy(() => import('./pages/CableVision/index'));

const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const mustChange = Boolean(user?.mustChangePassword);
  if (mustChange && location.pathname !== "/change-password") {
    localStorage.setItem("redirectTo", location.pathname);
    return <Navigate to="/change-password" replace state={{ from: location }} />;
  }

  return element;
};

const ProtectedPermissionRoute: React.FC<{ element: React.ReactElement; anyOf: string[] }> = ({ element, anyOf }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const mustChange = Boolean(user?.mustChangePassword);
  if (mustChange && location.pathname !== "/change-password") {
    localStorage.setItem("redirectTo", location.pathname);
    return <Navigate to="/change-password" replace state={{ from: location }} />;
  }

  if (!canAny(user, anyOf)) {
    return <Navigate to="/forbidden" replace />;
  }

  return element;
};

const FeatureRoute: React.FC<{ enabled: boolean; element: React.ReactElement }> = ({ enabled, element }) => {
  if (!enabled) return <Navigate to="/not-found" replace />;
  return element;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<div><Loader width={20} height={20}/>Loading...</div>}>
        <SidebarProvider>
          <AuthProvider>
            <CommandPalette />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/change-password" element={<ProtectedRoute element={<ChangePasswordComponent />} />} />
              <Route path="/reseller" element={<Navigate to="/dashboard" replace />} />
              <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
                <Route index element={<ProtectedRoute element={<Home />} />} />
                <Route path="dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
                <Route path="forbidden" element={<ProtectedRoute element={<ForbiddenComponent />} />} />
                <Route path="auth-users" element={<ProtectedRoute element={<AuthUsers />} />} />
                <Route path="settings" element={<ProtectedRoute element={<Setting />} />} />
                <Route path="about" element={<ProtectedRoute element={<About />} />} />
                <Route path="invoices" element={<ProtectedRoute element={<InvoicesComponent />} />} />
                <Route path="nas" element={<ProtectedRoute element={<NasComponent />} />} />
                <Route path="users/list" element={<ProtectedPermissionRoute anyOf={['users.view','reseller.users.view']} element={<UsersComponent />} />} />
                <Route path="users/new" element={<ProtectedPermissionRoute anyOf={['users.view','reseller.users.manage']} element={<AddUserComponent />} />} />
                <Route path="users/:username" element={<ProtectedPermissionRoute anyOf={['users.view','reseller.users.view']} element={<UserDetailComponent />} />} />
                <Route path="users/:username/sessions" element={<ProtectedPermissionRoute anyOf={['users.view','reseller.users.view']} element={<UserSessionsComponent />} />} />
                <Route path="profiles/list" element={<ProtectedRoute element={<ProfilesComponent />} />} />
                <Route path="/online-users" element={<ProtectedPermissionRoute anyOf={['users.online.view','reseller.users.view']} element={<OnlineUsersComponent />} />} />
                <Route path="/auth-failures" element={<ProtectedPermissionRoute anyOf={['users.online.view','reseller.users.view']} element={<AuthFailuresComponent />} />} />
                <Route
                  path="/invoice-upload"
                  element={
                    <FeatureRoute
                      enabled={isFeatureEnabled("invoice-upload")}
                      element={<ProtectedRoute element={<InvoiceUpload />} />}
                    />
                  }
                />
                <Route
                  path="/external-invoices"
                  element={
                    <FeatureRoute
                      enabled={isFeatureEnabled("external-invoices")}
                      element={<ProtectedRoute element={<ExternalInvoicesComponent />} />}
                    />
                  }
                />
                <Route path="/access" element={<ProtectedRoute element={<AccessComponent />} />} />
                <Route
                  path="/backups"
                  element={
                    <FeatureRoute
                      enabled={isFeatureEnabled("backups")}
                      element={<ProtectedPermissionRoute anyOf={['admin.access.manage']} element={<BackupsComponent />} />}
                    />
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <FeatureRoute enabled={isFeatureEnabled("analytics")} element={<ProtectedRoute element={<AnalyticsComponent />} />} />
                  }
                />
                <Route
                  path="/alerts"
                  element={
                    <FeatureRoute enabled={isFeatureEnabled("alerts")} element={<ProtectedRoute element={<AlertsComponent />} />} />
                  }
                />
                <Route
                  path="/collections"
                  element={
                    <FeatureRoute
                      enabled={isFeatureEnabled("collections")}
                      element={<ProtectedRoute element={<CollectionsComponent />} />}
                    />
                  }
                />
                <Route
                  path="/cable-vision"
                  element={<ProtectedPermissionRoute anyOf={["cablevision.accounts.view", "cablevision.accounts.manage"]} element={<CableVisionComponent />} />}
                />
                <Route path="expenses" element={<ProtectedRoute element={<ExpensesComponent />} />} />
                <Route path="/admin/resellers" element={<ProtectedRoute element={<ResellersComponent />} />} />
                <Route path="*" element={<ProtectedRoute element={<NotFoundComponent />} />} />
              </Route>
            </Routes>
          </AuthProvider>
        </SidebarProvider>
      </Suspense>
    </Router>
  );
};

const App: React.FC = () => {
  useEffect(() => {
    // Initialize WebSocket connection
    websocketService.connect();

    // Set up notification handler
    const unsubscribe = websocketService.onNotification((data) => {
      console.log('Received notification:', data);
      toast.info(data.message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      websocketService.disconnect();
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Xnet Pro Radius</title>
        <meta name="description" content="Xnet Radius Server" />
      </Helmet>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </QueryClientProvider>
      <ToastContainer />
      <Toaster />
    </>
  );
};

export default App;
