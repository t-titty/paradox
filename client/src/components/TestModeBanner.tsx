import { useAuth } from "../context/AuthContext.tsx";

/**
 * Top-of-app banner shown only when the authenticated user has effective
 * test mode active (system env.TEST_MODE OR admin-granted per-user flag).
 * Regular users never see this banner — even when TEST_MODE is off, the
 * server-derived flag on the User DTO drives visibility.
 */
export function TestModeBanner() {
  const { user } = useAuth();
  if (!user?.testMode) return null;
  return (
    <div className="border-b-2 border-gold bg-ink px-4 py-2 text-center font-mono text-xs uppercase tracking-brutal text-gold md:text-sm">
      TEST MODE — ALL PHASES UNLOCKED
    </div>
  );
}
