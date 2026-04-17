import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api.ts";

interface TestModeState {
  testMode: boolean;
  loaded: boolean;
}

const TestModeContext = createContext<TestModeState>({ testMode: false, loaded: false });

/**
 * Polls /api/health once on mount to discover whether the server has
 * TEST_MODE enabled. Children read via useTestMode().
 */
export function TestModeProvider({ children }: { children: ReactNode }) {
  const [testMode, setTestMode] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ ok: boolean; testMode: boolean }>("/health")
      .then((r) => {
        if (!cancelled) {
          setTestMode(Boolean(r.data.testMode));
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <TestModeContext.Provider value={{ testMode, loaded }}>{children}</TestModeContext.Provider>
  );
}

export function useTestMode(): TestModeState {
  return useContext(TestModeContext);
}
