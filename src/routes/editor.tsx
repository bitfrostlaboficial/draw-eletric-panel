import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";
import { z } from "zod";
import { Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { Toolbar } from "@/components/editor/Toolbar";
import { ComponentLibrary } from "@/components/editor/ComponentLibrary";
import { Canvas } from "@/components/editor/Canvas";
import { PropertiesPanel } from "@/components/editor/PropertiesPanel";
import { ViewportControls } from "@/components/editor/ViewportControls";
import { useAuth } from "@/hooks/useAuth";
import { useAutosave } from "@/hooks/useAutosave";
import { useEditor } from "@/lib/editor-store";
import { getProject, updateProject } from "@/lib/projects";
import { generateAndUploadThumbnail } from "@/lib/thumbnails";
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
      // Gera a thumbnail primeiro
      const thumbnail_url = await generateAndUploadThumbnail(s.projectId);

      await updateProject(s.projectId, {
        name: s.projectName,
        data: { panel: s.panel, entities: s.entities, wires: s.wires, measurements: s.measurements, showLegends: s.showLegends },
        thumbnail_url: thumbnail_url || undefined
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
      <div className="flex-1 flex min-h-0 relative">
        <ComponentLibrary />
        <Canvas />
        <PropertiesPanel />
        
      </div>
      <footer className="shrink-0 border-t border-border bg-card/40 px-2 py-1 sm:px-4 sm:py-2 flex items-center justify-center transition-all">
        <AdSlot size={isMobile ? "mobile" : "leaderboard"} />
      </footer>

    </div>
  );
}

