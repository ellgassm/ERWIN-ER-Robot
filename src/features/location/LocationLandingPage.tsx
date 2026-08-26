import { Heart, MapPin } from "lucide-react";

export default function LocationLandingPage() {
  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-sm flex-col justify-center">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">ERWIN</p>
            <p className="text-sm text-muted-foreground">Emergency Department assistant</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/25">
            <Heart size={19} className="text-primary-foreground" fill="currentColor" />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <MapPin size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-black">Scan your waiting-area QR code</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Use your phone camera to open the location-specific ERWIN link. No patient information is stored when you scan.
          </p>
        </div>
      </section>
    </main>
  );
}
