import { useEffect, useRef, useState, type PointerEvent as RPE } from "react";
import { cn } from "@/lib/utils";
import { useEditor, type Placed, type Plate, type Shape, type TextBox, type WireAnchor, type ViewportApi } from "@/lib/editor-store";
import { buildWirePath, connectionCandidates, resolveAnchorPoint, type SnapCandidate } from "@/lib/wire-geometry";
import { useCatalog } from "@/lib/use-catalog";
import { CONNECTION_POINT_COLORS as CP_COLORS } from "@/lib/catalog";
import { DeviceGlyph } from "./DeviceGlyph";
import { ShapeGlyph } from "./ShapeGlyph";
import { PlateGlyph } from "./PlateGlyph";
import { ContextualToolbar } from "./ContextualToolbar";
import { WireLayer } from "./WireLayer";
import { Rulers, RULER_SIZE } from "./Rulers";
import { MeasurementOverlay } from "./MeasurementOverlay";
import { MeasurementsLayer } from "./MeasurementsLayer";
import { SnapPointsLayer } from "./SnapPointsLayer";
import { Minimap } from "./Minimap";
import { ViewportControls } from "./ViewportControls";

/** Espaço "infinito" ao redor do quadro (sandbox). */
const SANDBOX_PAD = 3000;



export function Canvas() {
  const {
    entities,
    wires,
    panel,
    zoom,
    showGrid,
    selectedId,
    selectedIds,
    selectedWireId,
    wireMode,
    wireTool,
    wireFromId,
    drawingWire,
    showLegends,
    customCatalog,
    showMeasures,
    measureTool,
    addItem,
    moveEntity,
    resizeEntity,
    updateEntity,
    select,
    beginWireAt,
    updateWireDraft,
    finishWireAt,
    addWirePoint,
    addMeasurement,
    setMeasureTool,
    leftCollapsed,
    rightCollapsed,
    leftWidth,
    projectId, // Added for tracking project changes
  } = useEditor();
  const [dragId, setDragId] = useState<string | null>(null);

  const {
    setZoom,
  } = useEditor();

  // Forçar re-renderização quando o projeto muda
  const [projectTick, setProjectTick] = useState(0);
  useEffect(() => {
    console.log(`[Canvas] Project change effect. projectId: ${projectId}. Entities: ${entities.length}. Wires: ${wires.length}`);
    setProjectTick(t => t + 1);
  }, [projectId, entities.length, wires.length]);

  const forceRender = () => {
    console.log("[Canvas] Manually forcing re-render");
    setProjectTick(t => t + 1);
  };

  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    id: string;
    offX: number;
    offY: number;
    mode: "move" | "resize";
    w0?: number;
    h0?: number;
    x0?: number;
    y0?: number;
  } | null>(null);
  const wireStartRef = useRef<{ x: number; y: number; began: boolean } | null>(null);
  const pendingDeselectRef = useRef<boolean>(false);
  const [editingText, setEditingText] = useState<string | null>(null);
  const [snapPreview, setSnapPreview] = useState<{
    x: number;
    y: number;
    excludeWireId?: string;
  } | null>(null);
  const [measureDraft, setMeasureDraft] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const measureRef = useRef<{ x1: number; y1: number } | null>(null);

  // -------- Sandbox pan (Space + drag, botão do meio) --------
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const handleResize = () => setTick(t => t + 1);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [spaceDown, setSpaceDown] = useState(false);
  const panRef = useRef<{ x: number; y: number; sl: number; st: number } | null>(null);
  
  const { undo, redo, removeSelected, selectAll } = useEditor();

  useEffect(() => {
    const target = wrapRef.current;
    if (!target) return;
    const down = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // ALT for temporary measurements
      if (e.code === "AltLeft" || e.code === "AltRight" || e.key === "Alt") {
        if (!isInput) useEditor.getState().toggleMeasures(true);
      }

      if (isInput) return;

      // CTRL+A Select All
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      }

      // CTRL+Z Undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }

      // CTRL+Y Redo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
      
      // ESC
      if (e.key === "Escape") {
        const s = useEditor.getState();
        if (measureRef.current || measureDraft) {
          measureRef.current = null;
          setMeasureDraft(null);
          e.stopPropagation();
        } else if (s.measureTool) {
          // If in measure mode but not drawing, EXIT measure mode
          s.setMeasureTool(null);
        }
      }


      // DELETE Remove Selected
      if (e.key === "Delete" || e.key === "Backspace") {
        // Only backspace if not editing text
        if (e.key === "Delete" || !editingText) {
          removeSelected();
        }
      }

      if (e.code === "Space" && !e.repeat) {
        setSpaceDown(true);
        e.preventDefault();
      }
      
      if (e.key === "Escape") {
        if (measureRef.current || measureDraft) {
          measureRef.current = null;
          setMeasureDraft(null);
          e.stopPropagation();
        } else if (measureTool) {
          setMeasureTool(null);
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "AltLeft" || e.code === "AltRight" || e.key === "Alt") {
        useEditor.getState().toggleMeasures(false);
      }
      if (e.code === "Space") setSpaceDown(false);
    };
    window.addEventListener("keydown", down, { capture: true });
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down, { capture: true });
      window.removeEventListener("keyup", up);
    };
  }, [measureTool, measureDraft, editingText, selectAll, undo, redo, removeSelected]);


  const onWrapperPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Pan com botão do meio, ou Space+esquerdo
    const middleOrSpace = e.button === 1 || (e.button === 0 && spaceDown);
    const isMeasuring = !!measureTool;
    // Pan com clique esquerdo em área vazia do sandbox (fora do quadro) quando não está em modo cabeamento/medida
    const targetEl = e.target as HTMLElement;
    const insidePanel = !!targetEl.closest?.("#voltflow-canvas-panel");
    const emptySandbox = e.button === 0 && !wireMode && !isMeasuring && !insidePanel;
    if (middleOrSpace || emptySandbox) {
      e.preventDefault();
      const el = wrapRef.current!;
      panRef.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };
  const onWrapperPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current) return;
    const el = wrapRef.current!;
    el.scrollLeft = panRef.current.sl - (e.clientX - panRef.current.x);
    el.scrollTop = panRef.current.st - (e.clientY - panRef.current.y);
  };
  const onWrapperPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (panRef.current) {
      panRef.current = null;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };
  // Double-middle-click → centralizar projeto
  const onWrapperAuxClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 && e.detail === 2) {
      e.preventDefault();
      useEditor.getState().viewportApi?.centerOnProject();
    }
  };
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const el = wrapRef.current;
      if (!el) {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * factor);
        return;
      }
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const oldZoom = zoom;
      const newZoom = Math.max(0.1, Math.min(8, oldZoom * factor));
      if (newZoom === oldZoom) return;
      const rect = el.getBoundingClientRect();
      // Pointer position in content (scroll) coordinates.
      const cx = (e.clientX - rect.left) + el.scrollLeft;
      const cy = (e.clientY - rect.top) + el.scrollTop;
      // World point that's under the cursor (independent of zoom for the SANDBOX_PAD/ruler offsets which don't scale).
      // Content layout: worldOriginPx = SANDBOX_PAD; inside that, rulers add rulerPad, then world is scaled by zoom.
      const ratio = newZoom / oldZoom;
      const newScrollLeft = SANDBOX_PAD + (cx - SANDBOX_PAD) * ratio - (e.clientX - rect.left);
      const newScrollTop = SANDBOX_PAD + (cy - SANDBOX_PAD) * ratio - (e.clientY - rect.top);
      setZoom(newZoom);
      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollLeft = newScrollLeft;
        el.scrollTop = newScrollTop;
      });
    }
  };


  const { data: officialCatalog = [] } = useCatalog();
  const lookupItem = (catalogId: string) =>
    officialCatalog.find((c) => c.id === catalogId) ??
    customCatalog.find((c) => c.id === catalogId);

  const toPanelCoords = (clientX: number, clientY: number) => {
    const rect = panelRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / zoom,
      y: (clientY - rect.top) / zoom,
    };
  };

  const onDragOver = (e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes("application/x-catalog-item") ||
      e.dataTransfer.types.includes("application/x-catalog-id")
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const onDrop = (e: React.DragEvent) => {
    const raw = e.dataTransfer.getData("application/x-catalog-item");
    const id = e.dataTransfer.getData("application/x-catalog-id");
    if (!raw && !id) return;
    e.preventDefault();
    const { x, y } = toPanelCoords(e.clientX, e.clientY);
    if (raw) {
      try {
        const item = JSON.parse(raw) as import("@/lib/catalog").CatalogItem;
        useEditor
          .getState()
          .addItemFromCatalog(item, x - item.width / 2, y - item.height / 2);
        return;
      } catch {
        /* fall through to legacy id lookup */
      }
    }
    const item = lookupItem(id);
    if (!item) return;
    addItem(id, x - item.width / 2, y - item.height / 2);
  };

  const snapAnchor = (
    pt: { x: number; y: number },
    preferredEntityId?: string,
    excludeWireId?: string,
  ): WireAnchor => {
    const candidates = connectionCandidates(entities, wires, {
      near: pt,
      preferredEntityId,
      excludeWireId,
    });
    let best: { anchor: WireAnchor; dist: number } | null = null;
    for (const c of candidates) {
      const dist = Math.hypot(c.x - pt.x, c.y - pt.y);
      if (!best || dist < best.dist) best = { anchor: c.anchor, dist };
    }
    return best && best.dist <= 26 ? best.anchor : { type: "free", x: pt.x, y: pt.y };
  };

  const onItemPointerDown = (e: RPE<HTMLDivElement>, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    if (wireMode || measureTool) {
      const pt = toPanelCoords(e.clientX, e.clientY);
      const anchor = snapAnchor(pt, id);
      
      if (measureTool) {
        if (measureRef.current) {
          // Finaliza medida no clique
          const endPt = resolveAnchorPoint(anchor, entities, wires) || pt;
          
          addMeasurement({
            variant: measureTool,
            start: snapAnchor({ x: measureRef.current.x1, y: measureRef.current.y1 }),
            end: anchor,
            color: "#ef4444",
          });
          measureRef.current = null;
          setMeasureDraft(null);
          setMeasureTool(null); // Volta para seleção
        } else {
          // Inicia medida no primeiro clique
          const startPt = resolveAnchorPoint(anchor, entities, wires) || pt;
          measureRef.current = { x1: startPt.x, y1: startPt.y };
          setMeasureDraft({ x1: startPt.x, y1: startPt.y, x2: startPt.x, y2: startPt.y });
        }
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }

      if (useEditor.getState().drawingWire) {
        finishWireAt(anchor);
        setSnapPreview(null);
        wireStartRef.current = null;
      } else {
        beginWireAt(anchor);
        wireStartRef.current = { x: e.clientX, y: e.clientY, began: true };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }
      return;
    }

    select(id);
    const it = entities.find((i) => i.id === id)!;
    const { x, y } = toPanelCoords(e.clientX, e.clientY);
    dragRef.current = { id, offX: x - it.x, offY: y - it.y, mode: "move" };
    setDragId(id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onItemPointerMove = (e: RPE<HTMLDivElement>) => {
    if (wireMode && useEditor.getState().drawingWire) {
      const pt = toPanelCoords(e.clientX, e.clientY);
      setSnapPreview(pt);
      updateWireDraft(snapAnchor(pt));
      return;
    }
    if (!dragRef.current) return;
    const { id, offX, offY, mode, w0, h0, x0, y0 } = dragRef.current;
    const { x, y } = toPanelCoords(e.clientX, e.clientY);
    if (wireMode || measureTool) {
      setSnapPreview({ x, y });
    }
    if (mode === "move") {
      moveEntity(id, x - offX, y - offY);
    } else if (
      mode === "resize" &&
      w0 !== undefined &&
      h0 !== undefined &&
      x0 !== undefined &&
      y0 !== undefined
    ) {
      resizeEntity(id, Math.max(8, w0 + (x - x0)), Math.max(8, h0 + (y - y0)));
    }
  };

  const onItemPointerUp = (e: RPE<HTMLDivElement>) => {
    if (wireMode && useEditor.getState().drawingWire) {
      // Pen tools (multi/free) never commit on pointer-up — they wait for ESC/Enter/dblclick.
      if (wireTool === "free" || wireTool === "multi") {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        return;
      }
      const start = wireStartRef.current;
      const moved = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 0;
      if (moved > 6) {
        const pt = toPanelCoords(e.clientX, e.clientY);
        finishWireAt(snapAnchor(pt));
        setSnapPreview(null);
        wireStartRef.current = null;
      }
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      return;
    }
    dragRef.current = null;
    setDragId(null);
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const onResizePointerDown = (e: RPE<HTMLDivElement>, ent: Placed | TextBox | Shape | Plate) => {
    e.stopPropagation();
    const { x, y } = toPanelCoords(e.clientX, e.clientY);
    dragRef.current = {
      id: ent.id,
      offX: 0,
      offY: 0,
      mode: "resize",
      w0: ent.width,
      h0: ent.height,
      x0: x,
      y0: y,
    };
    setDragId(ent.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Only deselect when the click target is the panel background itself
  const onPanelPointerDown = (e: React.PointerEvent) => {
    // Modo "criar medida": inicia desenho ao clicar em qualquer lugar do panel
    if (measureTool && e.button === 0) {
      e.stopPropagation();
      const pt = toPanelCoords(e.clientX, e.clientY);
      const anchor = snapAnchor(pt);
      const clickedPt = resolveAnchorPoint(anchor, entities, wires) || pt;

      if (measureRef.current) {
        // Segundo clique: finaliza
        addMeasurement({
          variant: measureTool,
          start: snapAnchor({ x: measureRef.current.x1, y: measureRef.current.y1 }),
          end: anchor,
          color: "#ef4444",
        });
        measureRef.current = null;
        setMeasureDraft(null);
        setMeasureTool(null); // Volta para seleção
      } else {
        // Primeiro clique: inicia
        measureRef.current = { x1: clickedPt.x, y1: clickedPt.y };
        setMeasureDraft({ x1: clickedPt.x, y1: clickedPt.y, x2: clickedPt.x, y2: clickedPt.y });
      }
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (wireMode && e.target === e.currentTarget) {
      const pt = toPanelCoords(e.clientX, e.clientY);
      const anchor = snapAnchor(pt);
      if (useEditor.getState().drawingWire) {
        const isPen = wireTool === "free" || wireTool === "multi";
        if (isPen && anchor.type === "free") {
          addWirePoint(anchor);
          return;
        }
        finishWireAt(anchor);
        setSnapPreview(null);
        wireStartRef.current = null;
        return;
      }
      beginWireAt(anchor);
      wireStartRef.current = { x: e.clientX, y: e.clientY, began: true };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (e.target === e.currentTarget) {
      if (wireMode && wireFromId) return;
      // Pan no modo seleção: clique em área vazia inicia arrasto do canvas
      if (!wireMode && e.button === 0 && wrapRef.current) {
        const el = wrapRef.current;
        panRef.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
        pendingDeselectRef.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
      select(null);
      useEditor.getState().selectWire(null);
      useEditor.getState().selectMeasurement(null);
      setEditingText(null);
    }
  };

  const onPanelDoubleClick = (e: React.PointerEvent | React.MouseEvent) => {
    if (wireMode && useEditor.getState().drawingWire && (wireTool === "free" || wireTool === "multi")) {
      // Double-click commits the polyline (Figma pen tool behavior).
      useEditor.getState().commitWireDraft();
      setSnapPreview(null);
      wireStartRef.current = null;
    }
  };

  const onPanelPointerMove = (e: React.PointerEvent) => {
    if (measureRef.current) {
      const pt = toPanelCoords(e.clientX, e.clientY);
      setSnapPreview(pt);
      const { x1, y1 } = measureRef.current;
      const endAnchor = snapAnchor(pt);
      const endPt = resolveAnchorPoint(endAnchor, entities, wires) || pt;
      
      let x2 = endPt.x;
      let y2 = endPt.y;
      if (measureTool === "horizontal") y2 = y1;
      else if (measureTool === "vertical") x2 = x1;
      setMeasureDraft({ x1, y1, x2, y2 });
      return;
    }
    if (panRef.current) {
      const el = wrapRef.current!;
      el.scrollLeft = panRef.current.sl - (e.clientX - panRef.current.x);
      el.scrollTop = panRef.current.st - (e.clientY - panRef.current.y);
      // Movimento cancela o deselect pendente
      if (Math.hypot(e.clientX - panRef.current.x, e.clientY - panRef.current.y) > 4) {
        pendingDeselectRef.current = false;
      }
      return;
    }
    if (wireMode && useEditor.getState().drawingWire) {
      const pt = toPanelCoords(e.clientX, e.clientY);
      setSnapPreview(pt);
      updateWireDraft(snapAnchor(pt));
    } else if (wireMode || measureTool) {
      // Show snap points when hovering even if not drawing yet
      const pt = toPanelCoords(e.clientX, e.clientY);
      setSnapPreview(pt);
    }
  };

  const onPanelPointerUp = (e: React.PointerEvent) => {
    if (measureRef.current && measureTool) {
      // No novo sistema de dois cliques, o pointer-up não finaliza a medida.
      // A finalização ocorre no segundo pointer-down.
      return;
    }

    if (panRef.current) {
      const wasPending = pendingDeselectRef.current;
      panRef.current = null;
      pendingDeselectRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      if (wasPending) {
        // Clique sem arrasto: desseleciona como antes
        select(null);
        useEditor.getState().selectWire(null);
        useEditor.getState().selectMeasurement(null);
        setEditingText(null);
      }
      return;
    }
    if (wireMode && useEditor.getState().drawingWire) {
      if (wireTool === "free" || wireTool === "multi") {
        (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
        return;
      }
      const start = wireStartRef.current;
      const moved = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 0;
      if (moved > 6) {
        const pt = toPanelCoords(e.clientX, e.clientY);
        finishWireAt(snapAnchor(pt));
        setSnapPreview(null);
        wireStartRef.current = null;
      }
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    }
  };

  const sortedEntities = [...entities].sort((a, b) => a.z - b.z);
  const showSnapLayer = wireMode || !!drawingWire || !!selectedWireId || !!snapPreview;
  // Entity points (5 fixos por componente) → SEMPRE visíveis enquanto a camada está ativa.
  // Pontos de cabo (segmentos / derivações) → dinâmicos, só aparecem perto do cursor.
  const snapPoints = showSnapLayer
    ? connectionCandidates(entities, wires, {
        near: snapPreview ?? undefined,
        excludeWireId: snapPreview?.excludeWireId,
      }).filter(
        (c) =>
          c.source === "entity" ||
          c.source === "cp" ||
          !snapPreview ||
          (c.distance ?? Infinity) <= 140,
      )
    : [];
  const activeSnap = snapPreview
    ? snapPoints.reduce<SnapCandidate | null>(
        (best, c) => ((c.distance ?? Infinity) < (best?.distance ?? Infinity) ? c : best),
        null,
      )
    : null;
  const canClickSnapPoint = wireMode || !!drawingWire;


  const panelStyle = panel.style ?? "flat";
  const isDepth = panelStyle === "depth" || panelStyle === "depth-soft";
  const isDepthSoft = panelStyle === "depth-soft";
  const depthPx = Math.max(0, panel.depth ?? 18);
  const frameColor = panel.frameColor ?? "#e2e8f0";
  const topShade = `color-mix(in oklab, ${frameColor} 96%, white)`;
  const bottomShade = `color-mix(in oklab, ${frameColor} 70%, black)`;
  const leftShade = `color-mix(in oklab, ${frameColor} 82%, black)`;
  const rightShade = `color-mix(in oklab, ${frameColor} 88%, black)`;
  const rimShade = `color-mix(in oklab, ${frameColor} 60%, black)`;
  const outerRim = panelStyle === "depth" ? 4 : isDepthSoft ? 14 : 0;
  const softPad = 0;

  const W = panel.width;
  const H = panel.height;
  const d = depthPx;
  // Tampa lateral (sempre visível ao lado do quadro, salvo desativada)
  const coverEnabled = panel.hasCover ?? true;
  const coverW = panel.coverWidth ?? W;
  const coverH = panel.coverHeight ?? H;
  const coverGap = panel.coverGap ?? 80;
  const coverColor = panel.coverColor ?? "#cbd5e1";
  // Chrome de profundidade só envolve a área do quadro (não a tampa)
  const panelOuterW = isDepth ? W + 2 * d + 2 * (outerRim + softPad) : W;
  const panelOuterH = isDepth ? H + 2 * d + 2 * (outerRim + softPad) : H;
  const wallsOffset = outerRim + softPad;
  const panelInteriorOffset = isDepth ? wallsOffset + d : 0;
  // Mundo (sandbox): largura/altura suficientes para conter quadro + gap + tampa
  const worldW = panelOuterW + (coverEnabled ? coverGap + coverW : 0);
  const worldH = Math.max(panelOuterH, coverH);
  // panelRef opera em coordenadas de mundo (origem = canto do interior do quadro)
  // Para simplificar drops, panelRef cobre a região (0..worldW - panelInteriorOffset, ...).
  // Coordenadas dos elementos partem de (0,0) = interior do quadro.

  const textureBgInner =
    panel.texture === "brushed"
      ? "repeating-linear-gradient(0deg, rgba(0,0,0,0.04) 0 1px, transparent 1px 3px)"
      : panel.texture === "hammered"
        ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0 2px, transparent 3px), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.06) 0 2px, transparent 3px)"
        : "none";
  void textureBgInner; // suprime warn quando não há texturas

  const rulerPad = showMeasures ? RULER_SIZE : 0;

  // Register viewport API for Toolbar/Minimap consumers.
  const layoutRef = useRef({
    worldW, worldH, panelInteriorOffset, rulerPad, zoom,
    W, H, coverEnabled, coverW, coverH, coverGap,
  });
  layoutRef.current = { worldW, worldH, panelInteriorOffset, rulerPad, zoom, W, H, coverEnabled, coverW, coverH, coverGap };

  useEffect(() => {
    const setZoomFn = useEditor.getState().setZoom;
    const api: ViewportApi = {
      getViewportState: () => {
        const el = wrapRef.current;
        if (!el) return null;
        const L = layoutRef.current;
        return {
          scrollLeft: el.scrollLeft,
          scrollTop: el.scrollTop,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight,
          worldOriginX: SANDBOX_PAD + L.rulerPad + L.panelInteriorOffset * L.zoom,
          worldOriginY: SANDBOX_PAD + L.rulerPad + L.panelInteriorOffset * L.zoom,
          worldW: L.worldW,
          worldH: L.worldH,
          zoom: L.zoom,
        };
      },
      scrollToWorld: (wx, wy) => {
        const el = wrapRef.current;
        if (!el) return;
        const L = layoutRef.current;
        const px = SANDBOX_PAD + L.rulerPad + (L.panelInteriorOffset + wx) * L.zoom;
        const py = SANDBOX_PAD + L.rulerPad + (L.panelInteriorOffset + wy) * L.zoom;
        el.scrollLeft = px - el.clientWidth / 2;
        el.scrollTop = py - el.clientHeight / 2;
      },
      centerOnProject: () => {
        const el = wrapRef.current;
        if (!el) return;
        const L = layoutRef.current;
        const minX = 0;
        const maxX = L.W + (L.coverEnabled ? L.coverGap + L.coverW : 0);
        const minY = 0;
        const maxY = Math.max(L.H, L.coverEnabled ? L.coverH : L.H);
        const bboxW = maxX - minX;
        const bboxH = maxY - minY;
        const margin = 0.12;
        const targetZoom = Math.max(
          0.15,
          Math.min(3, Math.min(
            (el.clientWidth * (1 - margin)) / bboxW,
            (el.clientHeight * (1 - margin)) / bboxH,
          )),
        );
        setZoomFn(targetZoom);
        requestAnimationFrame(() => {
          const el2 = wrapRef.current;
          if (!el2) return;
          const L2 = layoutRef.current;
          const cx = (minX + maxX) / 2;
          const cy = (minY + maxY) / 2;
          const px = SANDBOX_PAD + L2.rulerPad + (L2.panelInteriorOffset + cx) * L2.zoom;
          const py = SANDBOX_PAD + L2.rulerPad + (L2.panelInteriorOffset + cy) * L2.zoom;
          el2.scrollLeft = px - el2.clientWidth / 2;
          el2.scrollTop = py - el2.clientHeight / 2;
        });
      },
    };
    useEditor.getState().setViewportApi(api);
    return () => {
      useEditor.getState().setViewportApi(null);
    };
  }, []);

  // Centralizar projeto na primeira montagem (após layout).
  useEffect(() => {
    const t = setTimeout(() => useEditor.getState().viewportApi?.centerOnProject(), 50);
    return () => clearTimeout(t);
  }, []);


  console.log(`[Canvas] Rendering. projectTick: ${projectTick}. Entities: ${entities.length}. Wires: ${wires.length}`);

  return (
    <div className="flex-1 relative min-w-0 min-h-0">
      <div className="absolute top-4 right-4 z-[100] flex gap-2">
        <button 
          onClick={forceRender}
          className="bg-primary text-primary-foreground px-2 py-1 rounded text-[10px] shadow-lg opacity-50 hover:opacity-100"
        >
          Forçar Re-render
        </button>
      </div>
      <div
      ref={wrapRef}
      className="absolute inset-0 overflow-auto bg-background"
      onPointerDown={onWrapperPointerDown}
      onPointerMove={onWrapperPointerMove}
      onPointerUp={onWrapperPointerUp}
      onPointerCancel={onWrapperPointerUp}
      onAuxClick={onWrapperAuxClick}
      onWheel={onWheel}
      style={{ 
        cursor: panRef.current 
          ? "grabbing" 
          : spaceDown 
            ? "grab" 
            : (measureTool || wireMode)
              ? "crosshair" 
              : "auto" 
      }}
    >
      {/* O Minimap deve estar aqui para ser posicionado absolutamente em relação ao wrapRef */}
      <Minimap />




      <div className={`absolute inset-0 ${showGrid ? "dot-grid" : ""}`} aria-hidden />

      <div
        className="relative"
        style={{
          width: worldW * zoom + rulerPad + SANDBOX_PAD * 2,
          height: worldH * zoom + rulerPad + SANDBOX_PAD * 2,
          paddingLeft: SANDBOX_PAD,
          paddingTop: SANDBOX_PAD,
        }}
      >
       <div
         className="relative"
         style={{ width: worldW * zoom + rulerPad, height: worldH * zoom + rulerPad }}
       >

        <Rulers
          panelWidth={worldW}
          panelHeight={worldH}
          zoom={zoom}
          offsetX={rulerPad}
          offsetY={rulerPad}
        />

        <div
          className="absolute"
          style={{ left: rulerPad, top: rulerPad, width: worldW * zoom, height: worldH * zoom }}
        >
        {isDepth && (
          <div
            aria-hidden
            className="absolute top-0 left-0 origin-top-left pointer-events-none"
            style={{
              width: panelOuterW,
              height: panelOuterH,
              transform: `scale(${zoom})`,
              filter: "drop-shadow(0 30px 40px rgba(15,23,42,0.45)) drop-shadow(0 8px 16px rgba(15,23,42,0.3))",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "#ffffff",
                borderRadius: 4,
                boxShadow:
                  panelStyle === "depth"
                    ? "inset 0 0 0 1px #ccc, inset -2px -2px 2px rgba(0,0,0,0.1)"
                    : "inset 0 0 0 1px #d4d4d4",
              }}
            />
            {panelStyle === "depth" && (
              <div
                style={{
                  position: "absolute",
                  left: outerRim,
                  top: outerRim,
                  width: panelOuterW - 2 * outerRim,
                  height: panelOuterH - 2 * outerRim,
                  border: "1.5px solid #dcdcdc",
                  boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.8)",
                  background: "#ffffff",
                }}
              />
            )}
            <div
              style={{
                position: "absolute",
                left: wallsOffset,
                top: wallsOffset,
                width: W + 2 * d,
                height: H + 2 * d,
              }}
            >
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${topShade}, ${frameColor})`, clipPath: `polygon(0 0, ${W + 2 * d}px 0, ${W + d}px ${d}px, ${d}px ${d}px)` }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${frameColor}, ${bottomShade})`, clipPath: `polygon(${d}px ${H + d}px, ${W + d}px ${H + d}px, ${W + 2 * d}px ${H + 2 * d}px, 0 ${H + 2 * d}px)` }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${leftShade}, ${frameColor})`, clipPath: `polygon(0 0, ${d}px ${d}px, ${d}px ${H + d}px, 0 ${H + 2 * d}px)` }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, ${frameColor}, ${rightShade})`, clipPath: `polygon(${W + d}px ${d}px, ${W + 2 * d}px 0, ${W + 2 * d}px ${H + 2 * d}px, ${W + d}px ${H + d}px)` }} />
              <div style={{ position: "absolute", left: d, top: d, width: W, height: H, boxShadow: `inset 0 6px 12px -4px ${rimShade}, inset 0 -2px 6px -2px rgba(0,0,0,0.25)` }} />
              {(() => {
                const furo = (style: React.CSSProperties) => (
                  <div style={{ position: "absolute", width: 14, height: 8, borderRadius: 8, background: "#c0c0c0", boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.4)", ...style }} />
                );
                return (
                  <>
                    {furo({ left: d + 10, top: d + 10 })}
                    {furo({ left: d + W - 24, top: d + 10 })}
                    {furo({ left: d + 10, top: d + H - 18 })}
                    {furo({ left: d + W - 24, top: d + H - 18 })}
                  </>
                );
              })()}
              <div style={{ position: "absolute", left: d + W * 0.075, top: d + H * 0.3, width: W * 0.85, height: 1, background: "rgba(0,0,0,0.06)" }} />
              <div style={{ position: "absolute", left: d + W * 0.075, top: d + H * 0.7, width: W * 0.85, height: 1, background: "rgba(0,0,0,0.06)" }} />
            </div>
          </div>
        )}

        <div
          ref={panelRef}
          id="voltflow-canvas-panel"
          onDragOver={onDragOver}
          onDrop={onDrop}
          onPointerDown={onPanelPointerDown}
          onPointerMove={onPanelPointerMove}
          onPointerUp={onPanelPointerUp}
          onDoubleClick={onPanelDoubleClick}
          className="absolute origin-top-left"
          key={`panel-${projectId}-${projectTick}`}
          style={{
            top: panelInteriorOffset * zoom,
            left: panelInteriorOffset * zoom,
            width: worldW - panelInteriorOffset,
            height: worldH - panelInteriorOffset,
            transform: `scale(${zoom}) translateZ(0)`,
            cursor: wireMode ? "crosshair" : undefined,
            willChange: "transform", // Hint for GPU acceleration
          }}
        >
          {/* Fundo do quadro (área W × H em coords de mundo) */}
          <div
            className={isDepth ? "absolute" : "absolute border-8 border-slate-300 rounded-md shadow-2xl"}
            style={{
              left: 0,
              top: 0,
              width: W,
              height: H,
              backgroundColor: panel.background,
              backgroundImage: textureBgInner,
              backgroundSize: panel.texture === "hammered" ? "8px 8px" : undefined,
              pointerEvents: "none",
            }}
          />
          <div
            className="absolute border-2 border-dashed border-slate-300/60 rounded-sm pointer-events-none"
            style={{ left: 12, top: 12, width: W - 24, height: H - 24 }}
          />

          {/* Tampa lateral (sandbox) */}
          {coverEnabled && (
            <div
              className="absolute rounded-md shadow-xl pointer-events-none"
              style={{
                left: W + coverGap,
                top: 0,
                width: coverW,
                height: coverH,
                background: coverColor,
                border: `4px solid color-mix(in oklab, ${coverColor} 55%, black)`,
                boxShadow: "0 10px 24px -8px rgba(15,23,42,0.35), inset 0 0 0 1px rgba(255,255,255,0.25)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: 20,
                  height: 50,
                  background: "#333",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#666", border: "1px solid #000" }} />
              </div>
            </div>
          )}

          {/* Render Entities with z-index and rotation */}
          {sortedEntities.map((ent) => {
            const isSel = selectedId === ent.id || selectedIds.includes(ent.id);
            const isDragging = dragId === ent.id;
            const isWireSrc = wireFromId === ent.id;
            const isEditing = editingText === ent.id;

            return (
              <div
                key={ent.id}
                onPointerDown={(e) => !isEditing && onItemPointerDown(e, ent.id)}
                onPointerMove={onItemPointerMove}
                onPointerUp={onItemPointerUp}
                onDoubleClick={(e) => {
                  if (ent.kind === "text") {
                    e.stopPropagation();
                    select(ent.id);
                    setEditingText(ent.id);
                  }
                }}
                className={cn(
                  "absolute origin-center select-none",
                  isDragging ? "z-50 opacity-90 cursor-grabbing" : "cursor-grab",
                  (wireMode || !!drawingWire) ? "cursor-crosshair" : "",
                  isEditing ? "cursor-text" : ""
                )}
                style={{
                  left: ent.x,
                  top: ent.y,
                  width: ent.width,
                  height: ent.height,
                  transform: `rotate(${ent.rotation}deg)`,
                  zIndex: ent.z,
                  outline: isSel
                    ? "2px solid var(--color-primary)"
                    : isWireSrc
                      ? "2px dashed var(--color-destructive)"
                      : "none",
                  outlineOffset: 2,
                }}
              >
                {ent.kind === "device" && (
                  (() => {
                    const item = lookupItem(ent.catalogId);
                    if (!item) return null;
                    const o = ent.overrides;
                    return (
                      <>
                        {o.imageUrl || item.imageUrl ? (
                          <img
                            src={(o.imageUrl || item.imageUrl)!}
                            alt={item.name}
                            draggable={false}
                            className="w-full h-full object-contain pointer-events-none"
                          />
                        ) : (
                          <DeviceGlyph item={item} width={ent.width} height={ent.height} tag={ent.tag} />
                        )}
                        {isSel && (
                          <div className="absolute -top-5 left-0 text-[9px] font-mono font-bold text-primary bg-card px-1.5 py-0.5 rounded shadow-sm border border-border">
                            {ent.tag}
                          </div>
                        )}
                        {showLegends && (
                          <div
                            className="absolute left-1/2 -translate-x-1/2 -bottom-1 translate-y-full mt-1 text-[9px] leading-tight font-mono text-slate-700 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded border border-slate-300 shadow-sm pointer-events-none whitespace-nowrap"
                            style={{ transform: `translate(-50%, 100%) rotate(${-ent.rotation}deg)` }}
                          >
                            <div className="font-bold text-slate-900">
                              {ent.tag} · {o.name ?? item.name}
                            </div>
                            {(() => {
                              const parts = [o.current ?? item.current, o.voltage ?? item.voltage, o.power ?? item.power, o.capacity ?? item.capacity].filter(Boolean);
                              return parts.length > 0 ? <div className="text-slate-600">{parts.join(" · ")}</div> : null;
                            })()}
                          </div>
                        )}
                      </>
                    );
                  })()
                )}
                
                {ent.kind === "shape" && <ShapeGlyph shape={ent} />}
                
                {ent.kind === "text" && (
                  isEditing ? (
                    <textarea
                      autoFocus
                      value={ent.text}
                      onChange={(e) => updateEntity(ent.id, { text: e.target.value })}
                      onBlur={() => setEditingText(null)}
                      onPointerDown={(e) => e.stopPropagation()}
                      className="w-full h-full resize-none p-1 outline-none border border-primary rounded"
                      style={{
                        fontSize: ent.fontSize,
                        color: ent.color,
                        fontWeight: ent.bold ? 700 : 400,
                        fontStyle: ent.italic ? "italic" : "normal",
                        textAlign: ent.align,
                        background: ent.background === "transparent" ? "white" : ent.background,
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full p-1 whitespace-pre-wrap break-words overflow-hidden flex"
                      style={{
                        fontSize: ent.fontSize,
                        color: ent.color,
                        fontWeight: ent.bold ? 700 : 400,
                        fontStyle: ent.italic ? "italic" : "normal",
                        textAlign: ent.align,
                        background: ent.background,
                        justifyContent: ent.align === "center" ? "center" : ent.align === "right" ? "flex-end" : "flex-start",
                        alignItems: "center",
                      }}
                    >
                      {ent.text || "Texto"}
                    </div>
                  )
                )}
                
                {ent.kind === "plate" && <PlateGlyph plate={ent} />}

                {isSel && !isDragging && !isEditing && (
                  <ResizeHandle onPointerDown={(e) => onResizePointerDown(e, ent)} />
                )}
              </div>
            );
          })}

          {/* Wires (advanced layer: styles, draggable bend + endpoints) */}
          <WireLayer
            panelWidth={panel.width}
            panelHeight={panel.height}
            entities={entities}
            wires={wires}
            zoom={zoom}
            snapAnchor={(pt, excludeWireId) => snapAnchor(pt, undefined, excludeWireId)}
            onReconnectPreview={(pt, excludeWireId) =>
              setSnapPreview(pt ? { ...pt, ...(excludeWireId ? { excludeWireId } : {}) } : null)
            }
          />

          {/* In-flight cable/pen preview using the real Bézier path */}
          {drawingWire &&
            (() => {
              const a = resolveAnchorPoint(drawingWire.start, entities, wires);
              const b = resolveAnchorPoint(drawingWire.current, entities, wires);
              if (!a || !b) return null;
              const mid = (drawingWire.points ?? [])
                .map((p) => resolveAnchorPoint(p, entities, wires))
                .filter(Boolean) as { x: number; y: number }[];
              const controlPoints = mid.map((p) => ({ x: p.x, y: p.y }));
              const { d } = buildWirePath(a, b, wireTool, null, controlPoints);
              return (
                <svg
                  className="absolute inset-0 pointer-events-none z-20"
                  width={panel.width}
                  height={panel.height}
                >
                  <path
                    d={d}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    opacity={0.85}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {[a, ...mid].map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#dc2626" />
                  ))}
                  <circle cx={b.x} cy={b.y} r={3.5} fill="white" stroke="#dc2626" strokeWidth={1.5} />
                </svg>
              );
            })()}

          {snapPoints.map((p) => {
            const isActive = activeSnap?.id === p.id && (p.distance ?? Infinity) <= p.snapRadius;
            const isEntity = p.source === "entity";
            const isCp = p.source === "cp";
            const isNearWire = p.source === "wire" && (p.distance ?? Infinity) <= 54;
            const cpColor =
              isCp && p.cpKind
                ? CP_COLORS[p.cpKind as keyof typeof CP_COLORS] ?? "#64748b"
                : null;
            return (
              <button
                type="button"
                key={p.id}
                title={isCp ? `${p.cpName ?? ""}${p.cpSignal ? " · " + p.cpSignal : ""}` : undefined}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (!canClickSnapPoint) return;
                  if (useEditor.getState().drawingWire) {
                    finishWireAt(p.anchor);
                    wireStartRef.current = null;
                  } else {
                    beginWireAt(p.anchor);
                    wireStartRef.current = { x: e.clientX, y: e.clientY, began: true };
                  }
                }}
                className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 rounded-full cursor-crosshair transition-[box-shadow,background-color,transform] duration-150 ease-out ${
                  isCp
                    ? "size-2.5 border-2 ring-2"
                    : isEntity
                      ? "size-3.5 bg-primary ring-2 ring-primary/25"
                      : "size-3 border-2 border-primary bg-background ring-2 ring-primary/25"
                } ${
                  isActive
                    ? "scale-150 ring-8 shadow-lg"
                    : isNearWire
                      ? "ring-4 ring-primary/15"
                      : ""
                }`}
                style={{
                  left: p.x,
                  top: p.y,
                  pointerEvents: canClickSnapPoint ? "auto" : "none",
                  ...(isCp && cpColor
                    ? {
                        backgroundColor: "white",
                        borderColor: cpColor,
                        // ring color via tailwind isn't dynamic; use boxShadow for halo
                        boxShadow: isActive
                          ? `0 0 0 6px ${cpColor}33, 0 4px 12px ${cpColor}66`
                          : `0 0 0 2px ${cpColor}22`,
                      }
                    : {}),
                }}
                aria-label={
                  isCp
                    ? `Borne ${p.cpName ?? ""} ${p.cpSignal ?? ""}`
                    : isEntity
                      ? "Ponto de conexão do componente"
                      : "Ponto conectável da linha"
                }
              />
            );
          })}

          {/* Etiqueta flutuante do borne ativo */}
          {activeSnap && activeSnap.source === "cp" && (activeSnap.distance ?? Infinity) <= activeSnap.snapRadius && (
            <div
              className="absolute z-40 -translate-x-1/2 -translate-y-full -mt-4 px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-mono shadow-lg pointer-events-none whitespace-nowrap"
              style={{ left: activeSnap.x, top: activeSnap.y }}
            >
              <span className="font-bold">{activeSnap.cpName}</span>
              {activeSnap.cpSignal && <span className="opacity-70"> · {activeSnap.cpSignal}</span>}
            </div>
          )}

          {/* Debug overlay para bornes removido da UI */}

          {activeSnap && (activeSnap.distance ?? Infinity) <= activeSnap.snapRadius && (
            <div
              className="absolute z-20 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40 bg-primary/10 animate-ping pointer-events-none"
              style={{ left: activeSnap.x, top: activeSnap.y }}
            />
          )}


          {(() => {
            if (entities.length > 0) {
              console.log(`[Canvas] Rendering ${entities.length} entities`);
            }
            return null;
          })()}

          {selectedId &&
            (() => {
              const sel = entities.find((e) => e.id === selectedId);
              if (!sel) return null;
              // Axis-aligned bounding box of the rotated element, so the
              // toolbar always floats above the *visual* top edge.
              const rad = (sel.rotation * Math.PI) / 180;
              const cos = Math.abs(Math.cos(rad));
              const sin = Math.abs(Math.sin(rad));
              const aabbH = sel.width * sin + sel.height * cos;
              const cx = sel.x + sel.width / 2;
              const cy = sel.y + sel.height / 2;
              return <ContextualToolbar x={cx} y={cy - aabbH / 2} />;
            })()}

          {entities.length === 0 && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-center text-muted-foreground max-w-[60%]">
                <div className="text-sm font-semibold mb-1">Quadro vazio</div>
                <div className="text-xs">
                  Arraste componentes da biblioteca à esquerda para começar.
                </div>
              </div>
            </div>
          )}
          <MeasurementOverlay
            draggingId={dragId}
            panelWidth={worldW}
            panelHeight={worldH}
          />
          <MeasurementsLayer worldWidth={worldW} worldHeight={worldH} />
          {measureDraft && (
            <svg className="absolute inset-0 pointer-events-none z-30" width={worldW} height={worldH}>
              <line
                x1={measureDraft.x1}
                y1={measureDraft.y1}
                x2={measureDraft.x2}
                y2={measureDraft.y2}
                stroke="#d946ef"
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  </div>
</div>



      <SnapPointsLayer 
        near={snapPreview} 
        active={!!snapPreview && (wireMode || !!measureTool)} 
        panelWidth={panel.width} 
        panelHeight={panel.height} 
      />
      {/* Área segura para controles flutuantes (Minimap, ViewportControls) */}
      {(() => {
        const isMobile = window.innerWidth < 1024;
        const currentRightWidth = isMobile ? Math.min(320, window.innerWidth - 40) : 320;
        const currentLeftWidth = isMobile ? Math.min(leftWidth, window.innerWidth - 40) : leftWidth;
        
        return (
          <div 
            className="absolute inset-0 pointer-events-none z-40 overflow-hidden"
            style={{
              marginLeft: !leftCollapsed && isMobile ? currentLeftWidth : 0,
              marginRight: !rightCollapsed && isMobile ? currentRightWidth : 0,
              transition: "margin 300ms cubic-bezier(0.4, 0, 0.2, 1)"
            }}
          >
            <div className="absolute inset-4 pointer-events-none flex flex-col justify-between items-end">
              <Minimap />
              <ViewportControls />
            </div>
          </div>
        );
      })()}
    </div>
  );
}


function ResizeHandle({ onPointerDown }: { onPointerDown: (e: RPE<HTMLDivElement>) => void }) {
  return (
    <div
      onPointerDown={onPointerDown}
      className="absolute -right-1.5 -bottom-1.5 size-3 bg-primary border-2 border-white rounded-sm cursor-nwse-resize shadow"
    />
  );
}
