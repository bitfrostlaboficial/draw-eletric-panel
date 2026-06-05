import { useEditor } from "@/lib/editor-store";
import { connectionCandidates, resolveAnchorPoint, type Pt } from "@/lib/wire-geometry";
import { CONNECTION_POINT_COLORS as CP_COLORS } from "@/lib/catalog";

/**
 * Reusable layer to show snap points (bolinhas de snap) during
 * wire creation, wire editing, measurement creation, or measurement editing.
 */
export function SnapPointsLayer({ 
  near,
  active = false,
  panelWidth,
  panelHeight,
  excludeId 
}: { 
  near: Pt | null; 
  active?: boolean;
  panelWidth: number;
  panelHeight: number;
  excludeId?: string;
}) {
  const { entities, wires, zoom } = useEditor();
  
  if (!active || !near) return null;

  // We reuse the same candidates logic from wires
  const candidates = connectionCandidates(entities, wires, {
    near,
    excludeWireId: excludeId,
    includeWires: true,
    includePanelPoints: true,
  });

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-50"
      width={panelWidth}
      height={panelHeight}
    >
      {candidates.map((c) => {
        const dist = Math.hypot(c.x - near.x, c.y - near.y);
        const isClose = dist < 30;
        if (!isClose && c.source !== "cp") return null;

        const opacity = isClose ? 1 : 0.3;
        const radius = isClose ? 5 : 3;
        const strokeWidth = isClose ? 2 : 1;
        
        let color = "#3b82f6"; // Default blue
        if (c.cpKind) {
          color = CP_COLORS[c.cpKind as keyof typeof CP_COLORS] || color;
        } else if (c.source === "wire") {
          color = "#10b981"; // Emerald for wires
        } else if (c.id.startsWith("panel:")) {
          color = "#6366f1"; // Indigo for panel
        }

        return (
          <g key={c.id} opacity={opacity}>
            <circle
              cx={c.x}
              cy={c.y}
              r={radius}
              fill="white"
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {isClose && c.cpName && (
              <g transform={`translate(${c.x + 8}, ${c.y - 8})`}>
                <rect
                  x={0}
                  y={-12}
                  width={c.cpName.length * 6 + 10}
                  height={16}
                  rx={4}
                  fill="rgba(15, 23, 42, 0.8)"
                />
                <text
                  x={5}
                  y={0}
                  fontSize={9}
                  fill="white"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                >
                  {c.cpName}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
