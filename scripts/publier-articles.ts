/**
 * Publie sur le blog les articles qu'Eliott a validés dans le cockpit.
 *
 *   bun scripts/publier-articles.ts --auto       la chaîne complète, un article au plus (scripts/publication.ts)
 *   bun scripts/publier-articles.ts --max 1      écrit seulement le plus anciennement validé, sans rien pousser
 *   bun scripts/publier-articles.ts --confirmer  marque publiés ceux du registre qui répondent en ligne
 *
 * `--auto` est ce que lance le travail planifié `.github/workflows/publier-article.yml`
 * chaque heure ouvrée ; les deux autres modes servent à la main, pour rejouer
 * une étape. Le détail est dans `docs/BLOG.md`.
 *
 * Jeton : `COCKPIT_AGENT_TOKEN` (le jeton `blog` du cockpit, ou le jeton
 * complet des agents), sinon `secret get cockpit-agent-token`.
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { entreeDuCockpit, type ArticleCockpit } from "../src/content/blog-cockpit";
import {
  type ArticleAPublier,
  type Outils,
  choisir,
  clientCockpit,
  jourDeParis,
  publierAuto,
  repondEnLigne,
  signalerIndexNow,
  urlArticle,
} from "./publication";

const RACINE = join(import.meta.dirname, "..");
const REGISTRE = join(RACINE, "src/content/articles-cockpit.json");
const ARTICLES = join(RACINE, "src/content/articles");
const COCKPIT = process.env.COCKPIT_URL ?? "https://admin.eliottbouquerel.fr";

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

function lireRegistre(): ArticleCockpit[] {
  const brut: unknown = JSON.parse(readFileSync(REGISTRE, "utf8"));
  if (!Array.isArray(brut)) throw new Error("articles-cockpit.json doit être un tableau");
  return brut as ArticleCockpit[];
}

const existe = (slug: string) => existsSync(join(ARTICLES, `${slug}.mdx`));

/** Le corps, l'entrée du registre et les trois JPG du visuel. */
async function ecrire(a: ArticleAPublier, date: string): Promise<void> {
  if (!a.article.visuel) throw new Error(`${a.article.slug} : pas de visuel`);
  // sharp n'est chargé que pour écrire : les autres modes tournent sans lui.
  const { rendreVisuel } = await import("./visuel-article.mjs");
  await rendreVisuel(a.article.slug, a.article.visuel.svg, RACINE);
  writeFileSync(join(ARTICLES, `${a.article.slug}.mdx`), `${a.corps.trim()}\n`);
  // Un texte retouché dans le cockpit perd ses insécables, et le test de typographie
  // bloquait l'article à chaque essai. La réparation mécanique passe avant les contrôles ;
  // ce qu'elle ne sait pas corriger reste au test. Sa sortie en 1 sur un résidu est attendue.
  spawnSync("bun", ["scripts/typo-fr.mjs", "--fix"], { cwd: RACINE, encoding: "utf8" });
  const registre = lireRegistre();
  registre.unshift(entreeDuCockpit({ ...a, corps: a.corps.trim() }, date));
  writeFileSync(REGISTRE, `${JSON.stringify(registre, null, 2)}\n`);
}

function executer(commande: string, args: readonly string[]) {
  const r = spawnSync(commande, args, { cwd: RACINE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, sortie: `${r.stdout ?? ""}${r.stderr ?? ""}${r.error?.message ?? ""}` };
}

/** Le dossier tel qu'au lancement : commit local, rebase en cours et fichiers écrits compris. */
function annulerVers(tete: string) {
  return () => {
    executer("git", ["rebase", "--abort"]);
    executer("git", ["reset", "--hard", tete]);
    executer("git", ["clean", "-fd", "src/content", "public/images"]);
  };
}

function outils(): Outils {
  const tete = executer("git", ["rev-parse", "HEAD"]).sortie.trim();
  return {
    cockpit: clientCockpit(COCKPIT, jeton()),
    registre: lireRegistre,
    existe,
    ecrire,
    annuler: annulerVers(tete),
    executer,
    enLigne: (url) => repondEnLigne(url),
    indexNow: (url) => signalerIndexNow(url),
    attendre: (ms) => new Promise((ok) => setTimeout(ok, ms)),
    maintenant: () => new Date(),
    journal: (m) => console.log(m),
  };
}

/** `--max N` : combien d'articles écrire au plus ; sans lui, tous. */
function maximum(): number {
  const i = process.argv.indexOf("--max");
  if (i < 0) return Number.POSITIVE_INFINITY;
  const n = Number(process.argv[i + 1]);
  if (!Number.isInteger(n) || n < 1) throw new Error("--max attend un entier positif");
  return n;
}

/** À la main : écrit les articles validés, sans contrôle ni poussée. */
async function ecrireSeulement(o: Outils): Promise<void> {
  const ecrits: string[] = [];
  const ignores: string[] = [];
  let restants = await o.cockpit.articles();
  while (ecrits.length < maximum()) {
    const { article, ignores: ecartes } = choisir(restants, o, o.maintenant());
    ignores.push(...ecartes);
    if (!article) break;
    await o.ecrire(article, jourDeParis(o.maintenant()));
    ecrits.push(article.article.slug);
    restants = restants.slice(restants.indexOf(article) + 1);
  }
  console.log(JSON.stringify({ ecrits, ignores }, null, 2));
}

async function confirmer(o: Outils): Promise<void> {
  const publies: string[] = [];
  const attente: string[] = [];
  for (const a of o.registre()) {
    const url = urlArticle(a.slug);
    if (!(await o.enLigne(url))) attente.push(`${a.slug} : pas encore en ligne`);
    else if (await o.cockpit.publie(a.validationId, url)) publies.push(url);
    else attente.push(`${a.slug} : refusé par le cockpit`);
  }
  console.log(JSON.stringify({ publies, attente }, null, 2));
  if (attente.length > 0) process.exitCode = 1;
}

const o = outils();
if (process.argv.includes("--auto")) {
  const issue = await publierAuto(o);
  console.log(JSON.stringify(issue, null, 2));
  if (issue.etat === "echec") process.exitCode = 1;
} else if (process.argv.includes("--confirmer")) {
  await confirmer(o);
} else {
  await ecrireSeulement(o);
}
