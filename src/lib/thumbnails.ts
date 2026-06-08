import { toPng } from "html-to-image";
import { supabase } from "@/integrations/supabase/client";
import { 
  waitForImages, 
  inlineRemoteImages, 
  computeContentBBox 
} from "./canvas-utils";

/**
 * Gera uma thumbnail do projeto atual e faz o upload para o Supabase Storage.
 * Retorna a URL pública da imagem.
 */
export async function generateAndUploadThumbnail(projectId: string): Promise<string | null> {
  const el = document.getElementById("voltflow-canvas-panel") as HTMLElement | null;
  if (!el) return null;

  try {
    const bbox = computeContentBBox();
    const contentW = bbox.maxX - bbox.minX;
    const contentH = bbox.maxY - bbox.minY;
    // Margem de ~10% no total (5% de cada lado), mínimo 40px
    const MARGIN = Math.max(40, Math.min(contentW, contentH) * 0.05);
    
    const cropX = Math.max(0, Math.floor(bbox.minX - MARGIN));
    const cropY = Math.max(0, Math.floor(bbox.minY - MARGIN));
    const cropW = Math.ceil(contentW + 2 * MARGIN);
    const cropH = Math.ceil(contentH + 2 * MARGIN);


    await waitForImages(el);
    const restoreImages = await inlineRemoteImages(el);

    try {
      const fullW = el.offsetWidth;
      const fullH = el.offsetHeight;
      
      // Captura inicial em resolução moderada
      const dataUrl = await toPng(el, {
        pixelRatio: 1.5,
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: { transform: "none" },
        width: fullW,
        height: fullH,
      });

      // Recorte e redimensionamento final para ~512x384
      const blob: Blob = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          
          // Mantemos a proporção do conteúdo, mas limitamos o tamanho máximo
          const targetW = 512;
          const targetH = 384;
          const scale = Math.min(targetW / cropW, targetH / cropH);
          
          canvas.width = Math.round(cropW * scale);
          canvas.height = Math.round(cropH * scale);
          
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject(new Error("Failed to get context"));
          
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.drawImage(
            img,
            cropX * 1.5, cropY * 1.5, cropW * 1.5, cropH * 1.5, // source (multiplicado pelo pixelRatio)
            0, 0, canvas.width, canvas.height // destination
          );
          
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error("Blob conversion failed"));
          }, "image/jpeg", 0.85);
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = dataUrl;
      });

      // Upload para o bucket 'project-thumbnails'
      // Nome do arquivo é o ID do projeto para facilitar a sobrescrita
      const fileName = `${projectId}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("project-thumbnails")
        .upload(fileName, blob, {
          contentType: "image/jpeg",
          upsert: true,
          cacheControl: "0" // Forçar que o browser não cacheie localmente por muito tempo
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("project-thumbnails")
        .getPublicUrl(fileName);

      return `${publicUrl}?t=${Date.now()}`; // Cache bust
    } finally {
      restoreImages();
    }
  } catch (error) {
    console.error("Erro ao gerar thumbnail:", error);
    return null;
  }
}
