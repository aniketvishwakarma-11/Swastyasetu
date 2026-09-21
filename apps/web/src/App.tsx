import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomeRedirect } from './features/HomeRedirect';
import { LoginView } from './features/auth/LoginView';
import { SignupView } from './features/auth/SignupView';
import { PHCDashboard } from './features/phc/PHCDashboard';
import { HospitalDashboard } from './features/hospital/HospitalDashboard';
import { CoordinatorDashboard } from './features/coordinator/CoordinatorDashboard';
import { AdminDashboard } from './features/admin/AdminDashboard';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Root redirect based on role */}
              <Route path="/" element={<HomeRedirect />} />

              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginView />} />
              <Route path="/signup" element={<SignupView />} />

              {/* Protected Role-Specific Dashboards */}
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

              {/* Fallback to root */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
