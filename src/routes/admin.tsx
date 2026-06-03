import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Upload, Search, Save, X, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES, BRANDS, type CatalogCategory, type ComponentConnectionPoint } from "@/lib/catalog";
import { signOut } from "@/hooks/useAuth";
import { ConnectionPointsEditor } from "@/components/admin/ConnectionPointsEditor";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · VoltFlow" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  name: string;
  brand: string;
  category: string;
  subtitle: string;
  width: number;
  height: number;
  accent: string | null;
  poles: number | null;
  current: string | null;
  voltage: string | null;
  capacity: string | null;
  power: string | null;
  description: string | null;
  tags: string[] | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  connection_points: ComponentConnectionPoint[] | null;
};

function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Partial<Row> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_components")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Row[];
    },
    enabled: !!user && isAdmin,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.brand.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.subtitle.toLowerCase().includes(q),
    );
  }, [query, rows]);

  if (loading) return <Center>Carregando...</Center>;
  if (!user) return null;
  if (!isAdmin)
    return (
      <Center>
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold">Acesso restrito</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Esta área é exclusiva para administradores. Peça a um admin para
            atribuir o papel à sua conta.
          </p>
          <div className="text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
            user_id: {user.id}
          </div>
          <Link to="/editor" className="inline-block mt-3 text-sm underline">Voltar ao editor</Link>
        </div>
      </Center>
    );

  const onDelete = async (id: string) => {
    if (!confirm("Remover este componente do catálogo oficial?")) return;
    const { error } = await supabase.from("catalog_components").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Componente removido");
    qc.invalidateQueries({ queryKey: ["admin-catalog"] });
    qc.invalidateQueries({ queryKey: ["catalog"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/editor" className="size-8 grid place-items-center rounded-md hover:bg-secondary">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold">Painel administrativo</h1>
            <p className="text-xs text-muted-foreground">Catálogo oficial de componentes</p>
          </div>
          <button
            onClick={() => setEditing({ category: "Proteção", width: 40, height: 80, sort_order: 1000, is_active: true })}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 flex items-center gap-1.5"
          >
            <Plus className="size-4" /> Novo componente
          </button>
          <button onClick={signOut} className="text-xs text-muted-foreground hover:text-foreground">Sair</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, marca, categoria..."
            className="w-full pl-8 pr-3 py-2 bg-card border border-border rounded-md text-sm"
          />
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-[10px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="text-left p-2 w-12"></th>
                <th className="text-left p-2">Modelo</th>
                <th className="text-left p-2">Marca</th>
                <th className="text-left p-2">Categoria</th>
                <th className="text-left p-2">Dim. (mm)</th>
                <th className="text-left p-2">Specs</th>
                <th className="text-right p-2 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-secondary/40">
                  <td className="p-2">
                    <div
                      className="size-9 rounded border border-border overflow-hidden grid place-items-center"
                      style={{
                        background: r.image_url
                          ? "repeating-conic-gradient(oklch(0.95 0 0) 0% 25%, oklch(1 0 0) 0% 50%) 50% / 6px 6px"
                          : undefined,
                      }}
                    >
                      {r.image_url ? (
                        <img src={r.image_url} className="w-full h-full object-contain" alt="" />
                      ) : (
                        <ImageOff className="size-3 text-muted-foreground" />
                      )}
                    </div>
                  </td>
                  <td className="p-2 font-medium">{r.name}<div className="text-[10px] text-muted-foreground">{r.subtitle}</div></td>
                  <td className="p-2">{r.brand}</td>
                  <td className="p-2"><span className="text-[10px] px-1.5 py-0.5 bg-secondary rounded">{r.category}</span></td>
                  <td className="p-2 font-mono text-[11px]">{r.width}×{r.height}</td>
                  <td className="p-2 text-[11px] text-muted-foreground">
                    {[r.current, r.voltage, r.power, r.capacity].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="p-2 text-right">
                    <button onClick={() => setEditing(r)} className="text-xs px-2 py-1 hover:bg-secondary rounded">Editar</button>
                    <button onClick={() => onDelete(r.id)} className="text-xs px-2 py-1 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 className="size-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Nenhum componente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {editing && (
        <ComponentDialog
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["admin-catalog"] });
            qc.invalidateQueries({ queryKey: ["catalog"] });
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ComponentDialog({
  initial, onClose, onSaved,
}: { initial: Partial<Row>; onClose: () => void; onSaved: () => void }) {
  const isNew = !initial.id;
  const [form, setForm] = useState<Partial<Row>>(initial);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (p: Partial<Row>) => setForm((f) => ({ ...f, ...p }));

  const onImage = async (file: File) => {
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${(form.id || crypto.randomUUID())}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("component-images")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("component-images").getPublicUrl(path);
      set({ image_url: data.publicUrl });
      toast.success("Imagem enviada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.brand || !form.category) {
      toast.error("Preencha modelo, marca e categoria");
      return;
    }
    setBusy(true);
    try {
      const id = form.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const payload = {
        id,
        name: form.name!,
        brand: form.brand!,
        category: form.category!,
        subtitle: form.subtitle ?? "",
        width: Number(form.width) || 40,
        height: Number(form.height) || 80,
        accent: form.accent ?? null,
        poles: form.poles ?? null,
        current: form.current ?? null,
        voltage: form.voltage ?? null,
        capacity: form.capacity ?? null,
        power: form.power ?? null,
        description: form.description ?? null,
        tags: form.tags ?? [],
        image_url: form.image_url ?? null,
        sort_order: form.sort_order ?? 1000,
        is_active: form.is_active ?? true,
        connection_points: form.connection_points ?? [],
      };
      const { error } = isNew
        ? await supabase.from("catalog_components").insert(payload)
        : await supabase.from("catalog_components").update(payload).eq("id", id);
      if (error) throw error;
      toast.success(isNew ? "Componente criado" : "Componente atualizado");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold">{isNew ? "Novo componente oficial" : `Editar: ${form.name}`}</h3>
            <p className="text-xs text-muted-foreground mt-1">Visível para todos os usuários.</p>
          </div>
          <button onClick={onClose} className="size-7 grid place-items-center rounded hover:bg-secondary">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <F label="Modelo *" value={form.name ?? ""} onChange={(v) => set({ name: v })} />
            <FSelect label="Marca *" value={form.brand ?? ""} onChange={(v) => set({ brand: v })}
              options={[...BRANDS, "Generic"]} />
          </div>
          <F label="Descrição curta" value={form.subtitle ?? ""} onChange={(v) => set({ subtitle: v })} />
          <div className="grid grid-cols-3 gap-2">
            <FSelect label="Categoria *" value={form.category ?? ""} onChange={(v) => set({ category: v as CatalogCategory })}
              options={CATEGORIES as unknown as string[]} />
            <NF label="Largura (mm)" value={form.width ?? 40} onChange={(v) => set({ width: v })} />
            <NF label="Altura (mm)" value={form.height ?? 80} onChange={(v) => set({ height: v })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <F label="Corrente" value={form.current ?? ""} onChange={(v) => set({ current: v })} />
            <F label="Tensão" value={form.voltage ?? ""} onChange={(v) => set({ voltage: v })} />
            <F label="Potência" value={form.power ?? ""} onChange={(v) => set({ power: v })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <F label="Capacidade" value={form.capacity ?? ""} onChange={(v) => set({ capacity: v })} />
            <NF label="Polos" value={form.poles ?? 1} onChange={(v) => set({ poles: v })} />
            <NF label="Ordem" value={form.sort_order ?? 1000} onChange={(v) => set({ sort_order: v })} />
          </div>
          <F label="Tags (separadas por vírgula)" value={(form.tags ?? []).join(", ")}
            onChange={(v) => set({ tags: v.split(",").map((s) => s.trim()).filter(Boolean) })} />
          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Descrição técnica</label>
            <textarea value={form.description ?? ""} onChange={(e) => set({ description: e.target.value })}
              rows={2} className="mt-1 w-full px-2 py-1.5 bg-card border border-border rounded text-sm" />
          </div>

          <div>
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Imagem oficial (PNG transparente recomendado)</label>
            <div className="mt-1 flex gap-2 items-start">
              <div
                className="size-24 border border-border rounded overflow-hidden grid place-items-center shrink-0"
                style={{ background: "repeating-conic-gradient(oklch(0.95 0 0) 0% 25%, oklch(1 0 0) 0% 50%) 50% / 8px 8px" }}
              >
                {form.image_url ? (
                  <img src={form.image_url} className="max-w-full max-h-full object-contain" alt="" />
                ) : (
                  <ImageOff className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <button onClick={() => fileRef.current?.click()} disabled={busy}
                  className="w-full py-1.5 border border-border rounded text-xs hover:bg-secondary flex items-center justify-center gap-1.5 disabled:opacity-50">
                  <Upload className="size-3" /> {form.image_url ? "Trocar imagem" : "Enviar imagem"}
                </button>
                {form.image_url && (
                  <button onClick={() => set({ image_url: null })}
                    className="w-full py-1 text-[11px] text-destructive border border-border rounded hover:bg-destructive/10">
                    Remover imagem
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/png,image/*" hidden
                  onChange={(e) => e.target.files?.[0] && onImage(e.target.files[0])} />
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex items-baseline justify-between mb-2">
              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                Bornes / pontos de conexão
              </label>
              <span className="text-[10px] text-muted-foreground">
                Coordenadas normalizadas — acompanham o resize automaticamente
              </span>
            </div>
            <ConnectionPointsEditor
              imageUrl={form.image_url}
              width={Number(form.width) || 40}
              height={Number(form.height) || 80}
              value={form.connection_points ?? []}
              onChange={(next) => set({ connection_points: next })}
            />
          </div>
        </div>
          </div>
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-secondary">Cancelar</button>
          <button onClick={save} disabled={busy}
            className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5">
            <Save className="size-3.5" /> {busy ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 bg-card border border-border rounded text-sm" />
    </div>
  );
}
function NF({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="px-2 py-1.5 bg-card border border-border rounded text-sm font-mono" />
    </div>
  );
}
function FSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1.5 bg-card border border-border rounded text-sm">
        <option value="">—</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Center({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen grid place-items-center p-4 bg-background">{children}</div>;
}
