# VoltFlow — Inventário de Dados (Sprint 2, Passo 1+2)

> Mapa do estado atual de persistência. Base para os próximos passos da
> migração total para Supabase. **Nada nesta etapa altera lógica.**

## 1. Entidades do domínio

| Entidade            | Onde vive hoje                                     | Status Supabase |
| ------------------- | -------------------------------------------------- | --------------- |
| `projects`          | tabela `public.projects` (jsonb `data`)            | ✅ existe        |
| `catalog_components`| tabela `public.catalog_components`                 | ✅ existe        |
| `user_components`   | tabela `public.user_components`                    | ✅ existe        |
| `connection_points` | coluna `jsonb` em `catalog_components` e `user_components` | ✅ embutida |
| `wires`             | embutidos em `projects.data.wires`                 | ⚠️ jsonb, sem tabela própria |
| `texts`             | embutidos em `projects.data.entities` (kind=text)  | ⚠️ jsonb        |
| `shapes`            | embutidos em `projects.data.entities` (kind=shape) | ⚠️ jsonb        |
| `images`            | embutidos em `projects.data.entities` (kind=image) | ⚠️ jsonb        |
| `user_preferences`  | `localStorage` (`voltflow:*`)                      | ❌ não migrado   |
| `user_roles`        | tabela `public.user_roles`                         | ✅ existe        |
| `profiles`          | tabela `public.profiles`                           | ✅ existe        |

## 2. Storage

| Bucket              | Conteúdo                                  | Status |
| ------------------- | ----------------------------------------- | ------ |
| `component-images`  | imagens do catálogo oficial               | ✅ público |
| `user-components`   | imagens enviadas pelos usuários           | ✅ público |
| `project-thumbnails`| pré-visualização de quadros               | 🔜 próximo passo |

## 3. Relacionamentos ausentes / a planejar

- `projects.user_id → auth.users.id` (lógico, sem FK física).
- `user_components.user_id → auth.users.id` (lógico, sem FK).
- `projects.thumbnail_url` aponta para Storage manualmente.
- Não há tabelas separadas para `wires`, `texts`, `shapes`, `images` —
  ficam todas dentro de `projects.data` (jsonb). Estratégia atual é
  intencional (snapshot autoexplicativo); migração para tabelas próprias
  só será considerada se passarmos a precisar de consultas relacionais
  (ex.: BOM, busca por componente em todos os projetos).

## 4. Camada de acesso (services)

A partir desta etapa, todo acesso a dados deve usar:

```ts
import { projectsService, userComponentsService, catalogService } from "@/services";
```

Componentes podem continuar importando os módulos diretos por compat
(`@/lib/projects`, `@/lib/user-components`, `@/lib/catalog`), mas novos
trechos devem preferir o namespace `services/`.

## 5. Próximos passos do Sprint 2

1. Criar bucket `project-thumbnails`.
2. Geração automática de thumbnail no autosave.
3. Migrar `user_preferences` (`voltflow:*` localStorage) para tabela própria.
4. Avaliar tabela dedicada para `wires` caso surjam casos de uso relacional.
5. Mover serviços para `createServerFn` quando começarmos a usar SSR / preload.
