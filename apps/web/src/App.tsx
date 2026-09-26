import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import { NotFoundPage } from './features/error/NotFoundPage';
import { PrivacyPolicyPage } from './features/legal/PrivacyPolicyPage';
import { TermsPage } from './features/legal/TermsPage';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { MobileQuickBar } from './components/MobileQuickBar';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineStatusBar } from './components/OfflineStatusBar';
import { usePageMeta } from './hooks/usePageMeta';
import { useNetworkSync } from './lib/useNetworkSync';

function AppLayout() {
  const location = useLocation();
  const { isOnline, isSyncing, pendingCount, failedCount, lastSyncTime, syncNow, retryFailed } =
    useNetworkSync();

  // Apply dynamic SEO title and meta descriptions on route change
  usePageMeta();

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-teal-500 selection:text-white pb-14 md:pb-0">
      {/* Global Offline / Sync Status Bar */}
      <OfflineStatusBar
        isOnline={isOnline}
        isSyncing={isSyncing}
        pendingCount={pendingCount}
        failedCount={failedCount}
        lastSyncTime={lastSyncTime}
        onSyncNow={syncNow}
        onRetryFailed={retryFailed}
      />
      {/* Top Header with Navigation & Controls (except on homepage which has its own hero PublicHeader) */}
      {!isHomePage && <Navbar />}

      {/* Main Content Viewport */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginView />} />
          <Route path="/signup" element={<SignupView />} />

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

          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <CookieConsentBanner />
      <MobileQuickBar />
      <PWAInstallBanner />
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
