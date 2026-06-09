import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Maximize, 
  Monitor, 
  Square, 
  MousePointer2, 
  Loader2, 
  FileDown 
} from "lucide-react";
import { useEditor } from "@/lib/editor-store";
import { exportCanvasToPdf, type ExportScope } from "@/lib/export-pdf";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [scope, setScope] = useState<ExportScope>("content");
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const { projectName } = useEditor();

  const options: { id: ExportScope; label: string; description: string; icon: any }[] = [
    {
      id: "content",
      label: "Área Preenchida",
      description: "Exporta apenas a região que contém elementos (recomendado).",
      icon: Maximize,
    },
    {
      id: "viewport",
      label: "Área Visível",
      description: "Captura exatamente o que você está vendo na tela agora.",
      icon: Monitor,
    },
    {
      id: "panel",
      label: "Quadro Elétrico",
      description: "Exporta apenas a área delimitada pelo quadro elétrico principal.",
      icon: Square,
    },
    {
      id: "manual",
      label: "Seleção Manual",
      description: "Em breve: defina manualmente a área de recorte.",
      icon: MousePointer2,
    },
  ];

  const handleExport = async () => {
    if (scope === "manual") {
      toast.info("A seleção manual será implementada em breve.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Preparando PDF...");

    try {
      await exportCanvasToPdf(projectName, (label) => {
        toast.loading(label, { id: toastId });
      }, { scope, scale });
      
      toast.success("PDF gerado com sucesso!", { id: toastId });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF: " + (error as Error).message, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="size-5 text-primary" />
            Exportar para PDF
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt) => (
              <button
                key={opt.id}
                disabled={opt.id === "manual"}
                onClick={() => setScope(opt.id)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                  scope === opt.id 
                    ? "bg-primary/5 border-primary ring-1 ring-primary" 
                    : "hover:bg-secondary border-border opacity-70 hover:opacity-100",
                  opt.id === "manual" && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "size-8 rounded-md flex items-center justify-center shrink-0",
                  scope === opt.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                )}>
                  <opt.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{opt.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Escala / Qualidade
            </label>
            <div className="flex gap-2">
              {[
                { v: 0.5, l: "1:2 (Leve)" },
                { v: 1, l: "1:1 (Normal)" },
                { v: 2, l: "2x (Alta Def.)" },
              ].map((s) => (
                <button
                  key={s.v}
                  onClick={() => setScale(s.v)}
                  className={cn(
                    "flex-1 py-2 text-xs font-medium border rounded-md transition-all",
                    scale === s.v ? "bg-foreground text-background border-foreground" : "hover:bg-secondary border-border"
                  )}
                >
                  {s.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <button
            disabled={isExporting}
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-md"
          >
            Cancelar
          </button>
          <button
            disabled={isExporting}
            onClick={handleExport}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileDown className="size-4" />
            )}
            Gerar PDF
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
