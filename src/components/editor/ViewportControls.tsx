import { 
  ZoomIn, ZoomOut, Maximize2, Minimize2, 
  Focus, Expand, MoreVertical 
} from "lucide-react";
import { useEditor } from "@/lib/editor-store";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function ViewportControls() {
  const { 
    zoom, setZoom, 
    fullscreen, toggleFullscreen,
    viewportApi
  } = useEditor();

  const handleZoomIn = () => setZoom(Math.min(8, zoom + 0.1));
  const handleZoomOut = () => setZoom(Math.max(0.1, zoom - 0.1));
  const handleCenter = () => viewportApi?.centerOnProject();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
      {/* Zoom and Main Controls */}
      <div className="flex items-center gap-1 bg-card/80 backdrop-blur border border-border rounded-full p-1 shadow-lg">
        <button 
          onClick={handleZoomOut}
          className="size-8 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Diminuir zoom"
        >
          <ZoomOut className="size-4" />
        </button>
        
        <button 
          onClick={() => setZoom(1)}
          className="px-2 text-[11px] font-mono font-medium hover:text-primary transition-colors min-w-[44px] text-center"
          title="Resetar zoom (100%)"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button 
          onClick={handleZoomIn}
          className="size-8 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Aumentar zoom"
        >
          <ZoomIn className="size-4" />
        </button>

        <div className="h-4 w-px bg-border mx-1" />

        <button 
          onClick={handleCenter}
          className="size-8 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Centralizar Projeto"
        >
          <Focus className="size-4" />
        </button>

        <button 
          onClick={toggleFullscreen}
          className="size-8 grid place-items-center rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title={fullscreen ? "Sair da tela cheia" : "Tela cheia"}
        >
          {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>
    </div>
  );
}
