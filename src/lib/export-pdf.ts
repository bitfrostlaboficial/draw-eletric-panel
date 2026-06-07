import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { useEditor } from "@/lib/editor-store";
import { 
  waitForImages, 
  inlineRemoteImages, 
  computeContentBBox 
} from "./canvas-utils";

export type ExportProgress = (label: string) => void;

/** Áreas que podemos exportar futuramente (apenas `content` implementado agora). */
export type ExportScope = "content" | "panel" | "panel+cover" | "selection";


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
