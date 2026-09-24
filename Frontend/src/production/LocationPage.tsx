"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ZoneCoordinateSettings from "./ZoneCoordinateSettings";

export default function LocationPage() {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Location" />
      <ZoneCoordinateSettings />
    </div>
  );
}
