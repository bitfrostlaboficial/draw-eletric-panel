import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cable, Grid3x3, Layers, MousePointer2, Sparkles, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "VoltFlow · Monte quadros elétricos 2D arrastando e soltando" },
      {
        name: "description",
        content:
          "Plataforma SaaS para projetar quadros elétricos visualmente. Componentes reais de Siemens, Schneider, WEG, ABB e mais. Sem CAD complexo.",
      },
      { property: "og:title", content: "VoltFlow · Quadros elétricos 2D, sem CAD" },
      {
        property: "og:description",
        content:
          "Arraste, solte e cabeie componentes reais. O Canva dos quadros elétricos.",
      },
    ],
  }),
});

const BRANDS = ["Siemens", "Schneider", "WEG", "ABB", "Eaton", "Phoenix Contact", "Finder", "Clamper"];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto h-14 flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="size-7 bg-primary rounded-lg grid place-items-center shadow-sm">
              <div className="size-3.5 bg-primary-foreground rounded-sm rotate-45" />
            </div>
            <span className="font-bold tracking-tight">
              VoltFlow{" "}
              <span className="text-[10px] font-mono uppercase text-muted-foreground align-top">
                PRO
              </span>
            </span>
          </div>
          <div className="hidden md:flex gap-7 text-sm text-muted-foreground">
            <a href="#recursos" className="hover:text-foreground">Recursos</a>
            <a href="#biblioteca" className="hover:text-foreground">Biblioteca</a>
            <a href="#precos" className="hover:text-foreground">Preços</a>
          </div>
          <Link
            to="/editor"
            className="text-sm font-semibold bg-foreground text-background px-3.5 py-1.5 rounded-md hover:opacity-90"
          >
            Abrir editor
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 pt-20 pb-16 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            SaaS para Engenharia Elétrica
          </div>
          <h1 className="mt-6 text-5xl lg:text-6xl font-extrabold tracking-tighter leading-[1.02]">
            Monte quadros elétricos{" "}
            <span className="text-primary">arrastando e soltando.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-[52ch]">
            VoltFlow é o Canva dos quadros elétricos: arraste disjuntores, contatores e CLPs reais para
            o painel, conecte com cabos e exporte um diagrama profissional. Sem CAD, sem curva de
            aprendizado.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/editor"
              className="h-11 inline-flex items-center gap-2 px-5 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:opacity-90"
            >
              Criar quadro grátis <ArrowRight className="size-4" />
            </Link>
            <a
              href="#recursos"
              className="h-11 inline-flex items-center px-5 border border-border rounded-lg font-semibold hover:bg-secondary"
            >
              Ver recursos
            </a>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 pt-6 border-t border-border max-w-md">
            <Stat label="Marcas reais" value="+10" />
            <Stat label="Componentes" value="+30" />
            <Stat label="Plano grátis" value="Sempre" />
          </div>
        </div>

        <HeroPreview />
      </header>

      {/* Brands */}
      <section className="border-y border-border bg-secondary/40 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground text-center mb-5">
            Componentes de fabricantes reais
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {BRANDS.map((b) => (
              <span
                key={b}
                className="text-sm font-semibold text-muted-foreground/80 tracking-tight"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="max-w-7xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            Recursos
          </div>
          <h2 className="text-4xl font-bold tracking-tight">
            Tudo que você precisa para projetar painéis profissionais.
          </h2>
        </div>
        <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Feature
            icon={<MousePointer2 className="size-5" />}
            title="Arrastar e soltar"
            desc="Posicione componentes em segundos. Sem aprender CAD, sem manuais."
          />
          <Feature
            icon={<Grid3x3 className="size-5" />}
            title="Snap em trilho DIN"
            desc="Alinhamento automático em grid e trilhos para um layout impecável."
          />
          <Feature
            icon={<Cable className="size-5" />}
            title="Cabeamento visual"
            desc="Conecte componentes com cabos coloridos. Fase, neutro, terra à mão."
          />
          <Feature
            icon={<Layers className="size-5" />}
            title="Biblioteca real"
            desc="Disjuntores, contatores, CLPs, DPS e mais — de marcas que você usa."
          />
          <Feature
            icon={<Zap className="size-5" />}
            title="Histórico e duplicação"
            desc="Desfazer/refazer ilimitado, duplicação rápida, propriedades editáveis."
          />
          <Feature
            icon={<Sparkles className="size-5" />}
            title="Pronto para SaaS"
            desc="Multiusuário, projetos na nuvem e exportação PDF/PNG no roadmap."
          />
        </div>
      </section>

      {/* CTA */}
      <section id="precos" className="max-w-5xl mx-auto px-6 pb-24">
        <div className="rounded-2xl border border-border bg-card p-10 lg:p-14 text-center shadow-xs">
          <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            Comece agora
          </div>
          <h3 className="text-3xl lg:text-4xl font-bold tracking-tight max-w-2xl mx-auto">
            Seu primeiro quadro elétrico em menos de 2 minutos.
          </h3>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Plano grátis para sempre. Componentes premium e exportação avançada chegam em breve.
          </p>
          <Link
            to="/editor"
            className="mt-8 inline-flex items-center gap-2 h-11 px-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90"
          >
            Abrir o editor <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-5 bg-foreground rounded grid place-items-center">
              <div className="size-2 bg-background rounded-sm rotate-45" />
            </div>
            <span className="font-bold tracking-tight text-foreground">VoltFlow</span>
          </div>
          <span className="font-mono">© 2026 VoltFlow · Engineering Studio</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="text-lg font-bold mt-0.5">{value}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
      <div className="size-10 rounded-lg bg-primary/10 text-primary grid place-items-center mb-4">
        {icon}
      </div>
      <h3 className="font-bold text-lg tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 bg-primary/5 rounded-2xl rotate-1" />
      <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="h-9 border-b border-border bg-secondary/40 flex items-center gap-2 px-4">
          <div className="size-2.5 rounded-full bg-red-400" />
          <div className="size-2.5 rounded-full bg-amber-400" />
          <div className="size-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-[11px] font-mono text-muted-foreground">
            quadro-galpao-a1.vfp
          </span>
        </div>
        <div className="grid grid-cols-[120px_1fr] h-[400px] dot-grid">
          <div className="bg-card/80 border-r border-border p-3 space-y-2">
            {["Disjuntor 16A", "Contator", "CLP", "DPS", "Borne", "Relé"].map((n, i) => (
              <div
                key={n}
                className="text-[10px] py-1.5 px-2 bg-secondary rounded border border-border flex items-center gap-2"
              >
                <div className="size-3 bg-primary/70 rounded-sm" />
                <span className="truncate">{n}</span>
                {i === 0 && (
                  <span className="ml-auto text-[8px] font-mono text-primary">drag</span>
                )}
              </div>
            ))}
          </div>
          <div className="relative p-8">
            <div className="absolute inset-6 bg-panel border-4 border-slate-300 rounded shadow-inner p-6 flex flex-col gap-8">
              {/* DIN rail */}
              <div className="relative">
                <div className="h-2 bg-slate-300 rounded-sm" />
                <div className="absolute -top-3 left-2 flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-4 h-10 bg-card border border-slate-400 shadow-sm flex flex-col"
                    >
                      <div className="h-1 bg-primary" />
                      <div className="flex-1" />
                      <div className="h-1 bg-primary/40" />
                    </div>
                  ))}
                  <div className="w-7 h-10 bg-card border-2 border-primary shadow-md flex flex-col">
                    <div className="h-1 bg-primary" />
                    <div className="flex-1 grid place-items-center">
                      <span className="text-[7px] font-mono font-bold">DR</span>
                    </div>
                    <div className="h-1 bg-primary/40" />
                  </div>
                </div>
              </div>
              <div className="relative mt-6">
                <div className="h-2 bg-slate-300 rounded-sm" />
                <div className="absolute -top-4 left-2 w-32 h-12 bg-card border border-slate-400 shadow-sm rounded-xs p-1.5 flex flex-col">
                  <div className="h-0.5 w-full bg-primary mb-1" />
                  <span className="text-[8px] font-bold">SIMATIC S7</span>
                  <span className="text-[7px] text-muted-foreground">CPU 1214C</span>
                </div>
              </div>
              <svg
                className="absolute inset-0 pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M 25 18 C 25 50, 35 50, 35 70"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="0.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
