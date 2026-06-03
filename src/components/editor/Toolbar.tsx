import {
  Cable, Grid3x3, Magnet, MousePointer2, Redo2, Undo2,
  ZoomIn, ZoomOut, Trash2, Save, Type, Tag, Check, Loader2, AlertCircle,
  FileDown, Heart, Maximize2, PanelLeft, PanelRight, Ruler,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useEditor } from "@/lib/editor-store";
import { updateProject } from "@/lib/projects";
import { AdGateModal } from "@/components/ads/AdGateModal";
import { exportCanvasToPdf } from "@/lib/export-pdf";

export function Toolbar() {
  const [pdfGateOpen, setPdfGateOpen] = useState(false);
  const {
    projectId, projectName, setProjectName,
    zoom, setZoom,
    showGrid, toggleGrid,
    snap, toggleSnap,
    wireMode, toggleWireMode,
    showLegends, toggleLegends,
    undo, redo, past, future,
    entities, wires, panel, reset, addText,
    saveStatus, setSaveStatus,
    toggleLeftPanel, toggleRightPanel, toggleFullscreen,
    leftCollapsed, rightCollapsed,
    showMeasures, toggleMeasures,
  } = useEditor();

  const handleSave = async () => {
    if (!projectId) {
      toast.error("Abra um projeto a partir do painel para salvar");
      return;
    }
    setSaveStatus("saving");
    try {
      await updateProject(projectId, {
        name: projectName,
        data: { panel, entities, wires, showLegends },
      });
      setSaveStatus("saved");
      toast.success("Salvo");
    } catch (e) {
      setSaveStatus("error");
      toast.error("Erro: " + (e as Error).message);
    }
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4 min-w-0">
        <Link to="/dashboard" className="text-xs font-mono text-muted-foreground hover:text-foreground">
          ← Projetos
        </Link>
        <div className="h-5 w-px bg-border" />
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Projeto</span>
          <input value={projectName} onChange={(e) => setProjectName(e.target.value)}
            className="text-sm font-bold bg-transparent outline-hidden truncate w-56" />
        </div>
        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-0.5">
          <ToolBtn label="Selecionar" active={!wireMode} onClick={() => wireMode && toggleWireMode()}>
            <MousePointer2 className="size-4" />
          </ToolBtn>
          <ToolBtn label="Cabeamento" active={wireMode} onClick={toggleWireMode}>
            <Cable className="size-4" />
          </ToolBtn>
          <ToolBtn label="Adicionar texto"
            onClick={() => addText(panel.width / 2 - 70, panel.height / 2 - 16)}>
            <Type className="size-4" />
          </ToolBtn>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-0.5">
          <ToolBtn label="Desfazer" disabled={past.length === 0} onClick={undo}><Undo2 className="size-4" /></ToolBtn>
          <ToolBtn label="Refazer" disabled={future.length === 0} onClick={redo}><Redo2 className="size-4" /></ToolBtn>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-0.5">
          <ToolBtn label="Grid (G)" active={showGrid} onClick={toggleGrid}><Grid3x3 className="size-4" /></ToolBtn>
          <ToolBtn label="Snap" active={snap} onClick={toggleSnap}><Magnet className="size-4" /></ToolBtn>
          <ToolBtn label="Legendas técnicas" active={showLegends} onClick={toggleLegends}><Tag className="size-4" /></ToolBtn>
          <ToolBtn label="Exibir medidas" active={showMeasures} onClick={toggleMeasures}><Ruler className="size-4" /></ToolBtn>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-0.5">
          <ToolBtn label="Biblioteca ( [ )" active={!leftCollapsed} onClick={toggleLeftPanel}><PanelLeft className="size-4" /></ToolBtn>
          <ToolBtn label="Propriedades ( ] )" active={!rightCollapsed} onClick={toggleRightPanel}><PanelRight className="size-4" /></ToolBtn>
          <ToolBtn label="Tela cheia (F)" onClick={toggleFullscreen}><Maximize2 className="size-4" /></ToolBtn>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Botão "Centralizar" foi movido para o canto inferior direito do Canvas */}
        <div className="flex items-center gap-1 bg-secondary rounded-full px-1 py-0.5">
          <button onClick={() => setZoom(zoom - 0.1)} className="size-7 grid place-items-center rounded-full hover:bg-card" aria-label="Diminuir zoom">
            <ZoomOut className="size-3.5" />
          </button>
          <span className="text-xs font-mono font-medium min-w-[44px] text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.1)} className="size-7 grid place-items-center rounded-full hover:bg-card" aria-label="Aumentar zoom">
            <ZoomIn className="size-3.5" />
          </button>
        </div>
        <div className="h-6 w-px bg-border" />
        <span className="text-[10px] font-mono text-muted-foreground">{entities.length} elem.</span>
        <button onClick={() => { if (entities.length && confirm("Limpar todo o quadro?")) reset(); }}
          className="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary" title="Limpar quadro">
          <Trash2 className="size-4" />
        </button>
        <SaveIndicator status={saveStatus} />
        <Link
          to="/donate"
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md"
          title="Apoiar o projeto"
        >
          <Heart className="size-3.5" /> Apoiar
        </Link>
        <button
          onClick={() => setPdfGateOpen(true)}
          disabled={entities.length === 0}
          className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 disabled:opacity-40"
          title="Exportar PDF"
        >
          <FileDown className="size-3.5" /> Exportar PDF
        </button>
        <button
          onClick={handleSave}
          disabled={!projectId || saveStatus === "saving"}
          className="px-4 py-1.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-sm hover:opacity-90 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="size-3.5" /> Salvar
        </button>
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
  children, label, active, disabled, onClick,
}: {
  children: React.ReactNode; label: string; active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button title={label} aria-label={label} disabled={disabled} onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}>
      {children}
    </button>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  // Largura fixa para evitar deslocamento dos botões da toolbar
  return (
    <span className="text-[11px] font-mono w-[78px] inline-flex items-center justify-start gap-1.5">
      {status === "saving" && (
        <><Loader2 className="size-3 animate-spin text-muted-foreground" /><span className="text-muted-foreground">Salvando…</span></>
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
