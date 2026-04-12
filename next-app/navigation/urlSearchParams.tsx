"use client";

import { useCallback, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams as useNextSearchParams } from "next/navigation";

export type SetURLSearchParams = (
  nextInit: URLSearchParams | ((prev: URLSearchParams) => URLSearchParams),
  opts?: { replace?: boolean }
) => void;

/** App Router equivalent of a `[params, setParams]` pair for shared table/page components. */
export function useSearchParams(): [URLSearchParams, SetURLSearchParams] {
  const router = useRouter();
  const pathname = usePathname();
  const nextSp = useNextSearchParams();

  const searchParams = useMemo(() => new URLSearchParams(nextSp?.toString() ?? ""), [nextSp]);

  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const setSearchParams = useCallback<SetURLSearchParams>(
    (nextInit, opts) => {
      const prev = searchParamsRef.current;
      const next = typeof nextInit === "function" ? nextInit(new URLSearchParams(prev.toString())) : nextInit;
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router]
  );

  return [searchParams, setSearchParams];
}
