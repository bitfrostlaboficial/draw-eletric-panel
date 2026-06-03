import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useEditor, type WireAnchor } from "@/lib/editor-store";

/**
 * Wait until every <img> inside the element has finished loading
 * (or errored).
 */
async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

/** Inline remote images (CORS workaround). Returns a restore function. */
async function inlineRemoteImages(root: HTMLElement): Promise<() => void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  const restorers: Array<() => void> = [];
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const res = await fetch(src, { mode: "cors", cache: "force-cache" });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(r.error);
          r.readAsDataURL(blob);
        });
        const original = img.src;
        img.src = dataUrl;
        if (img.decode) await img.decode().catch(() => undefined);
        restorers.push(() => {
          img.src = original;
        });
      } catch {
        /* keep original src */
      }
    }),
  );
  return () => restorers.forEach((fn) => fn());
}

export type ExportProgress = (label: string) => void;

/** Áreas que podemos exportar futuramente (apenas `content` implementado agora). */
export type ExportScope = "content" | "panel" | "panel+cover" | "selection";

type BBox = { minX: number; minY: number; maxX: number; maxY: number };

/**
 * Calcula o bounding box do conteúdo real do projeto (entidades, fios livres,
 * quadro, tampa). Coordenadas em "world space" (mesmo sistema do panelRef).
 */
function computeContentBBox(): BBox {
  const s = useEditor.getState();
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  const include = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const e of s.entities) {
    include(e.x, e.y);
    include(e.x + e.width, e.y + e.height);
  }

  const includeAnchor = (a?: WireAnchor) => {
    if (!a) return;
    if (a.type === "free" || a.type === "wire") include(a.x, a.y);
  };
  for (const w of s.wires) {
    includeAnchor(w.start);
    includeAnchor(w.end);
    // alguns wires têm pontos intermediários em campos diversos; ignorados aqui
  }

  // Sempre incluir o quadro principal
  include(0, 0);
  include(s.panel.width, s.panel.height);

  // Tampa lateral, se ativa
  if (s.panel.hasCover ?? true) {
    const cw = s.panel.coverWidth ?? s.panel.width;
    const ch = s.panel.coverHeight ?? s.panel.height;
    const cg = s.panel.coverGap ?? 80;
    include(s.panel.width + cg, 0);
    include(s.panel.width + cg + cw, ch);
  }

  if (!isFinite(minX)) {
    minX = 0; minY = 0;
    maxX = s.panel.width; maxY = s.panel.height;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Exporta o canvas como PDF, recortando apenas a área realmente usada do
 * sandbox. Ignora regiões vazias do canvas infinito.
 *
 * `scope` está preparado para no futuro permitir variações (quadro, tampa,
 * seleção). Hoje sempre exporta o conteúdo completo do projeto.
 */
export async function exportCanvasToPdf(
  projectName: string,
  onProgress?: ExportProgress,
  _scope: ExportScope = "content",
) {
  const el = document.getElementById("voltflow-canvas-panel") as HTMLElement | null;
  if (!el) throw new Error("Canvas não encontrado");

  onProgress?.("Calculando área do projeto…");
  const bbox = computeContentBBox();
  const MARGIN = 40; // px de margem ao redor do conteúdo
  const cropX = Math.max(0, Math.floor(bbox.minX - MARGIN));
  const cropY = Math.max(0, Math.floor(bbox.minY - MARGIN));
  const cropW = Math.ceil(bbox.maxX - bbox.minX + 2 * MARGIN);
  const cropH = Math.ceil(bbox.maxY - bbox.minY + 2 * MARGIN);

  onProgress?.("Aguardando imagens…");
  await waitForImages(el);

  onProgress?.("Embutindo imagens dos componentes…");
  const restoreImages = await inlineRemoteImages(el);

  const placeholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=";

  onProgress?.("Renderizando quadro em alta resolução…");
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  try {
    // Captura o painel inteiro (sem transform do zoom). Em seguida cortamos
    // para a bbox do conteúdo. offsetWidth/Height equivalem ao tamanho em
    // unidades de mundo, pois o transform: scale do zoom é neutralizado.
    const fullW = el.offsetWidth;
    const fullH = el.offsetHeight;
    const pixelRatio = 2;

    const dataUrl = await toPng(el, {
      pixelRatio,
      cacheBust: false,
      backgroundColor: undefined,
      skipFonts: false,
      imagePlaceholder: placeholder,
      style: { transform: "none" },
      width: fullW,
      height: fullH,
    });

    onProgress?.("Recortando área usada do sandbox…");

    // Garante que o crop fique dentro da imagem renderizada
    const safeCropW = Math.min(cropW, Math.max(1, fullW - cropX));
    const safeCropH = Math.min(cropH, Math.max(1, fullH - cropY));

    const cropped: string = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(safeCropW * pixelRatio);
        canvas.height = Math.round(safeCropH * pixelRatio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Falha ao recortar"));
        ctx.drawImage(
          img,
          Math.round(cropX * pixelRatio),
          Math.round(cropY * pixelRatio),
          Math.round(safeCropW * pixelRatio),
          Math.round(safeCropH * pixelRatio),
          0,
          0,
          canvas.width,
          canvas.height,
        );
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Falha ao carregar imagem"));
      img.src = dataUrl;
    });

    onProgress?.("Montando PDF…");

    const pxToMm = (px: number) => (px * 25.4) / 96;
    const wMm = pxToMm(safeCropW);
    const hMm = pxToMm(safeCropH);

    const pdf = new jsPDF({
      orientation: wMm > hMm ? "landscape" : "portrait",
      unit: "mm",
      format: [wMm, hMm],
      compress: true,
    });
    pdf.addImage(cropped, "PNG", 0, 0, wMm, hMm, undefined, "FAST");

    const safe = (projectName || "quadro").replace(/[^a-z0-9-_]+/gi, "_");
    pdf.save(`${safe}.pdf`);
  } finally {
    restoreImages();
  }
}
