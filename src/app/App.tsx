import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Heart, Check, Info, Phone, Clock, Bell } from "lucide-react";

import LocationRequestPage from "@/features/location/LocationRequestPage";

type Screen =
  | "signin"
  | "scan"
  | "scan-success"
  | "home"
  | "pain"
  | "complete";

const PAIN_DATA = [
  { value: 0, label: "No pain" },
  { value: 1, label: "Very mild" },
  { value: 2, label: "Mild" },
  { value: 3, label: "Mild" },
  { value: 4, label: "Moderate" },
  { value: 5, label: "Moderate" },
  { value: 6, label: "Uncomfortable" },
  { value: 7, label: "Severe" },
  { value: 8, label: "Severe" },
  { value: 9, label: "Very severe" },
  { value: 10, label: "Worst pain" },
];

const QR_CELLS = [
  1,0,1,1,0,1,0,0,1,1,0,1,0,1,1,0,1,0,0,1,1,0,1,0,1,
  0,1,0,1,1,0,1,1,0,1,1,0,0,1,0,1,1,0,1,1,0,0,1,1,0,
  1,1,0,0,1,0,1,0,1,0,0,1,1,0,1,0,1,1,0,0,1,0,1,0,1,
  0,0,1,0,1,1,0,1,1,0,1,0,1,1,0,1,0,0,1,0,1,1,0,1,0,
  1,0,0,1,0,1,1,0,0,1,0,1,0,1,0,1,1,0,1,1,0,0,1,0,1,
];

const STEP_MAP: Record<Screen, number> = {
  signin: 0,
  scan: 1,
  "scan-success": 1,
  home: 2,
  pain: 3,
  complete: 4,
};

function painClass(value: number) {
  if (value <= 3) return "bg-emerald-500 border-emerald-500 text-white";
  if (value <= 6) return "bg-amber-500 border-amber-500 text-white";
  return "bg-rose-600 border-rose-600 text-white";
}

const slideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -24 },
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [selectedPain, setSelectedPain] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [called, setCalled] = useState(false);

  const stepIndex = STEP_MAP[screen];

  if (typeof window !== "undefined" && window.location.pathname === "/request") {
    return <LocationRequestPage />;
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (firstName && lastName && dob) setScreen("scan");
  }

  function handleScan() {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      setScreen("scan-success");
      setTimeout(() => {
        setIsScanning(false);
        setScreen("home");
      }, 2300);
    }, 1800);
  }

  function handleReturnHome() {
    setSelectedPain(null);
    setCalled(false);
    setScreen("home");
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center">
      <div
        className="w-full max-w-sm min-h-screen flex flex-col bg-card shadow-2xl shadow-black/10 relative overflow-hidden"
        style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}
      >
        {/* Ambient shape */}
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, rgba(24,118,168,0.07) 0%, transparent 70%)",
          }}
        />

        {/* ── Header ── */}
        <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
          <div className="flex items-center gap-3">
            {screen === "scan" && (
              <button
                onClick={() => setScreen("signin")}
                aria-label="Go back"
                className="w-11 h-11 -ml-1 flex items-center justify-center rounded-full bg-secondary active:bg-muted transition-colors"
              >
                <ChevronLeft size={22} className="text-foreground" />
              </button>
            )}
            <div>
              <p
                className="text-muted-foreground font-bold uppercase"
                style={{ fontSize: "10px", letterSpacing: "0.12em" }}
              >
                Mercy General
              </p>
              <p className="text-muted-foreground" style={{ fontSize: "10px" }}>
                Emergency Department
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Heart size={17} className="text-primary-foreground" fill="currentColor" />
          </div>
        </header>

        {/* ── Step indicator ── */}
        <div className="relative z-10 flex items-center gap-1.5 px-5 pb-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === stepIndex
                  ? "flex-[3] bg-primary"
                  : i < stepIndex
                  ? "flex-1 bg-primary/40"
                  : "flex-1 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* ── Screens ── */}
        <div className="flex-1 flex flex-col relative z-10">
          <AnimatePresence mode="wait">

            {/* ─ Sign In ─ */}
            {screen === "signin" && (
              <motion.div
                key="signin"
                {...slideUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col px-5 pb-10"
              >
                <div className="mt-8 mb-8">
                  <h1
                    className="text-foreground font-black leading-tight mb-2"
                    style={{ fontSize: "28px" }}
                  >
                    Welcome — let's get you checked in.
                  </h1>
                  <p className="text-base text-muted-foreground">
                    This will only take a moment.
                  </p>
                </div>

                <form onSubmit={handleSignIn} className="flex flex-col gap-5 flex-1">
                  <div className="space-y-2">
                    <label htmlFor="fn" className="block text-sm font-bold text-foreground">
                      First Name
                    </label>
                    <input
                      id="fn"
                      type="text"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Your first name"
                      required
                      className="w-full h-14 px-4 rounded-2xl border-2 border-border bg-background text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:bg-card transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ln" className="block text-sm font-bold text-foreground">
                      Last Name
                    </label>
                    <input
                      id="ln"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Your last name"
                      required
                      className="w-full h-14 px-4 rounded-2xl border-2 border-border bg-background text-foreground text-base placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:bg-card transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="dob" className="block text-sm font-bold text-foreground">
                      Date of Birth
                    </label>
                    <input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      required
                      className="w-full h-14 px-4 rounded-2xl border-2 border-border bg-background text-foreground text-base focus:outline-none focus:border-primary focus:bg-card transition-all"
                    />
                  </div>

                  <div className="mt-auto pt-4">
                    <button
                      type="submit"
                      disabled={!firstName || !lastName || !dob}
                      className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-black shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform disabled:opacity-40"
                    >
                      Sign In
                    </button>
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Having trouble? Ask a staff member for help.
                    </p>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ─ Scan ─ */}
            {screen === "scan" && (
              <motion.div
                key="scan"
                {...slideUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col px-5 pb-10"
              >
                <div className="mt-6 mb-6">
                  <h2 className="text-2xl font-black text-foreground mb-2">
                    Scan Your Seat
                  </h2>
                  <p className="text-base text-muted-foreground">
                    Point your camera at the QR code on your seat.
                  </p>
                </div>

                <div className="mx-auto w-full max-w-[272px] aspect-square mb-8 rounded-3xl overflow-hidden bg-[#0d1c27] relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#142232] via-[#0d1c27] to-[#081319]" />

                  <div className="absolute inset-8">
                    {(
                      [
                        "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-lg",
                        "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-lg",
                        "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-lg",
                        "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-lg",
                      ] as const
                    ).map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 border-white/75 ${cls}`} />
                    ))}

                    {!isScanning && (
                      <motion.div
                        className="absolute left-0 right-0 h-0.5 rounded-full"
                        style={{
                          background:
                            "linear-gradient(to right, transparent, rgba(24,118,168,0.95), transparent)",
                          boxShadow: "0 0 10px 2px rgba(24,118,168,0.5)",
                        }}
                        animate={{ top: ["6%", "92%", "6%"] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}

                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 border-[3px] border-white/20 border-t-primary rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 opacity-[0.09]">
                    <div className="grid grid-cols-5 gap-0.5">
                      {QR_CELLS.slice(0, 25).map((cell, i) => (
                        <div
                          key={i}
                          className={`w-3 h-3 rounded-[1px] ${cell ? "bg-white" : "bg-transparent"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleScan}
                  disabled={isScanning}
                  className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-black shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform disabled:opacity-50 mb-4"
                >
                  {isScanning ? "Scanning…" : "Scan QR Code"}
                </button>
                <p className="text-center text-sm text-muted-foreground">
                  No QR code nearby? Ask a staff member.
                </p>
              </motion.div>
            )}

            {/* ─ Scan Success ─ */}
            {screen === "scan-success" && (
              <motion.div
                key="scan-success"
                {...slideUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col items-center justify-center px-5 pb-16"
              >
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="mb-8"
                >
                  <div className="w-28 h-28 rounded-full bg-accent/15 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/35">
                      <Check size={38} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="text-center"
                >
                  <p
                    className="font-bold text-muted-foreground uppercase mb-2"
                    style={{ fontSize: "11px", letterSpacing: "0.12em" }}
                  >
                    Checked In
                  </p>
                  <p className="font-black text-foreground mb-2" style={{ fontSize: "52px", lineHeight: 1 }}>
                    Seat A4
                  </p>
                  <p className="text-xl font-bold text-accent mb-3">You're all set!</p>
                  <p className="text-base text-muted-foreground">
                    Taking you to your waiting room…
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* ─ Home (idle + queued merged) ─ */}
            {screen === "home" && (
              <motion.div
                key="home"
                {...slideUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col px-5 pb-8"
              >
                {/* Greeting */}
                <div className="mt-5 mb-4">
                  <p className="text-sm text-muted-foreground font-semibold">
                    Good afternoon,
                  </p>
                  <h2 className="font-black text-foreground leading-tight" style={{ fontSize: "28px" }}>
                    {firstName || "Sarah"}
                  </h2>
                </div>

                {/* Seat chip */}
                <div className="flex items-center gap-3 bg-secondary rounded-2xl px-4 py-3 mb-6 border border-border">
                  <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20 shrink-0">
                    <span className="text-primary-foreground font-black text-sm">A4</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-muted-foreground uppercase mb-0.5" style={{ fontSize: "10px", letterSpacing: "0.1em" }}>
                      Your Seat
                    </p>
                    <p className="text-sm font-bold text-foreground">Section A · Seat 4</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-accent/15 rounded-full px-3 py-1.5 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs font-bold text-accent">Active</span>
                  </div>
                </div>

                {/* Big circle — morphs between idle and queued */}
                <div className="flex-1 flex flex-col items-center justify-center gap-5">
                  <motion.button
                    onClick={() => !called && setCalled(true)}
                    aria-label={called ? "Robot is on its way" : "Call for help — a care robot will come to your seat"}
                    aria-disabled={called}
                    animate={{
                      backgroundColor: called ? "#d8eef7" : "#1876a8",
                      boxShadow: called
                        ? "0 4px 20px rgba(24,118,168,0.08)"
                        : "0 20px 60px rgba(24,118,168,0.38), 0 8px 24px rgba(24,118,168,0.22)",
                    }}
                    transition={{ duration: 0.55, ease: "easeInOut" }}
                    className="w-[288px] h-[288px] rounded-full flex flex-col items-center justify-center gap-4 active:scale-95 transition-transform"
                    style={{ cursor: called ? "default" : "pointer" }}
                  >
                    <AnimatePresence mode="wait">
                      {!called ? (
                        <motion.div
                          key="idle-content"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.25 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <Phone size={56} className="text-white" fill="white" />
                          <span
                            className="text-white font-black text-center leading-tight"
                            style={{ fontSize: "26px" }}
                          >
                            Call for{"\n"}Help
                          </span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="queued-content"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.25 }}
                          className="flex flex-col items-center gap-4"
                        >
                          <Bell size={52} className="text-primary" strokeWidth={1.8} />
                          <span
                            className="text-primary font-black text-center leading-tight"
                            style={{ fontSize: "22px" }}
                          >
                            Robot is{"\n"}on its way
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  {/* Below-circle info — fades between states */}
                  <AnimatePresence mode="wait">
                    {!called ? (
                      <motion.p
                        key="idle-hint"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="text-sm text-muted-foreground text-center"
                      >
                        A care robot will come to your seat.
                      </motion.p>
                    ) : (
                      <motion.div
                        key="queued-info"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-black text-foreground" style={{ fontSize: "28px" }}>#2</span>
                          <span className="text-base font-bold text-muted-foreground">in line</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock size={13} />
                          <span className="text-sm font-semibold">Est. wait: 8–12 min</span>
                        </div>

                        {/* Demo button */}
                        <button
                          onClick={() => setScreen("pain")}
                          className="mt-3 h-10 px-5 rounded-xl border border-border text-sm font-bold text-muted-foreground active:bg-muted transition-colors"
                        >
                          Demo: Robot Arrived →
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ─ Pain Level ─ */}
            {screen === "pain" && (
              <motion.div
                key="pain"
                {...slideUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col px-5 pb-10"
              >
                <div className="mt-6 mb-5">
                  <h2 className="text-2xl font-black text-foreground mb-1.5">
                    How is your pain?
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Tap the number that best describes how you feel right now.
                  </p>
                </div>

                {/* Anchor faces */}
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex flex-col items-center">
                    <span style={{ fontSize: "36px", lineHeight: 1 }}>😊</span>
                    <span className="font-bold text-muted-foreground mt-1.5" style={{ fontSize: "11px" }}>
                      No pain
                    </span>
                  </div>
                  <div
                    className="flex-1 h-px mx-3 opacity-40"
                    style={{ background: "linear-gradient(to right, #10b981, #f59e0b, #ef4444)" }}
                  />
                  <div className="flex flex-col items-center">
                    <span style={{ fontSize: "36px", lineHeight: 1 }}>😭</span>
                    <span className="font-bold text-muted-foreground mt-1.5" style={{ fontSize: "11px" }}>
                      Worst
                    </span>
                  </div>
                </div>

                {/* Pain circles */}
                <div className="flex flex-wrap justify-center gap-2 mb-3">
                  {PAIN_DATA.map(({ value }) => {
                    const isSelected = selectedPain === value;
                    return (
                      <button
                        key={value}
                        onClick={() => setSelectedPain(value)}
                        aria-label={`Pain level ${value}`}
                        aria-pressed={isSelected}
                        className={[
                          "w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 transition-all duration-150 active:scale-90",
                          isSelected
                            ? `${painClass(value)} scale-110 shadow-md`
                            : "border-border bg-background text-foreground hover:border-primary/50",
                        ].join(" ")}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>

                {/* Selected label */}
                <div className="h-10 flex items-center justify-center mb-4">
                  <AnimatePresence mode="wait">
                    {selectedPain !== null && (
                      <motion.div
                        key={selectedPain}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2 bg-secondary rounded-full px-5 py-2 border border-border"
                      >
                        <span style={{ fontSize: "18px", lineHeight: 1 }}>
                          {selectedPain <= 3 ? "😊" : selectedPain <= 6 ? "😕" : "😣"}
                        </span>
                        <span className="text-sm font-bold text-foreground">
                          {PAIN_DATA[selectedPain].label}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Privacy note */}
                <div className="flex gap-2.5 bg-background border border-border rounded-2xl px-4 py-3.5 mb-6">
                  <Info size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Only you and your care team will see this. Your response is private and secure.
                  </p>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => { if (selectedPain !== null) setScreen("complete"); }}
                    disabled={selectedPain === null}
                    className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-black shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    Submit
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─ Session Complete ─ */}
            {screen === "complete" && (
              <motion.div
                key="complete"
                {...slideUp}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="flex-1 flex flex-col items-center justify-center px-5 pb-16"
              >
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="mb-8"
                >
                  <div className="w-32 h-32 rounded-full bg-accent/15 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center shadow-xl shadow-accent/35">
                      <Check size={44} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                  className="text-center mb-10"
                >
                  <h2 className="text-3xl font-black text-foreground mb-3">
                    Thanks, {firstName || "Sarah"}!
                  </h2>
                  <p className="text-lg font-bold text-foreground/80 mb-2">
                    Your care team has your latest vitals.
                  </p>
                  <p
                    className="text-muted-foreground leading-relaxed mx-auto"
                    style={{ maxWidth: "260px", fontSize: "15px" }}
                  >
                    A nurse will review your information and follow up with you shortly.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.48 }}
                  className="w-full"
                >
                  <button
                    onClick={handleReturnHome}
                    className="w-full h-16 rounded-2xl bg-primary text-primary-foreground text-lg font-black shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
                  >
                    Return to Waiting Room
                  </button>
                </motion.div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
