import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { AdSlot } from "./AdSlot";

/**
 * AdGateModal — exibe um anúncio curto antes de liberar uma ação
 * (download de PDF, export, etc). Após a contagem regressiva, executa
 * `onComplete` ainda com o modal aberto, mostrando estado de "gerando…"
 * para que o usuário tenha feedback claro até o download começar.
 */
export function AdGateModal({
  open,
  seconds = 5,
  title = "Preparando seu download…",
  subtitle = "Obrigado por apoiar o projeto gratuito.",
  onComplete,
  onCancel,
}: {
  open: boolean;
  seconds?: number;
  title?: string;
  subtitle?: string;
  onComplete: () => Promise<void> | void;
  onCancel?: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [phase, setPhase] = useState<"countdown" | "working" | "done">("countdown");
  const [workLabel, setWorkLabel] = useState<string>("Iniciando…");
  const firedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setRemaining(seconds);
      setPhase("countdown");
      setWorkLabel("Iniciando…");
      firedRef.current = false;
      return;
    }
    if (phase !== "countdown") return;
    const t = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [open, seconds, phase]);

  useEffect(() => {
    if (!open || remaining > 0 || firedRef.current) return;
    firedRef.current = true;
    setPhase("working");
    (async () => {
      try {
        await onComplete();
        setPhase("done");
      } catch {
        // parent handles toast; just close visual state
        setPhase("done");
      }
    })();
  }, [open, remaining, onComplete]);

  if (!open) return null;

  const pct = phase === "countdown" ? ((seconds - remaining) / seconds) * 100 : 100;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl border border-border w-[min(92vw,640px)] p-6 relative">
        {onCancel && phase === "countdown" && (
          <button
            onClick={onCancel}
            className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary"
            aria-label="Cancelar"
          >
            <X className="size-4" />
          </button>
        )}
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>

        <div className="grid place-items-center my-4">
          <AdSlot size="rectangle" label="Anúncio patrocinado" />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1.5">
              {phase === "working" && <Loader2 className="size-3 animate-spin" />}
              {phase === "countdown"
                ? remaining > 0
                  ? `Liberando em ${remaining}s…`
                  : "Pronto!"
                : phase === "working"
                  ? workLabel
                  : "Download iniciado!"}
            </span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full bg-primary ${
                phase === "working" ? "animate-pulse" : "transition-[width] duration-1000 ease-linear"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-4">
          O VoltFlow é gratuito graças a anúncios discretos e doações.{" "}
          <a href="/donate" className="underline hover:text-foreground">
            Apoiar o projeto
          </a>
        </p>

        {/* expose label setter via window event for parent progress hooks */}
        <span
          ref={(node) => {
            if (!node) return;
            (node as unknown as { __set?: (l: string) => void }).__set = setWorkLabel;
          }}
          data-ad-gate-label
          className="hidden"
        />
      </div>
    </div>
  );
}
