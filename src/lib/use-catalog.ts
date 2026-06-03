import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogItem, CatalogCategory, ComponentConnectionPoint } from "@/lib/catalog";

type Row = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subtitle: string;
  width: number;
  height: number;
  accent: string | null;
  poles: number | null;
  current: string | null;
  voltage: string | null;
  capacity: string | null;
  power: string | null;
  description: string | null;
  tags: string[] | null;
  image_url: string | null;
  connection_points: unknown;
  is_active: boolean;
  sort_order: number;
};

function parseCps(raw: unknown): ComponentConnectionPoint[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw as ComponentConnectionPoint[];
}

function rowToItem(r: Row): CatalogItem {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: r.category as CatalogCategory,
    subtitle: r.subtitle,
    width: r.width,
    height: r.height,
    accent: r.accent ?? undefined,
    poles: r.poles ?? undefined,
    current: r.current ?? undefined,
    voltage: r.voltage ?? undefined,
    capacity: r.capacity ?? undefined,
    power: r.power ?? undefined,
    description: r.description ?? undefined,
    tags: r.tags ?? undefined,
    imageUrl: r.image_url ?? undefined,
    connectionPoints: parseCps(r.connection_points),
  };
}

export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: async (): Promise<CatalogItem[]> => {
      const { data, error } = await supabase
        .from("catalog_components")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data as Row[]).map(rowToItem);
    },
    staleTime: 30_000,
  });
}
