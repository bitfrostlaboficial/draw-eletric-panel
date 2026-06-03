import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";

/**
 * Popover-based color picker, rendered through a portal anchored at <body>.
 * Avoids being clipped by parent `overflow:auto` containers and stays above
 * canvas elements regardless of stacking context. Stays open while the user
 * is interacting; closes on outside click or Escape.
 */
export function ColorPicker({
  value,
  onChange,
  className = "",
  allowTransparent = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  allowTransparent?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const interactingInsideRef = useRef(false);
  const isTransparent = value === "transparent";

  const normalized = isTransparent ? "#ffffff" : value;
  const validHex = /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : "#000000";

  // Compute position when opening / on scroll / resize.
  const recompute = () => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const POP_W = 232;
    const POP_H = 280;
    const margin = 8;
    let left = r.right - POP_W;
    if (left < margin) left = margin;
    if (left + POP_W > window.innerWidth - margin) left = window.innerWidth - POP_W - margin;
    let top = r.bottom + 6;
    if (top + POP_H > window.innerHeight - margin) {
      top = Math.max(margin, r.top - POP_H - 6);
    }
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    recompute();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const isInside = (target: EventTarget | null) => {
      const t = target as Node | null;
      return !!t && (!!popRef.current?.contains(t) || !!triggerRef.current?.contains(t));
    };
    const onPointerDown = (e: PointerEvent) => {
      interactingInsideRef.current = isInside(e.target);
      if (!interactingInsideRef.current) setOpen(false);
    };
    const onPointerUp = () => {
      window.setTimeout(() => {
        interactingInsideRef.current = false;
      }, 0);
    };
    const onClick = (e: MouseEvent) => {
      if (interactingInsideRef.current || isInside(e.target)) return;
      setOpen(false);
    };
    const onFocusIn = (e: FocusEvent) => {
      if (isInside(e.target)) return;
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onScroll = () => recompute();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const swatchBg = isTransparent
    ? "repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 50% / 8px 8px"
    : validHex;

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative size-8 rounded-md cursor-pointer overflow-hidden ring-1 ring-border hover:ring-2 hover:ring-primary/60 transition-shadow"
        aria-label="Escolher cor"
        title="Cor personalizada"
      >
        {/* Color preview */}
        <span className="absolute inset-0" style={{ background: swatchBg }} />
        {/* Rainbow ring overlay to communicate "color picker" */}
        <span
          className="absolute inset-0 rounded-md pointer-events-none"
          style={{
            background:
              "conic-gradient(from 180deg, #ef4444, #f59e0b, #eab308, #22c55e, #06b6d4, #3b82f6, #a855f7, #ec4899, #ef4444)",
            WebkitMask:
              "radial-gradient(circle, transparent 55%, #000 58%)",
            mask: "radial-gradient(circle, transparent 55%, #000 58%)",
            opacity: 0.95,
          }}
        />
      </button>

      {open && pos &&
        createPortal(
          <div
            ref={popRef}
            className="fixed z-[9999] bg-card border border-border rounded-lg shadow-2xl p-3 w-[232px]"
            style={{ top: pos.top, left: pos.left }}
            tabIndex={-1}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <HexColorPicker
              color={validHex}
              onChange={(c) => onChange(c)}
              style={{ width: "100%" }}
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-mono text-muted-foreground">HEX</span>
              <input
                value={isTransparent ? "" : value}
                placeholder="#000000"
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) {
                    onChange(v.startsWith("#") ? v : `#${v}`);
                  }
                }}
                className="flex-1 px-2 py-1 text-xs font-mono bg-secondary border border-border rounded outline-hidden"
              />
            </div>
            {allowTransparent && (
              <button
                type="button"
                onClick={() => onChange("transparent")}
                className={`mt-2 w-full text-[11px] py-1 border rounded ${
                  isTransparent
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:bg-secondary"
                }`}
              >
                Transparente
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-2 w-full text-[11px] py-1 bg-primary text-primary-foreground rounded font-medium"
            >
              OK
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
