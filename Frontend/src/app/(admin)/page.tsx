import type { Metadata } from "next";
import ProductionDashboard from "@/production/ProductionDashboard";

export const metadata: Metadata = {
  title: "rscm-fais | RSCM",
  description: "rscm-fais and inspection monitoring dashboard",
};

export default function RSCMFAISHome() {
  return <ProductionDashboard />;
}
