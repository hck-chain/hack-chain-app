import { lazy, Suspense } from 'react';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import CookieBanner from "./components/CookieBanner";

// Eagerly loaded — always needed on first paint
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy loaded — only when user navigates to these routes
const Login = lazy(() => import("./pages/Login"));
const NFTCreator = lazy(() => import("./pages/NFTCreator"));
const EducatorDashboard = lazy(() => import("./pages/EducatorDashboard"));
const TalentDashboard = lazy(() => import("./pages/TalentDashboard"));
const RecruiterDashboard = lazy(() => import("./pages/RecruiterDashboard"));
const TalentDetailDashboard = lazy(() => import("./pages/TalentDetailDashboard"));
const RegisterLanding = lazy(() => import("./pages/RegisterLanding"));
const RegisterUser = lazy(() => import("./pages/RegisterUser").then(m => ({ default: m.RegisterUser })));
const RegisterRecruiter = lazy(() => import("./pages/RegisterRecruiter").then(m => ({ default: m.RegisterRecruiter })));
const RegisterEducator = lazy(() => import("./pages/RegisterEducator"));
const MintCertificate = lazy(() => import("./utils/mintCertificate.jsx"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Contact = lazy(() => import("./pages/Contact"));
const TokenHack = lazy(() => import("./pages/TokenHack"));
const CookiePolicy = lazy(() => import("./pages/legal/CookiePolicy"));
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const BlockchainDisclaimer = lazy(() => import("./pages/legal/BlockchainDisclaimer"));
const EducatorProfile = lazy(() => import("./pages/EducatorProfile"));
const EditEducatorProfile = lazy(() => import("./pages/EditEducatorProfile"));
const EditEducatorClasses = lazy(() => import("./pages/EditEducatorClasses"));
const BookEducatorClass = lazy(() => import("./pages/BookEducatorClass"));
const TalentClasses = lazy(() => import("./pages/TalentClasses"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Referrals = lazy(() => import("./pages/Referrals"));
const EducatorsList = lazy(() => import("./pages/EducatorsList"));

// Admin dashboard — lazy-loaded shell + 4 sub-pages. AdminRoute pings the
// backend on mount to verify the wallet is in ADMIN_WALLETS; failed probe
// redirects out before any sub-page hydrates.
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminStatsPage = lazy(() => import("./pages/admin/AdminStatsPage"));
const AdminEducatorsPage = lazy(() => import("./pages/admin/AdminEducatorsPage"));
const AdminPaymentsPage = lazy(() => import("./pages/admin/AdminPaymentsPage"));
const AdminTreasuryPage = lazy(() => import("./pages/admin/AdminTreasuryPage"));

const queryClient = new QueryClient();

// Loading fallback for lazy-loaded routes
function PageLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
    </div>
  );
}

const App = () => {
  useModalScrollLock();
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <ScrollToTop />
          <ErrorBoundary>
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<RegisterLanding />} />
                <Route path="/register/user" element={<RegisterUser />} />
                <Route path="/register/recruiter" element={<RegisterRecruiter />} />
                <Route path="/register/issuer" element={<RegisterEducator />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/token" element={<TokenHack />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/nft-creator" element={<NFTCreator />} />

                {/* Protected routes — require authentication and role */}
                <Route path="/educator/dashboard" element={
                  <ProtectedRoute roles={['issuer']}>
                    <EducatorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/talent" element={
                  <ProtectedRoute roles={['student']}>
                    <TalentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/talent/classes" element={
                  <ProtectedRoute roles={['student']}>
                    <TalentClasses />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/recruiter" element={
                  <ProtectedRoute roles={['recruiter']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/recruiter/talent/:wallet_address" element={
                  <ProtectedRoute roles={['recruiter']}>
                    <TalentDetailDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/mint" element={
                  <ProtectedRoute roles={['issuer']}>
                    <MintCertificate />
                  </ProtectedRoute>
                } />
                <Route path="/referrals" element={
                  <ProtectedRoute roles={['student', 'issuer', 'recruiter']}>
                    <Referrals />
                  </ProtectedRoute>
                } />

                {/* Educator edit profile */}
                <Route path="/educator/profile/edit" element={
                  <ProtectedRoute roles={['issuer']}>
                    <EditEducatorProfile />
                  </ProtectedRoute>
                } />
                <Route path="/educator/classes/edit" element={
                  <ProtectedRoute roles={['issuer']}>
                    <EditEducatorClasses />
                  </ProtectedRoute>
                } />

                {/* Email verification */}
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Admin dashboard — gated by AdminRoute which probes the
                    backend for ADMIN_WALLETS membership. */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminStatsPage />} />
                  <Route path="educators" element={<AdminEducatorsPage />} />
                  <Route path="payments"  element={<AdminPaymentsPage />} />
                  <Route path="treasury"  element={<AdminTreasuryPage />} />
                </Route>

                {/* Educator public profile */}
                <Route path="/educators" element={<EducatorsList />} />
                <Route path="/educator/:wallet" element={<EducatorProfile />} />
                <Route path="/educator/:wallet/book" element={
                  <ProtectedRoute roles={['student']}>
                    <BookEducatorClass />
                  </ProtectedRoute>
                } />

                {/* Legal routes */}
                <Route path="/legal/cookies" element={<CookiePolicy />} />
                <Route path="/legal/privacy" element={<PrivacyPolicy />} />
                <Route path="/legal/terms" element={<TermsOfService />} />
                <Route path="/legal/blockchain" element={<BlockchainDisclaimer />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
          <CookieBanner />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
