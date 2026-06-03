import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogItem, CatalogCategory, ComponentConnectionPoint } from "@/lib/catalog";

type Row = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  subtitle: string;
  brand: string;
  width: number;
  height: number;
  image_url: string | null;
  thumbnail_url: string | null;
  properties: Record<string, unknown>;
  tags: string[] | null;
  connection_points: unknown;
  is_favorite: boolean;
  is_public: boolean;
};

const BUCKET = "user-components";

function rowToItem(r: Row): CatalogItem & { isUserComponent: true; isFavorite: boolean } {
  const props = (r.properties ?? {}) as Record<string, unknown>;
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: (r.category as CatalogCategory) ?? "Personalizado",
    subtitle: r.subtitle ?? "",
    width: r.width,
    height: r.height,
    accent: (props.accent as string) ?? "#2563eb",
    poles: props.poles as number | undefined,
    capacity: props.capacity as string | undefined,
    current: props.current as string | undefined,
    voltage: props.voltage as string | undefined,
    power: props.power as string | undefined,
    description: props.description as string | undefined,
    tags: r.tags ?? [],
    imageUrl: r.image_url ?? undefined,
    connectionPoints: Array.isArray(r.connection_points) && r.connection_points.length
      ? (r.connection_points as ComponentConnectionPoint[])
      : undefined,
    custom: true,
    isUserComponent: true,
    isFavorite: r.is_favorite,
  };
}

export function useUserComponents(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["user-components", userId ?? "anon"],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_components")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Row[]).map(rowToItem);
    },
  });
}

async function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

/**
 * Redimensiona + comprime preservando proporção. Usa WebP quando suportado
 * (queda significativa de tamanho com qualidade visual equivalente).
 */
async function resizeAndCompress(
  file: File,
  maxWidth: number,
  quality = 0.85,
): Promise<{ blob: Blob; ext: string; contentType: string }> {
  const dataUrl = await fileToDataUrl(file);
  const img = await loadImage(dataUrl);
  const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  // Tenta WebP — fallback PNG (preserva transparência).
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
  if (blob && blob.size > 0) {
    return { blob, ext: "webp", contentType: "image/webp" };
  }
  const png = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), "image/png"),
  );
  return { blob: png, ext: "png", contentType: "image/png" };
}

export type UploadProgress = (label: string, pct?: number) => void;

export async function uploadComponentImage(
  userId: string,
  file: File,
  onProgress?: UploadProgress,
): Promise<{ imageUrl: string; thumbnailUrl: string }> {
  onProgress?.("Comprimindo imagem...", 10);
  const main = await resizeAndCompress(file, 1024, 0.85);
  const thumb = await resizeAndCompress(file, 128, 0.8);

  const baseName = `${Date.now()}-${crypto.randomUUID()}`;
  onProgress?.("Enviando imagem...", 40);
  const mainPath = `${userId}/${baseName}.${main.ext}`;
  const { error: e1 } = await supabase.storage
    .from(BUCKET)
    .upload(mainPath, main.blob, { upsert: false, contentType: main.contentType });
  if (e1) throw e1;

  onProgress?.("Enviando miniatura...", 75);
  const thumbPath = `${userId}/${baseName}-thumb.${thumb.ext}`;
  const { error: e2 } = await supabase.storage
    .from(BUCKET)
    .upload(thumbPath, thumb.blob, { upsert: false, contentType: thumb.contentType });
  if (e2) throw e2;

  onProgress?.("Finalizando...", 95);
  const { data: m } = supabase.storage.from(BUCKET).getPublicUrl(mainPath);
  const { data: t } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);
  return { imageUrl: m.publicUrl, thumbnailUrl: t.publicUrl };
}


export type SaveUserComponentInput = {
  userId: string;
  name: string;
  brand: string;
  category: CatalogCategory | string;
  subtitle?: string;
  width: number;
  height: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  properties?: Record<string, unknown>;
  tags?: string[];
};

export function useSaveUserComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveUserComponentInput) => {
      const { data, error } = await supabase
        .from("user_components")
        .insert({
          user_id: input.userId,
          name: input.name,
          brand: input.brand,
          category: input.category,
          subtitle: input.subtitle ?? "",
          width: input.width,
          height: input.height,
          image_url: input.imageUrl ?? null,
          thumbnail_url: input.thumbnailUrl ?? null,
          properties: (input.properties ?? {}) as never,
          tags: input.tags ?? [],
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-components"] }),
  });
}

export function useDeleteUserComponent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_components").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-components"] }),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("user_components")
        .update({ is_favorite: value })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-components"] }),
  });
}
