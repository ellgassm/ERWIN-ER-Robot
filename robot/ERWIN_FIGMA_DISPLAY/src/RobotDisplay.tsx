// ─── ERWIN RobotDisplay ───────────────────────────────────────────────────────
//
// Top-level presentation component for the ERWIN robot touchscreen.
//
// USAGE:
//   <RobotDisplay state="idle" />
//   <RobotDisplay state="greeting" patientName="Alex" />
//   <RobotDisplay state="measuring_heart_rate" heartRate={72} measurementStatus="measuring" />
//
// The HRI state machine controls which state is active.
// This component only renders the corresponding screen — it does not manage
// state transitions, connect to ROS2, or call Supabase.
//
// INTEGRATION: Replace the hardcoded `state` prop with live state from
//   the ERWIN HRI state machine. Pass screen-specific props from the
//   controller to give each screen real data.

import IdleScreen from "@/screens/IdleScreen";
import QueuedScreen from "@/screens/QueuedScreen";
import NavigatingScreen from "@/screens/NavigatingScreen";
import ArrivingScreen from "@/screens/ArrivingScreen";
import GreetingScreen from "@/screens/GreetingScreen";
import AssistanceSelectionScreen from "@/screens/AssistanceSelectionScreen";
import SensorSetupScreen from "@/screens/SensorSetupScreen";
import MeasuringHeartRateScreen from "@/screens/MeasuringHeartRateScreen";
import PainScaleScreen from "@/screens/PainScaleScreen";
import BreathingExerciseScreen from "@/screens/BreathingExerciseScreen";
import ProcessingScreen from "@/screens/ProcessingScreen";
import CompleteScreen from "@/screens/CompleteScreen";
import ReviewAlertScreen from "@/screens/ReviewAlertScreen";
import ReturningHomeScreen from "@/screens/ReturningHomeScreen";

import type { RobotDisplayProps } from "@/types/erwin";

export default function RobotDisplay({
  state,
  // queued
  queuePosition,
  estimatedWait,
  // greeting
  patientName,
  // choosing_assistance
  onAssistanceSelected,
  // measuring_heart_rate
  heartRate,
  measurementStatus,
  signalQuality,
  elapsedTime,
  // pain_scale
  interactionMode,
  onPainScoreSelected,
  // breathing_exercise
  onExerciseStarted,
  onExercisePhaseChanged,
  onExerciseCompleted,
  // review_alert
  alertLevel,
  alertHeartRate,
  alertNotes,
}: RobotDisplayProps) {
  switch (state) {
    case "idle":
      return <IdleScreen />;

    case "queued":
      return <QueuedScreen queuePosition={queuePosition} estimatedWait={estimatedWait} />;

    case "navigating":
      return <NavigatingScreen />;

    case "arriving":
      return <ArrivingScreen />;

    case "greeting":
      return <GreetingScreen patientName={patientName} />;

    case "choosing_assistance":
      return (
        <AssistanceSelectionScreen
          onAssistanceSelected={onAssistanceSelected ?? (() => {})}
        />
      );

    case "sensor_setup":
      return <SensorSetupScreen />;

    case "measuring_heart_rate":
      return (
        <MeasuringHeartRateScreen
          heartRate={heartRate}
          measurementStatus={measurementStatus}
          signalQuality={signalQuality}
          elapsedTime={elapsedTime}
        />
      );

    case "pain_scale":
      return (
        <PainScaleScreen
          onPainScoreSelected={onPainScoreSelected ?? (() => {})}
          interactionMode={interactionMode}
        />
      );

    case "breathing_exercise":
      return (
        <BreathingExerciseScreen
          onExerciseStarted={onExerciseStarted}
          onExercisePhaseChanged={onExercisePhaseChanged}
          onExerciseCompleted={onExerciseCompleted}
        />
      );

    case "processing":
      return <ProcessingScreen />;

    case "complete":
      return <CompleteScreen />;

    case "review_alert":
      return (
        <ReviewAlertScreen
          alertLevel={alertLevel}
          heartRate={alertHeartRate}
          notes={alertNotes}
        />
      );

    case "returning_home":
      return <ReturningHomeScreen />;

    default:
      // Exhaustive check — TypeScript will flag unhandled states at compile time
      return <IdleScreen />;
  }
}

// Re-export the type so consumers don't need a separate import
export type { RobotDisplayProps, ErwinDisplayState } from "@/types/erwin";
