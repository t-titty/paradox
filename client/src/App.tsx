import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header.tsx";
import { TestModeBanner } from "./components/TestModeBanner.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { TestModeProvider } from "./context/TestModeContext.tsx";
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
    <TestModeProvider>
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

          {/* Admin — never redirects. Handles its own "404" for non-admins
              so the route is undiscoverable. */}
          <Route path="/admin" element={<AdminPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
    </TestModeProvider>
  );
}
