import { create } from "zustand";
import { CATALOG, loadCustomCatalog, saveCustomCatalog, type CatalogItem, type ComponentConnectionPoint } from "./catalog";
import { resolveAnchorPoint } from "./wire-geometry";

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
  connectionPoints?: ComponentConnectionPoint[];
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
  background: string;
};

export type ShapeVariant =
  | "rectangle" | "square" | "circle" | "ellipse" | "triangle" | "diamond"
  | "pentagon" | "hexagon" | "octagon" | "star" | "cross" | "arrow"
  | "double-arrow" | "line" | "dashed-line" | "callout" | "cloud";

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
  strokeStyle?: "solid" | "dashed" | "dotted";
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
  icon?: import("./plate-templates").PlateIcon;
  templateId?: string;
};

export type Entity = Placed | TextBox | Shape | Plate;

export type WireStyle = "straight" | "curved" | "orthogonal" | "multi" | "free" | "smart";
export type WireTerminal = "none" | "eyelet" | "fork" | "ferrule" | "pin";
export type WireTrace = "solid" | "dashed" | "dotted";
export type WireVisualStyle = "technical" | "soft" | "neon";
export type ConnectionPoint = "center" | "top" | "bottom" | "left" | "right" | "top-left" | "top-right" | "bottom-left" | "bottom-right" | `cp:${string}`;
export type WirePoint = { x: number; y: number };
export type WireAnchor =
  | { type: "free"; x: number; y: number }
  | { type: "entity"; entityId: string; point: ConnectionPoint }
  | { type: "wire"; wireId: string; x: number; y: number; position?: number };

export type ArrowHead = "none" | "triangle" | "open" | "diamond" | "circle";
export type WireKind = "cable" | "arrow";

export type Wire = {
  id: string;
  kind?: WireKind;
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
  bend?: { dx: number; dy: number } | null;
  arrowStart?: ArrowHead;
  arrowEnd?: ArrowHead;
  tag?: string;
  tagColor?: string;
};

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

export type MeasureVariant = "horizontal" | "vertical" | "free" | "area";
export type Measurement = {
  id: string;
  kind: "measurement";
  variant: MeasureVariant;
  start: WireAnchor;
  end: WireAnchor;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  label?: string;
  manualValue?: string;
  unit?: MeasureUnit;
  z: number;
  fixed: boolean; // Permanent visibility
};


export type PanelStyle = {
  width: number;
  height: number;
  background: string;
  texture: "smooth" | "brushed" | "hammered";
  hasCover?: boolean;
  coverColor?: string;
  coverWidth?: number;
  coverHeight?: number;
  coverGap?: number;
  hasDoor?: boolean;
  doorColor?: string;
  doorClosed?: boolean;
  style?: "flat" | "depth" | "depth-soft";
  depth?: number;
  frameColor?: string;
};


type Snapshot = {
  entities: Entity[];
  wires: Wire[];
  measurements: Measurement[];
  panel: PanelStyle;
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

type State = {
  projectId: string | null;
  projectName: string;
  isProjectReady: boolean;
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
  updateEntity: (id: string, patch: any, skipPast?: boolean) => void;
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
  addArrow: (variant: any, x: number, y: number) => void;
  selectAll: () => void;
  copySelection: () => void;
  pasteClipboard: () => void;
  addCustomCatalog: (item: CatalogItem) => void;
  removeCustomCatalog: (id: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  loadProject: (p: any) => void;
  setProjectId: (id: string | null) => void;
  markDirty: () => void;
  setSaveStatus: (s: SaveStatus, at?: number) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleFullscreen: () => void;
  setFullscreen: (v: boolean) => void;
  setLeftWidth: (w: number) => void;
  toggleDebugCps: () => void;
  setUnit: (u: MeasureUnit) => void;
  toggleMeasures: (v?: boolean | null) => void;
  setMeasuresVisibility: (v: boolean) => void;
  toggleMinimap: () => void;
  setMinimapCollapsed: (v: boolean) => void;
  setViewportApi: (api: ViewportApi | null) => void;
  setLeftCollapsed: (v: boolean) => void;
  setRightCollapsed: (v: boolean) => void;
  setMeasureTool: (t: MeasureVariant | null) => void;
  addMeasurement: (m: Omit<Measurement, "id" | "kind" | "z" | "x1" | "y1" | "x2" | "y2" | "fixed">) => string;
  updateMeasurement: (id: string, patch: Partial<Measurement>) => void;
  removeMeasurement: (id: string) => void;
  selectMeasurement: (id: string | null) => void;
  moveMeasurementEndpoint: (id: string, which: "start" | "end", anchor: WireAnchor) => void;

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
  measurements: s.measurements.map((m) => ({ ...m })),
  panel: { ...s.panel },
});

const maxZ = (entities: Entity[]) => entities.reduce((m, e) => Math.max(m, e.z), 0);

const getCatalogItem = (id: string, custom: CatalogItem[]) =>
  CATALOG.find((c) => c.id === id) ?? custom.find((c) => c.id === id);

export const useEditor = create<State & Actions>((set, get) => ({
  projectId: null,
  projectName: "Quadro sem título",
  isProjectReady: false,
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
  leftWidth: 288,
  debugCps: false,
  unit: "mm",
  showMeasures: false,
  minimapCollapsed: false,
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
    const known = CATALOG.some((c) => c.id === item.id) || s.customCatalog.some((c) => c.id === item.id);
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
      // Auto-close library and open properties on mobile/tablet after adding
      leftCollapsed: s.leftCollapsed || window.innerWidth < 1280,
      rightCollapsed: window.innerWidth < 1280 ? false : s.rightCollapsed,
    });
    saveCustomCatalog(nextCustom);
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
      leftCollapsed: s.leftCollapsed || window.innerWidth < 1280,
      rightCollapsed: window.innerWidth < 1280 ? false : s.rightCollapsed,
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
      leftCollapsed: s.leftCollapsed || window.innerWidth < 1280,
      rightCollapsed: window.innerWidth < 1280 ? false : s.rightCollapsed,
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
      icon: template.icon,
      templateId: template.id,
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: [...s.entities, p],
      selectedId: id,
      leftCollapsed: s.leftCollapsed || window.innerWidth < 1280,
      rightCollapsed: window.innerWidth < 1280 ? false : s.rightCollapsed,
    });
  },
  removeSelected: () => {
    const s = get();
    const hasSelection = s.selectedIds.length > 0 || s.selectedWireIds.length > 0 || s.selectedId || s.selectedWireId || s.selectedMeasurementId;
    if (!hasSelection) return;

    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.filter(e => !s.selectedIds.includes(e.id) && e.id !== s.selectedId),
      wires: s.wires.filter(w => !s.selectedWireIds.includes(w.id) && w.id !== s.selectedWireId),
      measurements: s.measurements.filter(m => m.id !== s.selectedMeasurementId),
      selectedId: null,
      selectedIds: [],
      selectedWireId: null,
      selectedWireIds: [],
      selectedMeasurementId: null,
    });
  },
  updateEntity: (id, patch, skipPast = false) => {
    const s = get();
    set({
      past: skipPast ? s.past : [...s.past, snapshot(s)],
      future: skipPast ? s.future : [],
      entities: s.entities.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  },
  moveEntity: (id, x, y) => {
    const s = get();
    set({
      entities: s.entities.map((e) => (e.id === id ? { ...e, x: snap(x, s.snap), y: snap(y, s.snap) } : e)),
    });
  },
  resizeEntity: (id, w, h) => {
    const s = get();
    set({
      entities: s.entities.map((e) => (e.id === id ? { ...e, width: w, height: h } : e)),
    });
  },
  removeEntity: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    });
  },
  duplicateEntity: (id) => {
    const s = get();
    const e = s.entities.find((it) => it.id === id);
    if (!e) return;
    const ne = { ...e, id: crypto.randomUUID(), x: e.x + 20, y: e.y + 20, z: maxZ(s.entities) + 1 };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: [...s.entities, ne],
      selectedId: ne.id,
    });
  },
  rotateEntity: (id) => {
    const s = get();
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      entities: s.entities.map((e) => (e.id === id ? { ...e, rotation: ((e.rotation ?? 0) + 90) % 360 } : e)),
    });
  },
  bringToFront: (id) => {
    const s = get();
    const z = maxZ(s.entities) + 1;
    set({
      entities: s.entities.map((e) => (e.id === id ? { ...e, z } : e)),
    });
  },
  sendToBack: (id) => {
    const s = get();
    set({
      entities: s.entities.map((e) => (e.id === id ? { ...e, z: -1 } : e)),
    });
  },
  bringForward: (id) => {
    const s = get();
    const e = s.entities.find((it) => it.id === id);
    if (!e) return;
    const next = s.entities.filter((it) => it.z > e.z).sort((a, b) => a.z - b.z)[0];
    if (next) {
      const z = next.z;
      set({
        entities: s.entities.map((it) => (it.id === id ? { ...it, z } : it.id === next.id ? { ...it, z: e.z } : it)),
      });
    }
  },
  sendBackward: (id) => {
    const s = get();
    const e = s.entities.find((it) => it.id === id);
    if (!e) return;
    const prev = s.entities.filter((it) => it.z < e.z).sort((a, b) => b.z - a.z)[0];
    if (prev) {
      const z = prev.z;
      set({
        entities: s.entities.map((it) => (it.id === id ? { ...it, z } : it.id === prev.id ? { ...it, z: e.z } : it)),
      });
    }
  },
  select: (id) => set({ selectedId: id, selectedWireId: null, selectedMeasurementId: null }),
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(8, z)) }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),
  toggleWireMode: () => set((s) => ({ wireMode: !s.wireMode, measureTool: null })),
  setWireMode: (v) => set({ wireMode: v, measureTool: null }),
  setWireTool: (style) => set({ wireTool: style }),
  toggleLegends: () => set((s) => ({ showLegends: !s.showLegends })),
  startWire: (id) => set({ wireFromId: id }),
  finishWire: (toId) => {
    const s = get();
    if (!s.wireFromId) return;
    const id = crypto.randomUUID();
    const wire: Wire = {
      id,
      start: { type: "entity", entityId: s.wireFromId, point: "center" },
      end: { type: "entity", entityId: toId, point: "center" },
      color: "#dc2626",
      thickness: 2,
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [...s.wires, wire],
      wireFromId: null,
    });
  },
  beginWireAt: (anchor) => set({ drawingWire: { start: anchor, current: anchor, points: [anchor] } }),
  updateWireDraft: (anchor) => set((s) => s.drawingWire ? { drawingWire: { ...s.drawingWire, current: anchor } } : {}),
  finishWireAt: (anchor) => {
    const s = get();
    if (!s.drawingWire) return;
    const id = crypto.randomUUID();
    const wire: Wire = {
      id,
      start: s.drawingWire.start,
      end: anchor,
      color: "#dc2626",
      thickness: 2,
      style: s.wireTool,
      controlPoints: s.drawingWire.points.slice(1, -1).map((p) => (p.type === "free" ? { x: p.x, y: p.y } : { x: 0, y: 0 })),
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [...s.wires, wire],
      drawingWire: null,
    });
  },
  addWirePoint: (anchor) => set((s) => s.drawingWire ? { drawingWire: { ...s.drawingWire, points: [...s.drawingWire.points, anchor] } } : {}),
  cancelWireDraft: () => set({ drawingWire: null }),
  commitWireDraft: () => {
    const s = get();
    if (!s.drawingWire) return;
    const id = crypto.randomUUID();
    const wire: Wire = {
      id,
      start: s.drawingWire.start,
      end: s.drawingWire.current,
      color: "#dc2626",
      thickness: 2,
      style: s.wireTool,
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [...s.wires, wire],
      drawingWire: null,
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
  selectWire: (id) => set({ selectedId: null, selectedWireId: id, selectedMeasurementId: null }),
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
      wires: s.wires.map((w) => (w.id === id ? { ...w, [which]: anchor } : w)),
    });
  },
  moveWireBy: (id, dx, dy) => {
    const s = get();
    set({
      wires: s.wires.map((w) => (w.id === id ? { ...w, controlPoints: (w.controlPoints || []).map(p => ({ x: p.x + dx, y: p.y + dy })) } : w)),
    });
  },
  updateWireControlPoint: (id, index, pt) => {
    const s = get();
    set({
      wires: s.wires.map((w) => (w.id === id ? { ...w, controlPoints: (w.controlPoints || []).map((p, i) => i === index ? pt : p) } : w)),
    });
  },
  removeWireControlPoint: (id, index) => {
    const s = get();
    set({
      wires: s.wires.map((w) => (w.id === id ? { ...w, controlPoints: (w.controlPoints || []).filter((_, i) => i !== index) } : w)),
    });
  },
  insertWireControlPoint: (id, index, pt) => {
    const s = get();
    set({
      wires: s.wires.map((w) => {
        if (w.id !== id) return w;
        const cps = [...(w.controlPoints || [])];
        cps.splice(index, 0, pt);
        return { ...w, controlPoints: cps };
      }),
    });
  },
  addArrow: (variant, x, y) => {
    const s = get();
    const id = crypto.randomUUID();
    const wire: Wire = {
      id,
      kind: "arrow",
      start: { type: "free", x, y },
      end: { type: "free", x: x + 100, y },
      color: "#0f172a",
      thickness: 2,
      arrowEnd: "triangle",
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      wires: [...s.wires, wire],
    });
  },
  selectAll: () => {
    const s = get();
    set({
      selectedIds: s.entities.map(e => e.id),
      selectedWireIds: s.wires.map(w => w.id),
    });
  },
  copySelection: () => {},
  pasteClipboard: () => {},
  addCustomCatalog: (item) => set((s) => {
    const next = [...s.customCatalog, item];
    saveCustomCatalog(next);
    return { customCatalog: next };
  }),
  removeCustomCatalog: (id) => set((s) => {
    const next = s.customCatalog.filter((c) => c.id !== id);
    saveCustomCatalog(next);
    return { customCatalog: next };
  }),
  undo: () => {
    const s = get();
    if (s.past.length === 0) return;
    const prev = s.past[s.past.length - 1];
    const newPast = s.past.slice(0, -1);
    set({
      past: newPast,
      future: [snapshot(s), ...s.future],
      entities: prev.entities,
      wires: prev.wires,
      measurements: prev.measurements,
      panel: prev.panel,
      selectedId: null,
      selectedIds: [],
      selectedWireId: null,
      selectedWireIds: [],
      selectedMeasurementId: null,
    });
  },
  redo: () => {
    const s = get();
    if (s.future.length === 0) return;
    const next = s.future[0];
    const newFuture = s.future.slice(1);
    set({
      past: [...s.past, snapshot(s)],
      future: newFuture,
      entities: next.entities,
      wires: next.wires,
      measurements: next.measurements,
      panel: next.panel,
      selectedId: null,
      selectedIds: [],
      selectedWireId: null,
      selectedWireIds: [],
      selectedMeasurementId: null,
    });
  },
  reset: () => set({ entities: [], wires: [], measurements: [] }),
  loadProject: (p) => {
    console.log("[EditorStore] loadProject - Start", { 
      entities: p.data?.entities?.length, 
      wires: p.data?.wires?.length 
    });
    
    // 1. Validation and Sanitization
    const sanitizeEntities = (entities: any[]): Entity[] => {
      return (entities || []).map(e => {
        // Deep copy to avoid mutations
        const sanitized = JSON.parse(JSON.stringify(e));
        
        // Ensure kind is valid
        if (!['device', 'text', 'shape', 'plate'].includes(sanitized.kind)) {
          sanitized.kind = 'device';
        }

        // Ensure numbers are valid
        sanitized.x = Number(sanitized.x);
        if (isNaN(sanitized.x)) sanitized.x = 0;
        
        sanitized.y = Number(sanitized.y);
        if (isNaN(sanitized.y)) sanitized.y = 0;
        
        sanitized.width = Number(sanitized.width);
        if (isNaN(sanitized.width) || sanitized.width <= 0) sanitized.width = 100;
        
        sanitized.height = Number(sanitized.height);
        if (isNaN(sanitized.height) || sanitized.height <= 0) sanitized.height = 100;
        
        sanitized.rotation = Number(sanitized.rotation);
        if (isNaN(sanitized.rotation)) sanitized.rotation = 0;
        
        sanitized.z = Number(sanitized.z);
        if (isNaN(sanitized.z)) sanitized.z = 0;

        // Ensure overrides object exists for devices
        if (sanitized.kind === 'device' && !sanitized.overrides) {
          sanitized.overrides = {};
        }

        return sanitized as Entity;
      });
    };

    const sanitizeWires = (wires: any[]): Wire[] => {
      return (wires || []).map(w => ({ ...w } as Wire));
    };

    const sanitizeMeasurements = (measurements: any[]): Measurement[] => {
      return (measurements || []).map(m => {
        const sanitized = { ...m };
        sanitized.x1 = Number(sanitized.x1);
        if (isNaN(sanitized.x1)) sanitized.x1 = 0;
        sanitized.y1 = Number(sanitized.y1);
        if (isNaN(sanitized.y1)) sanitized.y1 = 0;
        sanitized.x2 = Number(sanitized.x2);
        if (isNaN(sanitized.x2)) sanitized.x2 = 0;
        sanitized.y2 = Number(sanitized.y2);
        if (isNaN(sanitized.y2)) sanitized.y2 = 0;
        return sanitized as Measurement;
      });
    };

    // 2. Set loading state first
    set({ isProjectReady: false });

    // 3. Hydrate state with sanitized data
    const sanitizedEntities = sanitizeEntities(p.data?.entities || []);
    const sanitizedWires = sanitizeWires(p.data?.wires || []);
    const sanitizedMeasurements = sanitizeMeasurements(p.data?.measurements || []);

    set({
      projectId: p.id,
      projectName: p.name,
      panel: p.data?.panel || get().panel,
      entities: sanitizedEntities,
      wires: sanitizedWires,
      measurements: sanitizedMeasurements,
      showLegends: p.data?.showLegends ?? false,
      past: [],
      future: [],
    });

    console.log("[EditorStore] loadProject - Data hydrated. Starting pre-load of images...");
    
    // 4. Pre-load images before setting isProjectReady
    const entitiesWithImages = (sanitizedEntities as Placed[]).filter(e => {
      if (e.kind !== "device") return false;
      const item = getCatalogItem(e.catalogId, get().customCatalog);
      return !!(e.overrides?.imageUrl || item?.imageUrl);
    });

    if (entitiesWithImages.length > 0) {
      console.log(`[EditorStore] Pre-loading ${entitiesWithImages.length} images...`);
      const loadPromises = entitiesWithImages.map(e => {
        const item = getCatalogItem(e.catalogId, get().customCatalog);
        const url = e.overrides?.imageUrl || item?.imageUrl;
        if (!url) return Promise.resolve();
        
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn(`[EditorStore] Failed to pre-load image: ${url}`);
            resolve(); // Still resolve to avoid blocking indefinitely
          };
          img.src = url;
          // If cached, it might be complete immediately
          if (img.complete) resolve();
        });
      });

      // Timeout safety: don't block more than 3 seconds
      const timeoutPromise = new Promise<void>((resolve) => setTimeout(resolve, 3000));
      
      Promise.race([
        Promise.all(loadPromises),
        timeoutPromise
      ]).then(() => {
        console.log("[EditorStore] Image pre-load complete (or timed out). Setting project ready.");
        set({ isProjectReady: true });
        // Center after rendering
        requestAnimationFrame(() => {
          get().viewportApi?.centerOnProject();
        });
      });
    } else {
      console.log("[EditorStore] No images to pre-load. Setting project ready.");
      set({ isProjectReady: true });
      // Center after rendering
      requestAnimationFrame(() => {
        get().viewportApi?.centerOnProject();
      });
    }
  },
  setProjectId: (id) => set({ projectId: id }),
  markDirty: () => set({ dirty: true }),
  setSaveStatus: (s, at) => set({ saveStatus: s, lastSavedAt: at }),
  toggleLeftPanel: () => {
    const s = get();
    const isTablet = window.innerWidth < 1280;
    const nextLeft = !s.leftCollapsed;
    set({ 
      leftCollapsed: nextLeft,
      // No modo tablet, se estamos abrindo a esquerda, fechamos a direita
      rightCollapsed: (isTablet && nextLeft === false) ? true : s.rightCollapsed
    });
  },
  toggleRightPanel: () => {
    const s = get();
    const isTablet = window.innerWidth < 1280;
    const nextRight = !s.rightCollapsed;
    set({ 
      rightCollapsed: nextRight,
      // No modo tablet, se estamos abrindo a direita, fechamos a esquerda
      leftCollapsed: (isTablet && nextRight === false) ? true : s.leftCollapsed
    });
  },
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  setFullscreen: (v) => set({ fullscreen: v }),
  setLeftWidth: (w) => set({ leftWidth: w }),
  toggleDebugCps: () => set((s) => ({ debugCps: !s.debugCps })),
  setUnit: (u) => set({ unit: u }),
  toggleMeasures: (v) => set((s) => ({ showMeasures: (v !== undefined && v !== null) ? !!v : !s.showMeasures })),
  setMeasuresVisibility: (v) => set({ showMeasures: v }),
  toggleMinimap: () => set((s) => ({ minimapCollapsed: !s.minimapCollapsed })),
  setMinimapCollapsed: (v) => set({ minimapCollapsed: v }),
  setViewportApi: (api) => set({ viewportApi: api }),
  setLeftCollapsed: (v) => {
    const s = get();
    const isTablet = window.innerWidth < 1280;
    set({ 
      leftCollapsed: v,
      // Se estamos abrindo (v=false) no tablet, fecha a direita
      rightCollapsed: (isTablet && !v) ? true : s.rightCollapsed
    });
  },
  setRightCollapsed: (v) => {
    const s = get();
    const isTablet = window.innerWidth < 1280;
    set({ 
      rightCollapsed: v,
      // Se estamos abrindo (v=false) no tablet, fecha a esquerda
      leftCollapsed: (isTablet && !v) ? true : s.leftCollapsed
    });
  },
  setMeasureTool: (t) => {
    set({
      measureTool: t,
      selectedId: t ? null : get().selectedId,
      selectedIds: t ? [] : get().selectedIds,
      selectedWireId: t ? null : get().selectedWireId,
      selectedMeasurementId: t ? null : get().selectedMeasurementId,
    });
    if (t) set({ showMeasures: true, wireMode: false });
  },
  addMeasurement: (m) => {
    const s = get();
    const id = crypto.randomUUID();
    const z = s.measurements.reduce((max, cur) => Math.max(max, cur.z), 0) + 1;
    const nm: Measurement = {
      ...m,
      id,
      kind: "measurement",
      z,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      fixed: false,
    };
    set({
      past: [...s.past, snapshot(s)],
      future: [],
      measurements: [...s.measurements, nm],
      selectedMeasurementId: id,
    });
    return id;
  },
  updateMeasurement: (id, patch) => set((s) => ({
    measurements: s.measurements.map((m) => {
      if (m.id !== id) return m;
      const nm = { ...m, ...patch };
      if (patch.manualValue === "") {
        delete nm.manualValue;
      }
      return nm;
    })
  })),
  removeMeasurement: (id) => set((s) => ({
    past: [...s.past, snapshot(s)],
    future: [],
    measurements: s.measurements.filter((m) => m.id !== id),
    selectedMeasurementId: s.selectedMeasurementId === id ? null : s.selectedMeasurementId
  })),
  selectMeasurement: (id) => {
    const s = get();
    if (!id) {
      set({ selectedMeasurementId: null });
      return;
    }
    const m = s.measurements.find((m) => m.id === id);
    if (m && s.viewportApi) {
      // Find coordinates of anchors to center on
      const p1 = resolveAnchorPoint(m.start, s.entities, s.wires) || { x: m.x1, y: m.y1 };
      const p2 = resolveAnchorPoint(m.end, s.entities, s.wires) || { x: m.x2, y: m.y2 };
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      s.viewportApi.scrollToWorld(mx, my);
    }
    set({
      selectedMeasurementId: id,
      selectedId: null,
      selectedIds: [],
      selectedWireId: null,
      selectedWireIds: [],
    });
  },
  moveMeasurementEndpoint: (id, which, anchor) => set((s) => ({
    measurements: s.measurements.map((m) => {
      if (m.id !== id) return m;
      return { ...m, [which]: anchor };
    })
  })),

}));

function deriveTag(item: CatalogItem, entities: Entity[]): string {
  const prefix = (item.category as string) === "Disjuntores" ? "Q" : "X";
  let max = 0;
  for (const e of entities) {
    if (e.kind !== "device") continue;
    const m = new RegExp(`^${prefix}(\\d+)$`).exec(e.tag);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${prefix}${max + 1}`;
}
