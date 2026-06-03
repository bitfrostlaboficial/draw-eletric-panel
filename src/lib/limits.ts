/**
 * Limites do plano gratuito (Sprint 2 — Free Forever).
 *
 * Objetivo: manter o projeto sustentável dentro do Free Tier do Supabase
 * sem perder funcionalidade. Administradores não possuem limites.
 */

import { supabase } from "@/integrations/supabase/client";

export const FREE_LIMITS = {
  /** Máx. de projetos salvos por usuário comum. */
  projects: 2,
  /** Máx. de componentes personalizados por usuário comum. */
  userComponents: 6,
  /** Largura máxima da imagem principal de um componente (px). */
  maxComponentImageWidth: 1024,
  /** Largura máxima das thumbnails (px). */
  maxThumbnailWidth: 128,
} as const;

export class FreeLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FreeLimitError";
  }
}

async function countRows(table: "projects" | "user_components", userId: string) {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function assertCanCreateProject(userId: string, isAdmin: boolean) {
  if (isAdmin) return;
  const n = await countRows("projects", userId);
  if (n >= FREE_LIMITS.projects) {
    throw new FreeLimitError(
      `Você atingiu o limite gratuito de ${FREE_LIMITS.projects} projetos. Exclua um projeto existente para criar outro.`,
    );
  }
}

export async function assertCanCreateUserComponent(userId: string, isAdmin: boolean) {
  if (isAdmin) return;
  const n = await countRows("user_components", userId);
  if (n >= FREE_LIMITS.userComponents) {
    throw new FreeLimitError(
      `Você atingiu o limite gratuito de ${FREE_LIMITS.userComponents} componentes personalizados.`,
    );
  }
}
