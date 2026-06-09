import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useEditor } from "@/lib/editor-store";
import { 
  waitForImages, 
  inlineRemoteImages, 
  computeContentBBox 
} from "./canvas-utils";

export type ExportProgress = (label: string) => void;

/** Opções de exportação PDF */
export type ExportScope = "content" | "viewport" | "panel" | "manual";

export interface ExportOptions {
  scope: ExportScope;
  scale: number; // 1, 0.5, 0.2 etc
  manualRect?: { x: number; y: number; width: number; height: number };
}

/**
 * Exporta o canvas como PDF com diferentes opções de escopo.
 */
export async function exportCanvasToPdf(
  projectName: string,
  onProgress?: ExportProgress,
  options: ExportOptions = { scope: "content", scale: 1 }
) {
  const el = document.getElementById("voltflow-canvas-panel") as HTMLElement | null;
  const wrap = document.querySelector(".overflow-auto.bg-background") as HTMLElement | null;
  
  if (!el || !wrap) throw new Error("Canvas não encontrado");

  let cropX = 0;
  let cropY = 0;
  let cropW = 0;
  let cropH = 0;

  onProgress?.("Calculando área de exportação…");

  if (options.scope === "content") {
    const bbox = computeContentBBox();
    const MARGIN = 40;
    cropX = Math.max(0, Math.floor(bbox.minX - MARGIN));
    cropY = Math.max(0, Math.floor(bbox.minY - MARGIN));
    cropW = Math.ceil(bbox.maxX - bbox.minX + 2 * MARGIN);
    cropH = Math.ceil(bbox.maxY - bbox.minY + 2 * MARGIN);
  } else if (options.scope === "panel") {
    cropX = 0;
    cropY = 0;
    cropW = useEditor.getState().panel.width;
    cropH = useEditor.getState().panel.height;
  } else if (options.scope === "viewport") {
    const zoom = useEditor.getState().zoom;
    const SANDBOX_PAD = 3000;
    const rulerPad = useEditor.getState().showMeasures ? 36 : 0;
    
    // Coordenadas mundo da viewport atual
    cropX = (wrap.scrollLeft - SANDBOX_PAD - rulerPad) / zoom;
    cropY = (wrap.scrollTop - SANDBOX_PAD - rulerPad) / zoom;
    cropW = wrap.clientWidth / zoom;
    cropH = wrap.clientHeight / zoom;
  } else if (options.scope === "manual" && options.manualRect) {
    cropX = options.manualRect.x;
    cropY = options.manualRect.y;
    cropW = options.manualRect.width;
    cropH = options.manualRect.height;
  }

  onProgress?.("Aguardando imagens…");
  await waitForImages(el);

  onProgress?.("Embutindo imagens dos componentes…");
  const restoreImages = await inlineRemoteImages(el);

  const placeholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=";

  onProgress?.("Renderizando quadro em alta resolução…");
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  try {
    const fullW = el.offsetWidth;
    const fullH = el.offsetHeight;
    const pixelRatio = options.scale * 2; // Base de 2x para nitidez

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

    onProgress?.("Processando imagem…");

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

    onProgress?.("Gerando PDF…");

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

    const now = new Date().toISOString().split('T')[0];
    const safe = (projectName || "quadro").replace(/[^a-z0-9-_]+/gi, "_");
    pdf.save(`${safe}-${now}.pdf`);
  } finally {
    restoreImages();
  }
}
