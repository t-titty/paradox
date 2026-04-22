import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header.tsx";
import { TestModeBanner } from "./components/TestModeBanner.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { CirclesManageGuard } from "./components/CirclesManageGuard.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { TodayPage } from "./pages/TodayPage.tsx";
import { ArchivePage } from "./pages/ArchivePage.tsx";
import { LibraryPage } from "./pages/LibraryPage.tsx";
import { CirclesPage } from "./pages/CirclesPage.tsx";
import { FeedbackPage } from "./pages/FeedbackPage.tsx";
import { SubmitDilemmaPage } from "./pages/SubmitDilemmaPage.tsx";
import { AdminPage } from "./pages/AdminPage.tsx";
import { TermsPage } from "./pages/TermsPage.tsx";
import { HowToPlayPage } from "./pages/HowToPlayPage.tsx";
import { CirclesManagePage } from "./pages/CirclesManagePage.tsx";
import { JoinCirclePage } from "./pages/JoinCirclePage.tsx";
import { PartyPage } from "./pages/PartyPage.tsx";
import { PricingPage } from "./pages/PricingPage.tsx";
import { PricingSuccessPage } from "./pages/PricingSuccessPage.tsx";
import { PricingCancelPage } from "./pages/PricingCancelPage.tsx";

// ProfilePage pulls in Three.js + r3f (heavy). Code-split it so only users
// who visit /profile/* pay the download cost.
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage.tsx").then((m) => ({ default: m.ProfilePage })),
);

function LazyFallback() {
  return (
    <div className="flex h-full items-center justify-center p-16">
      <p className="brutal-heading text-xl text-muted">LOADING...</p>
    </div>
  );
}

export default function App() {
  return (
    <div className="flex min-h-full flex-col bg-ink text-bone">
      <TestModeBanner />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public */}
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/circles" element={<CirclesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/pricing/cancel" element={<PricingCancelPage />} />
          <Route
            path="/pricing/success"
            element={
              <ProtectedRoute>
                <PricingSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/how-to-play" element={<HowToPlayPage />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TodayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LazyFallback />}>
                  <ProfilePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:username"
            element={
              <Suspense fallback={<LazyFallback />}>
                <ProfilePage />
              </Suspense>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <LibraryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback"
            element={
              <ProtectedRoute>
                <FeedbackPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <SubmitDilemmaPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/circles/manage"
            element={
              <ProtectedRoute>
                <CirclesManageGuard>
                  <CirclesManagePage />
                </CirclesManageGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/circles/manage/:circleId"
            element={
              <ProtectedRoute>
                <CirclesManageGuard>
                  <CirclesManagePage />
                </CirclesManageGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/join/:code"
            element={
              <ProtectedRoute>
                <JoinCirclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/party"
            element={
              <ProtectedRoute>
                <PartyPage />
              </ProtectedRoute>
            }
          />

          {/* Admin — never redirects. Handles its own "404" for non-admins
              so the route is undiscoverable. */}
          <Route path="/admin" element={<AdminPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t-2 border-smoke px-4 py-6 md:px-6">
        <p className="font-mono text-xs uppercase tracking-brutal text-muted">
          © 2026 PARADOX. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
