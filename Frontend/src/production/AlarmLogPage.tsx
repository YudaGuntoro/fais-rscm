"use client";

import { useMemo } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useLogBuffers } from "@/hooks/useLogBuffers";

type AlarmRow = {
  id: number;
  time: string;
  zone: string;
  location: string;
  device: string;
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

const demoAlarmSeed = [
  {
    device: "FAIS-B-01",
    location: "Zone B - PKIA RSCM Kiara",
    minuteOffset: 0,
    zone: "Zone B",
  },
  {
    device: "FAIS-F-01",
    location: "Zone F - Utility Building",
    minuteOffset: 4,
    zone: "Zone F",
  },
  {
    device: "FAIS-A-02",
    location: "Zone A - Unit Rawat Inap Terpadu Gedung A",
    minuteOffset: 38,
    zone: "Zone A",
  },
  {
    device: "FAIS-C-03",
    location: "Zone C - Radioterapi",
    minuteOffset: 74,
    zone: "Zone C",
  },
  {
    device: "FAIS-D-01",
    location: "Zone D - Satelit Farmasi Pusat",
    minuteOffset: 126,
    zone: "Zone D",
  },
  {
    device: "FAIS-H-04",
    location: "Zone H - Geriatri",
    minuteOffset: 188,
    zone: "Zone H",
  },
  {
    device: "FAIS-G-03",
    location: "Zone G - Unit Produksi Makanan",
    minuteOffset: 245,
    zone: "Zone G",
  },
  {
    device: "FAIS-E-01",
    location: "Zone E - Lembaga Eijkman",
    minuteOffset: 318,
    zone: "Zone E",
  },
  {
    device: "FAIS-B-02",
    location: "Zone B - PKIA RSCM Kiara",
    minuteOffset: 421,
    zone: "Zone B",
  },
  {
    device: "FAIS-F-02",
    location: "Zone F - CMU 3 (ULB, CCC)",
    minuteOffset: 612,
    zone: "Zone F",
  },
  {
    device: "FAIS-C-06",
    location: "Zone C - Klinik Edukasi Batuk",
    minuteOffset: 913,
    zone: "Zone C",
  },
  {
    device: "FAIS-A-06",
    location: "Zone A - Cafeteria dan ATM",
    minuteOffset: 1217,
    zone: "Zone A",
  },
  {
    device: "FAIS-D-04",
    location: "Zone D - Instalasi Gawat Darurat",
    minuteOffset: 1560,
    zone: "Zone D",
  },
  {
    device: "FAIS-H-01",
    location: "Zone H - Psikiatri",
    minuteOffset: 1844,
    zone: "Zone H",
  },
];

const demoAlarmRows: AlarmRow[] = demoAlarmSeed.map((row, index) => ({
  ...row,
  id: -(index + 1),
  time: new Date(Date.now() - row.minuteOffset * 60_000).toISOString(),
}));

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateFormatter.format(date).replace(/\./g, ":");
}

function readPayload(payload: string) {
  try {
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function firstText(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  return "";
}

function isAlarmPayload(payloadText: string) {
  return payloadText.toUpperCase().includes("ALARM");
}

export default function AlarmLogPage() {
  const { data, isLoading, refetch } = useLogBuffers({ limit: 50, page: 1 });

  const alarmRows = useMemo<AlarmRow[]>(() => {
    const rows = data.filter((item) => isAlarmPayload(item.payload)).map((item) => {
      const payload = readPayload(item.payload);
      const zone = firstText(payload, ["zone", "zona", "area", "map_code", "mapCode"]) || "Zone";
      const location = firstText(payload, ["location", "lokasi", "room", "ruang", "building", "gedung"]) || item.device_id;

      return {
        device: item.device_id,
        id: item.id,
        location,
        time: item.time_stamp,
        zone: zone.toUpperCase().startsWith("ZONE") ? zone : `Zone ${zone}`,
      };
    });

    return [...demoAlarmRows, ...rows];
  }, [data]);

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Log Alarm" />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Fire Alarm Event</p>
            <h1 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Log Alarm</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">Active alarm indications and zone event history.</p>
          </div>
          <button
            className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
            disabled={isLoading}
            onClick={() => refetch()}
            type="button"
          >
            {isLoading ? "Refreshing" : "Refresh"}
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
              <thead className="bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Zone</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Device</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                {alarmRows.map((row) => (
                  <tr className="align-top" key={row.id}>
                    <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-600 dark:text-slate-300">{formatDate(row.time)}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-black text-slate-950 dark:text-white">{row.zone}</td>
                    <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{row.location}</td>
                    <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-500 dark:text-slate-400">{row.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
