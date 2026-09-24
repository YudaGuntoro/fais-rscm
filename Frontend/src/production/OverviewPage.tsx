"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { ApexOptions } from "apexcharts";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useLogBuffers } from "@/hooks/useLogBuffers";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type AlarmRow = {
  device: string;
  id: number;
  location: string;
  time: string;
  zone: string;
};

type RangeOption = "today" | "7d" | "30d";

const totalZones = 8;

const demoAlarmSeed = [
  { device: "FAIS-B-01", location: "PKIA RSCM Kiara", minuteOffset: 0, zone: "Zone B" },
  { device: "FAIS-F-01", location: "CMU 3 (ULB, CCC)", minuteOffset: 4, zone: "Zone F" },
  { device: "FAIS-A-02", location: "Unit Rawat Inap Terpadu Gedung A", minuteOffset: 38, zone: "Zone A" },
  { device: "FAIS-C-03", location: "Radioterapi", minuteOffset: 74, zone: "Zone C" },
  { device: "FAIS-D-01", location: "Satelit Farmasi Pusat", minuteOffset: 126, zone: "Zone D" },
  { device: "FAIS-H-04", location: "Geriatri", minuteOffset: 188, zone: "Zone H" },
  { device: "FAIS-G-03", location: "Unit Produksi Makanan", minuteOffset: 245, zone: "Zone G" },
  { device: "FAIS-E-01", location: "Lembaga Eijkman", minuteOffset: 318, zone: "Zone E" },
  { device: "FAIS-B-02", location: "PKIA RSCM Kiara", minuteOffset: 421, zone: "Zone B" },
  { device: "FAIS-F-02", location: "CMU 3 (ULB, CCC)", minuteOffset: 612, zone: "Zone F" },
  { device: "FAIS-C-06", location: "Klinik Edukasi Batuk", minuteOffset: 913, zone: "Zone C" },
  { device: "FAIS-A-06", location: "Cafeteria dan ATM", minuteOffset: 1217, zone: "Zone A" },
  { device: "FAIS-D-04", location: "Instalasi Gawat Darurat", minuteOffset: 1560, zone: "Zone D" },
  { device: "FAIS-H-01", location: "Psikiatri", minuteOffset: 1844, zone: "Zone H" },
];

const rangeLabels: Record<RangeOption, string> = {
  today: "Hari ini",
  "7d": "7 hari",
  "30d": "30 hari",
};

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getRangeStart(range: RangeOption) {
  const start = startOfToday();
  if (range === "7d") start.setDate(start.getDate() - 6);
  if (range === "30d") start.setDate(start.getDate() - 29);
  return start;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : dateTimeFormatter.format(date).replace(/\./g, ":");
}

function readPayload(payloadText: string) {
  try {
    const parsed = JSON.parse(payloadText) as Record<string, unknown>;
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

function normalizeZone(value: string) {
  const cleanValue = value.trim();
  if (!cleanValue) return "Zone";
  return cleanValue.toUpperCase().startsWith("ZONE") ? cleanValue : `Zone ${cleanValue}`;
}

function createDemoRows(): AlarmRow[] {
  return demoAlarmSeed.map((row, index) => ({
    ...row,
    id: -(index + 1),
    time: new Date(Date.now() - row.minuteOffset * 60_000).toISOString(),
  }));
}

function bucketLabel(date: Date, range: RangeOption) {
  if (range === "today") return `${date.getHours().toString().padStart(2, "0")}:00`;
  return shortDateFormatter.format(date);
}

function createBuckets(range: RangeOption, start: Date, end: Date) {
  const buckets: Array<{ end: Date; label: string; start: Date; value: number }> = [];

  if (range === "today") {
    for (let hour = 0; hour <= end.getHours(); hour += 1) {
      const bucketStart = new Date(start);
      bucketStart.setHours(hour, 0, 0, 0);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setHours(hour, 59, 59, 999);
      buckets.push({ end: bucketEnd, label: bucketLabel(bucketStart, range), start: bucketStart, value: 0 });
    }
    return buckets;
  }

  const cursor = new Date(start);
  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    bucketStart.setHours(0, 0, 0, 0);
    const bucketEnd = new Date(bucketStart);
    bucketEnd.setHours(23, 59, 59, 999);
    buckets.push({ end: bucketEnd, label: bucketLabel(bucketStart, range), start: bucketStart, value: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}

function SummaryCard({ label, note, tone, value }: { label: string; note: string; tone: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <span className={`block h-1.5 w-10 rounded-full ${tone}`} />
      <p className="mt-4 text-xs font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{note}</p>
    </div>
  );
}

export default function OverviewPage() {
  const { data, error, isLoading, refetch } = useLogBuffers({ limit: 500, page: 1 });
  const [range, setRange] = useState<RangeOption>("today");

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
        zone: normalizeZone(zone),
      };
    });

    return [...createDemoRows(), ...rows].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [data]);

  const overview = useMemo(() => {
    const end = new Date();
    const start = getRangeStart(range);
    const rangeRows = alarmRows.filter((row) => {
      const time = new Date(row.time).getTime();
      return !Number.isNaN(time) && time >= start.getTime() && time <= end.getTime();
    });

    const zoneMap = new Map<string, { count: number; devices: Set<string>; lastTime: string; location: string; zone: string }>();

    rangeRows.forEach((row) => {
      const current = zoneMap.get(row.zone);
      if (!current) {
        zoneMap.set(row.zone, {
          count: 1,
          devices: new Set([row.device]),
          lastTime: row.time,
          location: row.location,
          zone: row.zone,
        });
        return;
      }

      current.count += 1;
      current.devices.add(row.device);
      if (new Date(row.time).getTime() > new Date(current.lastTime).getTime()) {
        current.lastTime = row.time;
        current.location = row.location;
      }
    });

    const zoneSummary = Array.from(zoneMap.values())
      .map((item) => ({
        count: item.count,
        deviceCount: item.devices.size,
        lastTime: item.lastTime,
        location: item.location,
        zone: item.zone,
      }))
      .sort((a, b) => b.count - a.count || a.zone.localeCompare(b.zone));

    const buckets = createBuckets(range, start, end);
    rangeRows.forEach((row) => {
      const eventTime = new Date(row.time).getTime();
      const bucket = buckets.find((item) => eventTime >= item.start.getTime() && eventTime <= item.end.getTime());
      if (bucket) bucket.value += 1;
    });

    return {
      alarmCount: rangeRows.length,
      buckets,
      rangeRows,
      safeZoneCount: Math.max(totalZones - zoneSummary.length, 0),
      zoneSummary,
    };
  }, [alarmRows, range]);

  const peakBucket = overview.buckets.reduce((peak, item) => (item.value > peak.value ? item : peak), overview.buckets[0] ?? { label: "-", value: 0 });
  const topZone = overview.zoneSummary[0];

  const chartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
      type: "area",
    },
    colors: ["#dc2626"],
    dataLabels: { enabled: false },
    fill: {
      gradient: { opacityFrom: 0.28, opacityTo: 0.04 },
      type: "gradient",
    },
    grid: {
      borderColor: "#e2e8f0",
      strokeDashArray: 4,
    },
    markers: {
      size: 4,
      strokeColors: "#ffffff",
      strokeWidth: 2,
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    tooltip: {
      y: { formatter: (value) => `${value} alarm` },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { show: false },
      categories: overview.buckets.map((item) => item.label),
      labels: {
        rotate: -35,
        style: { colors: "#64748b", fontSize: "12px" },
      },
    },
    yaxis: {
      allowDecimals: false,
      labels: { style: { colors: ["#64748b"], fontSize: "12px" } },
    },
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Overview" />

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Alarm Overview</p>
            <h1 className="mt-2 text-xl font-black text-slate-950 dark:text-white">Review Alarm Berdasarkan Rentang Waktu</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
              Pantau jumlah alarm aktif, zona terdampak, peak time, dan riwayat kejadian dalam range yang dipilih.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-grid grid-cols-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
              {(Object.keys(rangeLabels) as RangeOption[]).map((option) => (
                <button
                  className={`h-9 px-3 text-xs font-black transition ${
                    range === option
                      ? "rounded-md bg-white text-brand-600 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                  key={option}
                  onClick={() => setRange(option)}
                  type="button"
                >
                  {rangeLabels[option]}
                </button>
              ))}
            </div>
            <button
              className="inline-flex h-11 items-center justify-center rounded-lg bg-brand-500 px-4 text-sm font-bold text-white transition hover:bg-brand-600 disabled:opacity-60"
              disabled={isLoading}
              onClick={() => refetch()}
              type="button"
            >
              {isLoading ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Alarm" note={`Akumulasi ${rangeLabels[range]}`} tone="bg-red-600" value={overview.alarmCount} />
          <SummaryCard label="Zona Alarm" note="Zona yang muncul dalam range" tone="bg-amber-500" value={overview.zoneSummary.length} />
          <SummaryCard label="Peak Time" note={`${peakBucket.value} alarm tercatat`} tone="bg-blue-500" value={peakBucket.label} />
          <SummaryCard label="Safe Zone" note="Tidak muncul alarm pada range" tone="bg-emerald-500" value={overview.safeZoneCount} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.55fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Active Alarm Trend</p>
              <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">Grafik Alarm Aktif</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">{rangeLabels[range]}</span>
          </div>

          <div className="min-h-[320px]">
            <ReactApexChart options={chartOptions} series={[{ data: overview.buckets.map((item) => item.value), name: "Alarm aktif" }]} type="area" height={315} />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Zone Review</p>
            <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">Zona Alarm Terbanyak</h2>
          </div>

          <div className="space-y-3">
            {overview.zoneSummary.length ? (
              overview.zoneSummary.slice(0, 6).map((zone) => {
                const percentage = Math.max((zone.count / Math.max(overview.alarmCount, 1)) * 100, 6);
                return (
                  <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800" key={zone.zone}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black text-slate-950 dark:text-white">{zone.zone}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{zone.location}</p>
                      </div>
                      <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">{zone.count}</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${percentage}%` }} />
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      {zone.deviceCount} device, terakhir {formatDateTime(zone.lastTime)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Tidak ada alarm pada range ini.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.65fr_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Range Summary</p>
            <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">Rekap Range</h2>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <span className="font-bold text-slate-500 dark:text-slate-400">Range</span>
              <span className="font-black text-slate-950 dark:text-white">{rangeLabels[range]}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400">Total Alarm</span>
              <span className="font-black text-slate-950 dark:text-white">{overview.alarmCount}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400">Zona Terdampak</span>
              <span className="font-black text-slate-950 dark:text-white">{overview.zoneSummary.length}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] border-b border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <span className="font-bold text-slate-500 dark:text-slate-400">Zona Tertinggi</span>
              <span className="font-black text-slate-950 dark:text-white">{topZone ? `${topZone.zone} (${topZone.count})` : "-"}</span>
            </div>
            <div className="grid grid-cols-[1fr_auto] px-4 py-3 text-sm">
              <span className="font-bold text-slate-500 dark:text-slate-400">Peak Time</span>
              <span className="font-black text-slate-950 dark:text-white">{peakBucket.value ? `${peakBucket.label} (${peakBucket.value})` : "-"}</span>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Alarm Detail</p>
              <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">Kejadian Terbaru Dalam Range</h2>
            </div>
            <span className="text-xs font-bold text-slate-400">{overview.rangeRows.length} record</span>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full min-w-[720px] divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
                <thead className="sticky top-0 bg-slate-50 text-xs font-black uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Zone</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {overview.rangeRows.slice(0, 20).map((row) => (
                    <tr className="align-top" key={row.id}>
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-600 dark:text-slate-300">{formatDateTime(row.time)}</td>
                      <td className="whitespace-nowrap px-4 py-4 font-black text-slate-950 dark:text-white">{row.zone}</td>
                      <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">{row.location}</td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-500 dark:text-slate-400">{row.device}</td>
                    </tr>
                  ))}
                  {!overview.rangeRows.length ? (
                    <tr>
                      <td className="px-4 py-8 text-center font-bold text-slate-400" colSpan={4}>
                        Tidak ada kejadian pada range ini.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
