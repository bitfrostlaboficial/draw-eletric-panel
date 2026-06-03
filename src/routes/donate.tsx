import { createFileRoute, Link } from "@tanstack/react-router";
import { Coffee, Heart, Server, Sparkles, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/donate")({
  component: DonatePage,
  head: () => ({
    meta: [
      { title: "Apoie o VoltFlow · Forever free for everyone" },
      {
        name: "description",
        content:
          "O VoltFlow é e sempre será gratuito. Apoie o projeto com uma doação e ajude a manter a ferramenta acessível a todos.",
      },
      { property: "og:title", content: "Apoie o VoltFlow" },
      {
        property: "og:description",
        content: "Forever free for everyone. Mantenha o projeto vivo.",
      },
    ],
  }),
});

const PIX_KEY = "doe@voltflow.app"; // substituível pelo usuário
const PAYPAL_URL = "https://paypal.me/voltflow";
const BMC_URL = "https://buymeacoffee.com/voltflow";

function DonatePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold tracking-tight">VoltFlow</Link>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar ao app
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero */}
        <header className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-mono text-muted-foreground mb-5">
            <Heart className="size-3.5 text-rose-500" /> Forever free for everyone
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Ajude a manter o VoltFlow gratuito.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Você não precisa pagar nada para usar a plataforma. Mas se o VoltFlow te
            ajudou em um projeto, considere apoiar com qualquer valor. Cada doação
            paga servidores, novos componentes e mais funcionalidades — para todos.
          </p>
        </header>

        {/* Donation methods */}
        <section className="grid sm:grid-cols-3 gap-4 mb-16">
          <DonateCard
            icon={<Zap className="size-5" />}
            title="PIX"
            sub="Brasil · instantâneo"
            action={
              <div className="space-y-2">
                <code className="block text-xs bg-secondary rounded px-2 py-1.5 break-all">
                  {PIX_KEY}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(PIX_KEY)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Copiar chave
                </button>
              </div>
            }
          />
          <DonateCard
            icon={<Heart className="size-5" />}
            title="PayPal"
            sub="Internacional"
            action={
              <a
                href={PAYPAL_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full justify-center px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:opacity-90"
              >
                Doar via PayPal
              </a>
            }
          />
          <DonateCard
            icon={<Coffee className="size-5" />}
            title="Buy Me a Coffee"
            sub="Cafézinho mensal"
            action={
              <a
                href={BMC_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full justify-center px-3 py-2 bg-amber-500 text-white rounded-md text-sm font-semibold hover:opacity-90"
              >
                ☕ Apoiar
              </a>
            }
          />
        </section>

        {/* Costs */}
        <Section title="Para onde vai a sua doação" icon={<Server className="size-5" />}>
          <ul className="grid sm:grid-cols-2 gap-3 text-sm">
            <Bullet>Infraestrutura (banco, storage, CDN)</Bullet>
            <Bullet>Catálogo oficial de componentes (imagens e dados)</Bullet>
            <Bullet>Domínio, e-mail e ferramentas de suporte</Bullet>
            <Bullet>Tempo de desenvolvimento de novas features</Bullet>
          </ul>
        </Section>

        {/* Roadmap */}
        <Section title="Roadmap" icon={<Sparkles className="size-5" />}>
          <ol className="space-y-3 text-sm">
            <Roadmap status="done" label="Editor 2D drag-and-drop" />
            <Roadmap status="done" label="Catálogo oficial + painel admin" />
            <Roadmap status="done" label="Autosave em nuvem" />
            <Roadmap status="doing" label="Exportação PDF + thumbnails" />
            <Roadmap status="next" label="Componentes personalizados do usuário" />
            <Roadmap status="next" label="Colaboração em tempo real" />
            <Roadmap status="next" label="Lista de materiais + cotação automática" />
          </ol>
        </Section>

        {/* Community */}
        <Section title="Impacto" icon={<Users className="size-5" />}>
          <p className="text-sm text-muted-foreground">
            Eletricistas, integradores, estudantes e técnicos de manutenção usam o
            VoltFlow todos os dias para documentar quadros sem precisar de CAD pago.
            Sua contribuição mantém isso acessível para quem está começando.
          </p>
        </Section>

        <footer className="mt-16 text-center text-xs text-muted-foreground">
          Obrigado por apoiar. ❤️
        </footer>
      </main>
    </div>
  );
}

function DonateCard({
  icon, title, sub, action,
}: { icon: React.ReactNode; title: string; sub: string; action: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-1 text-primary">{icon}<span className="font-semibold text-foreground">{title}</span></div>
      <p className="text-xs text-muted-foreground mb-4">{sub}</p>
      <div className="mt-auto">{action}</div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
        <span className="text-primary">{icon}</span> {title}
      </h2>
      {children}
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 items-start">
      <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}

function Roadmap({ status, label }: { status: "done" | "doing" | "next"; label: string }) {
  const cfg = {
    done: { dot: "bg-emerald-500", text: "Concluído" },
    doing: { dot: "bg-amber-500 animate-pulse", text: "Em progresso" },
    next: { dot: "bg-muted-foreground/40", text: "Em breve" },
  }[status];
  return (
    <li className="flex items-center gap-3">
      <span className={`size-2.5 rounded-full ${cfg.dot}`} />
      <span className="text-sm">{label}</span>
      <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {cfg.text}
      </span>
    </li>
  );
}
