/**
 * LA PUBLICATION AUTOMATIQUE D'UN ARTICLE VALIDÉ DANS LE COCKPIT.
 *
 * Eliott valide un article au cockpit (hub Blog) : sa validation vaut feu vert.
 * Le travail planifié `.github/workflows/publier-article.yml` lance
 * `bun scripts/publier-articles.ts --auto` chaque heure ouvrée, et ce module
 * fait le reste, dans l'ordre :
 *
 *   1. marque « Publié » au cockpit tout article du registre qui répond en ligne
 *      et ne l'était pas encore (un déploiement lent la veille, par exemple) ;
 *   2. s'arrête le samedi, le dimanche, et dès qu'un article est parti aujourd'hui :
 *      un article par jour ouvré, décision d'Eliott ;
 *   3. prend l'article validé le plus ancien, l'écrit dans le site avec son
 *      visuel, et passe les contrôles du site : types, lint, tests, build ;
 *   4. pousse sur `main` : Coolify déploie seul à chaque poussée ;
 *   5. attend que la page réponde 200, la marque « Publiée » au cockpit et
 *      signale l'adresse aux moteurs qui lisent IndexNow (Bing, Yandex).
 *
 * UN ÉCHEC NE CASSE JAMAIS LE SITE. Contrôle rouge : rien n'est poussé, le
 * dossier revient à son état, l'article reste validé et sa carte au cockpit
 * dit pourquoi. Il n'est retenté que quand son texte change, ou le lendemain
 * (un échec passager ne le bloque pas pour toujours), et il ne bloque pas les
 * suivants. Build Coolify en échec : le site en ligne reste sur sa version
 * précédente, et la carte le dit aussi.
 *
 * Toutes les entrées et sorties sont injectées (`Outils`) : la chaîne entière
 * se teste sans réseau, sans git et sans build (`publication.test.ts`).
 */
import { createHash } from "node:crypto";
import type { ArticleCockpit, ArticleDuCockpit } from "../src/content/blog-cockpit";

export const SITE = "https://eliottbouquerel.fr";

/** Un article validé, tel que `GET /api/agents/articles` du cockpit le rend. */
export interface ArticleAPublier {
  id: string;
  titre: string;
  corps: string;
  article: ArticleDuCockpit;
  /** Le dernier échec de publication, s'il y en a eu un. */
  publication?: { echec: string; le: string; empreinte: string } | null;
}

export interface Cockpit {
  /** Les articles validés, le plus anciennement validé d'abord. */
  articles(): Promise<ArticleAPublier[]>;
  /** Déclare l'article publié à cette adresse ; vrai si c'est fait ou déjà fait. */
  publie(id: string, url: string): Promise<boolean>;
  /** Pose le motif d'échec sur la carte de l'article, qui reste validé. */
  echec(id: string, motif: string, empreinte: string): Promise<void>;
}

export interface Resultat {
  ok: boolean;
  sortie: string;
}

export interface Outils {
  cockpit: Cockpit;
  registre(): ArticleCockpit[];
  /** Le fichier du corps existe déjà dans le site. */
  existe(slug: string): boolean;
  /** Écrit le corps, le registre et les trois JPG du visuel. */
  ecrire(a: ArticleAPublier, date: string): Promise<void>;
  /** Remet le dossier dans son état d'avant `ecrire` (rien n'a été poussé). */
  annuler(): void;
  executer(commande: string, args: readonly string[]): Resultat;
  enLigne(url: string): Promise<boolean>;
  indexNow(url: string): Promise<string>;
  attendre(ms: number): Promise<void>;
  maintenant(): Date;
  journal(message: string): void;
}

export type Issue =
  | { etat: "repos" | "deja-publie" | "rien"; confirmes: string[]; ignores: string[] }
  | { etat: "publie"; url: string; confirmes: string[]; ignores: string[] }
  | { etat: "echec"; motif: string; confirmes: string[]; ignores: string[] };

/** Les contrôles du site, dans l'ordre du moins cher au plus cher. */
export const CONTROLES: readonly (readonly string[])[] = [
  ["run", "typecheck"],
  ["run", "lint"],
  ["run", "test"],
  ["run", "build"],
];

/** Au plus 20 minutes d'attente du déploiement, un relevé toutes les 10 secondes. */
export const RELEVES_DEPLOIEMENT = 120;
export const INTERVALLE_RELEVE = 10_000;
/** Un échec se retente le lendemain même sans correction : un incident passager ne bloque pas l'article. */
const RETENTE_ECHEC = 24 * 3600_000;
/** Le registre ne se relit en ligne que sur deux semaines : au-delà, tout est confirmé depuis longtemps. */
const FENETRE_CONFIRMATION = 14 * 24 * 3600_000;

export const urlArticle = (slug: string): string => `${SITE}/blog/${slug}`;

/** Jour de Paris, `AAAA-MM-JJ`. */
export const jourDeParis = (d: Date): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(d);

/** Samedi et dimanche à Paris. */
export function estWeekEnd(d: Date): boolean {
  const jour = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" }).format(d);
  return jour === "Sat" || jour === "Sun";
}

/** Empreinte courte du texte : un échec ne vaut que pour le texte qui l'a produit. */
export const empreinte = (corps: string): string => createHash("sha256").update(corps).digest("hex").slice(0, 16);

/** Les dernières lignes utiles d'une sortie, pour un motif lisible sur une carte. */
export function extrait(sortie: string, max = 600): string {
  const propre = sortie.trim().split("\n").filter((l) => l.trim()).slice(-8).join("\n");
  return propre.length > max ? `…${propre.slice(-max)}` : propre;
}

/** Les articles du registre récents qui répondent en ligne, déclarés publiés au cockpit. */
async function confirmerEnLigne(o: Outils): Promise<string[]> {
  const depuis = jourDeParis(new Date(o.maintenant().getTime() - FENETRE_CONFIRMATION));
  const confirmes: string[] = [];
  for (const a of o.registre().filter((e) => e.date >= depuis)) {
    const url = urlArticle(a.slug);
    if ((await o.enLigne(url)) && (await o.cockpit.publie(a.validationId, url))) confirmes.push(url);
  }
  return confirmes;
}

/** Le premier article publiable, et ce qui a été écarté avec sa raison. */
export function choisir(
  articles: readonly ArticleAPublier[],
  o: Pick<Outils, "registre" | "existe">,
  maintenant: Date,
): { article: ArticleAPublier | null; ignores: string[] } {
  const connus = new Set(o.registre().map((a) => a.slug));
  const ignores: string[] = [];
  for (const a of articles) {
    const slug = a.article.slug;
    const echec = a.publication;
    if (!a.article.visuel) ignores.push(`${slug} : pas encore de visuel`);
    else if (connus.has(slug) || o.existe(slug)) ignores.push(`${slug} : déjà présent sur le site`);
    else if (
      echec?.empreinte === empreinte(a.corps) &&
      maintenant.getTime() - Date.parse(echec.le) < RETENTE_ECHEC
    ) {
      ignores.push(`${slug} : en échec, retenté quand son texte change ou demain`);
    } else return { article: a, ignores };
  }
  return { article: null, ignores };
}

/** Pousse le commit sur `main` ; si `main` a bougé entre-temps, rebase une fois et repousse. */
function pousser(o: Outils, slug: string): Resultat {
  for (const args of [
    ["add", "src/content", "public/images"],
    ["commit", "-m", `📝 Publier l'article ${slug}`],
  ]) {
    const r = o.executer("git", args);
    if (!r.ok) return r;
  }
  const premier = o.executer("git", ["push", "origin", "HEAD:main"]);
  if (premier.ok) return premier;
  const rebase = o.executer("git", ["pull", "--rebase", "origin", "main"]);
  return rebase.ok ? o.executer("git", ["push", "origin", "HEAD:main"]) : rebase;
}

async function attendreEnLigne(o: Outils, url: string): Promise<boolean> {
  for (let i = 0; i < RELEVES_DEPLOIEMENT; i++) {
    if (await o.enLigne(url)) return true;
    await o.attendre(INTERVALLE_RELEVE);
  }
  return false;
}

/** Contrôles du site, puis poussée : le motif du premier échec, ou null si tout est passé. */
function controlerEtPousser(o: Outils, slug: string): string | null {
  for (const args of CONTROLES) {
    o.journal(`bun ${args.join(" ")}`);
    const r = o.executer("bun", args);
    if (!r.ok) {
      o.annuler();
      return `Contrôle « bun ${args.join(" ")} » en échec, rien n'est parti :\n${extrait(r.sortie)}`;
    }
  }
  const poussee = pousser(o, slug);
  if (poussee.ok) return null;
  o.annuler();
  return `Poussée sur le site refusée, rien n'est parti :\n${extrait(poussee.sortie)}`;
}

/** La chaîne complète, un article au plus. */
export async function publierAuto(o: Outils): Promise<Issue> {
  // L'annulation remet le dossier à son état de départ (`reset --hard`, `clean`) :
  // sur un dossier déjà modifié, elle effacerait un travail en cours. Rien ne part.
  const etat = o.executer("git", ["status", "--porcelain"]);
  if (!etat.ok || etat.sortie.trim()) {
    return { etat: "echec", motif: "Dossier du site modifié ou illisible : publication automatique refusée.", confirmes: [], ignores: [] };
  }
  const confirmes = await confirmerEnLigne(o);
  const maintenant = o.maintenant();
  const date = jourDeParis(maintenant);
  if (estWeekEnd(maintenant)) return { etat: "repos", confirmes, ignores: [] };
  if (o.registre().some((a) => a.date === date)) return { etat: "deja-publie", confirmes, ignores: [] };

  const { article, ignores } = choisir(await o.cockpit.articles(), o, maintenant);
  if (!article) return { etat: "rien", confirmes, ignores };

  const slug = article.article.slug;
  const emp = empreinte(article.corps);
  o.journal(`Publication de ${slug}`);
  await o.ecrire(article, date);
  const refus = controlerEtPousser(o, slug);
  if (refus) {
    await o.cockpit.echec(article.id, refus, emp);
    return { etat: "echec", motif: refus, confirmes, ignores };
  }

  const url = urlArticle(slug);
  if (!(await attendreEnLigne(o, url))) {
    const motif =
      "Poussé sur le site, mais la page ne répond pas après 20 minutes : le déploiement Coolify est à vérifier. " +
      "Le site en ligne reste sur sa version précédente ; l'article sera marqué publié dès qu'il répondra.";
    await o.cockpit.echec(article.id, motif, emp);
    return { etat: "echec", motif, confirmes, ignores };
  }
  await o.cockpit.publie(article.id, url);
  o.journal(await o.indexNow(url));
  return { etat: "publie", url, confirmes, ignores };
}

/**
 * La clé IndexNow du site, publique par nature : le fichier
 * `public/<clé>.txt` prouve aux moteurs que la notification vient bien du
 * propriétaire du domaine. Ce n'est pas un secret.
 */
export const INDEXNOW_CLE = "1e9ce576b737d48dd885a4fc652151a4";

/** Le client du cockpit, sur les deux routes ouvertes au jeton `blog`. */
export function clientCockpit(base: string, jeton: string, lire: typeof fetch = fetch): Cockpit {
  const entetes = { authorization: `Bearer ${jeton}`, "content-type": "application/json" };
  const poster = (id: string, corps: object) =>
    lire(`${base}/api/agents/articles/${id}/publication`, {
      method: "POST",
      headers: entetes,
      body: JSON.stringify(corps),
    });
  return {
    async articles() {
      const r = await lire(`${base}/api/agents/articles`, { headers: entetes });
      if (!r.ok) throw new Error(`Cockpit : ${r.status} sur la lecture des articles validés`);
      const { articles } = (await r.json()) as { articles: ArticleAPublier[] };
      return articles;
    },
    async publie(id, url) {
      // 409 : déjà déclaré publié, ou plus validé ; rien à refaire.
      const r = await poster(id, { resultat: "publie", url });
      return r.ok || r.status === 409;
    },
    async echec(id, motif, emp) {
      const r = await poster(id, { resultat: "echec", motif, empreinte: emp });
      if (!r.ok && r.status !== 409) throw new Error(`Cockpit : ${r.status} sur le motif d'échec de ${id}`);
    },
  };
}

/** La page répond 200, sans suivre de redirection. */
export async function repondEnLigne(url: string, lire: typeof fetch = fetch): Promise<boolean> {
  try {
    const r = await lire(url, { redirect: "manual", cache: "no-store" });
    return r.status === 200;
  } catch {
    return false;
  }
}

/**
 * Signale l'adresse aux moteurs qui lisent IndexNow (Bing, Yandex, Seznam…).
 * Gratuit, sans compte. Google ne le lit pas : il découvre l'article par le
 * sitemap, régénéré à chaque build. Un refus ne fait jamais échouer la publication.
 */
export async function signalerIndexNow(url: string, lire: typeof fetch = fetch): Promise<string> {
  try {
    const r = await lire("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: INDEXNOW_CLE,
        keyLocation: `${SITE}/${INDEXNOW_CLE}.txt`,
        urlList: [url],
      }),
    });
    return `IndexNow : ${r.status}`;
  } catch (e) {
    return `IndexNow injoignable : ${e instanceof Error ? e.message : String(e)}`;
  }
}
