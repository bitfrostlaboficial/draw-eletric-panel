import { type CatalogItem } from "@/lib/catalog";

/**
 * Schematic 2D representation of an electrical device.
 * Pure CSS — performant for hundreds of components.
 */
export function DeviceGlyph({
  item,
  width,
  height,
  tag,
  compact = false,
}: {
  item: CatalogItem;
  width: number;
  height: number;
  tag?: string;
  compact?: boolean;
}) {
  const accent = item.accent ?? "#2563eb";

  // Botões / sinaleiros (round) — checked first so they don't fall into DIN-rail branch
  if (item.category === "Comando" && item.width <= 35) {
    return (
      <div
        style={{ width, height }}
        className="rounded-full border-2 border-slate-700 grid place-items-center shadow-inner"
      >
        <div
          className="rounded-full"
          style={{
            width: width * 0.7,
            height: height * 0.7,
            backgroundColor: accent,
            boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.3)",
          }}
        />
      </div>
    );
  }

  // DIN-rail style components (tall vertical breakers, contactors, relays)
  if (
    item.category === "Proteção" ||
    item.category === "Comando" ||
    (item.category === "Automação" && item.height >= 70 && item.width <= 60)
  ) {
    return (
      <div
        style={{ width, height }}
        className="relative bg-white border border-slate-400 shadow-sm flex flex-col items-stretch overflow-hidden"
      >
        <div className="h-1 bg-slate-200 border-b border-slate-300 shrink-0" />
        <div className="flex-1 flex flex-col items-center justify-between py-1 relative">
          <div
            className="h-1.5 w-full"
            style={{ backgroundColor: accent }}
          />
          <div className="flex-1 w-full flex items-center justify-center">
            {!compact && tag && (
              <span className="text-[8px] font-mono font-bold text-slate-700">
                {tag}
              </span>
            )}
          </div>
          {/* lever */}
          <div className="w-3 h-2 bg-slate-700 rounded-sm" />
          <div
            className="h-1.5 w-full mt-1"
            style={{ backgroundColor: accent, opacity: 0.5 }}
          />
        </div>
        <div className="h-1 bg-slate-200 border-t border-slate-300 shrink-0" />
      </div>
    );
  }

  // Trilho DIN
  if (item.id.startsWith("rail-din")) {
    return (
      <div
        style={{ width, height }}
        className="relative"
      >
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-slate-300 border-y border-slate-400"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, oklch(0.85 0.01 256) 0 8px, oklch(0.78 0.015 256) 8px 10px)",
          }}
        />
      </div>
    );
  }

  // Canaleta
  if (item.id.startsWith("duct")) {
    return (
      <div
        style={{ width, height }}
        className="bg-slate-200 border border-slate-300 relative overflow-hidden"
      >
        <div
          className="absolute inset-1"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, transparent 0 4px, rgba(0,0,0,0.08) 4px 5px)",
          }}
        />
      </div>
    );
  }

  // (round buttons handled at top)

  // Bornes
  if (item.id.startsWith("term")) {
    return (
      <div
        style={{ width, height }}
        className="bg-slate-100 border border-slate-400 flex flex-col items-center justify-between py-1"
      >
        <div className="size-1 rounded-full bg-amber-400" />
        <div className="size-1 rounded-full bg-amber-400" />
      </div>
    );
  }

  // Generic device (PLC, IHM, fontes, inversores, etc.)
  return (
    <div
      style={{ width, height }}
      className="bg-white border border-slate-400 rounded-sm shadow-sm flex flex-col overflow-hidden"
    >
      <div
        className="h-1.5 shrink-0"
        style={{ backgroundColor: accent }}
      />
      <div className="flex-1 p-1.5 flex flex-col gap-1 min-h-0">
        <div className="flex items-start justify-between gap-1">
          <span className="text-[8px] font-bold text-slate-800 leading-tight truncate">
            {item.name}
          </span>
          <div className="size-1.5 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
        </div>
        <div className="text-[7px] text-slate-500 leading-tight truncate">
          {item.brand}
        </div>
        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xs grid place-items-center min-h-0">
          {tag && (
            <span className="text-[8px] font-mono font-semibold text-slate-600">
              {tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
