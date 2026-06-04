import { useEditor, type Placed, type TextBox, type Shape, type Plate, type Wire, type WireStyle, type WireTerminal } from "@/lib/editor-store";
import { useCatalog } from "@/lib/use-catalog";
import {
  Copy, RotateCw, Trash2,
  ChevronsUp, ChevronsDown, ChevronUp, ChevronDown,
  Bold, Italic, AlignLeft, AlignCenter, AlignRight, Upload,
  PanelRightClose, PanelRightOpen, Settings2, Cable, Ruler,
} from "lucide-react";
import { useRef } from "react";
import { ColorPicker } from "./ColorPicker";

const CABLE_COLORS = [
  { name: "Fase R", value: "#dc2626" },
  { name: "Fase S", value: "#fbbf24" },
  { name: "Fase T", value: "#0f172a" },
  { name: "Neutro", value: "#2563eb" },
  { name: "Terra", value: "#16a34a" },
];

const PANEL_BG = ["#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8", "#1e293b", "#0f172a", "#fef3c7", "#dcfce7"];

export function PropertiesPanel() {
  const {
    entities,
    wires,
    selectedId,
    selectedWireId,
    panel,
    customCatalog,
    setPanel,
    updateEntity,
    duplicateEntity,
    rotateEntity,
    removeEntity,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    rightCollapsed,
    toggleRightPanel,
    updateWire,
    removeWire,
    selectedMeasurementId,
    measurements,
    updateMeasurement,
    removeMeasurement,
  } = useEditor();


  const { data: officialCatalog = [] } = useCatalog();
  const sel = entities.find((i) => i.id === selectedId);
  const selWire = wires.find((w) => w.id === selectedWireId);
  const selMeasure = measurements.find((m) => m.id === selectedMeasurementId);

  const cat =
    sel && sel.kind === "device"
      ? officialCatalog.find((c) => c.id === (sel as Placed).catalogId) ??
        customCatalog.find((c) => c.id === (sel as Placed).catalogId)
      : null;


  if (rightCollapsed) {
    return (
      <aside className="w-10 border-l border-border bg-card flex flex-col items-center py-2 shrink-0">
        <button
          onClick={toggleRightPanel}
          title="Expandir propriedades ( ] )"
          className="size-8 grid place-items-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground"
        >
          <PanelRightOpen className="size-4" />
        </button>
        <div className="mt-2 text-muted-foreground" title="Propriedades">
          <Settings2 className="size-4" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Propriedades
        </h2>
        <button onClick={toggleRightPanel} title="Recolher ( ] )" className="size-7 grid place-items-center rounded hover:bg-secondary text-muted-foreground">
          <PanelRightClose className="size-4" />
        </button>
      </div>

      {!sel && !selWire && !selMeasure && <PanelSettings panel={panel} setPanel={setPanel} />}

      {selMeasure && (
        <MeasureProps
          measure={selMeasure}
          onUpdate={(p) => updateMeasurement(selMeasure.id, p)}
          onRemove={() => removeMeasurement(selMeasure.id)}
        />
      )}


      {selWire && (
        <WireProps
          wire={selWire}
          onUpdate={(p) => updateWire(selWire.id, p)}
          onRemove={() => removeWire(selWire.id)}
        />
      )}


      {sel && (
        <div className="p-5 space-y-5">
          <LayerControls
            id={sel.id}
            onFront={bringToFront}
            onBack={sendToBack}
            onUp={bringForward}
            onDown={sendBackward}
          />

          <CommonTransform sel={sel} onUpdate={updateEntity} />

          {sel.kind === "device" && cat && (
            <DeviceProps
              sel={sel as Placed}
              cat={cat}
              onUpdate={(p) => updateEntity(sel.id, p)}
            />
          )}

          {sel.kind === "text" && (
            <TextProps sel={sel as TextBox} onUpdate={(p) => updateEntity(sel.id, p)} />
          )}

          {sel.kind === "shape" && (
            <ShapeProps sel={sel as Shape} />
          )}

          {sel.kind === "plate" && (
            <PlateProps sel={sel as Plate} onUpdate={(p) => updateEntity(sel.id, p)} />
          )}

          {sel.kind === "device" && (
            <div>
              <Label>Cabeamento</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CABLE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    title={c.name}
                    onClick={() => updateEntity(sel.id, { cableColor: c.value })}
                    className="size-7 rounded-full border-2 border-card shadow-sm"
                    style={{
                      backgroundColor: c.value,
                      boxShadow:
                        (sel as Placed).cableColor === c.value
                          ? `0 0 0 2px ${c.value}`
                          : "0 0 0 1px var(--color-border)",
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border space-y-2">
            <button
              onClick={() => duplicateEntity(sel.id)}
              className="w-full py-2 bg-foreground text-background rounded-md font-medium text-sm hover:opacity-90 flex items-center justify-center gap-2"
            >
              <Copy className="size-3.5" /> Duplicar
            </button>
            <button
              onClick={() => rotateEntity(sel.id)}
              className="w-full py-2 border border-border rounded-md font-medium text-sm hover:bg-secondary flex items-center justify-center gap-2"
            >
              <RotateCw className="size-3.5" /> Girar 90°
            </button>
            <button
              onClick={() => removeEntity(sel.id)}
              className="w-full py-2 text-destructive rounded-md font-medium text-sm hover:bg-destructive/10 flex items-center justify-center gap-2"
            >
              <Trash2 className="size-3.5" /> Remover
            </button>
          </div>
        </div>
      )}
    </aside>
  );

}

function PanelSettings({ panel, setPanel }: { panel: ReturnType<typeof useEditor.getState>["panel"]; setPanel: (p: Partial<ReturnType<typeof useEditor.getState>["panel"]>) => void }) {
  const unit = useEditor((s) => s.unit);
  const showMeasures = useEditor((s) => s.showMeasures);
  const setUnit = useEditor((s) => s.setUnit);
  const toggleMeasures = useEditor((s) => s.toggleMeasures);
  return (
    <div className="p-5 space-y-6">

      <div>
        <Label>Quadro elétrico</Label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <NumField label="Largura (mm)" value={panel.width} onChange={(v) => setPanel({ width: v })} />
          <NumField label="Altura (mm)" value={panel.height} onChange={(v) => setPanel({ height: v })} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: "Pequeno", w: 400, h: 500 },
            { label: "Médio", w: 600, h: 700 },
            { label: "Grande", w: 800, h: 1000 },
            { label: "Industrial", w: 1000, h: 1200 },
          ].map((p) => (
            <button key={p.label} onClick={() => setPanel({ width: p.w, height: p.h })}
              className="text-[11px] py-1.5 border border-border rounded hover:bg-secondary">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Cor de fundo</Label>
        <div className="mt-2 flex flex-wrap gap-2 items-center">
          {PANEL_BG.map((c) => (
            <button key={c} onClick={() => setPanel({ background: c })}
              className="size-7 rounded border-2"
              style={{
                background: c,
                borderColor: panel.background === c ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
          <ColorPicker value={panel.background} onChange={(v) => setPanel({ background: v })} />
        </div>
      </div>

      <div>
        <Label>Textura</Label>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {(["smooth", "brushed", "hammered"] as const).map((t) => (
            <button key={t} onClick={() => setPanel({ texture: t })}
              className={`text-[11px] py-1.5 border rounded capitalize ${
                panel.texture === t ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
              }`}>
              {t === "smooth" ? "Liso" : t === "brushed" ? "Escovado" : "Texturizado"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Estilo do gabinete</Label>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {([
            { key: "flat", label: "Plano" },
            { key: "depth", label: "Profundidade" },
            { key: "depth-soft", label: "Moldura" },
          ] as const).map((s) => (
            <button key={s.key} onClick={() => setPanel({ style: s.key })}
              className={`text-[11px] py-1.5 border rounded ${
                (panel.style ?? "flat") === s.key ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
              }`}>
              {s.label}
            </button>
          ))}
        </div>
        {(panel.style ?? "flat") !== "flat" && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-20">Profundidade</span>
              <input
                type="range" min={6} max={48} step={2}
                value={panel.depth ?? 18}
                onChange={(e) => setPanel({ depth: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="text-[11px] font-mono w-8 text-right">{panel.depth ?? 18}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground w-20">Cor moldura</span>
              <ColorPicker value={panel.frameColor ?? "#94a3b8"} onChange={(v) => setPanel({ frameColor: v })} />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>Tampa lateral</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button onClick={() => setPanel({ hasCover: !(panel.hasCover ?? true) })}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              (panel.hasCover ?? true) ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
            }`}>
            {(panel.hasCover ?? true) ? "Com tampa" : "Sem tampa"}
          </button>
          {(panel.hasCover ?? true) && (
            <ColorPicker value={panel.coverColor ?? "#cbd5e1"} onChange={(v) => setPanel({ coverColor: v })} />
          )}
        </div>
        {(panel.hasCover ?? true) && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <NumField label="Largura" value={panel.coverWidth ?? panel.width} onChange={(v) => setPanel({ coverWidth: v })} />
            <NumField label="Altura" value={panel.coverHeight ?? panel.height} onChange={(v) => setPanel({ coverHeight: v })} />
            <NumField label="Gap" value={panel.coverGap ?? 80} onChange={(v) => setPanel({ coverGap: v })} />
          </div>
        )}
      </div>

      <div>
        <Label>Medidas</Label>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => toggleMeasures()}
            className={`px-3 py-1.5 text-xs rounded-md border ${
              showMeasures ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
            }`}>
            {showMeasures ? "Réguas ativas" : "Mostrar réguas"}
          </button>
          <div className="flex items-center gap-1">
            {(["mm", "cm"] as const).map((u) => (
              <button key={u} onClick={() => setUnit(u)}
                className={`px-2 py-1 text-[11px] rounded border font-mono uppercase ${
                  unit === u ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
                }`}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="text-xs text-muted-foreground border-t border-border pt-4">
        Selecione um componente no quadro para editar suas propriedades.
      </div>
    </div>
  );
}


function LayerControls({
  id, onFront, onBack, onUp, onDown,
}: { id: string; onFront: (id: string) => void; onBack: (id: string) => void; onUp: (id: string) => void; onDown: (id: string) => void }) {
  return (
    <div>
      <Label>Camadas</Label>
      <div className="mt-2 grid grid-cols-4 gap-1">
        <LayerBtn title="Trazer para frente" onClick={() => onFront(id)}><ChevronsUp className="size-3.5" /></LayerBtn>
        <LayerBtn title="Avançar" onClick={() => onUp(id)}><ChevronUp className="size-3.5" /></LayerBtn>
        <LayerBtn title="Recuar" onClick={() => onDown(id)}><ChevronDown className="size-3.5" /></LayerBtn>
        <LayerBtn title="Enviar para trás" onClick={() => onBack(id)}><ChevronsDown className="size-3.5" /></LayerBtn>
      </div>
    </div>
  );
}

function LayerBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button title={title} onClick={onClick} className="py-1.5 border border-border rounded hover:bg-secondary flex items-center justify-center">
      {children}
    </button>
  );
}

function CommonTransform({ sel, onUpdate }: { sel: any; onUpdate: (id: string, p: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Largura" value={Math.round(sel.width)} onChange={(v) => onUpdate(sel.id, { width: Math.max(8, v) })} />
        <NumField label="Altura" value={Math.round(sel.height)} onChange={(v) => onUpdate(sel.id, { height: Math.max(8, v) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="X" value={Math.round(sel.x)} onChange={(v) => onUpdate(sel.id, { x: v })} />
        <NumField label="Y" value={Math.round(sel.y)} onChange={(v) => onUpdate(sel.id, { y: v })} />
      </div>
      <div>
        <Label>Rotação</Label>
        <div className="mt-1 grid grid-cols-4 gap-1">
          {[0, 90, 180, 270].map((deg) => (
            <button key={deg} onClick={() => onUpdate(sel.id, { rotation: deg })}
              className={`text-[11px] py-1 border rounded font-mono ${
                sel.rotation === deg ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
              }`}>{deg}°</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DeviceProps({ sel, cat, onUpdate }: { sel: Placed; cat: any; onUpdate: (p: Partial<Placed>) => void }) {
  const o = sel.overrides;
  const fileRef = useRef<HTMLInputElement>(null);

  const onImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onUpdate({ overrides: { ...o, imageUrl: String(reader.result) } });
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-secondary rounded-lg border border-border">
        <div className="text-sm font-bold">{o.name ?? cat.name}</div>
        <div className="text-xs text-muted-foreground">{o.brand ?? cat.brand}</div>
        <div className="text-[10px] font-mono text-muted-foreground mt-1">{cat.subtitle}</div>
      </div>

      <TextField label="Tag do projeto" value={sel.tag} onChange={(v) => onUpdate({ tag: v })} />

      <div className="grid grid-cols-2 gap-2">
        <TextField label="Modelo" value={o.name ?? cat.name} onChange={(v) => onUpdate({ overrides: { ...o, name: v } })} />
        <TextField label="Marca" value={o.brand ?? cat.brand} onChange={(v) => onUpdate({ overrides: { ...o, brand: v } })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Corrente" value={o.current ?? cat.current ?? ""} onChange={(v) => onUpdate({ overrides: { ...o, current: v } })} />
        <TextField label="Tensão" value={o.voltage ?? cat.voltage ?? ""} onChange={(v) => onUpdate({ overrides: { ...o, voltage: v } })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Potência" value={o.power ?? cat.power ?? ""} onChange={(v) => onUpdate({ overrides: { ...o, power: v } })} />
        <TextField label="Capacidade" value={o.capacity ?? cat.capacity ?? ""} onChange={(v) => onUpdate({ overrides: { ...o, capacity: v } })} />
      </div>
      <NumField label="Polos" value={o.poles ?? cat.poles ?? 1} onChange={(v) => onUpdate({ overrides: { ...o, poles: v } })} />

      <div className="flex flex-col gap-1">
        <Label>Descrição técnica</Label>
        <textarea
          value={o.description ?? cat.description ?? ""}
          onChange={(e) => onUpdate({ overrides: { ...o, description: e.target.value } })}
          rows={2}
          className="px-2 py-1.5 bg-card border border-border rounded text-xs"
        />
      </div>

      <div>
        <Label>Imagem do equipamento</Label>
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => fileRef.current?.click()}
            className="flex-1 py-1.5 border border-border rounded text-xs hover:bg-secondary flex items-center justify-center gap-1.5">
            <Upload className="size-3" /> {o.imageUrl ? "Trocar" : "Enviar"} imagem
          </button>
          {o.imageUrl && (
            <button onClick={() => onUpdate({ overrides: { ...o, imageUrl: undefined } })}
              className="px-2 py-1.5 text-xs text-destructive border border-border rounded hover:bg-destructive/10">
              Remover
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/*" hidden
            onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
        </div>
        {o.imageUrl && (
          <div
            className="mt-2 max-h-24 border border-border rounded overflow-hidden p-1"
            style={{ background: "repeating-conic-gradient(oklch(0.95 0 0) 0% 25%, oklch(1 0 0) 0% 50%) 50% / 8px 8px" }}
          >
            <img src={o.imageUrl} alt="" className="max-h-20 mx-auto object-contain" />
          </div>
        )}
      </div>
    </div>
  );
}

function TextProps({ sel, onUpdate }: { sel: TextBox; onUpdate: (p: Partial<TextBox>) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Texto</Label>
        <textarea
          value={sel.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={2}
          className="px-2 py-1.5 bg-card border border-border rounded text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Tamanho (px)" value={sel.fontSize} onChange={(v) => onUpdate({ fontSize: Math.max(8, v) })} />
        <div className="flex flex-col gap-1">
          <Label>Cor</Label>
          <ColorPicker value={sel.color} onChange={(v) => onUpdate({ color: v })} />
        </div>
      </div>
      <div>
        <Label>Estilo</Label>
        <div className="mt-1 grid grid-cols-5 gap-1">
          <StyleBtn active={sel.bold} onClick={() => onUpdate({ bold: !sel.bold })}><Bold className="size-3.5" /></StyleBtn>
          <StyleBtn active={sel.italic} onClick={() => onUpdate({ italic: !sel.italic })}><Italic className="size-3.5" /></StyleBtn>
          <StyleBtn active={sel.align === "left"} onClick={() => onUpdate({ align: "left" })}><AlignLeft className="size-3.5" /></StyleBtn>
          <StyleBtn active={sel.align === "center"} onClick={() => onUpdate({ align: "center" })}><AlignCenter className="size-3.5" /></StyleBtn>
          <StyleBtn active={sel.align === "right"} onClick={() => onUpdate({ align: "right" })}><AlignRight className="size-3.5" /></StyleBtn>
        </div>
      </div>
      <div>
        <Label>Fundo</Label>
        <div className="mt-2 flex gap-2 items-center">
          <ColorPicker
            value={sel.background}
            onChange={(v) => onUpdate({ background: v })}
            allowTransparent
          />
          <span className="text-xs text-muted-foreground font-mono">
            {sel.background === "transparent" ? "Transparente" : sel.background}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlateProps({ sel, onUpdate }: { sel: Plate; onUpdate: (p: Partial<Plate>) => void }) {
  const ICONS: { v: NonNullable<Plate["icon"]>; label: string }[] = [
    { v: "none", label: "—" },
    { v: "bolt", label: "Raio" },
    { v: "ground", label: "Terra" },
    { v: "warning", label: "Atenção" },
    { v: "danger", label: "Perigo" },
    { v: "lock", label: "Cadeado" },
    { v: "energized", label: "Energ." },
    { v: "ppe", label: "EPI" },
  ];
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <Label>Texto</Label>
        <textarea
          value={sel.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          rows={3}
          className="px-2 py-1.5 bg-card border border-border rounded text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Fonte (px)" value={sel.fontSize} onChange={(v) => onUpdate({ fontSize: Math.max(6, v) })} />
        <div className="flex flex-col gap-1">
          <Label>Peso</Label>
          <select
            value={sel.fontWeight}
            onChange={(e) => onUpdate({ fontWeight: Number(e.target.value) as 400 | 600 | 700 | 800 })}
            className="px-2 py-1.5 bg-card border border-border rounded text-sm"
          >
            <option value={400}>Regular</option>
            <option value={600}>Semibold</option>
            <option value={700}>Bold</option>
            <option value={800}>Extra-bold</option>
          </select>
        </div>
      </div>
      <div>
        <Label>Alinhamento</Label>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} onClick={() => onUpdate({ align: a })}
              className={`py-1.5 text-[11px] border rounded ${sel.align === a ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}>
              {a === "left" ? "Esq." : a === "center" ? "Centro" : "Dir."}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1"><Label>Cor texto</Label><ColorPicker value={sel.color} onChange={(v) => onUpdate({ color: v })} /></div>
        <div className="flex flex-col gap-1"><Label>Fundo</Label><ColorPicker value={sel.background} onChange={(v) => onUpdate({ background: v })} allowTransparent /></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1"><Label>Cor borda</Label><ColorPicker value={sel.borderColor} onChange={(v) => onUpdate({ borderColor: v })} /></div>
        <NumField label="Espessura borda" value={sel.borderWidth} onChange={(v) => onUpdate({ borderWidth: Math.max(0, v) })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Cantos (px)" value={sel.cornerRadius} onChange={(v) => onUpdate({ cornerRadius: Math.max(0, v) })} />
        <NumField label="Padding (px)" value={sel.padding} onChange={(v) => onUpdate({ padding: Math.max(0, v) })} />
      </div>
      <div>
        <Label>Ícone</Label>
        <div className="mt-1 grid grid-cols-4 gap-1">
          {ICONS.map((i) => (
            <button key={i.v} onClick={() => onUpdate({ icon: i.v })}
              className={`py-1 text-[10px] border rounded ${(sel.icon ?? "none") === i.v ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}>
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShapeProps({ sel }: { sel: Shape }) {
  const updateEntity = useEditor((s) => s.updateEntity);
  const onUpdate = (p: Partial<Shape>) => updateEntity(sel.id, p);
  const isLine = sel.variant === "line" || sel.variant === "dashed-line";
  const supportsRadius =
    sel.variant === "rectangle" ||
    sel.variant === "square" ||
    sel.variant === "callout";
  const strokeStyle = sel.strokeStyle ?? (sel.dashed ? "dashed" : "solid");
  return (
    <div className="space-y-3">
      {!isLine && (
        <div>
          <Label>Preenchimento</Label>
          <div className="mt-2 flex gap-2 items-center">
            <ColorPicker
              value={sel.fill}
              onChange={(v) => onUpdate({ fill: v })}
              allowTransparent
            />
            <span className="text-xs text-muted-foreground font-mono">
              {sel.fill === "transparent" ? "Transparente" : sel.fill}
            </span>
          </div>
        </div>
      )}
      <div>
        <Label>Borda</Label>
        <div className="mt-2 flex gap-2 items-center">
          <ColorPicker value={sel.stroke} onChange={(v) => onUpdate({ stroke: v })} />
          <span className="text-xs text-muted-foreground font-mono">{sel.stroke}</span>
        </div>
      </div>
      <NumField
        label="Espessura da borda"
        value={sel.strokeWidth}
        onChange={(v) => onUpdate({ strokeWidth: Math.max(0, v) })}
      />
      <div>
        <Label>Estilo da borda</Label>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["solid", "dashed", "dotted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onUpdate({ strokeStyle: s, dashed: s === "dashed" })}
              className={`py-1.5 text-[11px] border rounded ${
                strokeStyle === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-secondary"
              }`}
            >
              {s === "solid" ? "Sólida" : s === "dashed" ? "Tracejada" : "Pontilhada"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-medium text-muted-foreground">
          Opacidade {Math.round(sel.opacity * 100)}%
        </label>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={sel.opacity}
          onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
        />
      </div>
      {supportsRadius && (
        <NumField
          label="Cantos arredondados"
          value={sel.cornerRadius ?? 2}
          onChange={(v) => onUpdate({ cornerRadius: Math.max(0, v) })}
        />
      )}
    </div>
  );
}

function StyleBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`py-1.5 border rounded flex items-center justify-center ${
        active ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"
      }`}>{children}</button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
      {children}
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 bg-card border border-border rounded text-sm focus:ring-2 focus:ring-ring/30 outline-hidden" />
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="px-2 py-1.5 bg-card border border-border rounded text-sm font-mono focus:ring-2 focus:ring-ring/30 outline-hidden" />
    </div>
  );
}

const WIRE_COLORS = [
  "#dc2626", "#fbbf24", "#0f172a", "#2563eb", "#16a34a",
  "#a855f7", "#ec4899", "#06b6d4", "#ffffff",
];

const STYLE_OPTS: { v: WireStyle; label: string }[] = [
  { v: "straight", label: "Reta" },
  { v: "curved", label: "Curva" },
  { v: "orthogonal", label: "Ortogonal" },
  { v: "multi", label: "Multi" },
  { v: "free", label: "Livre" },
  { v: "smart", label: "Smart" },
];

const TERM_OPTS: { v: WireTerminal; label: string }[] = [
  { v: "none", label: "—" },
  { v: "eyelet", label: "Olhal" },
  { v: "fork", label: "Tipo U" },
  { v: "ferrule", label: "Ponteira" },
  { v: "pin", label: "Pino" },
];

function WireProps({
  wire, onUpdate, onRemove,
}: { wire: Wire; onUpdate: (p: Partial<Wire>) => void; onRemove: () => void }) {
  const opacity = wire.opacity ?? 1;
  const trace = wire.trace ?? (wire.dashed ? "dashed" : "solid");
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Cable className="size-4 text-primary" /> Cabo
      </div>

      {wire.kind !== "arrow" && (
        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <Label>Identificador (tag)</Label>
            <input
              type="text"
              value={wire.tag ?? ""}
              onChange={(e) => onUpdate({ tag: e.target.value.toUpperCase().slice(0, 8) })}
              placeholder="F01"
              className="mt-1 w-full px-2 py-1.5 text-xs font-mono uppercase border border-border rounded bg-background"
            />
          </div>
          <div>
            <Label>Cor</Label>
            <input
              type="color"
              value={wire.tagColor ?? "#fde047"}
              onChange={(e) => onUpdate({ tagColor: e.target.value })}
              className="mt-1 h-8 w-10 rounded border border-border cursor-pointer"
              title="Cor da etiqueta"
            />
          </div>
        </div>
      )}

      <div>
        <Label>Estilo da linha</Label>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {STYLE_OPTS.map((o) => (
            <button key={o.v} onClick={() => onUpdate({ style: o.v })}
              className={`text-[11px] py-1.5 border rounded ${
                (wire.style ?? "curved") === o.v
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-secondary"
              }`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>


      <div>
        <Label>Cor</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {WIRE_COLORS.map((c) => (
            <button key={c} onClick={() => onUpdate({ color: c })}
              className="size-6 rounded-full border-2"
              style={{
                background: c,
                borderColor: wire.color === c ? "var(--color-primary)" : "var(--color-border)",
              }}
            />
          ))}
          <ColorPicker value={wire.color} onChange={(v) => onUpdate({ color: v })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumField label="Espessura" value={wire.thickness}
          onChange={(v) => onUpdate({ thickness: Math.max(1, Math.min(20, v)) })} />
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-medium text-muted-foreground">Opacidade {Math.round(opacity * 100)}%</label>
          <input type="range" min={0.1} max={1} step={0.05} value={opacity}
            onChange={(e) => onUpdate({ opacity: Number(e.target.value) })} />
        </div>
      </div>

      <div>
        <Label>Tipo de traço</Label>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["solid", "dashed", "dotted"] as const).map((t) => (
            <button key={t} onClick={() => onUpdate({ trace: t, dashed: t === "dashed" })}
              className={`text-[11px] py-1.5 border rounded ${trace === t ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}>
              {t === "solid" ? "Contínua" : t === "dashed" ? "Tracejada" : "Pontilhada"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Estilo visual</Label>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["technical", "soft", "neon"] as const).map((v) => (
            <button key={v} onClick={() => onUpdate({ visualStyle: v })}
              className={`text-[11px] py-1.5 border rounded ${(wire.visualStyle ?? "technical") === v ? "bg-foreground text-background border-foreground" : "border-border hover:bg-secondary"}`}>
              {v === "technical" ? "Técnico" : v === "soft" ? "Suave" : "Neon"}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs">
        <input type="checkbox" checked={!!wire.shadow}
          onChange={(e) => onUpdate({ shadow: e.target.checked })} />
        Sombra opcional
      </label>

      {/* Terminais temporariamente desativados — manter código para retomada futura. */}
      {false && (
        <>
          <div>
            <Label>Terminal — Origem</Label>
            <div className="mt-1 grid grid-cols-5 gap-1">
              {TERM_OPTS.map((o) => (
                <button key={o.v} onClick={() => onUpdate({ terminalA: o.v })}
                  className={`text-[10px] py-1.5 border rounded ${
                    (wire.terminalA ?? "none") === o.v
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-secondary"
                  }`}>{o.label}</button>
              ))}
            </div>
          </div>
          <div>
            <Label>Terminal — Destino</Label>
            <div className="mt-1 grid grid-cols-5 gap-1">
              {TERM_OPTS.map((o) => (
                <button key={o.v} onClick={() => onUpdate({ terminalB: o.v })}
                  className={`text-[10px] py-1.5 border rounded ${
                    (wire.terminalB ?? "none") === o.v
                      ? "bg-foreground text-background border-foreground"
                      : "border-border hover:bg-secondary"
                  }`}>{o.label}</button>
              ))}
            </div>
          </div>
        </>
      )}


      <button onClick={() => onUpdate({ bend: null })}
        className="w-full py-1.5 text-xs border border-border rounded hover:bg-secondary">
        Resetar curvatura
      </button>

      <div className="pt-4 border-t border-border">
        <button onClick={onRemove}
          className="w-full py-2 text-destructive rounded-md font-medium text-sm hover:bg-destructive/10 flex items-center justify-center gap-2">
          <Trash2 className="size-3.5" /> Remover cabo
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Dica: arraste o ponto azul no meio do cabo para curvar livremente. Clique duplo num cabo para removê-lo.
      </p>
    </div>
  );
}

function MeasureProps({
  measure,
  onUpdate,
  onRemove,
}: {
  measure: ReturnType<typeof useEditor.getState>["measurements"][number];
  onUpdate: (patch: Partial<ReturnType<typeof useEditor.getState>["measurements"][number]>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Ruler className="size-4 text-primary" />
        <h3 className="text-sm font-bold">Propriedades da Medida</h3>
      </div>

      <TextField
        label="Etiqueta / Nome"
        value={measure.label || ""}
        onChange={(v) => onUpdate({ label: v })}
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Unidade</Label>
          <div className="mt-1 flex gap-1">
            {(["mm", "cm"] as const).map((u) => (
              <button
                key={u}
                onClick={() => onUpdate({ unit: u })}
                className={`flex-1 py-1.5 text-[10px] font-mono border rounded uppercase ${
                  (measure.unit || "mm") === u
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:bg-secondary"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label>Tipo</Label>
          <div className="mt-1 flex gap-1">
            <button className="flex-1 py-1.5 border rounded bg-secondary text-[10px] font-medium capitalize">
              {measure.variant === "horizontal" ? "Horiz." : measure.variant === "vertical" ? "Vert." : "Livre"}
            </button>
          </div>
        </div>
      </div>

      <TextField
        label="Valor Manual (Override)"
        value={measure.manualValue || ""}
        onChange={(v) => onUpdate({ manualValue: v })}
      />

      <div>
        <Label>Cor da cota</Label>
        <div className="mt-2 flex items-center gap-2">
          {["#2563eb", "#dc2626", "#16a34a", "#0f172a", "#d946ef"].map((c) => (
            <button
              key={c}
              onClick={() => onUpdate({ color: c })}
              className={`size-6 rounded-full border-2 ${
                measure.color === c ? "border-primary" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          <ColorPicker value={measure.color} onChange={(v) => onUpdate({ color: v })} />
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <button
          onClick={onRemove}
          className="w-full py-2 text-destructive rounded-md font-medium text-sm hover:bg-destructive/10 flex items-center justify-center gap-2"
        >
          <Trash2 className="size-3.5" /> Remover medida
        </button>
      </div>
    </div>
  );
}

