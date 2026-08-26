import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, HeartPulse, MapPin, Phone, XCircle } from "lucide-react";

import type { WaitingLocation } from "@/shared/domain";
import { SESSION_STATUSES, type SessionStatus } from "@/shared/session";
import { measurementRepository } from "@/data/supabase/measurement-repository";
import { patientRepository } from "@/data/supabase/patient-repository";
import { sessionRepository } from "@/data/supabase/session-repository";
import { triageRepository } from "@/data/supabase/triage-repository";
import { useSession } from "./use-session";

interface Props {
  location: WaitingLocation;
}

type Screen = "identify" | "waiting" | "choose" | "pain" | "heart-rate" | "review" | "complete";
type MeasurementPlan = Array<"pain" | "heart_rate">;

const SESSION_STORAGE_KEY = "erwin.patient.session-id";

function getStoredSessionId(): string | null {
  return typeof window === "undefined" ? null : window.sessionStorage.getItem(SESSION_STORAGE_KEY);
}

function statusLabel(status: SessionStatus): string {
  return status === "navigating" ? "ERWIN is on the way" : status[0].toUpperCase() + status.slice(1);
}

export default function PatientSessionPage({ location }: Props) {
  const [sessionId, setSessionId] = useState<string | null>(getStoredSessionId);
  const [screen, setScreen] = useState<Screen>(sessionId ? "waiting" : "identify");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pain, setPain] = useState<number | null>(null);
  const [heartRate, setHeartRate] = useState("78");
  const [plan, setPlan] = useState<MeasurementPlan>([]);
  const [recordedTypes, setRecordedTypes] = useState<Set<string>>(new Set());
  const [baseline, setBaseline] = useState<{ pain?: number; heart_rate?: number }>({});

  const { session, queuePosition, loading, error: sessionError } = useSession(sessionId);

  useEffect(() => {
    if (!session) return;
    if (session.status === "interacting" && screen === "waiting") setScreen("choose");
    if (session.status === "review") setScreen("review");
    if (session.status === "completed" || session.status === "cancelled") setScreen("complete");
  }, [screen, session]);

  useEffect(() => {
    if (screen !== "review" || !session?.patientId) return;
    triageRepository
      .findByPatientId(session.patientId)
      .then((assessments) => {
        const nextBaseline: { pain?: number; heart_rate?: number } = {};
        for (const assessment of assessments) nextBaseline[assessment.type] = assessment.value;
        setBaseline(nextBaseline);
      })
      .catch(() => setError("The latest baseline could not be loaded."));
  }, [screen, session?.patientId]);

  const currentStatus = session?.status;
  const statusProgress = useMemo(() => {
    const index = currentStatus ? SESSION_STATUSES.indexOf(currentStatus) : 0;
    return Math.max(0, index);
  }, [currentStatus]);

  async function requestErwin(forceAnonymous = false) {
    if (creating) return;
    const hasAnyIdentity = forceAnonymous ? "" : firstName || lastName || dateOfBirth;
    const hasCompleteIdentity = forceAnonymous ? "" : firstName && lastName && dateOfBirth;
    if (hasAnyIdentity && !hasCompleteIdentity) {
      setError("To identify yourself, enter your first name, last name, and date of birth.");
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const patient = hasCompleteIdentity
        ? await patientRepository.create({ firstName, lastName, dateOfBirth })
        : null;
      const created = await sessionRepository.create({ locationId: location.locationId, patientId: patient?.patientId });
      const queued = await sessionRepository.updateStatus(created.sessionId, "queued");
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, queued.sessionId);
      setSessionId(queued.sessionId);
      setScreen("waiting");
    } catch {
      setError("We couldn’t create your ERWIN request. Please try again or ask a staff member for help.");
    } finally {
      setCreating(false);
    }
  }

  async function cancelSession() {
    if (!sessionId) return;
    try {
      await sessionRepository.updateStatus(sessionId, "cancelled");
      setError(null);
    } catch {
      setError("We couldn’t cancel this request. Please ask a staff member for help.");
    }
  }

  function choosePlan(nextPlan: MeasurementPlan) {
    setPlan(nextPlan);
    setScreen(nextPlan.includes("pain") ? "pain" : "heart-rate");
  }

  async function saveMeasurement(type: "pain" | "heart_rate", value: number) {
    if (!sessionId) return;
    setError(null);
    try {
      await measurementRepository.record({ sessionId, type, value });
      const nextRecorded = new Set(recordedTypes);
      nextRecorded.add(type);
      setRecordedTypes(nextRecorded);
      if (type === "pain" && plan.includes("heart_rate")) setScreen("heart-rate");
      else if (type === "heart_rate" && plan.includes("pain") && !nextRecorded.has("pain")) setScreen("pain");
      else {
        await sessionRepository.updateStatus(sessionId, "review");
        setScreen("review");
      }
    } catch {
      setError("We couldn’t save that measurement. Please try again.");
    }
  }

  async function completeSession() {
    if (!sessionId) return;
    try {
      await sessionRepository.updateStatus(sessionId, "completed");
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      setScreen("complete");
    } catch {
      setError("We couldn’t complete this interaction. Please ask a staff member for help.");
    }
  }

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">ERWIN</p>
            <p className="text-sm text-muted-foreground">Emergency Department assistant</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary shadow-md shadow-primary/25">
            <HeartPulse size={19} className="text-primary-foreground" />
          </div>
        </header>

        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3">
          <MapPin size={19} className="shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-accent">Location recognized</p>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">Waiting location</p>
            <p className="truncate font-black">{location.name ?? `Waiting Area ${location.locationCode}`}</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {sessionError && (
          <div className="mb-5 flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>We couldn’t refresh your queue status. Please try again or ask a staff member for help.</p>
          </div>
        )}

        {screen === "identify" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-3xl font-black">Request ERWIN</h1>
            <p className="mt-2 text-muted-foreground">You can continue anonymously or optionally identify yourself for baseline comparison.</p>
            <div className="mt-6 space-y-3">
              <input aria-label="First name" value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name (optional)" className="h-12 w-full rounded-2xl border-2 border-border bg-background px-4" />
              <input aria-label="Last name" value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Last name (optional)" className="h-12 w-full rounded-2xl border-2 border-border bg-background px-4" />
              <input aria-label="Date of birth" type="date" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} className="h-12 w-full rounded-2xl border-2 border-border bg-background px-4" />
            </div>
            <button type="button" disabled={creating} onClick={() => void requestErwin()} className="mt-6 h-14 w-full rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-50">{creating ? "Requesting…" : "Call ERWIN"}</button>
            <button type="button" disabled={creating} onClick={() => void requestErwin(true)} className="mt-3 h-12 w-full rounded-2xl border border-border font-bold text-muted-foreground disabled:opacity-50">Continue anonymously</button>
          </div>
        )}

        {screen === "waiting" && (
          <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-secondary"><Phone size={32} className="text-primary" /></div>
            <h1 className="text-3xl font-black">{currentStatus ? statusLabel(currentStatus) : "Your request is being sent"}</h1>
            <p className="mt-2 text-muted-foreground">ERWIN will come to {location.locationCode}.</p>
            {(currentStatus === "requested" || currentStatus === "queued") && <p className="mt-5 flex items-center justify-center gap-2 font-bold text-primary"><Clock3 size={17} /> {queuePosition ? `Position ${queuePosition}` : "Joining the queue…"}</p>}
            {currentStatus === "navigating" && <p className="mt-5 font-bold text-primary">Navigating to {location.locationCode}</p>}
            <div className="mt-6 flex gap-1">{["queued", "navigating", "interacting", "measuring", "review"].map((step) => <div key={step} className={`h-2 flex-1 rounded-full ${SESSION_STATUSES.indexOf(step as SessionStatus) <= statusProgress ? "bg-primary" : "bg-muted"}`} />)}</div>
            <button type="button" onClick={() => void cancelSession()} className="mt-7 text-sm font-bold text-muted-foreground underline">Cancel request</button>
            {loading && <p className="mt-3 text-xs text-muted-foreground">Refreshing status…</p>}
          </div>
        )}

        {screen === "choose" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <CheckCircle2 size={42} className="mb-4 text-accent" />
            <h1 className="text-3xl font-black">ERWIN has arrived</h1>
            <p className="mt-2 text-muted-foreground">Choose an interaction to complete while you wait.</p>
            <div className="mt-6 space-y-3">
              <button type="button" onClick={() => choosePlan(["pain"])} className="h-14 w-full rounded-2xl bg-primary font-black text-primary-foreground">Pain scale</button>
              <button type="button" onClick={() => choosePlan(["heart_rate"])} className="h-14 w-full rounded-2xl border border-border font-black">Heart-rate check</button>
              <button type="button" onClick={() => choosePlan(["pain", "heart_rate"])} className="h-14 w-full rounded-2xl border border-border font-black">Both checks</button>
            </div>
          </div>
        )}

        {screen === "pain" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-3xl font-black">How is your pain?</h1>
            <p className="mt-2 text-muted-foreground">Tap the number that best describes how you feel right now.</p>
            <div className="mt-7 grid grid-cols-6 gap-2">{Array.from({ length: 11 }, (_, value) => <button key={value} type="button" onClick={() => setPain(value)} className={`h-11 rounded-full border-2 font-black ${pain === value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"}`}>{value}</button>)}</div>
            <button type="button" disabled={pain === null} onClick={() => pain !== null && void saveMeasurement("pain", pain)} className="mt-7 h-14 w-full rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-40">Save pain score</button>
          </div>
        )}

        {screen === "heart-rate" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-3xl font-black">Heart-rate check</h1>
            <p className="mt-2 text-muted-foreground">Mock sensor value for this local demonstration. The hardware adapter will replace this later.</p>
            <label className="mt-7 block text-sm font-bold">Heart rate (BPM)<input type="number" min="0" max="300" value={heartRate} onChange={(event) => setHeartRate(event.target.value)} className="mt-2 h-14 w-full rounded-2xl border-2 border-border bg-background px-4 text-2xl font-black" /></label>
            <button type="button" disabled={!heartRate || Number(heartRate) < 0 || Number(heartRate) > 300} onClick={() => void saveMeasurement("heart_rate", Number(heartRate))} className="mt-7 h-14 w-full rounded-2xl bg-primary font-black text-primary-foreground disabled:opacity-40">Save heart rate</button>
          </div>
        )}

        {screen === "review" && (
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h1 className="text-3xl font-black">Review complete</h1>
            <p className="mt-2 text-muted-foreground">Your measurements were recorded for this ERWIN session.</p>
            <div className="mt-6 space-y-3">{Array.from(recordedTypes).map((type) => <div key={type} className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3"><span className="font-bold">{type === "heart_rate" ? "Heart rate" : "Pain"}</span><span className="font-black">{type === "heart_rate" ? `${heartRate} BPM` : `${pain}/10`}</span></div>)}</div>
            {session?.patientId && <div className="mt-5 rounded-2xl border border-border px-4 py-3 text-sm"><p className="font-bold">Initial triage comparison</p>{Object.entries(baseline).map(([type, value]) => <p key={type} className="mt-1 text-muted-foreground">{type}: baseline {value} → current {type === "heart_rate" ? heartRate : pain}</p>)}</div>}
            {!session?.patientId && <p className="mt-5 text-sm text-muted-foreground">Anonymous sessions do not have an initial patient baseline to compare.</p>}
            <button type="button" onClick={() => void completeSession()} className="mt-7 h-14 w-full rounded-2xl bg-primary font-black text-primary-foreground">Complete session</button>
          </div>
        )}

        {screen === "complete" && (
          <div className="rounded-3xl border border-border bg-card p-7 text-center shadow-sm">
            {session?.status === "cancelled" ? <XCircle size={48} className="mx-auto mb-5 text-muted-foreground" /> : <CheckCircle2 size={48} className="mx-auto mb-5 text-accent" />}
            <h1 className="text-3xl font-black">{session?.status === "cancelled" ? "Request cancelled" : "Thanks — you’re all set"}</h1>
            <p className="mt-3 text-muted-foreground">Your ERWIN interaction is complete. A member of your care team can review the information.</p>
          </div>
        )}
      </section>
    </main>
  );
}
