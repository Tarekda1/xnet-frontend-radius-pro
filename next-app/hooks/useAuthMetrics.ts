import { useEffect, useState } from "react";
import { apiClient } from "../api/client";

export type AuthMetrics = {
  windowSeconds: number;
  current: { attempts: number; accepted: number; rejected: number };
  previous: { attempts: number; accepted: number; rejected: number };
  changePct: { attempts: number; accepted: number; rejected: number };
};

export function useAuthMetrics(windowSeconds: number = 86400) {
  const [data, setData] = useState<AuthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await apiClient.get("/auth-metrics", { params: { windowSeconds } });
        if (cancelled) return;
        if (resp?.data?.success) setData(resp.data.data);
        else setData(null);
      } catch (e) {
        if (cancelled) return;
        setError(e);
        setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [windowSeconds]);

  return { data, isLoading, error };
}

