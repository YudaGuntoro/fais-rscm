export type MapCoordinate = {
  label: string;
  x: number;
  y: number;
};

export type MapCoordinateSettings = Record<string, MapCoordinate>;

export const MAP_COORDINATE_STORAGE_KEY = "rscm-fais-map-coordinates";

export const defaultMapCoordinates: MapCoordinateSettings = {
  A: { label: "Zona A", x: 78, y: 55 },
  A1: { label: "Zona A - A1", x: 76, y: 54 },
  A2: { label: "Zona A - A2", x: 82, y: 48 },
  B: { label: "Zona B", x: 88, y: 66 },
  C: { label: "Zona C", x: 78, y: 67 },
  C1: { label: "Zona C - C1", x: 75, y: 65 },
  C2: { label: "Zona C - C2", x: 79, y: 65 },
  C3: { label: "Zona C - C3", x: 83, y: 66 },
  C4: { label: "Zona C - C4", x: 84, y: 72 },
  C5: { label: "Zona C - C5", x: 80, y: 72 },
  D: { label: "Zona D", x: 63, y: 72 },
  D1: { label: "Zona D - D1", x: 61, y: 61 },
  D2: { label: "Zona D - D2", x: 68, y: 61 },
  D3: { label: "Zona D - D3", x: 63, y: 68 },
  D4: { label: "Zona D - D4", x: 68, y: 73 },
  D5: { label: "Zona D - D5", x: 72, y: 79 },
  E: { label: "Zona E", x: 57, y: 76 },
  F: { label: "Zona F", x: 52, y: 67 },
  F1: { label: "Zona F - F1", x: 55, y: 58 },
  F2: { label: "Zona F - F2", x: 55, y: 64 },
  F3: { label: "Zona F - F3", x: 50, y: 70 },
  F4: { label: "Zona F - F4", x: 46, y: 70 },
  G: { label: "Zona G", x: 58, y: 43 },
  G1: { label: "Zona G - G1", x: 52, y: 43 },
  G2: { label: "Zona G - G2", x: 51, y: 50 },
  G3: { label: "Zona G - G3", x: 59, y: 45 },
  G4: { label: "Zona G - G4", x: 62, y: 43 },
  G5: { label: "Zona G - G5", x: 65, y: 43 },
  H: { label: "Zona H", x: 49, y: 32 },
  H1: { label: "Zona H - H1", x: 55, y: 29 },
  H2: { label: "Zona H - H2", x: 49, y: 38 },
  H3: { label: "Zona H - H3", x: 47, y: 46 },
  H4: { label: "Zona H - H4", x: 49, y: 25 },
  I: { label: "Zona I", x: 56, y: 35 },
  I1: { label: "Zona I - I1", x: 56, y: 35 },
  I2: { label: "Zona I - I2", x: 59, y: 35 },
};

export const mapCoordinateOptions = Object.entries(defaultMapCoordinates).map(([code, coordinate]) => ({
  code,
  label: coordinate.label,
})).filter((option) => /^[A-H]$/.test(option.code));

export function readMapCoordinateSettings(): MapCoordinateSettings {
  if (typeof window === "undefined") {
    return defaultMapCoordinates;
  }

  try {
    const stored = window.localStorage.getItem(MAP_COORDINATE_STORAGE_KEY);
    return stored ? { ...defaultMapCoordinates, ...JSON.parse(stored) } : defaultMapCoordinates;
  } catch {
    return defaultMapCoordinates;
  }
}

export function saveMapCoordinateSettings(settings: MapCoordinateSettings) {
  window.localStorage.setItem(MAP_COORDINATE_STORAGE_KEY, JSON.stringify(settings));
}
