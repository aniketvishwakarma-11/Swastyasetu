import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomeRedirect } from './features/HomeRedirect';
import { LoginView } from './features/auth/LoginView';
import { SignupView } from './features/auth/SignupView';
import { PHCDashboard } from './features/phc/PHCDashboard';
import { HospitalDashboard } from './features/hospital/HospitalDashboard';
import { CoordinatorDashboard } from './features/coordinator/CoordinatorDashboard';
import { AdminDashboard } from './features/admin/AdminDashboard';

function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  // Public Home Page OR Unauthenticated / Auth Pages View
  if (isHomePage || !user || isAuthPage) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
        {isAuthPage && <Navbar />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginView />} />
            <Route path="/signup" element={<SignupView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Authenticated Portal View (Matches User Reference Screenshot)
  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white overflow-hidden">
      {/* 1. Full-Height Collapsible Left Sidebar */}
      <Sidebar />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header with Global Search & Notification Controls */}
        <Navbar />

        {/* Scrollable Dashboard View */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<HomeRedirect />} />

            <Route
              path="/phc"
              element={
                <ProtectedRoute allowedRoles={['PHC_USER', 'ADMIN']}>
                  <PHCDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/hospital"
              element={
                <ProtectedRoute allowedRoles={['CLINICIAN', 'ADMIN']}>
                  <HospitalDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/triage"
              element={
                <ProtectedRoute allowedRoles={['REFERRAL_COORDINATOR', 'ADMIN']}>
                  <CoordinatorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
