import { useEffect, useState } from "react";

import { locationRepository } from "@/data/supabase/location-repository";
import type { WaitingLocation } from "@/shared/domain";

export type LocationResolutionState =
  | { status: "loading"; location: null; error: null }
  | { status: "success"; location: WaitingLocation; error: null }
  | { status: "not-found"; location: null; error: null }
  | { status: "error"; location: null; error: Error };

export function useWaitingLocation(locationCode: string | null): LocationResolutionState {
  const [state, setState] = useState<LocationResolutionState>(() =>
    locationCode
      ? { status: "loading", location: null, error: null }
      : { status: "not-found", location: null, error: null },
  );

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    if (!locationCode) {
      setState({ status: "not-found", location: null, error: null });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: "loading", location: null, error: null });
    // Resolve on a microtask so synchronous configuration errors are handled
    // by the same error path as asynchronous Supabase failures.
    const lookup = Promise.resolve().then(() => locationRepository.findByCode(locationCode));
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => reject(new Error("Location lookup timed out.")), 10000);
    });

    Promise.race([lookup, timeout])
      .then((location) => {
        if (cancelled) return;
        setState(
          location
            ? { status: "success", location, error: null }
            : { status: "not-found", location: null, error: null },
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          location: null,
          error: error instanceof Error ? error : new Error("Unable to resolve location."),
        });
      })
      .finally(() => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      });

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [locationCode]);

  return state;
}
