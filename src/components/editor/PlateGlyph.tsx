import type { PlateIcon } from "@/lib/plate-templates";
import type { Plate } from "@/lib/editor-store";

/** Renderiza o ícone livre escolhido para a plaqueta. */
function Icon({ icon, color, size }: { icon: PlateIcon; color: string; size: number }) {
  const s = size;
  switch (icon) {
    case "bolt":
      // raio sobre triângulo amarelo
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
          <polygon points="32,4 60,58 4,58" fill="transparent" stroke={color} strokeWidth={3} strokeLinejoin="round" />
          <polygon points="34,16 22,38 30,38 26,52 42,28 32,28 38,16" fill={color} />
        </svg>
      );
    case "ground":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
          <line x1="32" y1="10" x2="32" y2="34" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <line x1="14" y1="36" x2="50" y2="36" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <line x1="20" y1="44" x2="44" y2="44" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <line x1="26" y1="52" x2="38" y2="52" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </svg>
      );
    case "warning":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
          <polygon points="32,6 60,58 4,58" fill="transparent" stroke={color} strokeWidth={3} strokeLinejoin="round" />
          <line x1="32" y1="22" x2="32" y2="42" stroke={color} strokeWidth={4} strokeLinecap="round" />
          <circle cx="32" cy="50" r="2.5" fill={color} />
        </svg>
      );
    case "danger":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
          <circle cx="32" cy="32" r="26" fill="transparent" stroke={color} strokeWidth={4} />
          <line x1="14" y1="14" x2="50" y2="50" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </svg>
      );
    case "lock":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
          <rect x="14" y="28" width="36" height="28" rx="3" fill="transparent" stroke={color} strokeWidth={3} />
          <path d="M22 28 V20 a10 10 0 0 1 20 0 V28" fill="transparent" stroke={color} strokeWidth={3} />
        </svg>
      );
    case "energized":
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
          <circle cx="32" cy="32" r="26" fill="transparent" stroke={color} strokeWidth={3} />
          <polygon points="34,14 22,36 30,36 26,52 42,30 32,30 38,14" fill={color} />
        </svg>
      );
    case "ppe":
      // capacete simples
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" aria-hidden>
          <path d="M10 44 q22 -30 44 0 z" fill={color} />
          <rect x="8" y="44" width="48" height="6" rx="2" fill={color} />
        </svg>
      );
    default:
      return null;
  }
}

export function PlateGlyph({ plate }: { plate: Plate }) {
  const hasIcon = plate.icon && plate.icon !== "none";
  const iconSize = Math.min(plate.height - 16, 56);
  const lines = plate.text.split("\n");
  return (
    <div
      className="w-full h-full flex items-stretch overflow-hidden"
      style={{
        background: plate.background,
        color: plate.color,
        border: `${plate.borderWidth}px solid ${plate.borderColor}`,
        borderRadius: plate.cornerRadius,
        padding: plate.padding,
        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        fontFamily: plate.fontFamily ?? "Inter, system-ui, sans-serif",
        gap: 8,
      }}
    >
      {hasIcon && (
        <div className="shrink-0 grid place-items-center">
          <Icon icon={plate.icon as PlateIcon} color={plate.color} size={iconSize} />
        </div>
      )}
      <div
        className="flex-1 min-w-0 flex flex-col"
        style={{
          justifyContent: "center",
          textAlign: plate.align,
          alignItems:
            plate.align === "center" ? "center" : plate.align === "right" ? "flex-end" : "flex-start",
          fontSize: plate.fontSize,
          fontWeight: plate.fontWeight,
          fontStyle: plate.italic ? "italic" : "normal",
          lineHeight: 1.15,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {lines.map((ln: string, i: number) => (
          <div key={i}>{ln || "\u00A0"}</div>
        ))}
      </div>
    </div>
  );
}
