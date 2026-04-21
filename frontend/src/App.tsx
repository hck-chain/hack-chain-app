import { lazy, Suspense } from 'react';
import { useModalScrollLock } from '@/hooks/useModalScrollLock';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
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
