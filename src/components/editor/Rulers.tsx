import { useEditor } from "@/lib/editor-store";
import { formatMeasure, mmToPx, pickRulerStep } from "@/lib/measurement";

const RULER_SIZE = 28;

/**
 * Réguas estilo Canva/Figma posicionadas sobre o canvas.
 * `offsetX` / `offsetY` são os pixels (já com zoom) entre a borda do wrapper
 * absoluto do canvas e a borda do panel renderizado.
 */
export function Rulers({
  panelWidth,
  panelHeight,
  zoom,
  offsetX,
  offsetY,
}: {
  panelWidth: number;
  panelHeight: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
}) {
  const { unit, showMeasures } = useEditor();
  if (!showMeasures) return null;

  const { major, minor } = pickRulerStep(zoom, unit);
  const widthMm = panelWidth;
  const heightMm = panelHeight;

  const tickColor = "rgba(100, 116, 139, 0.55)";
  const labelColor = "rgb(71, 85, 105)";
  const bg = "rgba(248, 250, 252, 0.95)";

  const horizontalTicks: { mm: number; major: boolean }[] = [];
  for (let mm = 0; mm <= widthMm + 0.001; mm += minor) {
    const m = Math.round(mm * 1000) / 1000;
    horizontalTicks.push({ mm: m, major: Math.abs(m % major) < 0.01 });
  }
  const verticalTicks: { mm: number; major: boolean }[] = [];
  for (let mm = 0; mm <= heightMm + 0.001; mm += minor) {
    const m = Math.round(mm * 1000) / 1000;
    verticalTicks.push({ mm: m, major: Math.abs(m % major) < 0.01 });
  }

  return (
    <>
      {/* Canto superior esquerdo (unit label) */}
      <div
        className="absolute z-40 pointer-events-none flex items-center justify-center text-[9px] font-mono uppercase tracking-wider border border-border"
        style={{
          left: offsetX - RULER_SIZE,
          top: offsetY - RULER_SIZE,
          width: RULER_SIZE,
          height: RULER_SIZE,
          background: bg,
          color: labelColor,
        }}
      >
        {unit}
      </div>

      {/* Régua superior */}
      <div
        className="absolute z-40 pointer-events-none overflow-hidden border-b border-border"
        style={{
          left: offsetX,
          top: offsetY - RULER_SIZE,
          width: panelWidth * zoom,
          height: RULER_SIZE,
          background: bg,
        }}
      >
        <svg width={panelWidth * zoom} height={RULER_SIZE}>
          {horizontalTicks.map((t, i) => {
            const x = mmToPx(t.mm) * zoom;
            const h = t.major ? RULER_SIZE * 0.55 : RULER_SIZE * 0.28;
            return (
              <line
                key={i}
                x1={x}
                x2={x}
                y1={RULER_SIZE - h}
                y2={RULER_SIZE}
                stroke={tickColor}
                strokeWidth={1}
              />
            );
          })}
          {horizontalTicks
            .filter((t) => t.major)
            .map((t, i) => {
              const x = mmToPx(t.mm) * zoom;
              const label = unit === "cm" ? `${t.mm / 10}` : `${t.mm}`;
              return (
                <text
                  key={`l-${i}`}
                  x={x + 2}
                  y={9}
                  fontSize={9}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fill={labelColor}
                >
                  {label}
                </text>
              );
            })}
        </svg>
      </div>

      {/* Régua esquerda */}
      <div
        className="absolute z-40 pointer-events-none overflow-hidden border-r border-border"
        style={{
          left: offsetX - RULER_SIZE,
          top: offsetY,
          width: RULER_SIZE,
          height: panelHeight * zoom,
          background: bg,
        }}
      >
        <svg width={RULER_SIZE} height={panelHeight * zoom}>
          {verticalTicks.map((t, i) => {
            const y = mmToPx(t.mm) * zoom;
            const w = t.major ? RULER_SIZE * 0.55 : RULER_SIZE * 0.28;
            return (
              <line
                key={i}
                x1={RULER_SIZE - w}
                x2={RULER_SIZE}
                y1={y}
                y2={y}
                stroke={tickColor}
                strokeWidth={1}
              />
            );
          })}
          {verticalTicks
            .filter((t) => t.major)
            .map((t, i) => {
              const y = mmToPx(t.mm) * zoom;
              const label = unit === "cm" ? `${t.mm / 10}` : `${t.mm}`;
              return (
                <text
                  key={`l-${i}`}
                  x={2}
                  y={y - 2}
                  fontSize={9}
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fill={labelColor}
                  transform={`rotate(-90 2 ${y - 2})`}
                  textAnchor="end"
                >
                  {label}
                </text>
              );
            })}
        </svg>
      </div>
    </>
  );
}

export { RULER_SIZE };

// Suprime label não usado:
void formatMeasure;
