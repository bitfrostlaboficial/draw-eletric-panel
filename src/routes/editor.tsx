import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { z } from "zod";
import { Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { Toolbar } from "@/components/editor/Toolbar";
import { ComponentLibrary } from "@/components/editor/ComponentLibrary";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { useAuth } from "@/hooks/useAuth";
import { useAutosave } from "@/hooks/useAutosave";
import { useEditor } from "@/lib/editor-store";
import { getProject, updateProject } from "@/lib/projects";
import { AdSlot } from "@/components/ads/AdSlot";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useBrowserFullscreen } from "@/hooks/useBrowserFullscreen";
import { useIsMobile } from "@/hooks/use-mobile";

const searchSchema = z.object({
  id: z.string().uuid().optional(),
});

export const Route = createFileRoute("/editor")({
  validateSearch: searchSchema,
  component: EditorPage,
  head: () => ({
    meta: [
      { title: "Editor de Quadros · VoltFlow" },
      {
        name: "description",
        content:
          "Monte quadros elétricos 2D arrastando componentes reais de Siemens, Schneider, WEG e mais.",
      },
    ],
  }),
});

function EditorPage() {
  const { user, loading } = useAuth();
  const { id } = Route.useSearch();
  const navigate = Route.useNavigate();
  const loadProject = useEditor((s) => s.loadProject);
  const projectId = useEditor((s) => s.projectId);
  const fullscreen = useEditor((s) => s.fullscreen);
  const setFullscreen = useEditor((s) => s.setFullscreen);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
    else if (!loading && user && !id) navigate({ to: "/dashboard" });
  }, [loading, user, id, navigate]);

  // Load project from URL
  useEffect(() => {
    if (!user || !id || projectId === id) return;
    (async () => {
      try {
        const p = await getProject(id);
        if (!p) {
          toast.error("Projeto não encontrado");
          navigate({ to: "/dashboard" });
          return;
        }
        loadProject(p);
      } catch (e) {
        toast.error("Erro ao carregar: " + (e as Error).message);
      }
    })();
  }, [id, user, projectId, loadProject, navigate]);

  useAutosave(!!user && !!id);

  const handleSave = useCallback(async () => {
    const s = useEditor.getState();
    if (!s.projectId) return;
    s.setSaveStatus("saving");
    try {
      await updateProject(s.projectId, {
        name: s.projectName,
        data: { panel: s.panel, entities: s.entities, wires: s.wires, showLegends: s.showLegends },
      });
      s.setSaveStatus("saved");
      toast.success("Salvo");
    } catch (e) {
      s.setSaveStatus("error");
      toast.error("Erro: " + (e as Error).message);
    }
  }, []);

  useEditorShortcuts({ onSave: handleSave });
  useBrowserFullscreen();

  // Mobile: recolher painéis e minimapa automaticamente
  const isMobile = useIsMobile();
  useEffect(() => {
    const s = useEditor.getState();
    if (isMobile) {
      s.setLeftCollapsed(true);
      s.setRightCollapsed(true);
      s.setMinimapCollapsed(true);
    }
  }, [isMobile]);

  // Reset fullscreen when leaving the editor
  useEffect(() => () => {
    setFullscreen(false);
  }, [setFullscreen]);

  if (loading || !user) {
    return (
      <div className="h-screen grid place-items-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[60] w-screen h-screen flex flex-col bg-background overflow-hidden"
          : "h-screen w-full flex flex-col bg-background overflow-hidden"
      }
    >
      <Toolbar />
      <div className="flex-1 flex min-h-0">
        <ComponentLibrary />
        <Canvas />
        <PropertiesPanel />
      </div>
      <footer className="shrink-0 border-t border-border bg-card/40 px-4 py-2 flex items-center justify-center">
        <AdSlot size="leaderboard" />
      </footer>

      {fullscreen && (
        <>
          <button
            onClick={() => setFullscreen(false)}
            title="Sair da tela cheia (F11)"
            className="fixed top-3 right-3 z-50 size-9 grid place-items-center rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground"
          >
            <Minimize2 className="size-4" />
          </button>
          <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur border border-border text-xs text-muted-foreground shadow-sm pointer-events-none">
            Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[10px]">F11</kbd> para sair do modo tela cheia
          </div>
        </>
      )}
    </div>
  );
}

