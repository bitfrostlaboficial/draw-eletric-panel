import { useEffect, useRef, useState, useMemo, useLayoutEffect } from "react";
import { ChevronDown, Map } from "lucide-react";
import { useEditor, type Placed, type Shape, type Plate, type TextBox } from "@/lib/editor-store";
import { resolveAnchorPoint } from "@/lib/wire-geometry";
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
  // Removendo flags de sidebars já que agora o posicionamento é relativo ao sandbox container


  const [camera, setCamera] = useState<{
    x: number; y: number; w: number; h: number;
  } | null>(null);
  
  const rafRef = useRef<number | null>(null);

  // Monitor layout changes to ensure positioning is updated
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    const handleResize = () => setTick(t => t + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => {
    if (collapsed || !viewportApi) return;
    const tick = () => {
      const s = viewportApi.getViewportState();
      if (s) {
        // Current camera view in world coordinates
        const vx = (s.scrollLeft - s.worldOriginX) / s.zoom;
        const vy = (s.scrollTop - s.worldOriginY) / s.zoom;
        const vw = s.clientWidth / s.zoom;
        const vh = s.clientHeight / s.zoom;
        setCamera({ x: vx, y: vy, w: vw, h: vh });
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [collapsed, viewportApi]);

  // The Minimap bounds are strictly derived from the current camera
  // showing 3x the current view area (original + 1 view width/height on each side for padding)
  const bounds = useMemo(() => {
    if (!camera) {
      return { x: -500, y: -500, w: 2000, h: 2000 };
    }
    
    const padFactor = 1.0; // Show 1 extra "screen" worth of area on each side
    const padW = camera.w * padFactor;
    const padH = camera.h * padFactor;
    
    return {
      x: camera.x - padW,
      y: camera.y - padH,
      w: camera.w + padW * 2,
      h: camera.h + padH * 2
    };
  }, [camera]);

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
    
    const padX = (MM_W - contentW) / 2;
    const padY = (MM_H - contentH) / 2;
    const wx = bounds.x + (localX - padX) / scale;
    const wy = bounds.y + (localY - padY) / scale;
    api.scrollToWorld(wx, wy);
  };

  const rightOffset = !rightCollapsed ? "right-4" : "right-4"; // Agora é relativo ao sandbox, então right-4 é sempre seguro


  if (collapsed) {
    return (
      <div className="absolute top-4 right-4 transition-all duration-300 z-40">
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
    <div className={cn(
      "absolute top-4 right-4 transition-all duration-300 z-40",
      collapsed ? "pointer-events-none" : "pointer-events-auto"
    )}>
      <div className="bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg overflow-hidden select-none">
        <div className="flex items-center justify-between px-2 py-1 border-b border-border bg-muted/40">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Visão Ampliada</span>
          <button
            onClick={toggle}
            title="Recolher"
            className="size-5 grid place-items-center rounded hover:bg-secondary text-muted-foreground"
          >
            <ChevronDown className="size-3" />
          </button>
        </div>
        <div 
          className="cursor-pointer"
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
              {/* Reference Grid/Panel */}
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
              {/* Cover */}
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
              {/* Entities */}
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
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}


