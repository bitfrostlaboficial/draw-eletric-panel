import { create } from "zustand";
import { CATALOG, loadCustomCatalog, saveCustomCatalog, type CatalogItem, type ComponentConnectionPoint } from "./catalog";

export type Placed = {
  id: string;
  kind: "device";
  catalogId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
  tag: string;
  cableColor: string;
  /** Bornes herdados do catálogo (snapshot, para projeto ser auto-suficiente). */
  connectionPoints?: ComponentConnectionPoint[];
  // editable per-instance overrides (fall back to catalog)
  overrides: {
    name?: string;
    brand?: string;
    current?: string;
    voltage?: string;
    power?: string;
    capacity?: string;
    poles?: number;
    description?: string;
    imageUrl?: string;
  };
};

export type TextBox = {
  id: string;
  kind: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
  background: string; // "transparent" or color
};

export type ShapeVariant =
  | "rectangle"
  | "square"
  | "circle"
  | "ellipse"
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "star"
  | "cross"
  | "arrow"
  | "double-arrow"
  | "line"
  | "dashed-line"
  | "callout"
  | "cloud";

export type Shape = {
  id: string;
  kind: "shape";
  variant: ShapeVariant;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  dashed?: boolean;
  /** Estilo da borda — sobrepõe `dashed`. */
  strokeStyle?: "solid" | "dashed" | "dotted";
  /** Cantos arredondados (px) — aplicável a retângulo/quadrado/callout. */
  cornerRadius?: number;
};

export type Plate = {
  id: string;
  kind: "plate";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z: number;
  text: string;
  fontSize: number;
  fontWeight: 400 | 600 | 700 | 800;
  italic?: boolean;
  align: "left" | "center" | "right";
  color: string;
  background: string;
  borderColor: string;
  borderWidth: number;
  cornerRadius: number;
  padding: number;
  fontFamily?: string;
  /** Ícone livre (símbolos elétricos). */
  icon?: import("./plate-templates").PlateIcon;
  /** Id do template originário (apenas referência). */
  templateId?: string;
};

export type Entity = Placed | TextBox | Shape | Plate;

export type WireStyle = "straight" | "curved" | "orthogonal" | "multi" | "free" | "smart";
export type WireTerminal = "none" | "eyelet" | "fork" | "ferrule" | "pin";
export type WireTrace = "solid" | "dashed" | "dotted";
export type WireVisualStyle = "technical" | "soft" | "neon";
export type ConnectionPoint = "center" | "top" | "bottom" | "left" | "right" | `cp:${string}`;
export type WirePoint = { x: number; y: number };
export type WireAnchor =
  | { type: "free"; x: number; y: number }
  | { type: "entity"; entityId: string; point: ConnectionPoint }
  | { type: "wire"; wireId: string; x: number; y: number; position?: number };

/** Tipo de ponta para wires usadas como setas. */
export type ArrowHead = "none" | "triangle" | "open" | "diamond" | "circle";
export type WireKind = "cable" | "arrow";

export type Wire = {
  id: string;
  kind?: WireKind;
  /** Legacy entity ids kept for older saved projects. New wires use start/end. */
  fromId?: string;
  toId?: string;
  start?: WireAnchor;
  end?: WireAnchor;
  color: string;
  thickness: number;
  opacity?: number;
  dashed?: boolean;
  trace?: WireTrace;
  style?: WireStyle;
  visualStyle?: WireVisualStyle;
  shadow?: boolean;
  terminalA?: WireTerminal;
  terminalB?: WireTerminal;
  controlPoints?: WirePoint[];
  /** Offset from the midpoint of the segment, in panel pixels. */
  bend?: { dx: number; dy: number } | null;
  /** Arrow heads — used when kind === "arrow" (or opt-in on cables). */
  arrowStart?: ArrowHead;
  arrowEnd?: ArrowHead;
  /** Identificação técnica do fio (ex: F01). Renderizada quando as legendas técnicas estão ativas. */
  tag?: string;
  /** Cor de fundo da etiqueta. Padrão: amarelo industrial. */
  tagColor?: string;
};

/**
 * Próximo identificador automático no padrão 001, 002, 003…
 * Padding de 3 dígitos. Ignora setas. Aceita também o legado F01/F02
 * para evitar reciclar números em projetos antigos.
 */
function nextWireTag(wires: Wire[]): string {
  let max = 0;
  for (const w of wires) {
    if (w.kind === "arrow") continue;
    const t = (w.tag ?? "").trim();
    const m = /^(?:F)?(\d+)$/i.exec(t);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return String(max + 1).padStart(3, "0");
}

export type MeasureUnit = "mm" | "cm";

/** Tipo de medida persistida no projeto. */
export type MeasureVariant = "horizontal" | "vertical" | "free";
export type Measurement = {
  id: string;
  kind: "measurement";
  variant: MeasureVariant;
  /** Coordenadas em pixels do panel (mesmo sistema das entities/wires). */
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  /** Nome opcional (ex: "Altura trilho DIN"). */
  label?: string;
  /** Override manual do valor exibido. Se ausente, calcula da geometria. */
  manualValue?: string;
  unit?: MeasureUnit;
  z: number;
};

export type PanelStyle = {
  width: number;
  height: number;
  background: string;
  texture: "smooth" | "brushed" | "hammered";
  /** Mostra uma tampa lateral ao lado do quadro (sempre visível, infinita). */
  hasCover?: boolean;
  coverColor?: string;
  coverWidth?: number;
  coverHeight?: number;
  coverGap?: number;
  /** Legacy — mantido para compatibilidade de projetos antigos. */
  hasDoor?: boolean;
  doorColor?: string;
  doorClosed?: boolean;
  /** Estilo visual do gabinete.
   *  - "flat": quadro plano
   *  - "depth": pseudo-3D com aba/rim externo (modelo 3)
   *  - "depth-soft": pseudo-3D com borda branca larga (modelo 2) */
  style?: "flat" | "depth" | "depth-soft";
  /** Profundidade visual em px (apenas styles depth*). */
  depth?: number;
  /** Cor das laterais/moldura (apenas styles depth*). */
  frameColor?: string;
};


type Snapshot = {
  entities: Entity[];
  wires: Wire[];
  panel: PanelStyle;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

type State = {
  projectId: string | null;
  projectName: string;
  panel: PanelStyle;
  entities: Entity[];
  wires: Wire[];
  measurements: Measurement[];
  customCatalog: CatalogItem[];
  selectedId: string | null;
  selectedIds: string[];
  selectedWireId: string | null;
  selectedWireIds: string[];
  selectedMeasurementId: string | null;
  /** Quando definido, clicar e arrastar no canvas cria uma medida desse tipo. */
  measureTool: MeasureVariant | null;
  zoom: number;
  showGrid: boolean;
  snap: boolean;
  wireMode: boolean;
  wireTool: WireStyle;
  showLegends: boolean;
  wireFromId: string | null;
  drawingWire: { start: WireAnchor; current: WireAnchor; points: WireAnchor[] } | null;
  clipboard: { entities: Entity[]; wires: Wire[] } | null;
  past: Snapshot[];
  future: Snapshot[];
  saveStatus: SaveStatus;
  lastSavedAt: number | null;
  dirty: boolean;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  fullscreen: boolean;
  leftWidth: number;
  debugCps: boolean;
  unit: MeasureUnit;
  showMeasures: boolean;
  minimapCollapsed: boolean;
  viewportApi: ViewportApi | null;
};

export type ViewportApi = {
  centerOnProject: () => void;
  scrollToWorld: (worldX: number, worldY: number) => void;
  getViewportState: () => {
    scrollLeft: number;
    scrollTop: number;
    clientWidth: number;
    clientHeight: number;
    worldOriginX: number;
    worldOriginY: number;
    worldW: number;
    worldH: number;
    zoom: number;
  } | null;
};

type Actions = {
  setProjectName: (n: string) => void;
  setPanel: (patch: Partial<PanelStyle>) => void;
  addItem: (catalogId: string, x: number, y: number) => void;
  addItemFromCatalog: (item: CatalogItem, x: number, y: number) => void;
  addText: (x: number, y: number) => void;
  addShape: (variant: ShapeVariant, x: number, y: number) => void;
  addPlate: (template: import("./plate-templates").PlateTemplate, x: number, y: number) => void;
  removeSelected: () => void;
  updateEntity: (id: string, patch: Partial<Placed> | Partial<TextBox> | Partial<Shape> | Partial<Plate>) => void;
  moveEntity: (id: string, x: number, y: number) => void;
  resizeEntity: (id: string, w: number, h: number) => void;
  removeEntity: (id: string) => void;
  duplicateEntity: (id: string) => void;
  rotateEntity: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  select: (id: string | null) => void;
  setZoom: (z: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleWireMode: () => void;
  setWireMode: (v: boolean) => void;
  setWireTool: (style: WireStyle) => void;
  toggleLegends: () => void;
  startWire: (id: string) => void;
  finishWire: (toId: string) => void;
  beginWireAt: (anchor: WireAnchor) => void;
  updateWireDraft: (anchor: WireAnchor) => void;
  finishWireAt: (anchor: WireAnchor) => void;
  addWirePoint: (anchor: WireAnchor) => void;
  cancelWireDraft: () => void;
  commitWireDraft: () => void;
  removeWire: (id: string) => void;
  selectWire: (id: string | null) => void;
  updateWire: (id: string, patch: Partial<Wire>) => void;
  moveWireEndpoint: (id: string, which: "start" | "end", anchor: WireAnchor) => void;
  moveWireBy: (id: string, dx: number, dy: number) => void;
  updateWireControlPoint: (id: string, index: number, pt: WirePoint) => void;
  removeWireControlPoint: (id: string, index: number) => void;
  insertWireControlPoint: (id: string, index: number, pt: WirePoint) => void;
  addArrow: (variant: "simple" | "double" | "curved" | "ortho" | "dashed" | "tech", x: number, y: number) => void;
  selectAll: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  addCustomCatalog: (item: CatalogItem) => void;
  removeCustomCatalog: (id: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  loadProject: (p: {
    id: string;
    name: string;
    data: { panel: PanelStyle; entities: Entity[]; wires: Wire[]; showLegends?: boolean; measurements?: Measurement[] };
  }) => void;
  setProjectId: (id: string | null) => void;
  markDirty: () => void;
  setSaveStatus: (s: "idle" | "saving" | "saved" | "error", at?: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleFullscreen: () => void;
  setFullscreen: (v: boolean) => void;
  setLeftWidth: (w: number) => void;
  toggleDebugCps: () => void;
  setUnit: (u: MeasureUnit) => void;
  toggleMeasures: () => void;
  toggleMinimap: () => void;
  setMinimapCollapsed: (v: boolean) => void;
  setViewportApi: (api: ViewportApi | null) => void;
  setLeftCollapsed: (v: boolean) => void;
  setRightCollapsed: (v: boolean) => void;
  // ----- Medidas (entidades persistentes do projeto) -----
  setMeasureTool: (t: MeasureVariant | null) => void;
  addMeasurement: (m: Omit<Measurement, "id" | "kind" | "z">) => string;
  updateMeasurement: (id: string, patch: Partial<Measurement>) => void;
  removeMeasurement: (id: string) => void;
  selectMeasurement: (id: string | null) => void;
};

const SNAP_GRID = 6;
const snap = (v: number, on: boolean) => (on ? Math.round(v / SNAP_GRID) * SNAP_GRID : v);

const snapshot = (s: State): Snapshot => ({
  entities: s.entities.map(
    (e) =>
      ({
        ...e,
        overrides: (e as Placed).overrides ? { ...(e as Placed).overrides } : undefined,
      }) as Entity,
  ),
  wires: s.wires.map((w) => ({ ...w })),
  panel: { ...s.panel },
});

const maxZ = (entities: Entity[]) => entities.reduce((m, e) => Math.max(m, e.z), 0);

const getCatalogItem = (id: string, custom: CatalogItem[]) =>
  CATALOG.find((c) => c.id === id) ?? custom.find((c) => c.id === id);

export const useEditor = create<State & Actions>((set, get) => ({
  projectId: null,
  projectName: "Quadro sem título",
  panel: {
    width: 600,
    height: 700,
    background: "#f1f5f9",
    texture: "smooth",
    hasCover: true,
    coverColor: "#cbd5e1",
    coverWidth: 600,
    coverHeight: 700,
    coverGap: 80,
    style: "flat",
    depth: 18,
    frameColor: "#94a3b8",
  },

  entities: [],
  wires: [],
  measurements: [],
  customCatalog: loadCustomCatalog(),
  selectedId: null,
  selectedIds: [],
  selectedWireId: null,
  selectedWireIds: [],
  selectedMeasurementId: null,
  measureTool: null,
  zoom: 1,
  showGrid: true,
  snap: true,
  wireMode: false,
  wireTool: "curved",
  showLegends: false,
  wireFromId: null,
  drawingWire: null,
  clipboard: null,
  past: [],
  future: [],
  saveStatus: "idle",
  lastSavedAt: null,
  dirty: false,
  leftCollapsed: false,
  rightCollapsed: false,
  fullscreen: false,
  leftWidth: (() => {
    if (typeof window === "undefined") return 288;
    const v = Number(window.localStorage?.getItem("voltflow:leftWidth"));
    return Number.isFinite(v) && v >= 220 && v <= 560 ? v : 288;
  })(),
  debugCps: false,
  unit: "mm",
  showMeasures: false,
  minimapCollapsed: (() => {
    if (typeof window === "undefined") return false;
    try {
      return window.localStorage?.getItem("voltflow:minimapCollapsed") === "1";
    } catch {
      return false;
    }
  })(),
  viewportApi: null,



  setProjectName: (n) => set({ projectName: n }),
  setPanel: (patch) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      panel: { ...s.panel, ...patch },
    });
  },

  addItem: (catalogId, x, y) => {
    const s = get();
    const item = getCatalogItem(catalogId, s.customCatalog);
    if (!item) return;
    get().addItemFromCatalog(item, x, y);
  },

  addItemFromCatalog: (item, x, y) => {
    const s = get();
    // Ensure the item is resolvable later (for re-renders, duplication, etc.)
    const known =
      CATALOG.some((c) => c.id === item.id) || s.customCatalog.some((c) => c.id === item.id);
    const nextCustom = known ? s.customCatalog : [...s.customCatalog, item];
    const id = crypto.randomUUID();
    const placed: Placed = {
      id,
      kind: "device",
      catalogId: item.id,
      x: snap(x, s.snap),
      y: snap(y, s.snap),
      width: item.width,
      height: item.height,
      rotation: 0,
      z: maxZ(s.entities) + 1,
      tag: deriveTag(item, s.entities),
      cableColor: "#dc2626",
      connectionPoints: item.connectionPoints ? [...item.connectionPoints] : undefined,
      overrides: {},
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      customCatalog: nextCustom,
      entities: [...s.entities, placed],
      selectedId: id,
    });
  },

  addText: (x, y) => {
    const s = get();
    const id = crypto.randomUUID();
    const t: TextBox = {
      id,
      kind: "text",
      x: snap(x, s.snap),
      y: snap(y, s.snap),
      width: 140,
      height: 32,
      rotation: 0,
      z: maxZ(s.entities) + 1,
      text: "Texto",
      fontSize: 14,
      color: "#0f172a",
      bold: false,
      italic: false,
      align: "left",
      background: "transparent",
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: [...s.entities, t],
      selectedId: id,
    });
  },

  addShape: (variant, x, y) => {
    const s = get();
    const id = crypto.randomUUID();
    const isLine = variant === "line" || variant === "dashed-line";
    const w = isLine ? 160 : variant === "square" || variant === "circle" ? 100 : 140;
    const h = isLine ? 4 : variant === "square" || variant === "circle" ? 100 : 100;
    const shape: Shape = {
      id,
      kind: "shape",
      variant,
      x: snap(x, s.snap),
      y: snap(y, s.snap),
      width: w,
      height: h,
      rotation: 0,
      z: maxZ(s.entities) + 1,
      fill: isLine ? "transparent" : "#dbeafe",
      stroke: "#1d4ed8",
      strokeWidth: 2,
      opacity: 1,
      dashed: variant === "dashed-line",
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: [...s.entities, shape],
      selectedId: id,
    });
  },

  addPlate: (template, x, y) => {
    const s = get();
    const id = crypto.randomUUID();
    const p: Plate = {
      id,
      kind: "plate",
      x: snap(x, s.snap),
      y: snap(y, s.snap),
      width: template.width,
      height: template.height,
      rotation: 0,
      z: maxZ(s.entities) + 1,
      text: template.text,
      fontSize: template.fontSize,
      fontWeight: template.fontWeight,
      italic: template.italic,
      align: template.align,
      color: template.color,
      background: template.background,
      borderColor: template.borderColor,
      borderWidth: template.borderWidth,
      cornerRadius: template.cornerRadius,
      padding: template.padding,
      icon: template.icon ?? "none",
      templateId: template.id,
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: [...s.entities, p],
      selectedId: id,
    });
  },

  removeSelected: () => {
    const s = get();
    const eIds = new Set<string>([
      ...s.selectedIds,
      ...(s.selectedId ? [s.selectedId] : []),
    ]);
    const wIds = new Set<string>([
      ...s.selectedWireIds,
      ...(s.selectedWireId ? [s.selectedWireId] : []),
    ]);
    if (eIds.size === 0 && wIds.size === 0) return;
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.filter((e) => !eIds.has(e.id)),
      wires: s.wires.filter(
        (w) =>
          !wIds.has(w.id) &&
          !(w.fromId && eIds.has(w.fromId)) &&
          !(w.toId && eIds.has(w.toId)) &&
          !(w.start?.type === "entity" && eIds.has(w.start.entityId)) &&
          !(w.end?.type === "entity" && eIds.has(w.end.entityId)),
      ),
      selectedId: null,
      selectedIds: [],
      selectedWireId: null,
      selectedWireIds: [],
    });
  },



  updateEntity: (id, patch) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.map((e) => (e.id === id ? ({ ...e, ...patch } as Entity) : e)),
    });
  },

  moveEntity: (id, x, y) => {
    const s = get();
    set({
      entities: s.entities.map((e) =>
        e.id === id ? ({ ...e, x: snap(x, s.snap), y: snap(y, s.snap) } as Entity) : e,
      ),
    });
  },

  resizeEntity: (id, w, h) => {
    const s = get();
    set({
      entities: s.entities.map((e) => {
        if (e.id !== id) return e;
        const cps = (e as Placed).connectionPoints;
        const min = cps && cps.length > 6 ? 60 : 8;
        // Trava razão de aspecto quando há bornes definidos — garante que a
        // posição visual dos pontos no editor case com a do painel admin.
        if (cps && cps.length > 0 && e.width > 0 && e.height > 0) {
          const ratio = e.width / e.height;
          const dw = Math.abs(w - e.width);
          const dh = Math.abs(h - e.height);
          let nw: number;
          let nh: number;
          if (dw >= dh) {
            nw = Math.max(min, w);
            nh = nw / ratio;
          } else {
            nh = Math.max(min, h);
            nw = nh * ratio;
          }
          return { ...e, width: nw, height: nh } as Entity;
        }
        return { ...e, width: Math.max(min, w), height: Math.max(min, h) } as Entity;
      }),
    });
  },

  removeEntity: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.filter((e) => e.id !== id),
      wires: s.wires.filter(
        (w) =>
          w.fromId !== id &&
          w.toId !== id &&
          !(w.start?.type === "entity" && w.start.entityId === id) &&
          !(w.end?.type === "entity" && w.end.entityId === id),
      ),
      selectedId: s.selectedId === id ? null : s.selectedId,
    });
  },

  duplicateEntity: (id) => {
    const s = get();
    const e = s.entities.find((x) => x.id === id);
    if (!e) return;
    const newId = crypto.randomUUID();
    const copy = { ...e, id: newId, x: e.x + 16, y: e.y + 16, z: maxZ(s.entities) + 1 } as Entity;
    if (copy.kind === "device") {
      const item = getCatalogItem(copy.catalogId, s.customCatalog);
      if (item) (copy as Placed).tag = deriveTag(item, s.entities);
    }
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: [...s.entities, copy],
      selectedId: newId,
    });
  },

  rotateEntity: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.map((e) =>
        e.id === id ? ({ ...e, rotation: (e.rotation + 90) % 360 } as Entity) : e,
      ),
    });
  },

  bringToFront: (id) => {
    const s = get();
    const top = maxZ(s.entities) + 1;
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.map((e) => (e.id === id ? ({ ...e, z: top } as Entity) : e)),
    });
  },
  sendToBack: (id) => {
    const s = get();
    const min = Math.min(...s.entities.map((e) => e.z), 0) - 1;
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.map((e) => (e.id === id ? ({ ...e, z: min } as Entity) : e)),
    });
  },
  bringForward: (id) => {
    const s = get();
    const sorted = [...s.entities].sort((a, b) => a.z - b.z);
    const idx = sorted.findIndex((e) => e.id === id);
    if (idx === -1 || idx === sorted.length - 1) return;
    const a = sorted[idx],
      b = sorted[idx + 1];
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.map((e) =>
        e.id === a.id
          ? ({ ...e, z: b.z } as Entity)
          : e.id === b.id
            ? ({ ...e, z: a.z } as Entity)
            : e,
      ),
    });
  },
  sendBackward: (id) => {
    const s = get();
    const sorted = [...s.entities].sort((a, b) => a.z - b.z);
    const idx = sorted.findIndex((e) => e.id === id);
    if (idx <= 0) return;
    const a = sorted[idx],
      b = sorted[idx - 1];
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.map((e) =>
        e.id === a.id
          ? ({ ...e, z: b.z } as Entity)
          : e.id === b.id
            ? ({ ...e, z: a.z } as Entity)
            : e,
      ),
    });
  },

  select: (id) =>
    set({
      selectedId: id,
      selectedIds: [],
      selectedWireIds: [],
      ...(id ? { selectedWireId: null } : {}),
    }),
  setZoom: (z) => set({ zoom: Math.max(0.25, Math.min(3, z)) }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),
  toggleWireMode: () =>
    set((s) => ({ wireMode: !s.wireMode, wireFromId: null, drawingWire: null })),
  setWireMode: (v) => set({ wireMode: v, wireFromId: null, drawingWire: null }),
  setWireTool: (style) =>
    set({ wireTool: style, wireMode: true, wireFromId: null, drawingWire: null }),
  toggleLegends: () => set((s) => ({ showLegends: !s.showLegends })),

  startWire: (id) => set({ wireFromId: id }),
  finishWire: (toId) => {
    const s = get();
    if (!s.wireFromId || s.wireFromId === toId) {
      set({ wireFromId: null });
      return;
    }
    const newId = crypto.randomUUID();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [
        ...s.wires,
        {
          id: newId,
          fromId: s.wireFromId,
          toId,
          color: "#dc2626",
          thickness: 2,
          opacity: 1,
          dashed: false,
          style: "curved",
          terminalA: "eyelet",
          terminalB: "eyelet",
          tag: nextWireTag(s.wires),
          tagColor: "#fde047",

          bend: null,
        },
      ],
      wireFromId: null,
    });
  },

  beginWireAt: (anchor) =>
    set({
      drawingWire: { start: anchor, current: anchor, points: [] },
      selectedId: null,
      selectedWireId: null,
    }),
  updateWireDraft: (anchor) =>
    set((s) => (s.drawingWire ? { drawingWire: { ...s.drawingWire, current: anchor } } : {})),
  addWirePoint: (anchor) =>
    set((s) =>
      s.drawingWire
        ? {
            drawingWire: {
              ...s.drawingWire,
              points: [...s.drawingWire.points, anchor],
              current: anchor,
            },
          }
        : {},
    ),
  finishWireAt: (anchor) => {
    const s = get();
    const draft = s.drawingWire;
    if (!draft) return;
    const noPoints = draft.points.length === 0;
    const sameFree =
      noPoints &&
      draft.start.type === "free" &&
      anchor.type === "free" &&
      Math.hypot(anchor.x - draft.start.x, anchor.y - draft.start.y) < 4;
    if (sameFree) {
      set({ drawingWire: null });
      return;
    }
    const newId = crypto.randomUUID();
    const controlPoints: WirePoint[] = draft.points.map((p) => {
      if (p.type === "entity") return { x: 0, y: 0 }; // entity refs aren't supported as middle points yet
      return { x: p.x, y: p.y };
    });
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [
        ...s.wires,
        {
          id: newId,
          start: draft.start,
          end: anchor,
          color: "#dc2626",
          thickness: 2,
          opacity: 1,
          dashed: false,
          trace: "solid",
          style: s.wireTool,
          visualStyle: "technical",
          shadow: false,
          terminalA: "none",
          terminalB: "none",
          controlPoints,
          bend: null,
          tag: nextWireTag(s.wires),
          tagColor: "#fde047",
        },
      ],
      drawingWire: null,
      selectedWireId: newId,
      selectedId: null,
      // Auto-return to "select" mode after the wire is created.
      wireMode: false,
      wireFromId: null,
    });
  },
  cancelWireDraft: () => set({ drawingWire: null, wireFromId: null }),

  commitWireDraft: () => {
    const s = get();
    const draft = s.drawingWire;
    if (!draft) return;
    // Use current pointer position as end; if no extra points, only commit if it differs.
    const noPoints = draft.points.length === 0;
    const sameFree =
      noPoints &&
      draft.start.type === "free" &&
      draft.current.type === "free" &&
      Math.hypot(draft.current.x - draft.start.x, draft.current.y - draft.start.y) < 4;
    if (sameFree) {
      set({ drawingWire: null });
      return;
    }
    const newId = crypto.randomUUID();
    const controlPoints: WirePoint[] = draft.points.map((p) =>
      p.type === "entity" ? { x: 0, y: 0 } : { x: p.x, y: p.y },
    );
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [
        ...s.wires,
        {
          id: newId,
          start: draft.start,
          end: draft.current,
          color: "#dc2626",
          thickness: 2,
          opacity: 1,
          dashed: false,
          trace: "solid",
          style: s.wireTool,
          visualStyle: "technical",
          shadow: false,
          terminalA: "none",
          terminalB: "none",
          controlPoints,
          bend: null,
          tag: nextWireTag(s.wires),
          tagColor: "#fde047",
        },
      ],
      drawingWire: null,
      selectedWireId: newId,
      selectedId: null,
      wireMode: false,
      wireFromId: null,
    });
  },

  updateWireControlPoint: (id, index, pt) => {
    const s = get();
    set({
      wires: s.wires.map((w) => {
        if (w.id !== id) return w;
        const cps = [...(w.controlPoints ?? [])];
        if (index < 0 || index >= cps.length) return w;
        cps[index] = pt;
        return { ...w, controlPoints: cps };
      }),
    });
  },

  removeWireControlPoint: (id, index) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: s.wires.map((w) => {
        if (w.id !== id) return w;
        const cps = (w.controlPoints ?? []).filter((_, i) => i !== index);
        return { ...w, controlPoints: cps };
      }),
    });
  },

  insertWireControlPoint: (id, index, pt) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: s.wires.map((w) => {
        if (w.id !== id) return w;
        const cps = [...(w.controlPoints ?? [])];
        cps.splice(Math.max(0, Math.min(cps.length, index)), 0, pt);
        return { ...w, controlPoints: cps };
      }),
    });
  },

  addArrow: (variant, x, y) => {
    const s = get();
    const id = crypto.randomUUID();
    const styleMap: Record<typeof variant, WireStyle> = {
      simple: "straight",
      double: "straight",
      curved: "curved",
      ortho: "orthogonal",
      dashed: "straight",
      tech: "orthogonal",
    } as const;
    const w: Wire = {
      id,
      kind: "arrow",
      start: { type: "free", x, y },
      end: { type: "free", x: x + 160, y: y + 0 },
      color: "#0f172a",
      thickness: 2,
      opacity: 1,
      trace: variant === "dashed" ? "dashed" : "solid",
      style: styleMap[variant],
      visualStyle: "technical",
      shadow: false,
      terminalA: "none",
      terminalB: "none",
      controlPoints: [],
      bend: null,
      arrowStart: variant === "double" ? "triangle" : "none",
      arrowEnd: "triangle",
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [...s.wires, w],
      selectedWireId: id,
      selectedId: null,
    });
  },

  selectWire: (id) =>
    set({
      selectedWireId: id,
      selectedIds: [],
      selectedWireIds: [],
      ...(id ? { selectedId: null } : {}),
    }),
  updateWire: (id, patch) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: s.wires.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });
  },

  moveWireEndpoint: (id, which, anchor) => {
    const s = get();
    set({
      wires: s.wires.map((w) =>
        w.id === id
          ? {
              ...w,
              [which]: anchor,
              ...(which === "start" ? { fromId: undefined } : { toId: undefined }),
            }
          : w,
      ),
    });
  },

  moveWireBy: (id, dx, dy) => {
    const s = get();
    set({
      wires: s.wires.map((w) => {
        if (w.id !== id) return w;
        const shift = (a?: WireAnchor): WireAnchor | undefined => {
          if (!a) return a;
          if (a.type === "free") return { type: "free", x: a.x + dx, y: a.y + dy };
          if (a.type === "wire") return { ...a, x: a.x + dx, y: a.y + dy };
          return a;
        };
        return { ...w, start: shift(w.start), end: shift(w.end) };
      }),
    });
  },

  removeWire: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: s.wires.filter((w) => w.id !== id),
      selectedWireId: s.selectedWireId === id ? null : s.selectedWireId,
    });
  },

  selectAll: () => {
    const s = get();
    set({
      selectedIds: s.entities.map((e) => e.id),
      selectedWireIds: s.wires.map((w) => w.id),
      selectedId: s.entities[0]?.id ?? null,
      selectedWireId: null,
    });
  },

  copySelection: () => {
    const s = get();
    const ids = s.selectedIds.length ? s.selectedIds : s.selectedId ? [s.selectedId] : [];
    const wireIds = s.selectedWireIds.length
      ? s.selectedWireIds
      : s.selectedWireId
        ? [s.selectedWireId]
        : [];
    if (!ids.length && !wireIds.length) return;
    set({
      clipboard: {
        entities: s.entities
          .filter((e) => ids.includes(e.id))
          .map((e) => JSON.parse(JSON.stringify(e)) as Entity),
        wires: s.wires
          .filter((w) => wireIds.includes(w.id))
          .map((w) => JSON.parse(JSON.stringify(w)) as Wire),
      },
    });
  },

  pasteClipboard: () => {
    const s = get();
    if (!s.clipboard) return;
    const offset = 16;
    const idMap = new Map<string, string>();
    const baseZ = maxZ(s.entities);
    const newEntities = s.clipboard.entities.map((e, i) => {
      const nid = crypto.randomUUID();
      idMap.set(e.id, nid);
      return { ...e, id: nid, x: e.x + offset, y: e.y + offset, z: baseZ + i + 1 } as Entity;
    });
    const newWires = s.clipboard.wires.map((w) => {
      const nid = crypto.randomUUID();
      const remap = (a?: WireAnchor): WireAnchor | undefined => {
        if (!a) return a;
        if (a.type === "entity") {
          const mapped = idMap.get(a.entityId);
          return mapped ? { ...a, entityId: mapped } : { type: "free", x: 0, y: 0 };
        }
        if (a.type === "free") return { type: "free", x: a.x + offset, y: a.y + offset };
        return { ...a, x: a.x + offset, y: a.y + offset };
      };
      return {
        ...w,
        id: nid,
        fromId: w.fromId ? idMap.get(w.fromId) : undefined,
        toId: w.toId ? idMap.get(w.toId) : undefined,
        start: remap(w.start),
        end: remap(w.end),
      } as Wire;
    });
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: [...s.entities, ...newEntities],
      wires: [...s.wires, ...newWires],
      selectedIds: newEntities.map((e) => e.id),
      selectedWireIds: newWires.map((w) => w.id),
      selectedId: newEntities[0]?.id ?? null,
      selectedWireId: null,
    });
  },

  addCustomCatalog: (item) => {
    const s = get();
    const next = [...s.customCatalog, item];
    saveCustomCatalog(next);
    set({ customCatalog: next });
  },

  removeCustomCatalog: (id) => {
    const s = get();
    const next = s.customCatalog.filter((c) => c.id !== id);
    saveCustomCatalog(next);
    set({ customCatalog: next });
  },

  undo: () => {
    const s = get();
    const prev = s.past[s.past.length - 1];
    if (!prev) return;
    set({
      past: s.past.slice(0, -1),
      future: [snapshot(s), ...s.future],
      entities: prev.entities,
      wires: prev.wires,
      panel: prev.panel,
    });
  },

  redo: () => {
    const s = get();
    const next = s.future[0];
    if (!next) return;
    set({
      past: [...s.past, snapshot(s)],
      future: s.future.slice(1),
      entities: next.entities,
      wires: next.wires,
      panel: next.panel,
    });
  },

  reset: () =>
    set({
      entities: [],
      wires: [],
      measurements: [],
      selectedId: null,
      selectedWireId: null,
      selectedMeasurementId: null,
      past: [],
      future: [],
      dirty: true,
    }),

  loadProject: (p) =>
    set({
      projectId: p.id,
      projectName: p.name,
      panel: p.data.panel,
      entities: p.data.entities ?? [],
      wires: p.data.wires ?? [],
      measurements: p.data.measurements ?? [],
      showLegends: p.data.showLegends ?? false,
      selectedId: null,
      selectedWireId: null,
      selectedMeasurementId: null,
      past: [],
      future: [],
      dirty: false,
      saveStatus: "saved",
      lastSavedAt: Date.now(),
    }),

  setProjectId: (id) => set({ projectId: id }),
  markDirty: () => set({ dirty: true, saveStatus: "idle" }),
  setSaveStatus: (s, at) =>
    set({
      saveStatus: s,
      ...(s === "saved" ? { dirty: false, lastSavedAt: at ?? Date.now() } : {}),
    }),
  toggleLeftPanel: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRightPanel: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  setFullscreen: (v) => set({ fullscreen: v }),
  setLeftWidth: (w) => {
    const clamped = Math.max(220, Math.min(560, Math.round(w)));
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem("voltflow:leftWidth", String(clamped));
      } catch {
        /* ignore quota */
      }
    }
    set({ leftWidth: clamped });
  },
  toggleDebugCps: () => set((s) => ({ debugCps: !s.debugCps })),
  setUnit: (u) => set({ unit: u }),
  toggleMeasures: () => set((s) => ({ showMeasures: !s.showMeasures })),
  toggleMinimap: () => set((s) => {
    const v = !s.minimapCollapsed;
    if (typeof window !== "undefined") {
      try { window.localStorage?.setItem("voltflow:minimapCollapsed", v ? "1" : "0"); } catch { /* */ }
    }
    return { minimapCollapsed: v };
  }),
  setMinimapCollapsed: (v) => {
    if (typeof window !== "undefined") {
      try { window.localStorage?.setItem("voltflow:minimapCollapsed", v ? "1" : "0"); } catch { /* */ }
    }
    set({ minimapCollapsed: v });
  },
  setViewportApi: (api) => set({ viewportApi: api }),
  setLeftCollapsed: (v) => set({ leftCollapsed: v }),
  setRightCollapsed: (v) => set({ rightCollapsed: v }),

  // ----- Medidas -----
  setMeasureTool: (t) =>
    set((s) => ({
      measureTool: t,
      // ao ativar uma ferramenta de medida, sai de outros modos e mostra medidas
      ...(t ? { wireMode: false, wireFromId: null, drawingWire: null, showMeasures: true } : {}),
    })),
  addMeasurement: (m) => {
    const s = get();
    const id = crypto.randomUUID();
    const z = (s.measurements.reduce((mx, x) => Math.max(mx, x.z), 0) ?? 0) + 1;
    const full: Measurement = {
      ...m,
      id,
      kind: "measurement",
      z,
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      measurements: [...s.measurements, full],
      selectedMeasurementId: id,
      selectedId: null,
      selectedWireId: null,
    });
    return id;
  },
  updateMeasurement: (id, patch) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      measurements: s.measurements.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    });
  },
  removeMeasurement: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      measurements: s.measurements.filter((m) => m.id !== id),
      selectedMeasurementId: s.selectedMeasurementId === id ? null : s.selectedMeasurementId,
    });
  },
  selectMeasurement: (id) =>
    set({
      selectedMeasurementId: id,
      ...(id ? { selectedId: null, selectedWireId: null, selectedIds: [], selectedWireIds: [] } : {}),
    }),
}));

function deriveTag(item: CatalogItem, existing: Entity[]) {
  const prefix =
    item.category === "Proteção"
      ? "Q"
      : item.category === "Comando"
        ? "K"
        : item.category === "Automação"
          ? "A"
          : item.category === "Energia"
            ? "E"
            : item.category === "Sinalização"
              ? "H"
              : "X";
  const n =
    existing.filter((e) => e.kind === "device" && (e as Placed).tag.startsWith(prefix)).length + 1;
  return `${prefix}${String(n).padStart(2, "0")}`;
}
