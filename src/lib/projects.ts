import { supabase } from "@/integrations/supabase/client";
import type { Entity, Wire, PanelStyle } from "./editor-store";

export type ProjectData = {
  panel: PanelStyle;
  entities: Entity[];
  wires: Wire[];
  showLegends?: boolean;
};

export type ProjectRow = {
  id: string;
  name: string;
  data: ProjectData;
  updated_at: string;
  created_at: string;
  thumbnail_url: string | null;
};

export async function listProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,data,updated_at,created_at,thumbnail_url")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ProjectRow[];
}

export async function getProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,name,data,updated_at,created_at,thumbnail_url")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as ProjectRow) ?? null;
}

export async function createProject(name: string, data: ProjectData): Promise<ProjectRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  const { data: row, error } = await supabase
    .from("projects")
    .insert({ user_id: user.id, name, data: data as never })
    .select("id,name,data,updated_at,created_at,thumbnail_url")
    .single();
  if (error) throw error;
  return row as unknown as ProjectRow;
}

export async function updateProject(
  id: string,
  patch: { name?: string; data?: ProjectData },
): Promise<void> {
  const payload: { name?: string; data?: ProjectData } = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.data !== undefined) payload.data = patch.data;
  const { error } = await supabase
    .from("projects")
    .update(payload as never)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}
