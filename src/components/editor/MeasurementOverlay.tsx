import { useEditor, type Entity } from "@/lib/editor-store";
import { formatMeasure } from "@/lib/measurement";

/**
 * Mostra cotas temporárias do item arrastado:
 * - distância até a borda esquerda e superior do quadro
 * - distância até a borda direita e inferior do quadro
 * - distância até vizinho mais próximo (horizontal e vertical)
 */
export function MeasurementOverlay({
  draggingId,
  panelWidth,
  panelHeight,
}: {
  draggingId: string | null;
  panelWidth: number;
  panelHeight: number;
}) {
  const { entities, showMeasures, unit } = useEditor();
  if (!showMeasures || !draggingId) return null;
  const sel = entities.find((e) => e.id === draggingId);
  if (!sel) return null;

  const left = sel.x;
  const top = sel.y;
  const right = panelWidth - (sel.x + sel.width);
  const bottom = panelHeight - (sel.y + sel.height);

  // vizinho mais próximo à esquerda (mesma faixa vertical)
  const others = entities.filter((e) => e.id !== draggingId);
  const horizGap = nearestGap(sel, others, "horizontal");
  const vertGap = nearestGap(sel, others, "vertical");

  const cx = sel.x + sel.width / 2;
  const cy = sel.y + sel.height / 2;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-30"
      width={panelWidth}
      height={panelHeight}
    >
      {/* até borda esquerda */}
      <Cote x1={0} y1={cy} x2={sel.x} y2={cy} label={formatMeasure(left, unit)} axis="h" />
      {/* até borda direita */}
      <Cote x1={sel.x + sel.width} y1={cy} x2={panelWidth} y2={cy} label={formatMeasure(right, unit)} axis="h" />
      {/* até topo */}
      <Cote x1={cx} y1={0} x2={cx} y2={sel.y} label={formatMeasure(top, unit)} axis="v" />
      {/* até base */}
      <Cote x1={cx} y1={sel.y + sel.height} x2={cx} y2={panelHeight} label={formatMeasure(bottom, unit)} axis="v" />

      {horizGap && (
        <Cote
          x1={horizGap.from}
          y1={cy}
          x2={horizGap.to}
          y2={cy}
          label={formatMeasure(Math.abs(horizGap.to - horizGap.from), unit)}
          axis="h"
          accent
        />
      )}
      {vertGap && (
        <Cote
          x1={cx}
          y1={vertGap.from}
          x2={cx}
          y2={vertGap.to}
          label={formatMeasure(Math.abs(vertGap.to - vertGap.from), unit)}
          axis="v"
          accent
        />
      )}
    </svg>
  );
}

function nearestGap(
  sel: Entity,
  others: Entity[],
  axis: "horizontal" | "vertical",
): { from: number; to: number } | null {
  let best: { from: number; to: number; d: number } | null = null;
  if (axis === "horizontal") {
    const selTop = sel.y;
    const selBottom = sel.y + sel.height;
    for (const o of others) {
      // precisam se sobrepor verticalmente
      const overlap = Math.min(selBottom, o.y + o.height) - Math.max(selTop, o.y);
      if (overlap <= 0) continue;
      const right = o.x + o.width;
      // o está à esquerda
      if (right <= sel.x) {
        const d = sel.x - right;
        if (!best || d < best.d) best = { from: right, to: sel.x, d };
      } else if (o.x >= sel.x + sel.width) {
        const d = o.x - (sel.x + sel.width);
        if (!best || d < best.d) best = { from: sel.x + sel.width, to: o.x, d };
      }
    }
  } else {
    const selLeft = sel.x;
    const selRight = sel.x + sel.width;
    for (const o of others) {
      const overlap = Math.min(selRight, o.x + o.width) - Math.max(selLeft, o.x);
      if (overlap <= 0) continue;
      const bottom = o.y + o.height;
      if (bottom <= sel.y) {
        const d = sel.y - bottom;
        if (!best || d < best.d) best = { from: bottom, to: sel.y, d };
      } else if (o.y >= sel.y + sel.height) {
        const d = o.y - (sel.y + sel.height);
        if (!best || d < best.d) best = { from: sel.y + sel.height, to: o.y, d };
      }
    }
  }
  return best ? { from: best.from, to: best.to } : null;
}

function Cote({
  x1, y1, x2, y2, label, axis, accent,
}: {
  x1: number; y1: number; x2: number; y2: number;
  label: string; axis: "h" | "v"; accent?: boolean;
}) {
  const stroke = accent ? "rgb(217, 70, 239)" : "rgb(59, 130, 246)";
  const len = axis === "h" ? Math.abs(x2 - x1) : Math.abs(y2 - y1);
  if (len < 2) return null;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const tickLen = 5;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={1} strokeDasharray="3 3" />
      {axis === "h" ? (
        <>
          <line x1={x1} y1={y1 - tickLen} x2={x1} y2={y1 + tickLen} stroke={stroke} strokeWidth={1} />
          <line x1={x2} y1={y2 - tickLen} x2={x2} y2={y2 + tickLen} stroke={stroke} strokeWidth={1} />
        </>
      ) : (
        <>
          <line x1={x1 - tickLen} y1={y1} x2={x1 + tickLen} y2={y1} stroke={stroke} strokeWidth={1} />
          <line x1={x2 - tickLen} y1={y2} x2={x2 + tickLen} y2={y2} stroke={stroke} strokeWidth={1} />
        </>
      )}
      <g transform={`translate(${mx}, ${my})`}>
        <rect
          x={-label.length * 3.2 - 4}
          y={-7}
          width={label.length * 6.4 + 8}
          height={14}
          rx={3}
          fill="white"
          stroke={stroke}
          strokeWidth={0.5}
        />
        <text
          x={0}
          y={3}
          fontSize={9}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fill={stroke}
          textAnchor="middle"
        >
          {label}
        </text>
      </g>
    </g>
  );
}
