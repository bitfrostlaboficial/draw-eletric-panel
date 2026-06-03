import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, FileText, LogOut } from "lucide-react";
import { useAuth, signOut } from "@/hooks/useAuth";
import {
  listProjects,
  createProject,
  deleteProject,
  type ProjectRow,
} from "@/lib/projects";
import { assertCanCreateProject, FREE_LIMITS } from "@/lib/limits";


export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Meus quadros · VoltFlow" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    listProjects()
      .then(setProjects)
      .catch((e) => toast.error("Erro: " + e.message));
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await assertCanCreateProject(user.id, isAdmin);
      const p = await createProject("Quadro sem título", {
        panel: {
          width: 600,
          height: 700,
          background: "#f1f5f9",
          texture: "smooth",
          hasDoor: false,
          doorColor: "#cbd5e1",
        },
        entities: [],
        wires: [],
        showLegends: false,
      });
      navigate({ to: "/editor", search: { id: p.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este quadro?")) return;
    try {
      await deleteProject(id);
      setProjects((ps) => ps?.filter((p) => p.id !== id) ?? null);
      toast.success("Quadro excluído");
    } catch (e) {
      toast.error("Erro: " + (e as Error).message);
    }
  };

  if (loading || !user) {
    return (
      <div className="h-screen grid place-items-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto h-14 flex items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-6 bg-primary rounded grid place-items-center">
              <div className="size-3 bg-primary-foreground rounded-sm rotate-45" />
            </div>
            <span className="font-bold tracking-tight">VoltFlow</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {isAdmin && (
              <Link to="/admin" className="text-primary hover:underline">
                Admin
              </Link>
            )}
            <span className="text-muted-foreground">{user.email}</span>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-md hover:bg-secondary"
              title="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meus quadros</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Seus projetos são salvos automaticamente na nuvem.
              {!isAdmin && projects && (
                <span className="ml-1 font-medium">
                  {projects.length}/{FREE_LIMITS.projects} no plano gratuito.
                </span>
              )}
            </p>
          </div>

          <button
            onClick={handleCreate}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="size-4" /> Novo quadro
          </button>
        </div>

        {projects === null ? (
          <div className="text-sm text-muted-foreground">Carregando projetos…</div>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center">
            <FileText className="size-10 text-muted-foreground mx-auto mb-3" />
            <h2 className="font-semibold">Nenhum quadro ainda</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-5">
              Crie seu primeiro projeto para começar.
            </p>
            <button
              onClick={handleCreate}
              disabled={busy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
            >
              <Plus className="size-4" /> Criar quadro
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <div
                key={p.id}
                className="group relative border border-border rounded-xl bg-card overflow-hidden hover:shadow-md transition-shadow"
              >
                <Link
                  to="/editor"
                  search={{ id: p.id }}
                  className="block aspect-video bg-secondary grid place-items-center"
                >
                  <FileText className="size-10 text-muted-foreground/40" />
                </Link>
                <div className="p-4 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to="/editor"
                      search={{ id: p.id }}
                      className="font-semibold truncate block hover:text-primary"
                    >
                      {p.name}
                    </Link>
                    <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                      {new Date(p.updated_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary opacity-0 group-hover:opacity-100 transition"
                    title="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
