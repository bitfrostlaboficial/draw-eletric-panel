import { Copy, RotateCw, Trash2, ChevronsUp, ChevronsDown } from "lucide-react";
import { useEditor } from "@/lib/editor-store";

/**
 * Floating mini-toolbar shown above the currently selected entity.
 * Positioning is computed by Canvas in panel-local coordinates with
 * rotation already accounted for via AABB, so this component itself
 * does NOT apply any rotation — it stays upright and stable.
 */
export function ContextualToolbar({ x, y }: { x: number; y: number }) {
  const { selectedId, duplicateEntity, rotateEntity, removeEntity, bringToFront, sendToBack } = useEditor();
  if (!selectedId) return null;

  return (
    <div
      className="absolute z-50 flex items-center gap-0.5 bg-card border border-border rounded-md shadow-lg px-1 py-1 pointer-events-auto select-none"
      style={{
        left: x,
        top: y,
        // Center horizontally, push up above the AABB with a small gap.
        transform: "translate(-50%, calc(-100% - 10px))",
        // Avoid sub-pixel flicker on transform updates.
        willChange: "left, top",
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <MiniBtn title="Duplicar (Ctrl+D)" onClick={() => duplicateEntity(selectedId)}>
        <Copy className="size-3.5" />
      </MiniBtn>
      <MiniBtn title="Girar 90° (R)" onClick={() => rotateEntity(selectedId)}>
        <RotateCw className="size-3.5" />
      </MiniBtn>
      <MiniBtn title="Trazer p/ frente" onClick={() => bringToFront(selectedId)}>
        <ChevronsUp className="size-3.5" />
      </MiniBtn>
      <MiniBtn title="Enviar p/ trás" onClick={() => sendToBack(selectedId)}>
        <ChevronsDown className="size-3.5" />
      </MiniBtn>
      <div className="h-4 w-px bg-border mx-0.5" />
      <MiniBtn title="Remover (Del)" danger onClick={() => removeEntity(selectedId)}>
        <Trash2 className="size-3.5" />
      </MiniBtn>
    </div>
  );
}

function MiniBtn({
  children, title, onClick, danger,
}: { children: React.ReactNode; title: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`size-11 md:size-7 grid place-items-center rounded transition-colors ${
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      {children}
    </button>
  );
}
