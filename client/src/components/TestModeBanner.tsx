import { useTestMode } from "../context/TestModeContext.tsx";

/**
 * Top-of-app banner shown only when the server reports TEST_MODE=true.
 * Renders nothing otherwise.
 */
export function TestModeBanner() {
  const { testMode } = useTestMode();
  if (!testMode) return null;
  return (
    <div className="border-b-2 border-gold bg-ink px-4 py-2 text-center font-mono text-xs uppercase tracking-brutal text-gold md:text-sm">
      TEST MODE — ALL PHASES UNLOCKED
    </div>
  );
}
