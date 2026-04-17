import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import { LoginPage } from "./pages/LoginPage.tsx";
import { RegisterPage } from "./pages/RegisterPage.tsx";
import { TodayPage } from "./pages/TodayPage.tsx";
import { ArchivePage } from "./pages/ArchivePage.tsx";
import { LibraryPage } from "./pages/LibraryPage.tsx";
import { CirclesPage } from "./pages/CirclesPage.tsx";

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
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public */}
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/circles" element={<CirclesPage />} />

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

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
