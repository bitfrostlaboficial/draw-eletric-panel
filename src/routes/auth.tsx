import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar · VoltFlow" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/editor" });
  }, [user, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Confira seu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo!");
        navigate({ to: "/editor" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao autenticar");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/editor",
    });
    if (result.error) {
      toast.error("Erro ao entrar com Google");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-xl shadow-lg p-6">
        <div className="mb-5 text-center">
          <div className="mx-auto size-10 bg-primary rounded-lg grid place-items-center mb-3">
            <div className="size-5 bg-primary-foreground rounded-sm rotate-45" />
          </div>
          <h1 className="text-lg font-bold">{mode === "signin" ? "Entrar" : "Criar conta"}</h1>
          <p className="text-xs text-muted-foreground mt-1">VoltFlow · Painéis 2D</p>
        </div>

        <button
          type="button"
          onClick={onGoogle}
          disabled={busy}
          className="w-full py-2 mb-3 border border-border rounded-md text-sm font-medium hover:bg-secondary flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <GoogleIcon /> Continuar com Google
        </button>

        <div className="flex items-center gap-2 my-3 text-[10px] text-muted-foreground uppercase tracking-wider">
          <div className="flex-1 h-px bg-border" /> ou e-mail <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <Field label="Nome" value={name} onChange={setName} />
          )}
          <Field label="E-mail" type="email" value={email} onChange={setEmail} required />
          <Field label="Senha" type="password" value={password} onChange={setPassword} required minLength={6} />

          <button
            disabled={busy}
            className="w-full py-2 bg-primary text-primary-foreground rounded-md font-medium text-sm hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>

        <div className="mt-4 text-center">
          <Link to="/" className="text-[11px] text-muted-foreground hover:text-foreground">← Voltar</Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required, minLength,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</label>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 bg-secondary border border-border rounded text-sm focus:ring-2 focus:ring-ring/30 outline-hidden"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}
