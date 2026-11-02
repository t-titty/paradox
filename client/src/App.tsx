import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header.tsx";
import { TestModeBanner } from "./components/TestModeBanner.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { AdminOnlyRoute } from "./components/AdminOnlyRoute.tsx";
import { CirclesManageGuard } from "./components/CirclesManageGuard.tsx";
import { NotificationPrompt } from "./components/NotificationPrompt.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.tsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.tsx";
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
import { WelcomePage } from "./pages/WelcomePage.tsx";
import { ParadoxesPage } from "./pages/ParadoxesPage.tsx";
import { PublicParadoxPage } from "./pages/PublicParadoxPage.tsx";
import { TribeWarsPage } from "./pages/TribeWarsPage.tsx";
import { LessonPlansPage } from "./pages/LessonPlansPage.tsx";
import { OpenBooksPage } from "./pages/OpenBooksPage.tsx";
import { SupportPage } from "./pages/SupportPage.tsx";
import { InstallPrompt } from "./components/InstallPrompt.tsx";

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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Public */}
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/how-to-play" element={<HowToPlayPage />} />
          <Route path="/paradoxes" element={<ParadoxesPage />} />
          <Route path="/p/:date" element={<PublicParadoxPage />} />
          <Route path="/tribe-wars" element={<TribeWarsPage />} />
          <Route path="/lesson-plans" element={<LessonPlansPage />} />
          <Route path="/open-books" element={<OpenBooksPage />} />
          <Route path="/support" element={<SupportPage />} />

          {/* Admin-only (Circles + Colosseum surface is hidden from
              non-admins for now — silently redirected to home). */}
          <Route
            path="/circles"
            element={
              <AdminOnlyRoute>
                <CirclesPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <AdminOnlyRoute>
                <PricingPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/pricing/cancel"
            element={
              <AdminOnlyRoute>
                <PricingCancelPage />
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/pricing/success"
            element={
              <AdminOnlyRoute>
                <PricingSuccessPage />
              </AdminOnlyRoute>
            }
          />
          {/* /colosseum is not a real route — it's the product name. Any
              typed or bookmarked URL forwards to the canonical /party,
              which is itself admin-gated below. */}
          <Route path="/colosseum" element={<Navigate to="/party" replace />} />

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
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            }
          />
          {/* Deep Dives are placeholder content — admin-only until written. */}
          <Route
            path="/library"
            element={
              <AdminOnlyRoute>
                <LibraryPage />
              </AdminOnlyRoute>
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
              <AdminOnlyRoute>
                <CirclesManageGuard>
                  <CirclesManagePage />
                </CirclesManageGuard>
              </AdminOnlyRoute>
            }
          />
          <Route
            path="/circles/manage/:circleId"
            element={
              <AdminOnlyRoute>
                <CirclesManageGuard>
                  <CirclesManagePage />
                </CirclesManageGuard>
              </AdminOnlyRoute>
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
              <AdminOnlyRoute>
                <PartyPage />
              </AdminOnlyRoute>
            }
          />

          {/* Admin — never redirects. Handles its own "404" for non-admins
              so the route is undiscoverable. */}
          <Route path="/admin" element={<AdminPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t-2 border-smoke px-4 py-6 md:px-6">
        <div className="flex flex-col gap-3 font-mono text-xs uppercase tracking-brutal text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 PARADOX. All rights reserved.</p>
          <nav className="flex flex-wrap gap-4">
            <Link to="/paradoxes" className="hover:text-gold">DILEMMAS</Link>
            <Link to="/tribe-wars" className="hover:text-gold">TRIBE WARS</Link>
            <Link to="/archive" className="hover:text-gold">ARCHIVE</Link>
            <Link to="/lesson-plans" className="hover:text-gold">FOR TEACHERS</Link>
            <Link to="/open-books" className="hover:text-gold">OPEN BOOKS</Link>
            <Link to="/support" className="hover:text-gold">SUPPORT</Link>
            <Link to="/terms" className="hover:text-gold">TERMS</Link>
          </nav>
        </div>
      </footer>
      <NotificationPrompt />
      <InstallPrompt />
    </div>
  );
}
