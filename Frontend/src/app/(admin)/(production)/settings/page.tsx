import type { Metadata } from "next";
import SettingPage from "@/production/SettingPage";

export const metadata: Metadata = { title: "Info | RSCM" };

export default function Page() {
  return <SettingPage />;
}
