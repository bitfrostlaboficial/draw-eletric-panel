import { useEditor, type Measurement } from "@/lib/editor-store";
import { formatMeasure } from "@/lib/measurement";
import { resolveAnchorPoint } from "@/lib/wire-geometry";
import { useMemo } from "react";

/**
 * Camada SVG que renderiza as medidas persistidas no projeto.
 * Recebe a área total do "mundo" (panel + sandbox auxiliares) para acomodar
 * medidas que ultrapassam o limite do quadro.
 */
export function MeasurementsLayer({
  worldWidth,
  worldHeight,
}: {
  worldWidth: number;
  worldHeight: number;
}) {
  const {
    measurements,
    entities,
    wires,
    selectedMeasurementId,
    showMeasures,
    selectMeasurement,
    unit,
  } = useEditor();

  // Resolve as coordenadas de todas as medidas em tempo real
  const resolved = useMemo(() => {
    return measurements.map(m => {
      const p1 = resolveAnchorPoint(m.start, entities, wires) || { x: m.x1, y: m.y1 };
      const p2 = resolveAnchorPoint(m.end, entities, wires) || { x: m.x2, y: m.y2 };
      return { ...m, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    });
  }, [measurements, entities, wires]);

  if (!showMeasures || measurements.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 z-25 pointer-events-none"
      width={worldWidth}
      height={worldHeight}
    >
      {resolved.map((m) => (
        <MeasurementGlyph
          key={m.id}
          m={m}
          selected={m.id === selectedMeasurementId}
          onSelect={() => selectMeasurement(m.id)}
          fallbackUnit={unit}
        />
      ))}
    </svg>
  );
}


function MeasurementGlyph({
  m,
  selected,
  onSelect,
  fallbackUnit,
}: {
  m: Measurement;
  selected: boolean;
  onSelect: () => void;
  fallbackUnit: "mm" | "cm";
}) {
  // Normaliza endpoints conforme a variante.
  let { x1, y1, x2, y2 } = m;
  if (m.variant === "horizontal") y2 = y1;
  if (m.variant === "vertical") x2 = x1;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length < 1) return null;

  const stroke = selected ? "#d946ef" : m.color;
  const strokeWidth = selected ? 2 : 1.4;
  const tick = 7;
  // Vetor perpendicular unitário para ticks
  const nx = -dy / length;
  const ny = dx / length;

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  const unit = m.unit ?? fallbackUnit;
  const value = m.manualValue ?? formatMeasure(length, unit);
  const label = m.label ? `${m.label} · ${value}` : value;

  if (m.variant === \"area\") {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const area = (width * height) / (unit === \"mm\" ? 1 : 100); // Exemplo simplificado
    const areaVal = m.manualValue ?? `${formatMeasure(width, unit)} x ${formatMeasure(height, unit)}`;

    return (
      <g
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        style={{ pointerEvents: \"auto\", cursor: \"pointer\" }}
      >
        <rect
          x={minX}
          y={minY}
          width={width}
          height={height}
          fill={selected ? \"rgba(217, 70, 239, 0.1)\" : \"rgba(37, 99, 235, 0.05)\"}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray=\"4 2\"
        />
        <g transform={`translate(${minX + width / 2}, ${minY + height / 2})`}>
          <rect
            x={-areaVal.length * 3.4 - 10}
            y={-10}
            width={areaVal.length * 6.8 + 20}
            height={20}
            rx={4}
            fill=\"white\"
            stroke={stroke}
            strokeWidth={0.6}
          />
          <text
            x={0}
            y={4}
            fontSize={10}
            fontFamily=\"ui-monospace, SFMono-Regular, monospace\"
            fill={stroke}
            textAnchor=\"middle\"
            fontWeight={700}
          >
            {areaVal}
          </text>
        </g>
      </g>
    );
  }

  return (
    <g
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ pointerEvents: \"auto\", cursor: \"pointer\" }}
    >
      {/* hit area */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke=\"transparent\"
        strokeWidth={14}
      />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={selected ? undefined : \"4 3\"}
      />
      {/* ticks/setas nas pontas */}
      <line
        x1={x1 - nx * tick}
        y1={y1 - ny * tick}
        x2={x1 + nx * tick}
        y2={y1 + ny * tick}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        x1={x2 - nx * tick}
        y1={y2 - ny * tick}
        x2={x2 + nx * tick}
        y2={y2 + ny * tick}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      {/* etiqueta */}
      <g transform={`translate(${mx}, ${my})`}>
        <rect
          x={-label.length * 3.4 - 6}
          y={-9}
          width={label.length * 6.8 + 12}
          height={18}
          rx={4}
          fill=\"white\"
          stroke={stroke}
          strokeWidth={selected ? 1.2 : 0.6}
        />
        <text
          x={0}
          y={4}
          fontSize={10}
          fontFamily=\"ui-monospace, SFMono-Regular, monospace\"
          fill={stroke}
          textAnchor=\"middle\"
          fontWeight={selected ? 700 : 500}
        >
          {label}
        </text>
      </g>
    </g>
  );
}
