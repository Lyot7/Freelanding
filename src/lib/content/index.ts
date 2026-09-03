/**
 * Point d'entrée unique de la couche contenu.
 *
 * Les composants/pages importent `content` (le port) et rien d'autre :
 *   import { content } from "@/lib/content";
 *   const home = await content.getHome();
 *
 * UN SEUL ADAPTER DEPUIS LE 2026-08-26 : les fichiers de `src/content/`. Le
 * second adapter, Payload, a été retiré du dépôt — il servait un contenu dont
 * la source de vérité restait ces fichiers, son admin ne pouvait pas être
 * utilisé pour éditer (le seed vidait les collections avant de les réécrire), et
 * il coûtait une base, des migrations, un seed et une vérification de parité.
 * Le blog, seul cas qui aurait justifié un CMS, est passé en MDX. Voir
 * `docs/BLOG.md`.
 *
 * LE PORT RESTE. Il ne coûte rien, il garde les composants ignorants de la
 * provenance du contenu, et c'est lui qui rendrait une future source (un CMS
 * chez un client, une API) substituable sans toucher une seule page.
 */
import { createFileContentRepository } from "./adapters/file-repository";
import { withFeatureFlags } from "./features";
import type { ContentRepository } from "./repository";

/**
 * Port exposé aux pages/composants.
 *
 * Les drapeaux de section (`src/content/features.ts`) sont appliqués ICI, autour
 * de l'adapter : éteindre une section vaut pour tout le site.
 *
 * Le port déléguait auparavant méthode par méthode, pour ne charger l'adapter
 * Payload qu'à la première lecture. Cette indirection n'a plus d'objet : il ne
 * reste qu'un adapter, et il lit des modules déjà présents dans le graphe.
 */
export const content: ContentRepository = withFeatureFlags(
  createFileContentRepository(),
);

/**
 * Types du contenu, réexportés depuis le port pour que les composants n'aient
 * qu'un seul import à connaître (`@/lib/content`).
 */
export type * from "./types";
export type { ContentRepository } from "./repository";
