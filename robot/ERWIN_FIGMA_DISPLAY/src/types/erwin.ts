// ─── ERWIN Robot Display — Type Definitions ───────────────────────────────────
//
// These types define the contract between the ERWIN HRI state machine and the
// robot display UI. Codex should connect these props/events to real controller
// data during integration; replace placeholder defaults with live values.

// ─── State Identifiers ────────────────────────────────────────────────────────

export type ErwinDisplayState =
  | "idle"
  | "queued"
  | "navigating"
  | "arriving"
  | "greeting"
  | "choosing_assistance"
  | "sensor_setup"
  | "measuring_heart_rate"
  | "breathing_exercise"
  | "pain_scale"
  | "processing"
  | "complete"
  | "review_alert"
  | "returning_home";

export interface DisplayStateMessage {
  version: 1;
  state: ErwinDisplayState;
  session_id?: string | null;
}

// ─── Screen Props ─────────────────────────────────────────────────────────────

export interface IdleScreenProps {
  // No dynamic data. Displayed when robot is docked/charging at base station.
}

export interface QueuedScreenProps {
  /** Patient's position in the assignment queue. Display placeholder if unknown. */
  queuePosition?: number;
  /** Human-readable estimated wait time, e.g. "~3 min". */
  estimatedWait?: string;
}

export interface NavigatingScreenProps {
  // No dynamic data. Robot is actively navigating; no patient interaction.
}

export interface ArrivingScreenProps {
  // No dynamic data. Robot has reached proximity of destination.
}

export interface GreetingScreenProps {
  /** Optional patient name for personalised greeting. */
  patientName?: string;
}

export interface AssistanceSelectionScreenProps {
  /**
   * ROBOT DISPLAY: Touch-interactive. Patient selects assistance type.
   * PHONE: Should show "Waiting for ERWIN…" or be idle.
   *
   * Emit this event when a selection is made; do NOT implement routing logic here.
   */
  onAssistanceSelected: (type: "vitals" | "breathing") => void;
}

export interface SensorSetupScreenProps {
  // Informational only. Waits for HRI controller to advance state.
  // Hardware involved: PPG finger sensor.
}

export type MeasurementStatus = "waiting" | "acquiring" | "measuring" | "complete" | "error";

export interface MeasuringHeartRateScreenProps {
  /**
   * Live BPM from PPG sensor. Undefined / null = not yet acquired (show "--").
   * Provided by the HRI controller / sensor bridge.
   */
  heartRate?: number | null;
  /** Current sensor acquisition status. */
  measurementStatus?: MeasurementStatus;
  /** Signal quality 0–100. Future use for quality indicator. */
  signalQuality?: number;
  /** Elapsed seconds since measurement began. */
  elapsedTime?: number;
}

export type PainInteractionMode =
  /** Patient touches robot display directly. */
  | "robot_display"
  /** Patient uses their phone; robot display shows a waiting message. */
  | "phone";

export interface PainScaleScreenProps {
  /**
   * Which interface collects the pain score.
   * HRI controller determines this; default to "robot_display" until phone UI exists.
   */
  interactionMode?: PainInteractionMode;
  /**
   * ROBOT DISPLAY: Touch-interactive (when interactionMode === "robot_display").
   * PHONE: Score submitted via phone app; robot display shows acknowledgement.
   *
   * Emit when patient selects a score. Do NOT implement routing logic here.
   */
  onPainScoreSelected: (score: number) => void;
}

export type BreathingPhase = "inhale" | "exhale";

export interface BreathingExerciseScreenProps {
  /** Called when the exercise animation begins. */
  onExerciseStarted?: () => void;
  /** Called each time the phase transitions between inhale and exhale. */
  onExercisePhaseChanged?: (phase: BreathingPhase) => void;
  /**
   * Called when the exercise is complete.
   * Currently the animation loops indefinitely; HRI controller should advance
   * the state externally when the session is done.
   */
  onExerciseCompleted?: () => void;
}

export interface ProcessingScreenProps {
  // Informational. Robot is computing / waiting for backend response.
}

export interface CompleteScreenProps {
  // Informational. HRI session has ended successfully.
}

export type AlertLevel = "info" | "caution" | "urgent";

export interface ReviewAlertScreenProps {
  /** Severity of the flagged condition. Defaults to "caution". */
  alertLevel?: AlertLevel;
  /** Heart rate reading that triggered the alert, if applicable. */
  heartRate?: number | null;
  /** Free-form note from the HRI controller or care team system. */
  notes?: string;
}

export interface ReturningHomeScreenProps {
  // Informational. Robot is navigating back to base station.
}

// ─── Aggregate prop map (used by RobotDisplay) ────────────────────────────────

export interface ScreenPropsMap {
  idle: IdleScreenProps;
  queued: QueuedScreenProps;
  navigating: NavigatingScreenProps;
  arriving: ArrivingScreenProps;
  greeting: GreetingScreenProps;
  choosing_assistance: AssistanceSelectionScreenProps;
  sensor_setup: SensorSetupScreenProps;
  measuring_heart_rate: MeasuringHeartRateScreenProps;
  breathing_exercise: BreathingExerciseScreenProps;
  pain_scale: PainScaleScreenProps;
  processing: ProcessingScreenProps;
  complete: CompleteScreenProps;
  review_alert: ReviewAlertScreenProps;
  returning_home: ReturningHomeScreenProps;
}

// ─── RobotDisplay top-level props ─────────────────────────────────────────────

export interface RobotDisplayProps {
  /** The active HRI state. Set by the ERWIN HRI state machine. */
  state: ErwinDisplayState;

  // ── Per-screen data (pass only what the active state needs) ──

  // queued
  queuePosition?: number;
  estimatedWait?: string;

  // greeting
  patientName?: string;

  // choosing_assistance
  onAssistanceSelected?: (type: "vitals" | "breathing") => void;

  // measuring_heart_rate
  heartRate?: number | null;
  measurementStatus?: MeasurementStatus;
  signalQuality?: number;
  elapsedTime?: number;

  // pain_scale
  interactionMode?: PainInteractionMode;
  onPainScoreSelected?: (score: number) => void;

  // breathing_exercise
  onExerciseStarted?: () => void;
  onExercisePhaseChanged?: (phase: BreathingPhase) => void;
  onExerciseCompleted?: () => void;

  // review_alert
  alertLevel?: AlertLevel;
  alertHeartRate?: number | null;
  alertNotes?: string;
}

// ─── Internal face expressions ────────────────────────────────────────────────

export type ErwinExpression =
  | "idle" | "queued" | "navigating" | "arriving" | "greeting"
  | "choosing" | "measuring" | "pain" | "processing"
  | "complete" | "alert" | "returning";
