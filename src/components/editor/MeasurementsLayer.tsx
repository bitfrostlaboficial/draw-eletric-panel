import { useEditor, type Measurement, type WireAnchor } from "@/lib/editor-store";
import { formatMeasure } from "@/lib/measurement";
import { resolveAnchorPoint, connectionCandidates } from "@/lib/wire-geometry";
import { useMemo, useRef, type PointerEvent as RPE } from "react";


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
    moveMeasurementEndpoint,
  } = useEditor();

  const toLocal = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    const zoom = useEditor.getState().zoom;
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  };


  // Resolve as coordenadas de todas as medidas em tempo real
  const resolved = useMemo(() => {
    return measurements.map(m => {
      const p1 = resolveAnchorPoint(m.start, entities, wires) || { x: m.x1, y: m.y1 };
      const p2 = resolveAnchorPoint(m.end, entities, wires) || { x: m.x2, y: m.y2 };
      return { ...m, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
    });
  }, [measurements, entities, wires]);

  // We always render if there are measurements, but individual ones check showMeasures OR fixed
  if (measurements.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 z-25"
      width={worldWidth}
      height={worldHeight}
      style={{ pointerEvents: "none" }}
      onPointerMove={(e) => {
        const d = useEditor.getState().selectedMeasurementId;
        if (!d) return;
        // Handling drag in the glyph itself or here via global state if we had a dragRef
      }}
    >

      {resolved.map((m) => {
        const isVisible = showMeasures || m.fixed;
        if (!isVisible) return null;
        return (
          <MeasurementGlyph
            key={m.id}
            m={m}
            selected={m.id === selectedMeasurementId}
            onSelect={() => selectMeasurement(m.id)}
            fallbackUnit={unit}
          />
        );
      })}
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
  const { entities, wires, moveMeasurementEndpoint } = useEditor();
  const dragRef = useRef<"start" | "end" | null>(null);

  const onHandleDown = (e: RPE, which: "start" | "end") => {
    e.stopPropagation();
    onSelect();
    dragRef.current = which;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onHandleMove = (e: RPE) => {
    if (!dragRef.current) return;
    const svg = (e.currentTarget as unknown as SVGElement).ownerSVGElement as unknown as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const zoom = useEditor.getState().zoom;
    const pt = { 
      x: (e.clientX - rect.left) / zoom, 
      y: (e.clientY - rect.top) / zoom 
    };
    
    // Use the same snapping logic as wires
    const snapAnchorLocal = (p: {x: number, y: number}) => {
      const candidates = connectionCandidates(entities, wires, { near: p });
      let best = null;
      for (const c of candidates) {
        const dist = Math.hypot(c.x - p.x, c.y - p.y);
        if (!best || dist < best.dist) best = { anchor: c.anchor, dist };
      }
      return best && best.dist <= 26 ? best.anchor : { type: "free", x: p.x, y: p.y };
    };

    moveMeasurementEndpoint(m.id, dragRef.current, snapAnchorLocal(pt));
  };


  const onHandleUp = (e: RPE) => {
    dragRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };


  // Normaliza endpoints conforme a variante.
  let { x1, y1, x2, y2 } = m;
  if (m.variant === "horizontal") y2 = y1;
  else if (m.variant === "vertical") x2 = x1;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  
  const stroke = selected ? "#d946ef" : m.color;
  const strokeWidth = selected ? 2 : 1.4;
  const tick = 7;
  
  const nx = length > 0 ? -dy / length : 0;
  const ny = length > 0 ? dx / length : 1;

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  const unit = m.unit ?? fallbackUnit;

  if (m.variant === "area") {
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);
    const areaLabel = m.manualValue ?? `${formatMeasure(width, unit)} x ${formatMeasure(height, unit)}`;

    return (
      <g
        onPointerDown={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        style={{ pointerEvents: "auto", cursor: "pointer" }}
      >
        <rect
          x={minX}
          y={minY}
          width={width}
          height={height}
          fill={selected ? "rgba(217, 70, 239, 0.1)" : "rgba(37, 99, 235, 0.05)"}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray="4 2"
        />
        <g transform={`translate(${minX + width / 2}, ${minY + height / 2})`}>
          <rect
            x={-areaLabel.length * 3.4 - 10}
            y={-10}
            width={areaLabel.length * 6.8 + 20}
            height={20}
            rx={4}
            fill="white"
            stroke={stroke}
            strokeWidth={0.6}
          />
          <text
            x={0}
            y={4}
            fontSize={10}
            fontFamily="ui-monospace, SFMono-Regular, monospace"
            fill={stroke}
            textAnchor="middle"
            fontWeight={700}
          >
            {areaLabel}
          </text>
        </g>
      </g>
    );
  }

  if (length < 1) return null;

  const value = m.manualValue ?? formatMeasure(length, unit);
  const label = m.label ? `${m.label} · ${value}` : value;

  return (
    <g
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{ pointerEvents: "auto", cursor: "pointer" }}
    >
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} />
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={selected ? undefined : "4 3"}
      />
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
      <g transform={`translate(${mx}, ${my})`} className={selected ? "animate-pulse" : ""}>
        <rect
          x={-label.length * 3.4 - 6}
          y={-9}
          width={label.length * 6.8 + 12}
          height={18}
          rx={4}
          fill="white"
          stroke={stroke}
          strokeWidth={selected ? 1.2 : 0.6}
        />
        <text
          x={0}
          y={4}
          fontSize={10}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
          fill={stroke}
          textAnchor="middle"
          fontWeight={selected ? 700 : 500}
        >
          {label}
        </text>
      </g>
      {selected && (
        <>
          <circle
            cx={x1}
            cy={y1}
            r={6}
            fill="white"
            stroke="#d946ef"
            strokeWidth={2}
            style={{ pointerEvents: "auto", cursor: "grab" }}
            onPointerDown={(e) => onHandleDown(e, "start")}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
          />
          <circle
            cx={x2}
            cy={y2}
            r={6}
            fill="white"
            stroke="#d946ef"
            strokeWidth={2}
            style={{ pointerEvents: "auto", cursor: "grab" }}
            onPointerDown={(e) => onHandleDown(e, "end")}
            onPointerMove={onHandleMove}
            onPointerUp={onHandleUp}
          />
        </>
      )}
    </g>

  );
}
