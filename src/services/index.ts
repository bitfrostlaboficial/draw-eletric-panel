/**
 * Camada centralizada de acesso a dados (Sprint 2 — fundação).
 *
 * Objetivo:
 *   - Evitar chamadas Supabase espalhadas pelos componentes.
 *   - Padronizar nomes (projects, components, storage, catalog).
 *   - Facilitar futura migração para outros providers / hospedagem.
 *
 * Esta etapa apenas reexporta os módulos existentes sob um namespace
 * único — sem alterar lógica. As migrações virão nos próximos passos.
 */

export * as projectsService from "@/lib/projects";
export * as userComponentsService from "@/lib/user-components";
export * as catalogService from "@/lib/catalog";

// Reexport do client Supabase para um único ponto de import nos services.
export { supabase } from "@/integrations/supabase/client";
