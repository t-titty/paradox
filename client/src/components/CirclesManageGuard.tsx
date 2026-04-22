import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext.tsx";

/**
 * Gate for /circles/manage routes. Base users — no admin grant, no active
 * subscription, and not an OWNER/ADMIN on any existing circle — are bounced
 * to /circles. Assumes <ProtectedRoute> has already ensured `user` is set.
 */
export function CirclesManageGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="brutal-heading text-bone">LOADING...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const allowed = Boolean(user.hasCircleAccess) || Boolean(user.ownsOrAdminsCircle);
  if (!allowed) return <Navigate to="/circles" replace />;

  return <>{children}</>;
}
