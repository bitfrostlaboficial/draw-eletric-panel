import { useEffect, useRef, useState } from "react";
import { ChevronDown, Map } from "lucide-react";
import { useEditor, type Placed, type Shape, type Plate, type TextBox } from "@/lib/editor-store";

const MM_W = 200;
const MM_H = 150;

export function Minimap() {
  const entities = useEditor((s) => s.entities);
  const panel = useEditor((s) => s.panel);
  const collapsed = useEditor((s) => s.minimapCollapsed);
  const toggle = useEditor((s) => s.toggleMinimap);
  const viewportApi = useEditor((s) => s.viewportApi);

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

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        title="Mostrar minimapa"
        className="absolute top-4 right-4 z-40 size-10 grid place-items-center rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground"
      >
        <Map className="size-4" />
      </button>
    );
  }

  const worldW = vp?.worldW ?? panel.width;
  const worldH = vp?.worldH ?? panel.height;
  const scale = Math.min(MM_W / worldW, MM_H / worldH);
  const contentW = worldW * scale;
  const contentH = worldH * scale;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const api = useEditor.getState().viewportApi;
    if (!api) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    // Convert minimap coords (which include letterboxing) to world coords
    const padX = (rect.width - contentW) / 2;
    const padY = (rect.height - contentH) / 2;
    const wx = (localX - padX) / scale;
    const wy = (localY - padY) / scale;
    api.scrollToWorld(wx, wy);
  };

  return (
    <div className="absolute top-4 right-4 z-40 bg-card/95 backdrop-blur border border-border rounded-lg shadow-lg overflow-hidden select-none">
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
      <svg
        width={MM_W}
        height={MM_H}
        viewBox={`0 0 ${MM_W} ${MM_H}`}
        onPointerDown={handlePointer}
        onPointerMove={(e) => { if (e.buttons === 1) handlePointer(e); }}
        className="cursor-pointer block"
        style={{ background: "hsl(var(--muted) / 0.4)" }}
      >
        <g transform={`translate(${(MM_W - contentW) / 2} ${(MM_H - contentH) / 2})`}>
          {/* Quadro */}
          <rect
            x={0}
            y={0}
            width={panel.width * scale}
            height={panel.height * scale}
            fill={panel.background}
            stroke="#94a3b8"
            strokeWidth={0.5}
          />
          {/* Tampa */}
          {(panel.hasCover ?? true) && (
            <rect
              x={(panel.width + (panel.coverGap ?? 80)) * scale}
              y={0}
              width={(panel.coverWidth ?? panel.width) * scale}
              height={(panel.coverHeight ?? panel.height) * scale}
              fill={panel.coverColor ?? "#cbd5e1"}
              stroke="#94a3b8"
              strokeWidth={0.5}
            />
          )}
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
                x={e.x * scale}
                y={e.y * scale}
                width={Math.max(1, e.width * scale)}
                height={Math.max(1, e.height * scale)}
                fill={fill}
                opacity={0.85}
              />
            );
          })}
          {/* Viewport */}
          {vp && (
            <rect
              x={vp.sx * scale}
              y={vp.sy * scale}
              width={Math.max(2, vp.sw * scale)}
              height={Math.max(2, vp.sh * scale)}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>
      </svg>
    </div>
  );
}
