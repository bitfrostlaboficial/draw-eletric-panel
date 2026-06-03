import type { Shape, ShapeVariant } from "@/lib/editor-store";

/**
 * Renderiza qualquer Shape como SVG vetorial. Usa viewBox 0..100 e
 * preserveAspectRatio="none" para escalar suavemente em qualquer tamanho.
 */
export function ShapeGlyph({ shape }: { shape: Shape }) {
  const { variant, fill, stroke, strokeWidth, opacity, dashed, strokeStyle, cornerRadius } = shape;
  const effectiveStyle: "solid" | "dashed" | "dotted" =
    strokeStyle ?? (dashed ? "dashed" : "solid");
  const dash =
    effectiveStyle === "dashed"
      ? `${Math.max(4, strokeWidth * 3)} ${Math.max(3, strokeWidth * 2)}`
      : effectiveStyle === "dotted"
        ? `${Math.max(1, strokeWidth)} ${Math.max(2, strokeWidth * 2)}`
        : undefined;
  const rx = cornerRadius;
  const common = {
    fill,
    stroke,
    strokeWidth,
    strokeLinejoin: "round" as const,
    strokeLinecap: "round" as const,
    strokeDasharray: dash,
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      preserveAspectRatio={variant === "line" || variant === "dashed-line" ? "none" : "xMidYMid meet"}
      style={{ opacity, overflow: "visible", display: "block" }}
      pointerEvents="none"
    >
      {renderPath(variant, common, rx)}
    </svg>
  );
}

function renderPath(v: ShapeVariant, p: React.SVGProps<SVGPathElement>, rx?: number) {
  // map cornerRadius (px space) to viewBox 0..100 — assume average dim 100
  const r = rx !== undefined ? Math.min(50, Math.max(0, rx / 4)) : undefined;
  switch (v) {
    case "rectangle":
      return <rect x={2} y={10} width={96} height={80} rx={r ?? 2} {...(p as React.SVGProps<SVGRectElement>)} />;
    case "square":
      return <rect x={5} y={5} width={90} height={90} rx={r ?? 2} {...(p as React.SVGProps<SVGRectElement>)} />;
    case "circle":
      return <circle cx={50} cy={50} r={46} {...(p as React.SVGProps<SVGCircleElement>)} />;
    case "ellipse":
      return <ellipse cx={50} cy={50} rx={48} ry={36} {...(p as React.SVGProps<SVGEllipseElement>)} />;
    case "triangle":
      return <polygon points="50,4 96,94 4,94" {...(p as React.SVGProps<SVGPolygonElement>)} />;
    case "diamond":
      return <polygon points="50,4 96,50 50,96 4,50" {...(p as React.SVGProps<SVGPolygonElement>)} />;
    case "pentagon":
      return <polygon points="50,4 96,38 78,94 22,94 4,38" {...(p as React.SVGProps<SVGPolygonElement>)} />;
    case "hexagon":
      return <polygon points="25,6 75,6 96,50 75,94 25,94 4,50" {...(p as React.SVGProps<SVGPolygonElement>)} />;
    case "octagon":
      return <polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" {...(p as React.SVGProps<SVGPolygonElement>)} />;
    case "star":
      return (
        <polygon
          points="50,4 61,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 39,38"
          {...(p as React.SVGProps<SVGPolygonElement>)}
        />
      );
    case "cross":
      return (
        <polygon
          points="38,4 62,4 62,38 96,38 96,62 62,62 62,96 38,96 38,62 4,62 4,38 38,38"
          {...(p as React.SVGProps<SVGPolygonElement>)}
        />
      );
    case "arrow":
      return (
        <polygon
          points="4,38 60,38 60,18 96,50 60,82 60,62 4,62"
          {...(p as React.SVGProps<SVGPolygonElement>)}
        />
      );
    case "double-arrow":
      return (
        <polygon
          points="4,50 24,30 24,42 76,42 76,30 96,50 76,70 76,58 24,58 24,70"
          {...(p as React.SVGProps<SVGPolygonElement>)}
        />
      );
    case "line":
    case "dashed-line":
      return <line x1={0} y1={50} x2={100} y2={50} {...(p as React.SVGProps<SVGLineElement>)} />;
    case "callout":
      return (
        <path
          d="M6,10 H94 Q98,10 98,14 V70 Q98,74 94,74 H58 L48,92 L42,74 H6 Q2,74 2,70 V14 Q2,10 6,10 Z"
          {...p}
        />
      );
    case "cloud":
      return (
        <path
          d="M25,72 Q4,72 4,55 Q4,40 22,38 Q22,20 42,20 Q56,20 60,32 Q72,28 80,38 Q96,40 96,55 Q96,72 75,72 Z"
          {...p}
        />
      );
    default:
      return <rect x={2} y={2} width={96} height={96} {...(p as React.SVGProps<SVGRectElement>)} />;
  }
}
