import {
  Cable, Grid3x3, Magnet, MousePointer2, Redo2, Undo2,
  Trash2, Save, Type, Tag, Check, Loader2, AlertCircle,
  FileDown, Heart, PanelLeft, PanelRight, Ruler, Eye,
  MoreHorizontal, MoreVertical, Settings2
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor-store";
import { updateProject } from "@/lib/projects";
import { generateAndUploadThumbnail } from "@/lib/thumbnails";

import { AdGateModal } from "@/components/ads/AdGateModal";
import { exportCanvasToPdf } from "@/lib/export-pdf";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function Toolbar() {
  const [pdfGateOpen, setPdfGateOpen] = useState(false);
  const {
    projectId, projectName, setProjectName,
    showGrid, toggleGrid,
    snap, toggleSnap,
    wireMode, toggleWireMode,
    showLegends, toggleLegends,
    undo, redo, past, future,
    entities, wires, panel, reset, addText,
    saveStatus, setSaveStatus,
    toggleLeftPanel, toggleRightPanel,
    leftCollapsed, rightCollapsed,
    showMeasures, toggleMeasures,
    measureTool, setMeasureTool,
    measurements,
    removeSelected,
  } = useEditor();


  const handleSave = async () => {
    if (!projectId) {
      toast.error("Abra um projeto a partir do painel para salvar");
      return;
    }
    console.log("SAVE_PROJECT_START", { projectId, projectName });
    setSaveStatus("saving");
    try {
      // Gera a thumbnail primeiro
      const thumbnail_url = await generateAndUploadThumbnail(projectId);

      await updateProject(projectId, {
        name: projectName,
        data: { panel, entities, wires, showLegends, measurements },
        thumbnail_url: thumbnail_url || undefined
      });

      console.log("PROJECT_UPDATED_WITH_THUMBNAIL", { 
        projectId, 
        thumbnail_url,
        entitiesCount: entities.length
      });

      setSaveStatus("saved");
      toast.success("Salvo");
    } catch (e) {
      setSaveStatus("error");
      toast.error("Erro: " + (e as Error).message);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-1 sm:px-2 md:px-4 shrink-0 overflow-x-auto no-scrollbar scroll-smooth transition-all duration-300">
      <div className="flex items-center gap-0.5 sm:gap-2 md:gap-4 min-w-0">
        <Link to="/dashboard" className="text-xs font-mono text-muted-foreground hover:text-foreground shrink-0 p-1 flex items-center">
          ← <span className="hidden md:inline ml-1">Projetos</span>
        </Link>
        <div className="h-5 w-px bg-border shrink-0 hidden md:block" />
        <div className="flex flex-col leading-tight min-w-0 hidden xs:flex">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground hidden lg:block">Projeto</span>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            className="text-xs sm:text-sm font-bold bg-transparent outline-none truncate w-16 sm:w-28 md:w-40 lg:w-56" />
        </div>
        <div className="h-6 w-px bg-border shrink-0 hidden md:block" />

        <div className="flex items-center gap-px sm:gap-1">
          <ToolBtn label="Selecionar" active={!wireMode && !measureTool} onClick={() => { if (wireMode) toggleWireMode(); setMeasureTool(null); toggleMeasures(false); }}>
            <MousePointer2 className="size-4" />
          </ToolBtn>
          <ToolBtn label="Componentes" active={!leftCollapsed} onClick={toggleLeftPanel} className="flex lg:hidden">
            <PanelLeft className="size-4" />
          </ToolBtn>
          <ToolBtn label="Cabeamento" active={wireMode} onClick={() => { toggleWireMode(); setMeasureTool(null); toggleMeasures(false); }}>
            <Cable className="size-4" />
          </ToolBtn>
          <ToolBtn label="Medidas" active={!!measureTool} onClick={() => { if (wireMode) toggleWireMode(); setMeasureTool(measureTool ? null : "free"); }}>
            <Ruler className="size-4" />
          </ToolBtn>

          <ToolBtn label="Texto" 
            onClick={() => addText(panel.width / 2 - 70, panel.height / 2 - 16)}>
            <Type className="size-4" />
          </ToolBtn>
        </div>

        <div className="h-6 w-px bg-border shrink-0 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-0.5 md:gap-1">
          <ToolBtn label="Desfazer" disabled={past.length === 0} onClick={undo}><Undo2 className="size-4" /></ToolBtn>
          <ToolBtn label="Refazer" disabled={future.length === 0} onClick={redo}><Redo2 className="size-4" /></ToolBtn>
        </div>

        <div className="hidden lg:flex items-center gap-0.5 md:gap-1 transition-all duration-300">
          <div className="h-6 w-px bg-border mx-1 md:mx-2" />
          <ToolBtn label="Grid (G)" active={showGrid} onClick={toggleGrid}><Grid3x3 className="size-4" /></ToolBtn>
          <ToolBtn label="Snap" active={snap} onClick={toggleSnap}><Magnet className="size-4" /></ToolBtn>
          <ToolBtn label="Exibir Medidas" active={showMeasures} onClick={() => toggleMeasures()}><Eye className="size-4" /></ToolBtn>
          <ToolBtn label="Legendas" active={showLegends} onClick={toggleLegends}><Tag className="size-4" /></ToolBtn>
        </div>

        <div className="hidden xl:flex items-center gap-0.5 md:gap-1 transition-all duration-300">
          <div className="h-6 w-px bg-border mx-1 md:mx-2" />
          <ToolBtn label="Biblioteca" active={!leftCollapsed} onClick={toggleLeftPanel}><PanelLeft className="size-4" /></ToolBtn>
          <ToolBtn label="Propriedades" active={!rightCollapsed} onClick={toggleRightPanel}><PanelRight className="size-4" /></ToolBtn>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-2 md:gap-3 shrink-0 ml-1">
        <div className="hidden lg:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
          <span>{entities.length} elem.</span>
        </div>
        
        <SaveIndicator status={saveStatus} />

        <div className="h-6 w-px bg-border shrink-0 hidden md:block" />

        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={handleSave}
            disabled={!projectId || saveStatus === "saving"}
            className="h-9 sm:h-10 px-1.5 sm:px-3 md:px-4 bg-primary text-primary-foreground text-[10px] sm:text-xs md:text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition flex items-center gap-1 sm:gap-2 disabled:opacity-50 shrink-0"
          >
            <Save className="size-3.5 sm:size-4" /> <span className="hidden xs:inline">Salvar</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setPdfGateOpen(true)}
              disabled={entities.length === 0}
              className="h-10 px-3 flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border border-transparent hover:border-border"
              title="Exportar PDF"
            >
              <FileDown className="size-4" />
              <span className="hidden lg:inline">PDF</span>
            </button>

            <Link 
              to="/donate"
              className="h-10 px-3 flex items-center gap-2 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
              title="Apoiar Projeto"
            >
              <Heart className="size-4 fill-current" />
              <span className="hidden lg:inline">Apoiar</span>
            </Link>
          </div>


          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Mais ferramentas">
                <MoreVertical className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 max-h-[80vh] overflow-y-auto">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPdfGateOpen(true)} disabled={entities.length === 0} className="flex items-center gap-2 md:hidden">
                <FileDown className="size-4" /> Exportar PDF
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Exibição e Painéis</DropdownMenuLabel>
              <DropdownMenuItem onClick={toggleLeftPanel} className="flex xl:hidden items-center gap-2">
                <PanelLeft className="size-4" /> {leftCollapsed ? "Mostrar" : "Ocultar"} Biblioteca
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleRightPanel} className="flex items-center gap-2 xl:hidden">
                <PanelRight className="size-4" /> {rightCollapsed ? "Mostrar" : "Ocultar"} Propriedades
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={toggleGrid} className="flex items-center gap-2 lg:hidden">
                <Grid3x3 className="size-4" /> {showGrid ? "Ocultar" : "Mostrar"} Grid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleSnap} className="flex items-center gap-2 lg:hidden">
                <Magnet className="size-4" /> {snap ? "Desativar" : "Ativar"} Snap
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleMeasures()} className="flex items-center gap-2 lg:hidden">
                <Eye className="size-4" /> {showMeasures ? "Ocultar" : "Mostrar"} Medidas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleLegends} className="flex items-center gap-2 lg:hidden">
                <Tag className="size-4" /> {showLegends ? "Ocultar" : "Mostrar"} Legendas
              </DropdownMenuItem>

              <DropdownMenuItem onClick={undo} disabled={past.length === 0} className="flex items-center gap-2 md:hidden">
                <Undo2 className="size-4" /> Desfazer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={redo} disabled={future.length === 0} className="flex items-center gap-2 md:hidden">
                <Redo2 className="size-4" /> Refazer
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Ferramentas</DropdownMenuLabel>
              
              <DropdownMenuItem className="flex items-center gap-2">
                <Settings2 className="size-4" /> Configurações
              </DropdownMenuItem>

              <DropdownMenuItem asChild className="md:hidden">
                <Link to="/donate" className="flex items-center gap-2 text-rose-600">
                  <Heart className="size-4" /> Apoiar Projeto (Doações)
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Avançado</DropdownMenuLabel>
              <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground">
                Ferramentas Avançadas
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 text-muted-foreground">
                Recursos Administrativos
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => { if (entities.length && confirm("Limpar todo o quadro?")) reset(); }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="size-4" /> Limpar Quadro
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AdGateModal
        open={pdfGateOpen}
        seconds={5}
        title="Preparando seu PDF…"
        subtitle="Um anúncio rápido mantém o VoltFlow gratuito para todos."
        onCancel={() => setPdfGateOpen(false)}
        onComplete={async () => {
          const toastId = toast.loading("Gerando PDF…");
          try {
            await exportCanvasToPdf(projectName, (label) => {
              toast.loading(label, { id: toastId });
            });
            toast.success("PDF gerado", { id: toastId });
          } catch (e) {
            console.error("[pdf]", e);
            toast.error("Erro ao gerar PDF: " + (e as Error).message, { id: toastId });
          } finally {
            setPdfGateOpen(false);
          }
        }}
      />
    </header>
  );
}

function ToolBtn({
  children, label, active, disabled, onClick, className
}: {
  children: React.ReactNode; label: string; active?: boolean; disabled?: boolean; onClick?: () => void; className?: string;
}) {
  return (
    <button title={label} aria-label={label} disabled={disabled} onClick={onClick}
      className={`p-1 sm:p-2.5 md:p-2 rounded-md transition-colors min-w-[32px] min-h-[32px] sm:min-w-[44px] sm:min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""} ${className || ""}`}>
      {children}
    </button>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  return (
    <span className="text-[10px] sm:text-[11px] font-mono hidden md:inline-flex items-center justify-start gap-1 sm:gap-1.5 min-w-0 md:min-w-[70px]">
      {status === "saving" && (
        <><Loader2 className="size-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Salvando</span></>
      )}
      {status === "saved" && (
        <><Check className="size-3 text-emerald-600" /><span className="text-emerald-600">Salvo</span></>
      )}
      {status === "error" && (
        <><AlertCircle className="size-3 text-destructive" /><span className="text-destructive">Erro</span></>
      )}
    </span>
  );
}
