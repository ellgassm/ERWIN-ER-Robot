import ErwinFace from "@/components/ErwinFace";
import { ScreenBase, ErwinWordmark, StateLabel, MainText } from "@/components/ScreenBase";
import type { FollowupScreenProps } from "@/types/erwin";

function ThumbSign({ up }: { up: boolean }) {
  return (
    <svg width="92" height="92" viewBox="0 0 92 92" aria-label={up ? "thumbs up" : "thumbs down"}>
      <rect x="2" y="2" width="88" height="88" rx="22" fill="rgba(10,140,136,0.06)" stroke="#4a7a90" strokeWidth="2" />
      <g transform={up ? "" : "rotate(180 46 46)"}>
        <path d="M39 67H25c-4 0-7-3-7-7V45c0-4 3-7 7-7h14v29Z" fill="#c7dce7" stroke="#4a7a90" strokeWidth="2.5" />
        <path d="M39 38 48 18c2-5 10-3 10 2v13h12c5 0 8 5 6 9l-7 23c-1 3-4 5-7 5H39V38Z" fill="#c7dce7" stroke="#4a7a90" strokeWidth="2.5" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export default function FollowupScreen({ otherAssistance }: FollowupScreenProps) {
  const label = otherAssistance === "vitals" ? "a vitals check" : "a breathing exercise";
  return (
    <ScreenBase>
      <ErwinWordmark />
      <StateLabel label="ONE MORE OPTION" />
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", gap: "46px", padding: "58px 38px 36px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", width: "260px" }}>
          <ErwinFace expression="choosing" width={190} />
          <MainText size={25} style={{ textAlign: "center" }}>Would you also like<br />{label}?</MainText>
        </div>
        <div style={{ width: "1.5px", height: "245px", background: "rgba(10,140,136,0.14)" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "13px" }}>
          <div style={{ display: "flex", gap: "28px" }}>
            <div style={{ textAlign: "center" }}><ThumbSign up /><div style={{ marginTop: "5px", color: "#0a8c88", fontSize: "19px" }}>YES</div></div>
            <div style={{ textAlign: "center" }}><ThumbSign up={false} /><div style={{ marginTop: "5px", color: "#cc7a0a", fontSize: "19px" }}>NO</div></div>
          </div>
          <div style={{ color: "#5a8499", fontSize: "18px", textAlign: "center" }}>Hold a steady thumbs-up<br />or thumbs-down</div>
        </div>
      </div>
    </ScreenBase>
  );
}
