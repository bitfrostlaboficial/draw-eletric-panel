import { toPng } from "html-to-image";
import jsPDF from "jspdf";

/**
 * Wait until every <img> inside the element has finished loading
 * (or errored). Prevents capturing a panel with half-loaded sprites.
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

/**
 * Convert remote image URLs to inlined data URLs. html-to-image normally
 * tries to do this via fetch+canvas, but cross-origin servers without
 * permissive CORS headers cause it to silently swap the image for the
 * placeholder — which is why components were vanishing in the exported PDF
 * while wires (pure SVG) kept rendering. We do the conversion ourselves
 * and restore the original src afterwards.
 *
 * Returns a restore function.
 */
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
        // Re-aguarda decode da nova fonte
        if (img.decode) await img.decode().catch(() => undefined);
        restorers.push(() => {
          img.src = original;
        });
      } catch {
        /* mantém src original — fallback para o placeholder do html-to-image */
      }
    }),
  );
  return () => restorers.forEach((fn) => fn());
}

export type ExportProgress = (label: string) => void;

/**
 * Exporta o canvas do editor como PDF — assíncrono, com feedback de progresso,
 * preservando transparência e dimensões exatas do quadro. Tolerante a falhas
 * em imagens externas (CORS) — substitui por placeholder em vez de abortar.
 */
export async function exportCanvasToPdf(projectName: string, onProgress?: ExportProgress) {
  const el = document.getElementById("voltflow-canvas-panel") as HTMLElement | null;
  if (!el) throw new Error("Canvas não encontrado");

  onProgress?.("Aguardando imagens…");
  await waitForImages(el);

  onProgress?.("Embutindo imagens dos componentes…");
  const restoreImages = await inlineRemoteImages(el);

  // 1x1 transparent PNG fallback for blocked/cross-origin images
  const placeholder =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgAAIAAAUAAen63NgAAAAASUVORK5CYII=";

  onProgress?.("Renderizando quadro em alta resolução…");

  // Yield to the browser so loading UI can paint before the heavy work
  await new Promise((r) => requestAnimationFrame(() => r(null)));

  try {
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      cacheBust: false,
      backgroundColor: undefined, // preserva transparência
      skipFonts: false,
      imagePlaceholder: placeholder,
      style: { transform: "none" }, // ignora o scale do zoom do editor
      width: el.offsetWidth,
      height: el.offsetHeight,
    });

    onProgress?.("Montando PDF…");

    // px → mm @ 96dpi
    const pxToMm = (px: number) => (px * 25.4) / 96;
    const wMm = pxToMm(el.offsetWidth);
    const hMm = pxToMm(el.offsetHeight);

    const pdf = new jsPDF({
      orientation: wMm > hMm ? "landscape" : "portrait",
      unit: "mm",
      format: [wMm, hMm],
      compress: true,
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, wMm, hMm, undefined, "FAST");

    const safe = (projectName || "quadro").replace(/[^a-z0-9-_]+/gi, "_");
    pdf.save(`${safe}.pdf`);
  } finally {
    restoreImages();
  }
}
