import { useEffect } from "react";
import { useEditor } from "@/lib/editor-store";

type Opts = {
  onSave?: () => void;
};

const isEditable = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
};

export function useEditorShortcuts({ onSave }: Opts = {}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const s = useEditor.getState();
      const mod = e.ctrlKey || e.metaKey;

      // Always-allowed shortcuts
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave?.();
        return;
      }
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        s.undo();
        return;
      }
      if ((mod && e.key.toLowerCase() === "y") || (mod && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        s.redo();
        return;
      }
      if (e.key === "Escape") {
        if (s.drawingWire) {
          // If user already placed at least one extra point, ESC commits the path;
          // otherwise it cancels the draft.
          if (s.drawingWire.points.length > 0) s.commitWireDraft();
          else s.cancelWireDraft();
        } else if (s.wireFromId) {
          s.cancelWireDraft();
        } else {
          s.select(null);
          s.selectWire(null);
        }
        return;
      }
      if (e.key === "Enter" && s.drawingWire) {
        e.preventDefault();
        s.commitWireDraft();
        return;
      }

      // F11 toggles fullscreen and prevents browser default
      if (e.key === "F11") {
        e.preventDefault();
        s.toggleFullscreen();
        return;
      }

      // Clipboard shortcuts (work outside text inputs)
      if (mod && e.key.toLowerCase() === "a" && !isEditable(e.target)) {
        e.preventDefault();
        s.selectAll();
        return;
      }
      if (mod && e.key.toLowerCase() === "c" && !isEditable(e.target)) {
        e.preventDefault();
        s.copySelection();
        return;
      }
      if (mod && e.key.toLowerCase() === "v" && !isEditable(e.target)) {
        e.preventDefault();
        s.pasteClipboard();
        return;
      }

      // Skip when typing
      if (isEditable(e.target)) return;

      // Unified delete: works for single + multi (Ctrl+A) selection of entities AND wires
      if (e.key === "Delete" || e.key === "Backspace") {
        const hasSelection =
          s.selectedId ||
          s.selectedWireId ||
          s.selectedIds.length > 0 ||
          s.selectedWireIds.length > 0;
        if (hasSelection) {
          e.preventDefault();
          s.removeSelected();
          return;
        }
      }

      // Selection-targeted shortcuts
      if (s.selectedId) {
        if (mod && e.key.toLowerCase() === "d") {
          e.preventDefault();
          s.duplicateEntity(s.selectedId);
          return;
        }
        if (e.key.toLowerCase() === "r") {
          e.preventDefault();
          s.rotateEntity(s.selectedId);
          return;
        }
      }

      // Global toggles
      switch (e.key.toLowerCase()) {
        case "f":
          e.preventDefault();
          s.toggleFullscreen();
          break;
        case "g":
          s.toggleGrid();
          break;
        case "w":
          s.toggleWireMode();
          break;
        case "t":
          s.addText(s.panel.width / 2 - 70, s.panel.height / 2 - 16);
          break;
        case "[":
          s.toggleLeftPanel();
          break;
        case "]":
          s.toggleRightPanel();
          break;
        case "+":
        case "=":
          s.setZoom(s.zoom + 0.1);
          break;
        case "-":
          s.setZoom(s.zoom - 0.1);
          break;
        case "0":
          s.setZoom(1);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSave]);
}
