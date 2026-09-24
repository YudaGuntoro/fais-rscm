import type { Metadata } from "next";
import AlarmLogPage from "@/production/AlarmLogPage";

export const metadata: Metadata = { title: "Log Alarm | RSCM" };

export default function Page() {
  return <AlarmLogPage />;
}
