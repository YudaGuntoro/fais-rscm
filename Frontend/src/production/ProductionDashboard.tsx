"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { apiGet } from "@/lib/api";
import { readMapCoordinateSettings, type MapCoordinateSettings } from "./mapCoordinateSettings";
import { readMqttConfiguration, type MqttSensorCode } from "./mqttConfiguration";

const SENSOR_ONLINE_WINDOW_MS = 60_000;
const sensorOrder: MqttSensorCode[] = ["SD1", "SD2", "HD1", "HD2", "MCP1", "MCP2", "MOD1", "SIR1"];

type SHMSStatus = {
  last_mqtt_at?: string | null;
  main_server?: MainServerStatus;
};

type MainServerStatus = {
  configured: boolean;
  server_name: string;
  endpoint_url?: string | null;
  online: boolean;
  outage_started_at?: string | null;
  downtime_seconds: number;
  last_success_at?: string | null;
  last_failure_at?: string | null;
  last_error?: string | null;
  redis_buffer_count: number;
  db_spillover_count: number;
};

type MqttBrokerStatus = {
  configured: boolean;
  host?: string;
  online: boolean;
  port?: number;
};

type LogBuffer = {
  id: number;
  device_id: string;
  payload: string;
  status?: string;
  time_stamp: string;
  uploaded_at?: string | null;
};

type PagedLogBuffer = {
  data: LogBuffer[];
  page_number: number;
  page_size: number;
  total_records: number;
  total_pages: number;
};

type DashboardState = {
  broker: MqttBrokerStatus | null;
  lastMqttAt: string | null;
  logs: LogBuffer[];
  mainServer: MainServerStatus | null;
  totalBuffered: number;
};

type SummaryCardProps = {
  accent: "red" | "green" | "blue" | "amber";
  iconSrc?: string;
  label: string;
  note: string;
  value: React.ReactNode;
};

type MapAlarm = {
  code: string;
  id: number;
  label: string;
  location: string;
  timeStamp: string;
  x: number;
  y: number;
  zone: string;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAlarmTime(value?: string | null) {
  const date = parseDate(value);
  return date
    ? date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        hour12: false,
        minute: "2-digit",
        second: "2-digit",
      }).replace(/\./g, ":")
    : "--:--:--";
}

function isRecent(value: string | null, now: number) {
  const date = parseDate(value);
  return date ? now - date.getTime() <= SENSOR_ONLINE_WINDOW_MS : false;
}

function getLogSensor(log: LogBuffer): MqttSensorCode | null {
  const source = `${log.device_id} ${log.payload}`.toUpperCase();
  return sensorOrder.find((code) => source.includes(code)) ?? null;
}

function readPayload(log: LogBuffer) {
  try {
    const parsed = JSON.parse(log.payload) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function firstText(payload: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function firstStatusText(payload: Record<string, unknown>, keys: string[], fallback: string) {
  return firstText(payload, keys) || fallback;
}

function createDummyMapAlarm(code: string, id: number, timeStamp: string, mapPoints: MapCoordinateSettings): MapAlarm {
  const point = mapPoints[code] ?? mapPoints.F2;

  return {
    code,
    id,
    label: point.label,
    location: point.label,
    timeStamp,
    x: point.x,
    y: point.y,
    zone: point.label.replace("Zona ", ""),
  };
}

function SummaryCard({ accent, iconSrc, label, note, value }: SummaryCardProps) {
  const accentClass = {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    green: "bg-emerald-500",
    red: "bg-red-500",
  }[accent];

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10 sm:px-4 sm:py-3">
      <div className="flex min-h-[48px] items-start gap-2.5 sm:min-h-[62px] sm:gap-3">
        <span className={`mt-1 h-8 w-1 rounded-full sm:mt-1.5 sm:h-9 ${accentClass}`} />
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-normal text-slate-500 dark:text-slate-400 sm:text-xs">{label}</p>
          <div className="mt-1 text-xl font-black leading-none tracking-normal text-slate-950 dark:text-white sm:mt-1.5 sm:text-2xl">{value}</div>
          <p className="mt-1 hidden truncate text-xs font-bold text-slate-500 dark:text-slate-400 sm:block">{note}</p>
        </div>
        {iconSrc ? (
          <span className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:ring-emerald-500/20 sm:size-11">
            <Image src={iconSrc} alt="" width={100} height={100} className="h-6 w-6 object-contain sm:h-7 sm:w-7" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AlarmIcon({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex items-center justify-center rounded-full bg-white ${className}`}>
      <Image
        src="/images/dashboard/alarm-icon.png"
        alt=""
        width={48}
        height={48}
        className="h-[62%] w-[62%] object-contain"
        priority
      />
    </span>
  );
}

export default function ProductionDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [configuration] = useState(() => readMqttConfiguration());
  const [mapPoints, setMapPoints] = useState<MapCoordinateSettings>(() => readMapCoordinateSettings());
  const [dashboard, setDashboard] = useState<DashboardState>({
    broker: null,
    lastMqttAt: null,
    logs: [],
    mainServer: null,
    totalBuffered: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const loadTime = Date.now();

    try {
      const [statusResult, brokerResult, bufferResult] = await Promise.allSettled([
        apiGet<SHMSStatus>("/api/rscm-fais/status"),
        apiGet<MqttBrokerStatus>("/api/rscm-fais/mqtt-broker/status"),
        apiGet<PagedLogBuffer>("/api/log-buffer?page=1&limit=50"),
      ]);

      const mainServer = statusResult.status === "fulfilled" ? statusResult.value.main_server ?? null : null;

      setNow(loadTime);
      setDashboard({
        broker: brokerResult.status === "fulfilled" ? brokerResult.value : null,
        lastMqttAt: statusResult.status === "fulfilled" ? statusResult.value.last_mqtt_at ?? null : null,
        logs: bufferResult.status === "fulfilled" ? bufferResult.value.data : [],
        mainServer,
        totalBuffered: mainServer?.redis_buffer_count ?? 0,
      });
    } catch (err) {
      toast.error({ message: err instanceof Error ? err.message : "Failed to load dashboard." });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const syncMapPoints = () => setMapPoints(readMapCoordinateSettings());
    window.addEventListener("storage", syncMapPoints);
    window.addEventListener("focus", syncMapPoints);
    return () => {
      window.removeEventListener("storage", syncMapPoints);
      window.removeEventListener("focus", syncMapPoints);
    };
  }, []);

  const sensorRows = useMemo(() => {
    return sensorOrder.map((code) => {
      const config = configuration.topics.find((topic) => topic.code === code);
      const logs = dashboard.logs.filter((log) => getLogSensor(log) === code);
      const lastAt = logs[0]?.time_stamp ?? null;
      const active = config?.enabled ?? false;

      return {
        active,
        code,
        lastAt,
        name: config?.name ?? code,
        online: active && isRecent(lastAt, now),
        topic: config?.topic ?? "-",
      };
    });
  }, [configuration.topics, dashboard.logs, now]);

  const troubleCount = sensorRows.filter((sensor) => sensor.active && !sensor.online).length;
  const supervisoryCount = dashboard.totalBuffered;
  const normalDeviceCount = sensorRows.filter((sensor) => sensor.active && sensor.online).length;
  const dummyMapAlarms = useMemo(() => {
    const timestamp = new Date(now).toISOString();
    return [createDummyMapAlarm("B", -1, timestamp, mapPoints), createDummyMapAlarm("F", -2, timestamp, mapPoints)];
  }, [mapPoints, now]);
  const mapAlarms = dummyMapAlarms;
  const activeAlarmCount = mapAlarms.length;
  const deviceCards = useMemo(
    () =>
      sensorRows
        .filter((sensor) => sensor.active)
        .map((sensor, index) => {
          const lastLog = dashboard.logs.find((log) => getLogSensor(log) === sensor.code);
          const payload = lastLog ? readPayload(lastLog) : {};
          const zoneCode = String.fromCharCode(65 + index);
          const alarm = mapAlarms.find((item) => item.code[0] === zoneCode || item.zone === zoneCode) ?? null;
          const fallbackZone = `Zone ${zoneCode}`;

          return {
            ...sensor,
            alarm,
            isAlarm: Boolean(alarm),
            lastAt: lastLog?.time_stamp ?? sensor.lastAt,
            zone: alarm?.zone ? `Zone ${alarm.zone.replace(/^Zona\s+/i, "")}` : firstStatusText(payload, ["zone", "zona", "area", "map_code", "mapCode"], fallbackZone),
          };
        }),
    [dashboard.logs, mapAlarms, sensorRows],
  );

  return (
    <div className="flex flex-col gap-3 xl:h-[calc(100vh-132px)] xl:min-h-[680px] xl:overflow-hidden">
      <section className="shrink-0 rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600 sm:text-xs">Fire Alarm Monitoring</p>
            <h1 className="mt-1 text-base font-black text-slate-900 dark:text-white sm:text-lg">RSUPN DR. CIPTO MANGUNKUSUMO</h1>
          </div>
          <p className="text-xs font-semibold text-slate-400">{loading ? "Refreshing..." : "Live dashboard"}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard accent="red" label="Alarm Aktif" note="Indikasi alarm aktif" value={activeAlarmCount} />
          <SummaryCard accent="amber" label="Trouble" note="Device perlu pengecekan" value={troubleCount} />
          <SummaryCard accent="blue" label="Supervisory" note="Data menunggu upload" value={supervisoryCount} />
          <SummaryCard
            accent="green"
            iconSrc="/images/dashboard/done-icon.png"
            label="Device Normal"
            note="Perangkat online"
            value={normalDeviceCount}
          />
        </div>
      </section>

      <section className="grid min-h-0 flex-1 gap-3 overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 xl:grid-cols-2">
        <aside className="flex min-h-0 flex-col gap-3 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10 sm:p-3">
          <div className="flex items-end justify-between gap-3 px-0.5">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-600 sm:text-xs">Device Monitoring</p>
              <h2 className="mt-1 text-sm font-black text-slate-950 dark:text-white sm:text-base">{deviceCards.length} Zona Terpantau</h2>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:px-3 sm:text-xs">
              Live
            </span>
          </div>

          <div className="grid min-h-0 grid-cols-2 gap-2 overflow-y-auto sm:gap-3 xl:grid-cols-4">
            {deviceCards.map((device) => {
              const statusStyle = device.isAlarm
                ? "border-red-200 bg-white shadow-red-100/60 dark:border-red-500/40 dark:bg-slate-950"
                : device.online
                  ? "border-emerald-200 bg-white shadow-emerald-100/60 dark:border-emerald-500/40 dark:bg-slate-950"
                  : "border-emerald-200 bg-white shadow-emerald-100/60 dark:border-emerald-500/40 dark:bg-slate-950";
              const title = device.isAlarm ? "ALARM" : "SAFE";

              return (
              <div
                className={`flex min-h-[132px] flex-col items-center justify-center rounded-lg border p-2.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:aspect-[1.05/1] sm:min-h-[126px] sm:p-3 ${statusStyle}`}
                key={device.code}
              >
                {device.isAlarm ? (
                  <AlarmIcon className="size-8 sm:size-10" />
                ) : (
                  <Image src="/images/dashboard/done-icon.png" alt="" width={100} height={100} className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
                )}
                <h3 className="mt-1.5 text-base font-black uppercase leading-none tracking-normal text-slate-950 dark:text-white sm:mt-2 sm:text-xl">{device.zone}</h3>
                <p className={`mt-1 text-base font-black uppercase leading-none sm:text-xl ${device.isAlarm ? "text-red-600" : "text-[#7ac943]"}`}>
                  {title}
                </p>
                {device.isAlarm ? (
                  <p className="mt-1 text-[11px] font-black leading-none text-slate-950 dark:text-white sm:mt-1.5 sm:text-xs">{formatAlarmTime(device.alarm?.timeStamp)}</p>
                ) : null}

                {device.isAlarm ? (
                  <button
                    className="mt-2 inline-flex min-h-7 w-full items-center justify-center rounded-md bg-red-600 px-2 text-[11px] font-black text-white shadow-sm shadow-red-500/20 transition hover:bg-red-700 sm:min-h-8 sm:px-3 sm:text-xs"
                    type="button"
                  >
                    Acknowledge
                  </button>
                ) : null}
              </div>
              );
            })}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col justify-center rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/10">
            <div className="flex min-h-[260px] flex-1 items-center justify-center overflow-hidden rounded-md bg-white sm:min-h-[420px]">
            <div className="relative w-full">
              <Image
                alt="Denah RSUPN Dr. Cipto Mangunkusumo"
                className="h-auto w-full select-none"
                height={1024}
                priority
                sizes="(min-width: 1280px) 1100px, 100vw"
                src="/images/dashboard/rscm-denah-v2.png"
                width={1536}
              />
              {mapAlarms.map((alarm, index) => (
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  key={`${alarm.id}-${index}`}
                  style={{ left: `${alarm.x}%`, top: `${alarm.y}%` }}
                >
                  <div className="relative flex flex-col items-center">
                    <div className="rounded bg-red-600 px-2 py-1.5 text-center text-[9px] font-black leading-tight text-white shadow-lg shadow-red-900/30 sm:rounded-md sm:px-3 sm:py-2 sm:text-xs">
                      ALARM
                      <br />
                      {alarm.label}
                    </div>
                    <span className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent border-t-red-600 sm:border-x-[8px] sm:border-t-[10px]" />
                    <AlarmIcon className="mt-0.5 size-5 ring-2 ring-white sm:mt-1 sm:size-8 sm:ring-4" />
                  </div>
                </div>
              ))}
            </div>
            </div>
        </div>
      </section>
    </div>
  );
}
