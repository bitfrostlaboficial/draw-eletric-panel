import { useEffect, useRef, useState, useMemo } from "react";
import { ChevronDown, Map } from "lucide-react";
import { useEditor, type Placed, type Shape, type Plate, type TextBox } from "@/lib/editor-store";
import { cn } from "@/lib/utils";

const MM_W = 200;
const MM_H = 150;

export function Minimap() {
  const entities = useEditor((s) => s.entities);
  const wires = useEditor((s) => s.wires);
  const measurements = useEditor((s) => s.measurements);
  const panel = useEditor((s) => s.panel);
  const collapsed = useEditor((s) => s.minimapCollapsed);
  const toggle = useEditor((s) => s.toggleMinimap);
  const viewportApi = useEditor((s) => s.viewportApi);
  const rightCollapsed = useEditor((s) => s.rightCollapsed);

  const [vp, setVp] = useState<{
    sx: number; sy: number; sw: number; sh: number; worldW: number; worldH: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (collapsed || !viewportApi) return;
    const tick = () => {
      const s = viewportApi.getViewportState();
      if (s) {
        // visible region in panel-interior coords
        const vx = (s.scrollLeft - s.worldOriginX) / s.zoom;
        const vy = (s.scrollTop - s.worldOriginY) / s.zoom;
        const vw = s.clientWidth / s.zoom;
        const vh = s.clientHeight / s.zoom;
        setVp({ sx: vx, sy: vy, sw: vw, sh: vh, worldW: s.worldW, worldH: s.worldH });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [collapsed, viewportApi]);

  // Unified bounding box: project elements + current viewport
  const bounds = useMemo(() => {
    let minX = 0;
    let minY = 0;
    let maxX = panel.width;
    let maxY = panel.height;

    // Expand bounds for cover
    if (panel.hasCover) {
      maxX = Math.max(maxX, panel.width + (panel.coverGap ?? 80) + (panel.coverWidth ?? panel.width));
      maxY = Math.max(maxY, panel.coverHeight ?? panel.height);
    }

    // Expand for all entities
    entities.forEach(e => {
      minX = Math.min(minX, e.x);
      minY = Math.min(minY, e.y);
      maxX = Math.max(maxX, e.x + e.width);
      maxY = Math.max(maxY, e.y + e.height);
    });

    // CRITICAL: Include current viewport in the minimap scale
    if (vp) {
      minX = Math.min(minX, vp.sx);
      minY = Math.min(minY, vp.sy);
      maxX = Math.max(maxX, vp.sx + vp.sw);
      maxY = Math.max(maxY, vp.sy + vp.sh);
    }

    // Padding for edges
    const pad = 200;
    return {
      x: minX - pad,
      y: minY - pad,
      w: Math.max(1000, (maxX - minX) + pad * 2),
      h: Math.max(1000, (maxY - minY) + pad * 2)
    };
  }, [entities, panel, vp]);

  const scale = Math.min(MM_W / bounds.w, MM_H / bounds.h);
  const contentW = bounds.w * scale;
  const contentH = bounds.h * scale;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement | HTMLDivElement>) => {
    if (e.button !== 0) return;
    const api = useEditor.getState().viewportApi;
    if (!api) return;
    const svg = e.currentTarget.querySelector('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    
    // padX/Y are the offsets to center the content within the MM_W x MM_H area
    const padX = (MM_W - contentW) / 2;
    const padY = (MM_H - contentH) / 2;
    const wx = bounds.x + (localX - padX) / scale;
    const wy = bounds.y + (localY - padY) / scale;
    api.scrollToWorld(wx, wy);
  };

  const containerClasses = cn(
    "absolute top-4 z-40 transition-all duration-300",
    rightCollapsed ? "right-4" : "right-[calc(var(--right-panel-width,320px)+1rem)]",
    collapsed ? "pointer-events-none" : "pointer-events-auto"
  );

  if (collapsed) {
    return (
      <div className={cn("absolute top-4 z-40 transition-all duration-300", rightCollapsed ? "right-4" : "right-[calc(var(--right-panel-width,320px)+1rem)]")}>
        <button
          onClick={toggle}
          title="Mostrar minimapa"
          className="size-10 grid place-items-center rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground pointer-events-auto"
        >
          <Map className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className="bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg overflow-hidden select-none">
        <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted/40">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Minimapa</span>
          <button
            onClick={toggle}
            title="Recolher"
            className="size-5 grid place-items-center rounded hover:bg-secondary text-muted-foreground"
          >
            <ChevronDown className="size-3" />
          </button>
        </div>
        <div 
          className="cursor-pointer bg-muted/20"
          onPointerDown={handlePointer}
          onPointerMove={(e) => { if (e.buttons === 1) handlePointer(e); }}
        >
          <svg
            width={MM_W}
            height={MM_H}
            viewBox={`0 0 ${MM_W} ${MM_H}`}
            className="block"
          >
            <g transform={`translate(${(MM_W - contentW) / 2} ${(MM_H - contentH) / 2}) scale(${scale}) translate(${-bounds.x} ${-bounds.y})`}>
              {/* Quadro */}
              <rect
                x={0}
                y={0}
                width={panel.width}
                height={panel.height}
                fill={panel.background}
                stroke="#94a3b8"
                strokeWidth={1 / scale}
                vectorEffect="non-scaling-stroke"
              />
              {/* Tampa */}
              {(panel.hasCover ?? true) && (
                <rect
                  x={panel.width + (panel.coverGap ?? 80)}
                  y={0}
                  width={panel.coverWidth ?? panel.width}
                  height={panel.coverHeight ?? panel.height}
                  fill={panel.coverColor ?? "#cbd5e1"}
                  stroke="#94a3b8"
                  strokeWidth={1 / scale}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {/* Wires */}
              {wires.map((w) => {
                if (!w.start || !w.end) return null;
                const p1 = resolveAnchorPoint(w.start, entities, wires);
                const p2 = resolveAnchorPoint(w.end, entities, wires);
                if (!p1 || !p2) return null;
                return (
                  <line
                    key={w.id}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={w.color}
                    strokeWidth={Math.max(1, (w.thickness ?? 2) / 2)}
                    opacity={0.6}
                  />
                );
              })}
              {/* Entidades */}
              {entities.map((e) => {
                let fill = "#64748b";
                if (e.kind === "device") fill = (e as Placed).cableColor ?? "#dc2626";
                else if (e.kind === "shape") fill = (e as Shape).fill || (e as Shape).stroke || "#3b82f6";
                else if (e.kind === "plate") fill = (e as Plate).background || "#f59e0b";
                else if (e.kind === "text") fill = (e as TextBox).color ?? "#0f172a";
                return (
                  <rect
                    key={e.id}
                    x={e.x}
                    y={e.y}
                    width={Math.max(2, e.width)}
                    height={Math.max(2, e.height)}
                    fill={fill}
                    opacity={0.85}
                  />
                );
              })}
              {/* Measurements */}
              {measurements.map((m) => {
                const p1 = resolveAnchorPoint(m.start, entities, wires) || { x: m.x1, y: m.y1 };
                const p2 = resolveAnchorPoint(m.end, entities, wires) || { x: m.x2, y: m.y2 };
                return (
                  <line
                    key={m.id}
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke={m.color}
                    strokeWidth={1 / scale}
                    strokeDasharray={`${2/scale} ${2/scale}`}
                    opacity={0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {/* Viewport */}
              {vp && (
                <rect
                  x={vp.sx}
                  y={vp.sy}
                  width={vp.sw}
                  height={vp.sh}
                  fill="rgba(59, 130, 246, 0.08)"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth={2 / scale}
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

