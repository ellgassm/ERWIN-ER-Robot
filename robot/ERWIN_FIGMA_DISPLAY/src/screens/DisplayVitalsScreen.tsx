import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { DisplayVitalsScreenProps } from "@/types/erwin";

export default function DisplayVitalsScreen({ heartRate, painLevel }: DisplayVitalsScreenProps) {
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="VITALS RECORDED" />
      <ErwinFace expression="measuring" width={210} />
      <MainText size={30}>Here is what I recorded</MainText>
      <div style={{ display: "flex", gap: "18px", marginTop: "24px" }}>
        <div style={{ padding: "18px 28px", borderRadius: "18px", background: "rgba(10,140,136,0.08)", textAlign: "center" }}>
          <div style={{ color: "#5a8499", fontSize: "17px" }}>Heart rate</div>
          <div style={{ color: "#0c2840", fontSize: "32px", fontWeight: 600 }}>{heartRate ?? "--"} BPM</div>
        </div>
        <div style={{ padding: "18px 28px", borderRadius: "18px", background: "rgba(204,122,10,0.08)", textAlign: "center" }}>
          <div style={{ color: "#5a8499", fontSize: "17px" }}>Pain</div>
          <div style={{ color: "#0c2840", fontSize: "32px", fontWeight: 600 }}>{painLevel ?? "--"}/10</div>
        </div>
      </div>
      <div style={{ marginTop: "20px", color: "#5a8499", fontSize: "18px" }}>Show a thumbs-up when you are ready.</div>
    </ScreenBase>
  );
}
