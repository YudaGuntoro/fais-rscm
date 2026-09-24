"use client";

import { ReactNode, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

const cardClass = "overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900";

type HealthState = "online" | "offline" | "unknown";

type SHMSStatus = {
  last_mqtt_at?: string | null;
};

type MqttBrokerStatus = {
  configured: boolean;
  host?: string;
  online: boolean;
  port?: number;
};

function formatStatus(status: HealthState) {
  if (status === "online") return "Online";
  if (status === "offline") return "Offline";
  return "Waiting";
}

function statusClass(status: HealthState) {
  if (status === "online") {
    return "bg-teal-50 text-teal-700 ring-teal-600/15 dark:bg-teal-500/10 dark:text-teal-200 dark:ring-teal-400/20";
  }

  if (status === "offline") {
    return "bg-red-50 text-red-700 ring-red-600/15 dark:bg-red-500/10 dark:text-red-200 dark:ring-red-400/20";
  }

  return "bg-slate-100 text-slate-600 ring-slate-500/15 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/25";
}

function InfoSection({ children, eyebrow, title }: { children: ReactNode; eyebrow?: string; title: string }) {
  return (
    <section className={cardClass}>
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p> : null}
        <h2 className={eyebrow ? "mt-2 text-base font-bold text-slate-900 dark:text-white" : "text-base font-bold text-slate-900 dark:text-white"}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function StatusCard({ label, note, status }: { label: string; note: string; status: HealthState }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(status)}`}>
        <span className={`size-2 rounded-full ${status === "online" ? "bg-teal-600" : status === "offline" ? "bg-red-600" : "bg-slate-400"}`} />
        {formatStatus(status)}
      </span>
      <p className="mt-4 text-sm font-bold text-slate-900 dark:text-white">{label}</p>
      <p className="mt-1 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  );
}

export default function SettingPage() {
  const [brokerStatus, setBrokerStatus] = useState<HealthState>("unknown");
  const [backendStatus, setBackendStatus] = useState<HealthState>("unknown");
  const [lastMqttAt, setLastMqttAt] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSystemInfo() {
      const [statusResult, brokerResult] = await Promise.allSettled([
        apiGet<SHMSStatus>("/api/rscm-fais/status"),
        apiGet<MqttBrokerStatus>("/api/rscm-fais/mqtt-broker/status"),
      ]);

      if (ignore) return;

      setBackendStatus(statusResult.status === "fulfilled" ? "online" : "offline");
      setLastMqttAt(statusResult.status === "fulfilled" ? statusResult.value.last_mqtt_at ?? null : null);
      setBrokerStatus(brokerResult.status === "fulfilled" && brokerResult.value.online ? "online" : "offline");
    }

    void loadSystemInfo();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">System</p>
        <h1 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Info</h1>
      </div>

      <InfoSection eyebrow="Runtime" title="System Info">
        <div className="grid gap-4 px-5 py-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatusCard label="Backend API" note="Local middleware API" status={backendStatus} />
          <StatusCard label="MQTT Broker" note="Broker connection" status={brokerStatus} />
          <StatusCard label="Last MQTT Received" note={lastMqttAt ? new Date(lastMqttAt).toLocaleString() : "No data"} status={lastMqttAt ? "online" : "unknown"} />
          <StatusCard label="App Version" note="v1.3.0" status="online" />
        </div>
      </InfoSection>
    </div>
  );
}
