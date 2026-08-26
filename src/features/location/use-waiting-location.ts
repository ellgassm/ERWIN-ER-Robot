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

    if (!locationCode) {
      setState({ status: "not-found", location: null, error: null });
      return () => {
        cancelled = true;
      };
    }

    setState({ status: "loading", location: null, error: null });
    locationRepository
      .findByCode(locationCode)
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
      });

    return () => {
      cancelled = true;
    };
  }, [locationCode]);

  return state;
}
