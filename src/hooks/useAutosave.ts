import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor-store";
import { updateProject, type ProjectData } from "@/lib/projects";

const DEBOUNCE_MS = 1500;
const PERIODIC_MS = 5 * 60 * 1000; // 5 min

export function useAutosave(enabled: boolean) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerializedRef = useRef<string>("");

  // Watch content changes and schedule a debounced save
  useEffect(() => {
    if (!enabled) return;
    const unsub = useEditor.subscribe((s, prev) => {
      if (
        s.entities === prev.entities &&
        s.wires === prev.wires &&
        s.measurements === prev.measurements &&
        s.panel === prev.panel &&
        s.projectName === prev.projectName &&
        s.showLegends === prev.showLegends
      ) return;

      const st = useEditor.getState();
      if (!st.projectId) return;

      st.setSaveStatus("idle");
      // mark dirty
      useEditor.setState({ dirty: true });

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    });
    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [enabled]);

  // Periodic save every 5 min if dirty
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => {
      const st = useEditor.getState();
      if (st.projectId && st.dirty) void flush();
    }, PERIODIC_MS);
    return () => clearInterval(t);
  }, [enabled]);

  // Save on tab hide / unload
  useEffect(() => {
    if (!enabled) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        const st = useEditor.getState();
        if (st.projectId && st.dirty) void flush();
      }
    };
    window.addEventListener("visibilitychange", onVis);
    return () => window.removeEventListener("visibilitychange", onVis);
  }, [enabled]);

  async function flush() {
    const st = useEditor.getState();
    if (!st.projectId) return;
    const data: ProjectData = {
      panel: st.panel,
      entities: st.entities,
      wires: st.wires,
      measurements: st.measurements,
      showLegends: st.showLegends,
    };
    const serialized = JSON.stringify({ name: st.projectName, data });
    if (serialized === lastSerializedRef.current) {
      st.setSaveStatus("saved");
      return;
    }
    st.setSaveStatus("saving");
    try {
      await updateProject(st.projectId, { name: st.projectName, data });
      lastSerializedRef.current = serialized;
      st.setSaveStatus("saved");
    } catch (e) {
      st.setSaveStatus("error");
      toast.error("Erro ao salvar: " + (e as Error).message);
    }
  }

  return { flush };
}
