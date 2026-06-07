import { useEditor, type WireAnchor } from "@/lib/editor-store";

/**
 * Wait until every <img> inside the element has finished loading
 * (or errored).
 */
export async function waitForImages(root: HTMLElement) {
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
export async function inlineRemoteImages(root: HTMLElement): Promise<() => void> {
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

export type BBox = { minX: number; minY: number; maxX: number; maxY: number };

/**
 * Calcula o bounding box do conteúdo real do projeto (entidades, fios livres,
 * quadro, tampa). Coordenadas em "world space".
 */
export function computeContentBBox(): BBox {
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
    if (w.controlPoints) {
      for (const p of w.controlPoints) {
        include(p.x, p.y);
      }
    }
  }

  for (const m of s.measurements) {
    includeAnchor(m.start);
    includeAnchor(m.end);
    include(m.x1, m.y1);
    include(m.x2, m.y2);
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
