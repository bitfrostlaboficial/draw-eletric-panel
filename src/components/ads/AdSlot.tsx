import { cn } from "@/lib/utils";

/**
 * AdSlot — placeholder discreto pronto para Google AdSense / ads internos.
 *
 * Quando o ad provider estiver configurado, basta trocar o conteúdo interno
 * (por ex. um `<ins class="adsbygoogle" />`) sem mexer no resto da UI.
 *
 * Tamanhos padrão (IAB):
 *  - "leaderboard"  728×90  → rodapé do editor (desktop)
 *  - "banner"       468×60  → fallback compacto
 *  - "rectangle"    300×250 → sidebar
 *  - "skyscraper"   160×600 → lateral alta
 */
export type AdSize = "leaderboard" | "banner" | "rectangle" | "skyscraper";

const SIZES: Record<AdSize, { w: number; h: number }> = {
  leaderboard: { w: 728, h: 90 },
  banner: { w: 468, h: 60 },
  rectangle: { w: 300, h: 250 },
  skyscraper: { w: 160, h: 600 },
};

export function AdSlot({
  size = "leaderboard",
  className,
  label = "Anúncio",
}: {
  size?: AdSize;
  className?: string;
  label?: string;
}) {
  const { w, h } = SIZES[size];
  return (
    <div
      aria-label="Espaço publicitário"
      className={cn(
        "relative flex items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground overflow-hidden",
        className,
      )}
      style={{ width: w, maxWidth: "100%", height: h }}
    >
      <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">
        {label} · {w}×{h}
      </span>
    </div>
  );
}
