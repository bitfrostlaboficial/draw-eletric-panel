import type { MeasureUnit } from "./editor-store";

/**
 * Escala física do editor: 1 pixel do panel = 1 mm.
 * Panel.width/height já são armazenados em milímetros.
 */
export const PX_PER_MM = 1;

export const mmToPx = (mm: number) => mm * PX_PER_MM;
export const pxToMm = (px: number) => px / PX_PER_MM;

export function formatMeasure(px: number, unit: MeasureUnit, decimals?: number): string {
  const mm = pxToMm(px);
  if (unit === "cm") {
    const cm = mm / 10;
    return `${cm.toFixed(decimals ?? (Math.abs(cm) >= 10 ? 1 : 2))} cm`;
  }
  return `${mm.toFixed(decimals ?? 0)} mm`;
}

/**
 * Escolhe um passo apropriado para tics da régua dependendo do zoom.
 * Retorna o passo em milímetros.
 */
export function pickRulerStep(zoom: number, unit: MeasureUnit): { major: number; minor: number } {
  // pixels por mm na tela
  const ppm = PX_PER_MM * zoom;
  // queremos ~50–80 px entre tics maiores
  const targetMajorPx = 60;
  const targetMm = targetMajorPx / ppm;
  const base = unit === "cm" ? 10 : 1;
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000];
  let major = base;
  for (const c of candidates) {
    if (c >= targetMm) {
      major = Math.max(base, c);
      break;
    }
    major = c;
  }
  const minor = major / 5;
  return { major, minor };
}
