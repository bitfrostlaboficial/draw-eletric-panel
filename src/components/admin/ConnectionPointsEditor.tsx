import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, Rows3, Wand2, MousePointer2, X } from "lucide-react";
import {
  CONNECTION_POINT_COLORS,
  type ComponentConnectionPoint,
  type ComponentConnectionPointKind,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";

type Props = {
  imageUrl?: string | null;
  width: number;
  height: number;
  value: ComponentConnectionPoint[];
  onChange: (next: ComponentConnectionPoint[]) => void;
};

const KINDS: ComponentConnectionPointKind[] = [
  "input",
  "output",
  "power",
  "ground",
  "comm",
  "analog-in",
  "analog-out",
  "generic",
];

const KIND_LABEL: Record<ComponentConnectionPointKind, string> = {
  input: "Entrada digital",
  output: "Saída digital",
  power: "Alimentação",
  ground: "Terra",
  comm: "Comunicação",
  "analog-in": "Entrada analógica",
  "analog-out": "Saída analógica",
  generic: "Genérico",
};

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cp-${Math.random().toString(36).slice(2, 10)}`;
}

export function ConnectionPointsEditor({ imageUrl, width, height, value, onChange }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [genOpen, setGenOpen] = useState(false);
  const [tool, setTool] = useState<"select" | "add">("select");
  const [addKind, setAddKind] = useState<ComponentConnectionPointKind>("input");

  // Aspect-ratio stage (fixed CSS height; width derived from width/height)
  const stageH = 360;
  const stageW = Math.max(160, Math.round((width / Math.max(1, height)) * stageH));

  const selected = useMemo(() => value.find((c) => c.id === selectedId) ?? null, [value, selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        onChange(value.filter((c) => c.id !== selectedId));
        setSelectedId(null);
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        setTool("select");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, value, onChange]);

  const clientToNorm = (clientX: number, clientY: number) => {
    const r = stageRef.current!.getBoundingClientRect();
    return {
      nx: Math.max(0, Math.min(1, (clientX - r.left) / r.width)),
      ny: Math.max(0, Math.min(1, (clientY - r.top) / r.height)),
    };
  };

  const onStageMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // ignore clicks on dots — they handle their own
    const target = e.target as HTMLElement;
    if (target.closest("[data-cp-dot]")) return;
    if (tool === "add") {
      const { nx, ny } = clientToNorm(e.clientX, e.clientY);
      const nextNumber =
        value.filter((c) => c.kind === addKind).length + 1;
      const point: ComponentConnectionPoint = {
        id: uid(),
        name: `${addKind === "input" ? "X" : addKind === "output" ? "Y" : addKind.slice(0, 1).toUpperCase()}${nextNumber}`,
        nx,
        ny,
        kind: addKind,
      };
      onChange([...value, point]);
      setSelectedId(point.id);
    } else {
      setSelectedId(null);
    }
  };

  const startDrag = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedId(id);
    setDragId(id);
  };

  useEffect(() => {
    if (!dragId) return;
    const onMove = (e: MouseEvent) => {
      const { nx, ny } = clientToNorm(e.clientX, e.clientY);
      onChange(value.map((c) => (c.id === dragId ? { ...c, nx, ny } : c)));
    };
    const onUp = () => setDragId(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragId, value, onChange]);

  const updateSelected = (patch: Partial<ComponentConnectionPoint>) => {
    if (!selectedId) return;
    onChange(value.map((c) => (c.id === selectedId ? { ...c, ...patch } : c)));
  };

  const removeSelected = () => {
    if (!selectedId) return;
    onChange(value.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  };

  const handleGenerate = (rowConfig: RowConfig) => {
    const created: ComponentConnectionPoint[] = [];
    for (let i = 0; i < rowConfig.count; i++) {
      const t = rowConfig.count === 1 ? 0.5 : i / (rowConfig.count - 1);
      const nx =
        rowConfig.direction === "horizontal"
          ? rowConfig.start + (rowConfig.end - rowConfig.start) * t
          : rowConfig.fixed;
      const ny =
        rowConfig.direction === "vertical"
          ? rowConfig.start + (rowConfig.end - rowConfig.start) * t
          : rowConfig.fixed;
      created.push({
        id: uid(),
        name: `${rowConfig.prefix}${rowConfig.startIndex + i}`,
        nx,
        ny,
        kind: rowConfig.kind,
      });
    }
    onChange([...value, ...created]);
    setGenOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex rounded-md border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setTool("select")}
            className={cn(
              "px-2.5 py-1.5 text-xs flex items-center gap-1.5",
              tool === "select" ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            <MousePointer2 className="size-3.5" /> Selecionar
          </button>
          <button
            type="button"
            onClick={() => setTool("add")}
            className={cn(
              "px-2.5 py-1.5 text-xs flex items-center gap-1.5 border-l border-border",
              tool === "add" ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
            )}
          >
            <Plus className="size-3.5" /> Adicionar borne
          </button>
        </div>

        {tool === "add" && (
          <select
            value={addKind}
            onChange={(e) => setAddKind(e.target.value as ComponentConnectionPointKind)}
            className="px-2 py-1.5 bg-card border border-border rounded text-xs"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABEL[k]}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => setGenOpen(true)}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-secondary flex items-center gap-1.5"
        >
          <Rows3 className="size-3.5" /> Gerar fileira
        </button>

        <div className="ml-auto text-[11px] text-muted-foreground">
          {value.length} borne{value.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="flex gap-3 items-start">
        {/* Stage */}
        <div
          ref={stageRef}
          onMouseDown={onStageMouseDown}
          className={cn(
            "relative shrink-0 rounded border border-border overflow-hidden select-none",
            tool === "add" ? "cursor-crosshair" : "cursor-default",
          )}
          style={{
            width: stageW,
            height: stageH,
            background:
              "repeating-conic-gradient(oklch(0.94 0 0) 0% 25%, oklch(1 0 0) 0% 50%) 50% / 12px 12px",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-xs text-muted-foreground pointer-events-none">
              Envie a imagem do componente para começar
            </div>
          )}

          {/* Dots */}
          {value.map((cp) => {
            const isSel = cp.id === selectedId;
            const color = CONNECTION_POINT_COLORS[cp.kind];
            return (
              <div
                key={cp.id}
                data-cp-dot
                onMouseDown={startDrag(cp.id)}
                title={`${cp.name} · ${KIND_LABEL[cp.kind]}`}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform",
                  isSel && "scale-125 z-10",
                )}
                style={{ left: `${cp.nx * 100}%`, top: `${cp.ny * 100}%` }}
              >
                <div
                  className={cn(
                    "size-3 rounded-full border-2 shadow",
                    isSel ? "border-foreground" : "border-white",
                  )}
                  style={{ background: color, boxShadow: `0 0 0 ${isSel ? 4 : 0}px ${color}33` }}
                />
                <div
                  className="absolute left-1/2 -translate-x-1/2 -top-5 text-[9px] font-mono px-1 rounded bg-black/70 text-white whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100"
                  style={{ opacity: isSel ? 1 : undefined }}
                >
                  {cp.name}
                </div>
              </div>
            );
          })}
        </div>

        {/* Inspector */}
        <div className="flex-1 min-w-0 bg-secondary/30 border border-border rounded p-3 space-y-2 max-h-[360px] overflow-y-auto">
          {selected ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Borne selecionado
                </span>
                <button
                  onClick={removeSelected}
                  className="text-destructive text-xs flex items-center gap-1 hover:underline"
                >
                  <Trash2 className="size-3" /> Remover
                </button>
              </div>
              <Field
                label="Nome"
                value={selected.name}
                onChange={(v) => updateSelected({ name: v })}
              />
              <Field
                label="Label (opcional)"
                value={selected.label ?? ""}
                onChange={(v) => updateSelected({ label: v || undefined })}
              />
              <Field
                label="Sinal (opcional)"
                value={selected.signal ?? ""}
                onChange={(v) => updateSelected({ signal: v || undefined })}
              />
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Tipo elétrico
                </label>
                <select
                  value={selected.kind}
                  onChange={(e) =>
                    updateSelected({ kind: e.target.value as ComponentConnectionPointKind })
                  }
                  className="mt-1 w-full px-2 py-1.5 bg-card border border-border rounded text-sm"
                >
                  {KINDS.map((k) => (
                    <option key={k} value={k}>
                      {KIND_LABEL[k]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Lado preferencial
                </label>
                <select
                  value={selected.side ?? ""}
                  onChange={(e) =>
                    updateSelected({
                      side: (e.target.value || undefined) as ComponentConnectionPoint["side"],
                    })
                  }
                  className="mt-1 w-full px-2 py-1.5 bg-card border border-border rounded text-sm"
                >
                  <option value="">Auto</option>
                  <option value="top">Topo</option>
                  <option value="right">Direita</option>
                  <option value="bottom">Base</option>
                  <option value="left">Esquerda</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <NumField
                  label="nx"
                  value={Number(selected.nx.toFixed(4))}
                  step={0.01}
                  onChange={(v) => updateSelected({ nx: Math.max(0, Math.min(1, v)) })}
                />
                <NumField
                  label="ny"
                  value={Number(selected.ny.toFixed(4))}
                  step={0.01}
                  onChange={(v) => updateSelected({ ny: Math.max(0, Math.min(1, v)) })}
                />
              </div>
            </>
          ) : (
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Use <strong>Adicionar borne</strong> e clique na imagem para criar pontos.
              </p>
              <p>Arraste qualquer borne para reposicionar. Pressione Delete para remover.</p>
              <p>
                Coordenadas <code>nx/ny</code> são normalizadas (0–1), então acompanham
                redimensionamentos automaticamente no canvas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lista compacta */}
      {value.length > 0 && (
        <div className="border border-border rounded-md max-h-32 overflow-y-auto">
          <table className="w-full text-xs">
            <tbody>
              {value.map((cp) => (
                <tr
                  key={cp.id}
                  onClick={() => setSelectedId(cp.id)}
                  className={cn(
                    "cursor-pointer border-t border-border first:border-t-0",
                    cp.id === selectedId ? "bg-primary/10" : "hover:bg-secondary/50",
                  )}
                >
                  <td className="p-1.5 w-6">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ background: CONNECTION_POINT_COLORS[cp.kind] }}
                    />
                  </td>
                  <td className="p-1.5 font-mono">{cp.name}</td>
                  <td className="p-1.5 text-muted-foreground">{KIND_LABEL[cp.kind]}</td>
                  <td className="p-1.5 font-mono text-[10px] text-muted-foreground text-right">
                    {(cp.nx * 100).toFixed(0)}%, {(cp.ny * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {genOpen && <RowGeneratorDialog onClose={() => setGenOpen(false)} onGenerate={handleGenerate} />}
    </div>
  );
}

/* ---------- Row generator ---------- */

type RowConfig = {
  count: number;
  direction: "horizontal" | "vertical";
  start: number;
  end: number;
  fixed: number;
  kind: ComponentConnectionPointKind;
  prefix: string;
  startIndex: number;
};

function RowGeneratorDialog({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (cfg: RowConfig) => void;
}) {
  const [cfg, setCfg] = useState<RowConfig>({
    count: 8,
    direction: "horizontal",
    start: 0.15,
    end: 0.85,
    fixed: 0.5,
    kind: "input",
    prefix: "X",
    startIndex: 0,
  });
  const set = (p: Partial<RowConfig>) => setCfg((c) => ({ ...c, ...p }));

  return (
    <div className="fixed inset-0 bg-black/40 z-[60] grid place-items-center p-4" onClick={onClose}>
      <div
        className="bg-card rounded-lg shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h4 className="font-bold text-sm flex items-center gap-2">
            <Wand2 className="size-4" /> Gerar fileira de bornes
          </h4>
          <button onClick={onClose} className="size-7 grid place-items-center rounded hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <NumField label="Quantidade" value={cfg.count} step={1} onChange={(v) => set({ count: Math.max(1, Math.round(v)) })} />
            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Direção</label>
              <select
                value={cfg.direction}
                onChange={(e) => set({ direction: e.target.value as RowConfig["direction"] })}
                className="mt-1 w-full px-2 py-1.5 bg-card border border-border rounded text-sm"
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <NumField label={cfg.direction === "horizontal" ? "x início" : "y início"} value={cfg.start} step={0.01} onChange={(v) => set({ start: v })} />
            <NumField label={cfg.direction === "horizontal" ? "x fim" : "y fim"} value={cfg.end} step={0.01} onChange={(v) => set({ end: v })} />
            <NumField label={cfg.direction === "horizontal" ? "y fixo" : "x fixo"} value={cfg.fixed} step={0.01} onChange={(v) => set({ fixed: v })} />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Tipo elétrico</label>
            <select
              value={cfg.kind}
              onChange={(e) => set({ kind: e.target.value as ComponentConnectionPointKind })}
              className="mt-1 w-full px-2 py-1.5 bg-card border border-border rounded text-sm"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Prefixo" value={cfg.prefix} onChange={(v) => set({ prefix: v })} />
            <NumField label="Índice inicial" value={cfg.startIndex} step={1} onChange={(v) => set({ startIndex: Math.round(v) })} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Valores entre 0 e 1 (porcentagem da imagem). Ex.: <code>0.15 → 0.85</code> distribui na faixa central.
          </p>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-secondary">
            Cancelar
          </button>
          <button
            onClick={() => onGenerate(cfg)}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Gerar {cfg.count} bornes
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- inputs ---------- */

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full px-2 py-1.5 bg-card border border-border rounded text-sm"
      />
    </div>
  );
}

function NumField({
  label,
  value,
  step,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full px-2 py-1.5 bg-card border border-border rounded text-sm font-mono"
      />
    </div>
  );
}
