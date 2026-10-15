/**
 * Publie sur le blog les articles qu'Eliott a validés dans le cockpit.
 *
 *   bun scripts/publier-articles.ts              écrit les articles validés pas encore publiés
 *   bun scripts/publier-articles.ts --max 1      n'en écrit que le plus anciennement validé
 *   bun scripts/publier-articles.ts --confirmer  marque publiés ceux qui répondent en ligne
 *
 * Premier temps, avant la PR : pour chaque validation `ARTICLE_BLOG` au statut
 * VALIDE, le corps (corrigé par Eliott s'il l'a touché) part dans
 * `src/content/articles/<slug>.mdx` et les métadonnées dans
 * `src/content/articles-cockpit.json`. Rien n'est publié ici : la PR, la CI
 * locale (`bun run test`) et le déploiement restent à la routine.
 *
 * Second temps, après le déploiement : chaque article du JSON qui répond 200
 * sur eliottbouquerel.fr est déclaré ENVOYE au cockpit, avec son adresse. Le
 * cockpit refuse une transition déjà faite (409) : relancer ne double rien.
 *
 * Jeton : `COCKPIT_AGENT_TOKEN`, sinon `secret get cockpit-agent-token`.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { ArticleCockpit, Motif } from "../src/content/blog-cockpit";
import { DESSINS, fabriquerVisuels } from "./visuel-articles-decision.mjs";

const RACINE = join(import.meta.dirname, "..");
const REGISTRE = join(RACINE, "src/content/articles-cockpit.json");
const ARTICLES = join(RACINE, "src/content/articles");
const COCKPIT = process.env.COCKPIT_URL ?? "https://admin.eliottbouquerel.fr";
const SITE = process.env.SITE_URL ?? "https://eliottbouquerel.fr";

/** Ce que le cockpit rend d'une validation d'article : on ne lit que ces champs. */
type Validation = {
  id: string;
  type: string;
  statut: string;
  titre: string | null;
  contenu: string;
  contenuCorrige: string | null;
  creeLe: string;
  decideLe: string | null;
  contexte: {
    article?: {
      slug: string;
      description: string;
      categorie?: string;
      motCle: { requete: string };
      motsCles?: { requete: string }[];
      pageServie: { url: string };
    };
  } | null;
};

function jeton(): string {
  const env = process.env.COCKPIT_AGENT_TOKEN;
  if (env) return env;
  try {
    const valeur = execFileSync("secret", ["get", "cockpit-agent-token"], { encoding: "utf8" }).trim();
    if (valeur) return valeur;
  } catch {
    // Pas de trousseau : le message ci-dessous dit quoi poser.
  }
  throw new Error("Jeton du cockpit introuvable (COCKPIT_AGENT_TOKEN ou secret cockpit-agent-token)");
}

const entetes = () => ({ authorization: `Bearer ${jeton()}`, "content-type": "application/json" });

function lireRegistre(): ArticleCockpit[] {
  const brut: unknown = JSON.parse(readFileSync(REGISTRE, "utf8"));
  if (!Array.isArray(brut)) throw new Error("articles-cockpit.json doit être un tableau");
  return brut as ArticleCockpit[];
}

/** Jour de Paris, `AAAA-MM-JJ`. */
const aujourdhui = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

/** 200 mots par minute, arrondi au-dessus : l'ordre de grandeur des autres articles. */
function dureeLecture(corps: string): string {
  const mots = corps.split(/\s+/).filter((m) => /[\p{L}\d]/u.test(m)).length;
  return `${Math.max(1, Math.ceil(mots / 200))} min de lecture`;
}

/** Le motif du visuel et la rubrique suivent l'offre que l'article sert. */
function visuelPour(pageServie: string): { motif: Motif; categorie: string } {
  if (pageServie.includes("logiciel")) return { motif: "odoo", categorie: "Outils métier" };
  if (pageServie.includes("site-vitrine") || pageServie.includes("creation-site")) {
    return { motif: "wordpress", categorie: "Méthode" };
  }
  return { motif: "refonte", categorie: "Méthode" };
}

/** Graine tirée du slug (FNV-1a) : le même article redonne la même image. */
function graine(slug: string): number {
  let h = 0x811c9dc5;
  for (const c of slug) h = Math.imul(h ^ c.charCodeAt(0), 0x01000193) >>> 0;
  return h;
}

async function validesDuCockpit(): Promise<Validation[]> {
  const r = await fetch(`${COCKPIT}/api/agents/validations?statut=VALIDE`, { headers: entetes() });
  if (!r.ok) throw new Error(`Cockpit : ${r.status} sur la lecture des validations`);
  const { validations } = (await r.json()) as { validations: Validation[] };
  // Le plus anciennement validé d'abord : c'est lui qui part au prochain jour de publication.
  return validations
    .filter((v) => v.type === "ARTICLE_BLOG" && v.statut === "VALIDE")
    .sort((a, b) => (a.decideLe ?? a.creeLe).localeCompare(b.decideLe ?? b.creeLe));
}

/** `--max N` : combien d'articles écrire au plus ; sans lui, tous. */
function maximum(): number {
  const i = process.argv.indexOf("--max");
  if (i < 0) return Number.POSITIVE_INFINITY;
  const n = Number(process.argv[i + 1]);
  if (!Number.isInteger(n) || n < 1) throw new Error("--max attend un entier positif");
  return n;
}

async function ecrire(): Promise<void> {
  const registre = lireRegistre();
  const connus = new Set(registre.map((a) => a.slug));
  const ecrits: string[] = [];
  const ignores: string[] = [];
  const max = maximum();
  for (const v of await validesDuCockpit()) {
    if (ecrits.length >= max) break;
    const article = v.contexte?.article;
    if (!article || !v.titre) {
      ignores.push(`${v.id} : ni titre ni slug`);
      continue;
    }
    const chemin = join(ARTICLES, `${article.slug}.mdx`);
    if (connus.has(article.slug) || existsSync(chemin)) {
      ignores.push(`${article.slug} : déjà présent sur le site`);
      continue;
    }
    const corps = (v.contenuCorrige ?? v.contenu).trim();
    const { motif, categorie } = visuelPour(article.pageServie.url);
    writeFileSync(chemin, `${corps}\n`);
    await fabriquerVisuels(article.slug, DESSINS[motif], graine(article.slug), RACINE);
    registre.unshift({
      slug: article.slug,
      title: v.titre,
      date: aujourdhui(),
      category: article.categorie ?? categorie,
      description: article.description,
      readingTime: dureeLecture(corps),
      tags: [article.motCle.requete, ...(article.motsCles ?? []).map((m) => m.requete)].slice(0, 5),
      motif,
      validationId: v.id,
    });
    connus.add(article.slug);
    ecrits.push(article.slug);
  }
  writeFileSync(REGISTRE, `${JSON.stringify(registre, null, 2)}\n`);
  console.log(JSON.stringify({ ecrits, ignores }, null, 2));
}

async function confirmer(): Promise<void> {
  const publies: string[] = [];
  const attente: string[] = [];
  for (const a of lireRegistre()) {
    const url = `${SITE}/blog/${a.slug}`;
    const enLigne = await fetch(url, { redirect: "manual" }).then((r) => r.status === 200, () => false);
    if (!enLigne) {
      attente.push(`${a.slug} : pas encore en ligne`);
      continue;
    }
    const r = await fetch(`${COCKPIT}/api/agents/validations/${a.validationId}`, {
      method: "PATCH",
      headers: entetes(),
      body: JSON.stringify({ statut: "ENVOYE", urlPublication: url }),
    });
    // 409 : déjà déclaré publié (ou plus validé) ; le cockpit dit lequel, rien à refaire ici.
    if (r.ok) publies.push(url);
    else if (r.status !== 409) attente.push(`${a.slug} : cockpit ${r.status}`);
  }
  console.log(JSON.stringify({ publies, attente }, null, 2));
  if (attente.length > 0) process.exitCode = 1;
}

await (process.argv.includes("--confirmer") ? confirmer() : ecrire());
