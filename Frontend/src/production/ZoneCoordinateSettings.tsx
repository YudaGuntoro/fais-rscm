"use client";

import Image from "next/image";
import { MouseEvent, useState } from "react";
import { useToast } from "@/context/ToastContext";
import {
  defaultMapCoordinates,
  mapCoordinateOptions,
  readMapCoordinateSettings,
  saveMapCoordinateSettings,
  type MapCoordinateSettings,
} from "./mapCoordinateSettings";

const inputClass = "mt-2 h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-400 focus:ring-3 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500";
const labelClass = "text-xs font-bold uppercase text-slate-600 dark:text-slate-300";

function numericValue(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function ZoneCoordinateSettings() {
  const toast = useToast();
  const [selectedZone, setSelectedZone] = useState("A");
  const [mapCoordinates, setMapCoordinates] = useState<MapCoordinateSettings>(() => readMapCoordinateSettings());
  const selectedCoordinate = mapCoordinates[selectedZone] ?? defaultMapCoordinates[selectedZone];

  function updateZoneCoordinate(zone: string, x: number, y: number) {
    const updated = {
      ...mapCoordinates,
      [zone]: {
        label: mapCoordinates[zone]?.label ?? defaultMapCoordinates[zone]?.label ?? `Zona ${zone}`,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
      },
    };

    setMapCoordinates(updated);
    saveMapCoordinateSettings(updated);
  }

  function handleCoordinateMapClick(event: MouseEvent<HTMLImageElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    updateZoneCoordinate(selectedZone, Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y)));
    toast.success({ message: `Koordinat ${selectedZone} diperbarui.` });
  }

  function resetZoneCoordinate() {
    const fallback = defaultMapCoordinates[selectedZone];
    if (!fallback) return;
    updateZoneCoordinate(selectedZone, fallback.x, fallback.y);
    toast.success({ message: `Koordinat ${selectedZone} dikembalikan ke default.` });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Map</p>
        <h2 className="mt-2 text-base font-bold text-slate-900 dark:text-white">Koordinat Zona</h2>
      </div>

      <div className="grid gap-5 px-5 py-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <label className={labelClass}>
            Pilih Zona
            <select className={inputClass} onChange={(event) => setSelectedZone(event.target.value)} value={selectedZone}>
              {mapCoordinateOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              X (%)
              <input
                className={inputClass}
                max={100}
                min={0}
                onChange={(event) => updateZoneCoordinate(selectedZone, numericValue(event.target.value, selectedCoordinate.x), selectedCoordinate.y)}
                step="0.01"
                type="number"
                value={selectedCoordinate.x}
              />
            </label>
            <label className={labelClass}>
              Y (%)
              <input
                className={inputClass}
                max={100}
                min={0}
                onChange={(event) => updateZoneCoordinate(selectedZone, selectedCoordinate.x, numericValue(event.target.value, selectedCoordinate.y))}
                step="0.01"
                type="number"
                value={selectedCoordinate.y}
              />
            </label>
          </div>

          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            onClick={resetZoneCoordinate}
            type="button"
          >
            Reset Zona Ini
          </button>

          <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs font-semibold leading-relaxed text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            Pilih zona, lalu klik posisi alarm pada gambar. Nilai X dan Y akan tersimpan otomatis.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
          <div className="relative overflow-hidden rounded-md bg-white">
            <Image
              alt="Denah koordinat zona"
              className="h-auto w-full cursor-crosshair select-none"
              height={1024}
              onClick={handleCoordinateMapClick}
              priority
              src="/images/dashboard/rscm-denah-v2.png"
              width={1536}
            />
            <div
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${selectedCoordinate.x}%`, top: `${selectedCoordinate.y}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="rounded-md bg-red-600 px-3 py-2 text-center text-xs font-black leading-tight text-white shadow-lg shadow-red-900/30">
                  {selectedZone}
                </span>
                <span className="h-0 w-0 border-x-[8px] border-t-[10px] border-x-transparent border-t-red-600" />
                <span className="size-4 rounded-full border-4 border-white bg-red-600 shadow-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
