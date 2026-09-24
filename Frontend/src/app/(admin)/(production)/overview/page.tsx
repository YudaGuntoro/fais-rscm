import type { Metadata } from "next";
import OverviewPage from "@/production/OverviewPage";

export const metadata: Metadata = { title: "Overview | RSCM" };

export default function Page() {
  return <OverviewPage />;
}
