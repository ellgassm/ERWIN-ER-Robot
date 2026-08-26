import { AlertCircle, CheckCircle2, MapPin, RefreshCw } from "lucide-react";

import { readLocationCode } from "./location-code";
import { useWaitingLocation } from "./use-waiting-location";
import PatientSessionPage from "@/features/session/PatientSessionPage";

function getCurrentLocationCode(): string | null {
  return typeof window === "undefined" ? null : readLocationCode(new URL(window.location.href));
}

export default function LocationRequestPage() {
  const locationCode = getCurrentLocationCode();
  const resolution = useWaitingLocation(locationCode);

  if (resolution.status === "success") return <PatientSessionPage location={resolution.location} />;

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm flex-col justify-center">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">ERWIN</p>
            <p className="text-sm text-muted-foreground">Emergency Department assistant</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/25">
            <MapPin size={19} className="text-primary-foreground" />
          </div>
        </div>

        {resolution.status === "loading" && (
          <div className="rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-secondary border-t-primary" />
            <h1 className="text-2xl font-black">Finding your waiting area…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Please wait while we verify this location.</p>
          </div>
        )}

        {resolution.status === "not-found" && (
          <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
            <AlertCircle size={42} className="mb-5 text-destructive" />
            <h1 className="text-2xl font-black">Waiting location not found</h1>
            <p className="mt-3 text-muted-foreground">
              Scan the QR code again or ask a staff member for help. This link does not include a valid waiting location.
            </p>
          </div>
        )}

        {resolution.status === "error" && (
          <div className="rounded-3xl border border-border bg-card p-7 shadow-sm">
            <AlertCircle size={42} className="mb-5 text-destructive" />
            <h1 className="text-2xl font-black">We couldn’t verify this location</h1>
            <p className="mt-3 text-muted-foreground">
              Please try again. If this continues, confirm the Vite Supabase environment variables and ask a staff member for help.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-5 font-bold text-primary-foreground"
            >
              <RefreshCw size={17} /> Try again
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
