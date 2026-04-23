import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext.tsx";

/**
 * Gate for admin-only pages. Silently redirects to `/` when the user is
 * not an admin — and when they aren't authed at all. There is no
 * "access denied" UI: from a non-admin's perspective the page simply
 * isn't here. (Anon users land at `/`, which is itself `<ProtectedRoute>`
 * and bounces them on to `/login` — so the net flow for a logged-out
 * visitor is /admin-page → / → /login, all silent.)
 */
export function AdminOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="brutal-heading text-bone">LOADING...</p>
      </div>
    );
  }

  if (!user?.isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
