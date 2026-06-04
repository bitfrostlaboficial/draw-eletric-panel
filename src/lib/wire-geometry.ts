import type {
  ConnectionPoint,
  Entity,
  Placed,
  Wire,
  WireAnchor,
  WirePoint,
  WireStyle,
} from "@/lib/editor-store";

export type Pt = { x: number; y: number };

export type SnapCandidate = {
  id: string;
  x: number;
  y: number;
  anchor: WireAnchor;
  source: "entity" | "wire" | "cp";
  point?: ConnectionPoint;
  cpKind?: string;
  cpName?: string;
  cpSignal?: string;
  distance?: number;
  snapRadius: number;
};

const ENTITY_POINTS: ConnectionPoint[] = ["top", "right", "bottom", "left", "center"];

function rotateAround(pt: Pt, cx: number, cy: number, deg: number): Pt {
  if (!deg) return pt;
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const dx = pt.x - cx;
  const dy = pt.y - cy;
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c };
}

export function entityPoint(e: Entity | undefined, point: ConnectionPoint = "center"): Pt | null {
  if (!e) return null;
  const cx = e.x + e.width / 2;
  const cy = e.y + e.height / 2;
  const rot = e.rotation ?? 0;
  // Borne customizado: "cp:<uuid>" — resolve via connectionPoints normalizados
  // e aplica a rotação do componente em torno do seu centro.
  if (typeof point === "string" && point.startsWith("cp:")) {
    const placed = e as Placed;
    const cps = placed.connectionPoints;
    if (cps) {
      const cp = cps.find((c) => `cp:${c.id}` === point);
      if (cp) {
        const raw = { x: e.x + cp.nx * e.width, y: e.y + cp.ny * e.height };
        return rotateAround(raw, cx, cy, rot);
      }
    }
    return { x: cx, y: cy };
  }
  let pt: Pt;
  if (point === "top") pt = { x: cx, y: e.y };
  else if (point === "bottom") pt = { x: cx, y: e.y + e.height };
  else if (point === "left") pt = { x: e.x, y: cy };
  else if (point === "right") pt = { x: e.x + e.width, y: cy };
  else pt = { x: cx, y: cy };
  return rotateAround(pt, cx, cy, rot);
}

export function anchorFromLegacy(w: Wire, which: "start" | "end"): WireAnchor | undefined {
  if (which === "start")
    return (
      w.start ?? (w.fromId ? { type: "entity", entityId: w.fromId, point: "center" } : undefined)
    );
  return w.end ?? (w.toId ? { type: "entity", entityId: w.toId, point: "center" } : undefined);
}

export function resolveAnchorPoint(
  anchor: WireAnchor | undefined,
  entities: Entity[],
  wires: Wire[] = [],
  fallbackId?: string,
  seen = new Set<string>(),
): Pt | null {
  if (!anchor) {
    return fallbackId
      ? entityPoint(
          entities.find((e) => e.id === fallbackId),
          "center",
        )
      : null;
  }
  if (anchor.type === "free") return { x: anchor.x, y: anchor.y };
  if (anchor.type === "entity")
    return entityPoint(
      entities.find((e) => e.id === anchor.entityId),
      anchor.point,
    );

  const target = wires.find((w) => w.id === anchor.wireId);
  if (!target || seen.has(target.id)) return { x: anchor.x, y: anchor.y };
  if (typeof anchor.position !== "number") return { x: anchor.x, y: anchor.y };

  seen.add(target.id);
  const polyline = wirePolyline(target, entities, wires, seen);
  seen.delete(target.id);
  return polyline.length >= 2
    ? pointAtPolyline(polyline, anchor.position)
    : { x: anchor.x, y: anchor.y };
}

/* -------- Path builders -------- */

function polylinePath(pts: Pt[]): string {
  return `M ${pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
}

/**
 * Catmull-Rom → cubic Bézier. Returns a smooth SVG path that interpolates
 * every input point. `tension` 0..1 (0.5 ≈ Figma feel).
 */
export function smoothPath(points: Pt[], tension = 0.5): string {
  if (points.length < 2) return "";
  if (points.length === 2)
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  const t = tension / 6;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) * t, y: p1.y + (p2.y - p0.y) * t };
    const c2 = { x: p2.x - (p3.x - p1.x) * t, y: p2.y - (p3.y - p1.y) * t };
    d += ` C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * Organic two-point cubic Bézier with horizontal-or-vertical tangents,
 * Figma-style. `bend` shifts both control handles along the perpendicular
 * axis so dragging the midpoint warps the curve naturally.
 */
function curvedTwoPoint(a: Pt, b: Pt, bend: Wire["bend"]) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const tangent = Math.max(40, Math.max(Math.abs(dx), Math.abs(dy)) * 0.5);
  const bdx = bend?.dx ?? 0;
  const bdy = bend?.dy ?? 0;
  const c1 = horizontal
    ? { x: a.x + tangent, y: a.y + bdy }
    : { x: a.x + bdx, y: a.y + tangent };
  const c2 = horizontal
    ? { x: b.x - tangent, y: b.y + bdy }
    : { x: b.x + bdx, y: b.y - tangent };
  const mid = { x: (a.x + b.x) / 2 + bdx, y: (a.y + b.y) / 2 + bdy };
  return {
    d: `M ${a.x} ${a.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${b.x} ${b.y}`,
    mid,
    points: [a, c1, c2, b],
  };
}

export function buildWirePath(
  a: Pt,
  b: Pt,
  style: WireStyle,
  bend: Wire["bend"],
  controlPoints: WirePoint[] = [],
) {
  const baseMx = (a.x + b.x) / 2;
  const baseMy = (a.y + b.y) / 2;
  const mid = { x: baseMx + (bend?.dx ?? 0), y: baseMy + (bend?.dy ?? 0) };

  if (style === "straight") {
    const pts = bend ? [a, mid, ...controlPoints, b] : [a, ...controlPoints, b];
    return { d: polylinePath(pts), mid, points: pts };
  }
  if (style === "orthogonal" || style === "smart") {
    const pts = [a, { x: mid.x, y: a.y }, { x: mid.x, y: b.y }, b];
    return {
      d: `M ${a.x} ${a.y} L ${mid.x} ${a.y} L ${mid.x} ${b.y} L ${b.x} ${b.y}`,
      mid: { x: mid.x, y: (a.y + b.y) / 2 },
      points: pts,
    };
  }
  if (style === "multi" || style === "free") {
    const pts = [a, ...controlPoints, b];
    if (pts.length === 2) return curvedTwoPoint(a, b, bend);
    return {
      d: smoothPath(pts, 0.5),
      mid: pts[Math.floor(pts.length / 2)] ?? mid,
      points: pts,
    };
  }
  // curved (default) — organic Bézier
  return curvedTwoPoint(a, b, bend);
}

export function wirePolyline(
  w: Wire,
  entities: Entity[],
  wires: Wire[] = [],
  seen = new Set<string>(),
): Pt[] {
  const a = resolveAnchorPoint(anchorFromLegacy(w, "start"), entities, wires, undefined, seen);
  const b = resolveAnchorPoint(anchorFromLegacy(w, "end"), entities, wires, undefined, seen);
  if (!a || !b) return [];
  return buildWirePath(a, b, w.style ?? "curved", w.bend ?? null, w.controlPoints ?? []).points;
}

export function pointAtPolyline(points: Pt[], position: number): Pt {
  const clamped = Math.max(0, Math.min(1, position));
  const lengths = segmentLengths(points);
  const total = lengths.reduce((sum, v) => sum + v, 0);
  if (!total) return points[0] ?? { x: 0, y: 0 };

  let remaining = total * clamped;
  for (let i = 0; i < lengths.length; i += 1) {
    const len = lengths[i];
    if (remaining <= len) {
      const a = points[i];
      const b = points[i + 1];
      const t = len ? remaining / len : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= len;
  }
  return points[points.length - 1] ?? { x: 0, y: 0 };
}

export function connectionCandidates(
  entities: Entity[],
  wires: Wire[],
  opts: {
    near?: Pt;
    preferredEntityId?: string;
    excludeWireId?: string;
    includeWires?: boolean;
    includePanelPoints?: boolean;
  } = {},
): SnapCandidate[] {
  const { panel } = useEditor.getState();
  
  const panelCandidates: SnapCandidate[] = opts.includePanelPoints !== false ? [
    { id: "panel:top-left", x: 0, y: 0, anchor: { type: "free", x: 0, y: 0 }, source: "cp", snapRadius: 30 },
    { id: "panel:top-right", x: panel.width, y: 0, anchor: { type: "free", x: panel.width, y: 0 }, source: "cp", snapRadius: 30 },
    { id: "panel:bottom-left", x: 0, y: panel.height, anchor: { type: "free", x: 0, y: panel.height }, source: "cp", snapRadius: 30 },
    { id: "panel:bottom-right", x: panel.width, y: panel.height, anchor: { type: "free", x: panel.width, y: panel.height }, source: "cp", snapRadius: 30 },
    { id: "panel:center", x: panel.width/2, y: panel.height/2, anchor: { type: "free", x: panel.width/2, y: panel.height/2 }, source: "cp", snapRadius: 30 },
    { id: "panel:top-center", x: panel.width/2, y: 0, anchor: { type: "free", x: panel.width/2, y: 0 }, source: "cp", snapRadius: 30 },
    { id: "panel:bottom-center", x: panel.width/2, y: panel.height, anchor: { type: "free", x: panel.width/2, y: panel.height }, source: "cp", snapRadius: 30 },
    { id: "panel:left-center", x: 0, y: panel.height/2, anchor: { type: "free", x: 0, y: panel.height/2 }, source: "cp", snapRadius: 30 },
    { id: "panel:right-center", x: panel.width, y: panel.height/2, anchor: { type: "free", x: panel.width, y: panel.height/2 }, source: "cp", snapRadius: 30 },
  ] : [];

  const entityCandidates: SnapCandidate[] = entities.flatMap((e): SnapCandidate[] => {

    const placed = e as Placed;
    const cps = placed.kind === "device" ? placed.connectionPoints : undefined;
    if (cps && cps.length > 0) {
      return cps.map<SnapCandidate>((cp) => {
        const pt = entityPoint(e, `cp:${cp.id}` as ConnectionPoint)!;
        return {
          id: `entity:${e.id}:cp:${cp.id}`,
          x: pt.x,
          y: pt.y,
          anchor: { type: "entity", entityId: e.id, point: `cp:${cp.id}` } as WireAnchor,
          source: "cp",
          point: `cp:${cp.id}` as ConnectionPoint,
          cpKind: cp.kind,
          cpName: cp.name,
          cpSignal: cp.signal,
          snapRadius: 22,
        };
      });
    }
    return ENTITY_POINTS.map<SnapCandidate>((point) => {
      const pt = entityPoint(e, point)!;
      return {
        id: `entity:${e.id}:${point}`,
        x: pt.x,
        y: pt.y,
        anchor: { type: "entity", entityId: e.id, point } as WireAnchor,
        source: "entity",
        point,
        snapRadius: point === "center" ? 30 : 26,
      };
    });
  });

  const wireCandidates: SnapCandidate[] =
    opts.includeWires === false
      ? []
      : wires.flatMap((w): SnapCandidate[] => {
          if (w.id === opts.excludeWireId) return [];
          const line = wirePolyline(w, entities, wires, new Set([w.id]));
          if (line.length < 2) return [];
          const endpoints: SnapCandidate[] = [0, 1].map((position) => {
            const pt = pointAtPolyline(line, position);
            return {
              id: `wire:${w.id}:${position}`,
              x: pt.x,
              y: pt.y,
              anchor: { type: "wire", wireId: w.id, x: pt.x, y: pt.y, position } as WireAnchor,
              source: "wire",
              snapRadius: 24,
            };
          });
          const segment = opts.near
            ? closestPointOnPolyline(line, opts.near)
            : { ...pointAtPolyline(line, 0.5), position: 0.5, distance: undefined as number | undefined };
          return [
            ...endpoints,
            {
              id: `wire:${w.id}:segment`,
              x: segment.x,
              y: segment.y,
              anchor: {
                type: "wire",
                wireId: w.id,
                x: segment.x,
                y: segment.y,
                position: segment.position,
              } as WireAnchor,
              source: "wire",
              distance: segment.distance,
              snapRadius: 22,
            },
          ];
        });

  const all: SnapCandidate[] = [...panelCandidates, ...entityCandidates, ...wireCandidates].map((c) => ({
    ...c,
    distance: opts.near ? Math.hypot(c.x - opts.near.x, c.y - opts.near.y) : c.distance,
  }));

  return opts.preferredEntityId
    ? all.sort(
        (a, b) =>
          Number(b.anchor.type === "entity" && b.anchor.entityId === opts.preferredEntityId) -
          Number(a.anchor.type === "entity" && a.anchor.entityId === opts.preferredEntityId),
      )
    : all;
}

function segmentLengths(points: Pt[]) {
  return points
    .slice(0, -1)
    .map((p, i) => Math.hypot(points[i + 1].x - p.x, points[i + 1].y - p.y));
}

export function closestPointOnPolyline(points: Pt[], pt: Pt) {
  const lengths = segmentLengths(points);
  const total = lengths.reduce((sum, v) => sum + v, 0) || 1;
  let best = { x: points[0].x, y: points[0].y, distance: Infinity, position: 0, segment: 0, t: 0 };
  let traversed = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const lenSq = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((pt.x - a.x) * vx + (pt.y - a.y) * vy) / lenSq));
    const x = a.x + vx * t;
    const y = a.y + vy * t;
    const distance = Math.hypot(pt.x - x, pt.y - y);
    if (distance < best.distance) {
      best = {
        x,
        y,
        distance,
        position: (traversed + lengths[i] * t) / total,
        segment: i,
        t,
      };
    }
    traversed += lengths[i];
  }
  return best;
}
