import { useRef, type PointerEvent as RPE } from "react";
import type { ArrowHead, Entity, Wire, WireAnchor } from "@/lib/editor-store";
import { useEditor } from "@/lib/editor-store";
import { buildWirePath, closestPointOnPolyline, resolveAnchorPoint } from "@/lib/wire-geometry";

type Pt = { x: number; y: number };

type DragMode =
  | { kind: "bend"; id: string; baseMx: number; baseMy: number }
  | { kind: "endpoint"; id: string; which: "start" | "end" }
  | { kind: "body"; id: string; lastX: number; lastY: number }
  | { kind: "cp"; id: string; index: number };

function arrowMarkerPath(head: ArrowHead): string | null {
  switch (head) {
    case "triangle":
      return "M0,0 L10,5 L0,10 z";
    case "open":
      return "M0,0 L10,5 L0,10";
    case "diamond":
      return "M0,5 L5,0 L10,5 L5,10 z";
    case "circle":
      return null; // rendered as <circle>
    default:
      return null;
  }
}

export function WireLayer({
  panelWidth,
  panelHeight,
  entities,
  wires,
  zoom,
  snapAnchor,
  onReconnectPreview,
}: {
  panelWidth: number;
  panelHeight: number;
  entities: Entity[];
  wires: Wire[];
  zoom: number;
  snapAnchor: (pt: Pt, excludeWireId?: string) => WireAnchor;
  onReconnectPreview?: (pt: Pt | null, excludeWireId?: string) => void;
}) {
  const {
    selectedWireId,
    selectedWireIds,
    showLegends,
    selectWire,
    updateWire,
    removeWire,
    moveWireEndpoint,
    moveWireBy,
    updateWireControlPoint,
    removeWireControlPoint,
    insertWireControlPoint,
  } = useEditor();
  const dragRef = useRef<DragMode | null>(null);

  const toLocal = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect();
    return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
  };

  const onBendDown = (e: RPE<SVGCircleElement>, w: Wire, a: Pt, b: Pt) => {
    e.stopPropagation();
    dragRef.current = { kind: "bend", id: w.id, baseMx: (a.x + b.x) / 2, baseMy: (a.y + b.y) / 2 };
    (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
  };

  const onEndpointDown = (e: RPE<SVGCircleElement>, w: Wire, which: "start" | "end") => {
    e.stopPropagation();
    selectWire(w.id);
    dragRef.current = { kind: "endpoint", id: w.id, which };
    (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
  };

  const onCpDown = (e: RPE<SVGCircleElement>, w: Wire, index: number) => {
    e.stopPropagation();
    if (e.altKey) {
      removeWireControlPoint(w.id, index);
      return;
    }
    selectWire(w.id);
    dragRef.current = { kind: "cp", id: w.id, index };
    (e.currentTarget as SVGCircleElement).setPointerCapture(e.pointerId);
  };

  const onBodyDown = (e: RPE<SVGPathElement>, w: Wire) => {
    e.stopPropagation();
    selectWire(w.id);
    const startFree = w.start?.type === "free" || (!w.start && !w.fromId);
    const endFree = w.end?.type === "free" || (!w.end && !w.toId);
    if (startFree && endFree) {
      const svg = e.currentTarget.ownerSVGElement!;
      const p = toLocal(svg, e.clientX, e.clientY);
      dragRef.current = { kind: "body", id: w.id, lastX: p.x, lastY: p.y };
      (e.currentTarget as SVGPathElement).setPointerCapture(e.pointerId);
    }
  };

  const onBodyDoubleClick = (e: React.MouseEvent<SVGPathElement>, w: Wire, a: Pt, b: Pt) => {
    e.stopPropagation();
    // Alt+dblclick removes wire; plain dblclick inserts a control point.
    if (e.altKey) {
      removeWire(w.id);
      return;
    }
    const style = w.style ?? "curved";
    if (style !== "multi" && style !== "free" && style !== "straight") {
      removeWire(w.id);
      return;
    }
    const svg = e.currentTarget.ownerSVGElement!;
    const p = toLocal(svg, e.clientX, e.clientY);
    const cps = w.controlPoints ?? [];
    const polyline = [a, ...cps, b];
    const closest = closestPointOnPolyline(polyline, p);
    // segment index counted with [a, ...cps, b] → control-point insertion index is segment.
    insertWireControlPoint(w.id, closest.segment, { x: closest.x, y: closest.y });
  };

  const onMove = (e: RPE<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const p = toLocal(e.currentTarget as SVGSVGElement, e.clientX, e.clientY);
    if (d.kind === "bend") {
      updateWire(d.id, { bend: { dx: p.x - d.baseMx, dy: p.y - d.baseMy } });
    } else if (d.kind === "endpoint") {
      moveWireEndpoint(d.id, d.which, { type: "free", x: p.x, y: p.y });
      onReconnectPreview?.(p, d.id);
    } else if (d.kind === "body") {
      moveWireBy(d.id, p.x - d.lastX, p.y - d.lastY);
      d.lastX = p.x;
      d.lastY = p.y;
    } else if (d.kind === "cp") {
      updateWireControlPoint(d.id, d.index, { x: p.x, y: p.y });
    }
  };

  const onUp = (e: RPE<SVGSVGElement>) => {
    const d = dragRef.current;
    if (d?.kind === "endpoint") {
      const p = toLocal(e.currentTarget as SVGSVGElement, e.clientX, e.clientY);
      moveWireEndpoint(d.id, d.which, snapAnchor(p, d.id));
    }
    onReconnectPreview?.(null);
    dragRef.current = null;
    try {
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    } catch {
      /* noop */
    }
  };

  // Collect all arrow markers actually used so we can declare them in <defs> once.
  const usedMarkers = new Set<string>();
  wires.forEach((w) => {
    if (w.arrowStart && w.arrowStart !== "none") usedMarkers.add(`${w.arrowStart}:${w.color}`);
    if (w.arrowEnd && w.arrowEnd !== "none") usedMarkers.add(`${w.arrowEnd}:${w.color}`);
  });

  // Coletor compartilhado de bounding boxes das tags já posicionadas neste
  // render — permite que cada nova etiqueta evite sobrepor as anteriores.
  const placedTagRects: Array<{ x: number; y: number; w: number; h: number }> = [];



  return (
    <svg
      className="absolute inset-0"
      width={panelWidth}
      height={panelHeight}
      style={{ pointerEvents: "none" }}
      onPointerMove={onMove}
      onPointerUp={onUp}
    >
      <defs>
        {Array.from(usedMarkers).map((key) => {
          const [head, color] = key.split(":") as [ArrowHead, string];
          const id = `arrow-${head}-${color.replace("#", "")}`;
          const path = arrowMarkerPath(head);
          return (
            <g key={key}>
              <marker
                id={`${id}-end`}
                viewBox="0 0 10 10"
                refX={head === "open" ? 9 : 8}
                refY={5}
                markerWidth={6}
                markerHeight={6}
                orient="auto-start-reverse"
                markerUnits="strokeWidth"
              >
                {path ? (
                  <path d={path} fill={head === "open" ? "none" : color} stroke={color} strokeWidth={head === "open" ? 1.5 : 0} />
                ) : (
                  <circle cx={5} cy={5} r={4} fill={color} />
                )}
              </marker>
              <marker
                id={`${id}-start`}
                viewBox="0 0 10 10"
                refX={head === "open" ? 1 : 2}
                refY={5}
                markerWidth={6}
                markerHeight={6}
                orient="auto"
                markerUnits="strokeWidth"
              >
                {path ? (
                  <path d={path} fill={head === "open" ? "none" : color} stroke={color} strokeWidth={head === "open" ? 1.5 : 0} transform="rotate(180 5 5)" />
                ) : (
                  <circle cx={5} cy={5} r={4} fill={color} />
                )}
              </marker>
            </g>
          );
        })}
      </defs>

      {wires.map((w) => {
        const a = resolveAnchorPoint(w.start, entities, wires, w.fromId);
        const b = resolveAnchorPoint(w.end, entities, wires, w.toId);
        if (!a || !b) return null;

        const style = w.style ?? "curved";
        const color = w.color;
        const opacity = w.opacity ?? 1;
        const thickness = w.thickness;
        const trace = w.trace ?? (w.dashed ? "dashed" : "solid");
        const dash =
          trace === "dashed"
            ? `${Math.max(4, thickness * 3)} ${Math.max(3, thickness * 2)}`
            : trace === "dotted"
              ? `0 ${Math.max(4, thickness * 2.5)}`
              : undefined;
        const isSel = selectedWireId === w.id || selectedWireIds.includes(w.id);
        const startFree = w.start?.type === "free" || (!w.start && !w.fromId);
        const endFree = w.end?.type === "free" || (!w.end && !w.toId);
        const fullyFree = startFree && endFree;
        const cps = w.controlPoints ?? [];
        const isEditableShape = style === "multi" || style === "free" || style === "straight";

        const { d, mid } = buildWirePath(a, b, style, w.bend ?? null, cps);

        const markerStart =
          w.arrowStart && w.arrowStart !== "none"
            ? `url(#arrow-${w.arrowStart}-${color.replace("#", "")}-start)`
            : undefined;
        const markerEnd =
          w.arrowEnd && w.arrowEnd !== "none"
            ? `url(#arrow-${w.arrowEnd}-${color.replace("#", "")}-end)`
            : undefined;

        return (
          <g key={w.id} opacity={opacity}>
            {w.shadow && (
              <path
                d={d}
                fill="none"
                stroke="oklch(0.18 0.02 256 / 0.22)"
                strokeWidth={thickness + 5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {isSel && (
              <path
                d={d}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth={thickness + 6}
                opacity={0.25}
              />
            )}
            <path
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dash}
              markerStart={markerStart}
              markerEnd={markerEnd}
            />
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(14, thickness + 10)}
              style={{ pointerEvents: "stroke", cursor: fullyFree ? "move" : "pointer" }}
              onPointerDown={(e) => onBodyDown(e, w)}
              onDoubleClick={(e) => onBodyDoubleClick(e, w, a, b)}
            />

            {/* Endpoint + control-point handles when selected */}
            {isSel && (
              <>
                <circle
                  cx={a.x}
                  cy={a.y}
                  r={7}
                  fill={startFree ? "white" : "var(--color-primary)"}
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  style={{ pointerEvents: "all", cursor: "grab" }}
                  onPointerDown={(e) => onEndpointDown(e, w, "start")}
                />
                <circle
                  cx={b.x}
                  cy={b.y}
                  r={7}
                  fill={endFree ? "white" : "var(--color-primary)"}
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  style={{ pointerEvents: "all", cursor: "grab" }}
                  onPointerDown={(e) => onEndpointDown(e, w, "end")}
                />
                {/* Bend midpoint handle (only useful for 2-pt styles). */}
                {cps.length === 0 && (
                  <circle
                    cx={mid.x}
                    cy={mid.y}
                    r={6}
                    fill="white"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    style={{ pointerEvents: "all", cursor: "grab" }}
                    onPointerDown={(e) => onBendDown(e, w, a, b)}
                  />
                )}
                {/* Editable control points (multi/free/straight). Alt+click removes. */}
                {isEditableShape &&
                  cps.map((cp, i) => (
                    <circle
                      key={`cp-${i}`}
                      cx={cp.x}
                      cy={cp.y}
                      r={6}
                      fill="white"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      style={{ pointerEvents: "all", cursor: "grab" }}
                      onPointerDown={(e) => onCpDown(e, w, i)}
                    >
                      <title>Arraste para mover · Alt+clique para remover</title>
                    </circle>
                  ))}
              </>
            )}

            {/* Etiquetas técnicas do fio — posicionamento inteligente. */}
            {showLegends && w.tag && w.kind !== "arrow" && (() => {
              const nearA = cps[0] ?? mid;
              const nearB = cps[cps.length - 1] ?? mid;
              const tagBg = w.tagColor ?? "#fde047";
              const fontSize = 10;
              const padX = 5;
              const padY = 2;
              const textW = w.tag.length * (fontSize * 0.6) + padX * 2;
              const textH = fontSize + padY * 2;

              // Candidatos: 12 direções (8 cardinais + 4 intermediárias), raio crescente.
              const dirs: Array<[number, number]> = [
                [0, -1], [1, -1], [1, 0], [1, 1],
                [0, 1], [-1, 1], [-1, 0], [-1, -1],
                [0.5, -1], [1, -0.5], [-1, 0.5], [-0.5, 1],
              ];
              const radii = [22, 32, 46, 64, 90];

              const rectsOverlap = (
                ax: number, ay: number, aw: number, ah: number,
                bx: number, by: number, bw: number, bh: number,
              ) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

              const scorePos = (cx: number, cy: number, away: Pt) => {
                const x = cx - textW / 2;
                const y = cy - textH / 2;
                // fora do canvas → péssimo
                if (x < 2 || y < 2 || x + textW > panelWidth - 2 || y + textH > panelHeight - 2) {
                  return Number.POSITIVE_INFINITY;
                }
                let score = 0;
                // colisão com componentes — penalização altíssima para
                // dispositivos (nunca devem ficar sob a tag se houver alternativa).
                for (const e of entities) {
                  // margem extra ao redor do componente p/ não encostar em bornes
                  const pad = e.kind === "device" ? 4 : 0;
                  if (rectsOverlap(x, y, textW, textH, e.x - pad, e.y - pad, e.width + pad * 2, e.height + pad * 2)) {
                    score += e.kind === "device" ? 1000 : e.kind === "text" ? 60 : 40;
                  }
                }
                // colisão com outras tags já colocadas neste passe
                for (const r of placedTagRects) {
                  if (rectsOverlap(x, y, textW, textH, r.x, r.y, r.w, r.h)) score += 120;
                }
                // distância do segmento (não ficar exatamente em cima do fio)
                const dxw = away.x - cx, dyw = away.y - cy;
                const segDist = Math.hypot(dxw, dyw);
                if (segDist < 8) score += 40;
                // preferência: leve bônus para posições mais próximas (penaliza distância excessiva)
                score += segDist * 0.05;
                return score;
              };

              const pickPlace = (anchor: Pt, towards: Pt) => {
                // direção "para fora" (longe do componente, seguindo o cabo)
                const vx = anchor.x - towards.x;
                const vy = anchor.y - towards.y;
                const vlen = Math.hypot(vx, vy) || 1;
                const ox = (vx / vlen);
                const oy = (vy / vlen);
                let best = { x: anchor.x + ox * 28, y: anchor.y + oy * 28, score: Infinity };
                for (const r of radii) {
                  for (const [dx, dy] of dirs) {
                    const nlen = Math.hypot(dx, dy) || 1;
                    const cx = anchor.x + (dx / nlen) * r;
                    const cy = anchor.y + (dy / nlen) * r;
                    const s = scorePos(cx, cy, anchor);
                    if (s < best.score) best = { x: cx, y: cy, score: s };
                  }
                  // Achou posição limpa (sem dispositivo) → para de procurar mais longe.
                  if (best.score < 1000) break;
                }
                return { x: best.x, y: best.y };
              };

              const c1 = pickPlace(a, nearA);
              placedTagRects.push({ x: c1.x - textW / 2, y: c1.y - textH / 2, w: textW, h: textH });
              const c2 = pickPlace(b, nearB);
              placedTagRects.push({ x: c2.x - textW / 2, y: c2.y - textH / 2, w: textW, h: textH });
              const chips = [c1, c2];

              return (
                <g style={{ pointerEvents: "none" }}>
                  {chips.map((c, i) => (
                    <g key={i} transform={`translate(${c.x - textW / 2}, ${c.y - textH / 2})`}>
                      <rect
                        width={textW}
                        height={textH}
                        rx={3}
                        ry={3}
                        fill={tagBg}
                        stroke="#0f172a"
                        strokeWidth={0.8}
                        opacity={0.95}
                      />
                      <text
                        x={textW / 2}
                        y={textH / 2 + fontSize / 2 - 1.5}
                        textAnchor="middle"
                        fontSize={fontSize}
                        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                        fontWeight={700}
                        fill="#0f172a"
                      >
                        {w.tag}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })()}
          </g>
        );
      })}
    </svg>
  );
}
