/**
 * LA PUBLICATION AUTOMATIQUE DE CE QU'ELIOTT VALIDE DANS LE COCKPIT : UN ARTICLE
 * ET UNE PAGE PAR MÉTIER PAR JOUR OUVRÉ, CHACUN SON QUOTA (décision du 2026-10-31).
 *
 * Eliott valide au cockpit (hub Blog) : sa validation vaut feu vert. Une page
 * par métier est une validation de même nature, avec `article.kind = "metier"`,
 * et son corps est une donnée : le JSON d'une entrée de `metiers.json`, sans sa
 * date, jamais compilé. Le travail planifié `.github/workflows/publier-article.yml`
 * lance `bun scripts/publier-articles.ts --auto` chaque heure ouvrée, et ce
 * module fait le reste, dans l'ordre :
 *
 *   1. marque « Publié » au cockpit tout article du registre et toute page de
 *      `metiers.json` qui répond en ligne et ne l'était pas encore (un
 *      déploiement lent la veille, par exemple) ;
 *   2. s'arrête le samedi et le dimanche ; un article déjà parti aujourd'hui
 *      n'arrête que les articles, une page datée d'aujourd'hui que les pages ;
 *   3. prend le validé le plus ancien de chaque nature, l'écrit dans le site
 *      avec son visuel, et passe les contrôles du site : types, lint, tests, build ;
 *   4. pousse sur `main` : Coolify déploie seul à chaque poussée ;
 *   5. attend que chaque page réponde 200, la marque « Publiée » au cockpit et
 *      signale l'adresse aux moteurs qui lisent IndexNow (Bing, Yandex).
 *
 * UN ÉCHEC NE CASSE JAMAIS LE SITE, ET N'ARRÊTE PAS L'AUTRE NATURE. Contrôle
 * rouge : rien n'est poussé, le dossier revient à son état, la validation reste
 * validée et sa carte au cockpit dit pourquoi. Elle n'est retentée que quand son
 * texte change, ou le lendemain (un échec passager ne la bloque pas pour
 * toujours), et elle ne bloque pas les suivantes. Build Coolify en échec : le
 * site en ligne reste sur sa version précédente, et la carte le dit aussi.
 *
 * Toutes les entrées et sorties sont injectées (`Outils`) : la chaîne entière
 * se teste sans réseau, sans git et sans build (`publication.test.ts`).
 */
import { createHash } from "node:crypto";
import type { ArticleCockpit, ArticleDuCockpit, PageMetierDuCockpit } from "../src/content/blog-cockpit";
import { CHEMIN_HUB_METIERS, motifsDeRefus, pageDuCorps, type PageMetier } from "../src/content/metiers";

export const SITE = "https://eliottbouquerel.fr";

/** Une validation, telle que `GET /api/agents/articles` du cockpit la rend. */
interface Validation<C> {
  id: string;
  titre: string;
  corps: string;
  article: C;
  /** Le dernier échec de publication, s'il y en a eu un. */
  publication?: { echec: string; le: string; empreinte: string } | null;
}

export type ArticleAPublier = Validation<ArticleDuCockpit>;
export type PageAPublier = Validation<PageMetierDuCockpit>;
export type AValider = ArticleAPublier | PageAPublier;

/** Absence de `kind` : un article. */
export const estPage = (a: AValider): a is PageAPublier => a.article.kind === "metier";

export interface Cockpit {
  /** Les validés des deux natures, le plus anciennement validé d'abord. */
  articles(): Promise<AValider[]>;
  /** Déclare la validation publiée à cette adresse ; vrai si c'est fait ou déjà fait. */
  publie(id: string, url: string): Promise<boolean>;
  /** Pose le motif d'échec sur la carte, qui reste validée. */
  echec(id: string, motif: string, empreinte: string): Promise<void>;
}

export interface Resultat {
  ok: boolean;
  sortie: string;
}

export interface Outils {
  cockpit: Cockpit;
  registre(): ArticleCockpit[];
  /** Les entrées de `metiers.json`, relues à chaque appel. */
  pages(): PageMetier[];
  /** Le fichier du corps existe déjà dans le site. */
  existe(slug: string): boolean;
  /** Écrit le corps, le registre et les trois JPG du visuel. */
  ecrire(a: ArticleAPublier, date: string): Promise<void>;
  /** Ajoute l'entrée à `metiers.json` et écrit les trois JPG du visuel. */
  ecrirePage(a: PageAPublier, entree: PageMetier): Promise<void>;
  /** Remet le dossier au commit `tete` : ce qui n'est pas parti disparaît, ce qui est parti reste. */
  annuler(tete: string): void;
  executer(commande: string, args: readonly string[]): Resultat;
  enLigne(url: string): Promise<boolean>;
  indexNow(url: string): Promise<string>;
  attendre(ms: number): Promise<void>;
  maintenant(): Date;
  journal(message: string): void;
}

/** Ce qu'une exécution a fait pour une nature. */
export type Volet =
  | { etat: "deja-publie" | "rien"; ignores: string[] }
  | { etat: "publie"; url: string; ignores: string[] }
  | { etat: "echec"; motif: string; ignores: string[] };

/**
 * L'issue d'une exécution : celle de l'article, à plat, et `page` dès qu'il y a
 * quelque chose à dire des pages par métier.
 */
export type Issue = ({ etat: "repos"; ignores: string[] } | Volet) & { confirmes: string[]; page?: Volet };

/** Vrai si l'une des deux natures a échoué : l'exécution sort en erreur. */
export const enEchec = (i: Issue): boolean => i.etat === "echec" || i.page?.etat === "echec";

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
/** Un échec se retente le lendemain même sans correction : un incident passager ne bloque pas la validation. */
const RETENTE_ECHEC = 24 * 3600_000;
/** Le registre ne se relit en ligne que sur deux semaines : au-delà, tout est confirmé depuis longtemps. */
const FENETRE_CONFIRMATION = 14 * 24 * 3600_000;

export const urlArticle = (slug: string): string => `${SITE}/blog/${slug}`;
export const urlPage = (slug: string): string => `${SITE}${CHEMIN_HUB_METIERS}/${slug}`;

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

/** Tout ce que le site déclare publié et que le cockpit peut confirmer. */
export function inscrits(o: Pick<Outils, "registre" | "pages">): { slug: string; date: string; id: string; url: string }[] {
  return [
    ...o.registre().map((a) => ({ slug: a.slug, date: a.date, id: a.validationId, url: urlArticle(a.slug) })),
    ...o.pages().flatMap((p) =>
      p.validationId ? [{ slug: p.slug, date: p.date, id: p.validationId, url: urlPage(p.slug) }] : [],
    ),
  ];
}

/** Les articles et les pages récents qui répondent en ligne, déclarés publiés au cockpit. */
async function confirmerEnLigne(o: Outils): Promise<string[]> {
  const depuis = jourDeParis(new Date(o.maintenant().getTime() - FENETRE_CONFIRMATION));
  const confirmes: string[] = [];
  for (const { date, id, url } of inscrits(o)) {
    if (date >= depuis && (await o.enLigne(url)) && (await o.cockpit.publie(id, url))) confirmes.push(url);
  }
  return confirmes;
}

/** La première validation publiable de la liste, et ce qui a été écarté avec sa raison. */
function premiere<T extends AValider>(
  liste: readonly T[],
  dejaLa: (slug: string) => boolean,
  maintenant: Date,
): { retenue: T | null; ignores: string[] } {
  const ignores: string[] = [];
  for (const a of liste) {
    const slug = a.article.slug;
    const echec = a.publication;
    if (!a.article.visuel) ignores.push(`${slug} : pas encore de visuel`);
    else if (dejaLa(slug)) ignores.push(`${slug} : déjà présent sur le site`);
    else if (
      echec?.empreinte === empreinte(a.corps) &&
      maintenant.getTime() - Date.parse(echec.le) < RETENTE_ECHEC
    ) {
      ignores.push(`${slug} : en échec, retenté quand son texte change ou demain`);
    } else return { retenue: a, ignores };
  }
  return { retenue: null, ignores };
}

/** Le premier article publiable, et ce qui a été écarté avec sa raison. Les pages par métier n'y entrent pas. */
export function choisir(
  validations: readonly AValider[],
  o: Pick<Outils, "registre" | "existe">,
  maintenant: Date,
): { article: ArticleAPublier | null; ignores: string[] } {
  const connus = new Set(o.registre().map((a) => a.slug));
  const articles = validations.filter((a): a is ArticleAPublier => !estPage(a));
  const { retenue, ignores } = premiere(articles, (slug) => connus.has(slug) || o.existe(slug), maintenant);
  return { article: retenue, ignores };
}

/** La première page publiable, et ce qui a été écarté avec sa raison. */
export function choisirPage(
  validations: readonly AValider[],
  o: Pick<Outils, "pages">,
  maintenant: Date,
): { page: PageAPublier | null; ignores: string[] } {
  const connues = new Set(o.pages().map((p) => p.slug));
  const { retenue, ignores } = premiere(validations.filter(estPage), (slug) => connues.has(slug), maintenant);
  return { page: retenue, ignores };
}

/**
 * L'entrée que la page ajoutera à `metiers.json`, datée de `date` : relue comme
 * une donnée, puis soumise au refus que le site applique à ses propres pages.
 * Lève une erreur lisible ; rien n'est alors écrit.
 */
export function entreePage(a: PageAPublier, date: string, toutes: readonly PageMetier[]): PageMetier {
  const page = pageDuCorps(a.corps, a.article.slug, date, toutes.length);
  const motifs = motifsDeRefus(page, toutes);
  // Les plus courts d'abord : « trop proche de x » ne doit pas se perdre derrière vingt phrases reprises.
  const lisibles = [...motifs].sort((a, b) => a.length - b.length);
  if (lisibles.length > 0) throw new Error(`Page refusée : ${lisibles.join(" ; ")}`);
  return { ...page, validationId: a.id };
}

/** Pousse le commit sur `main` ; si `main` a bougé entre-temps, rebase une fois et repousse. */
function pousser(o: Outils, message: string): Resultat {
  for (const args of [
    ["add", "src/content", "public/images"],
    ["commit", "-m", message],
  ]) {
    const r = o.executer("git", args);
    if (!r.ok) return r;
  }
  const premier = o.executer("git", ["push", "origin", "HEAD:main"]);
  if (premier.ok) return premier;
  const rebase = o.executer("git", ["pull", "--rebase", "origin", "main"]);
  return rebase.ok ? o.executer("git", ["push", "origin", "HEAD:main"]) : rebase;
}

/** Contrôles du site, puis poussée : le motif du premier échec, ou null si tout est passé. */
function controlerEtPousser(o: Outils, message: string, tete: string): string | null {
  for (const args of CONTROLES) {
    o.journal(`bun ${args.join(" ")}`);
    const r = o.executer("bun", args);
    if (!r.ok) {
      o.annuler(tete);
      return `Contrôle « bun ${args.join(" ")} » en échec, rien n'est parti :\n${extrait(r.sortie)}`;
    }
  }
  const poussee = pousser(o, message);
  if (poussee.ok) return null;
  o.annuler(tete);
  return `Poussée sur le site refusée, rien n'est parti :\n${extrait(poussee.sortie)}`;
}

const texteErreur = (e: unknown): string => (e instanceof Error ? e.message : String(e));

/** Pose le motif sur la carte. Un cockpit muet n'arrête pas l'autre nature : le journal le garde. */
async function poserEchec(o: Outils, a: AValider, motif: string): Promise<void> {
  try {
    await o.cockpit.echec(a.id, motif, empreinte(a.corps));
  } catch (e) {
    o.journal(`Motif non posé sur la carte de ${a.article.slug} : ${texteErreur(e)}`);
  }
}

/** Une validation partie sur `main`, en attente de sa page en ligne. */
interface Partie {
  etat: "partie";
  a: AValider;
  url: string;
  ignores: string[];
}

/** Ce qui change d'une nature à l'autre. `preparer` lève une erreur lisible si rien ne peut s'écrire. */
interface Envoi {
  a: AValider;
  url: string;
  message: string;
  preparer(): Promise<void>;
}

/** Écrit, contrôle et pousse une validation. Tout échec reste ici : l'autre nature part quand même. */
async function envoyer(o: Outils, { a, url, message, preparer }: Envoi, ignores: string[]): Promise<Volet | Partie> {
  o.journal(`Publication de ${a.article.slug}`);
  // Pris ici et non au lancement : l'échec d'une page ne doit pas défaire l'article parti avant elle.
  const tete = o.executer("git", ["rev-parse", "HEAD"]).sortie.trim();
  let refus: string | null;
  try {
    await preparer();
    refus = controlerEtPousser(o, message, tete);
  } catch (e) {
    o.annuler(tete);
    // Le début et non la fin : les motifs de refus se lisent dans l'ordre, et le cockpit borne le texte.
    refus = `Écriture refusée, rien n'est parti :\n${[...texteErreur(e)].slice(0, 2000).join("")}`;
  }
  if (!refus) return { etat: "partie", a, url, ignores };
  await poserEchec(o, a, refus);
  return { etat: "echec", motif: refus, ignores };
}

/** Les adresses qui répondent. Au plus 20 minutes pour les deux : leurs déploiements se suivent. */
async function attendreEnLigne(o: Outils, parties: readonly Partie[]): Promise<ReadonlySet<string>> {
  const enLigne = new Set<string>();
  for (let i = 0; i < RELEVES_DEPLOIEMENT && enLigne.size < parties.length; i++) {
    for (const { url } of parties) {
      if (!enLigne.has(url) && (await o.enLigne(url))) enLigne.add(url);
    }
    if (enLigne.size < parties.length) await o.attendre(INTERVALLE_RELEVE);
  }
  return enLigne;
}

/** La page répond : la carte passe à « Publié » et les moteurs sont prévenus. Sinon la carte le dit. */
async function conclure(o: Outils, v: Volet | Partie, enLigne: ReadonlySet<string>): Promise<Volet> {
  if (v.etat !== "partie") return v;
  const { a, url, ignores } = v;
  if (!enLigne.has(url)) {
    const motif =
      "Poussé sur le site, mais la page ne répond pas après 20 minutes : le déploiement Coolify est à vérifier. " +
      "Le site en ligne reste sur sa version précédente ; la publication sera confirmée dès que la page répondra.";
    await poserEchec(o, a, motif);
    return { etat: "echec", motif, ignores };
  }
  try {
    await o.cockpit.publie(a.id, url);
  } catch (e) {
    // La page est en ligne : la prochaine exécution la confirmera (`confirmerEnLigne`).
    o.journal(`Publication de ${a.article.slug} non confirmée au cockpit : ${texteErreur(e)}`);
  }
  o.journal(await o.indexNow(url));
  return { etat: "publie", url, ignores };
}

/** La chaîne complète : au plus un article et au plus une page par jour ouvré, chacun son quota. */
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

  const articleDuJour = o.registre().some((a) => a.date === date);
  const pageDuJour = o.pages().some((p) => p.date === date);
  const validations = articleDuJour && pageDuJour ? [] : await o.cockpit.articles();

  const volet = async (deja: boolean, envoi: Envoi | null, ignores: string[]): Promise<Volet | Partie> => {
    if (deja) return { etat: "deja-publie", ignores: [] };
    return envoi ? envoyer(o, envoi, ignores) : { etat: "rien", ignores };
  };

  const { article, ignores } = choisir(validations, o, maintenant);
  const pourArticle = await volet(
    articleDuJour,
    article && {
      a: article,
      url: urlArticle(article.article.slug),
      message: `📝 Publier l'article ${article.article.slug}`,
      preparer: () => o.ecrire(article, date),
    },
    ignores,
  );

  const { page, ignores: ignoresPages } = choisirPage(validations, o, maintenant);
  const pourPage = await volet(
    pageDuJour,
    page && {
      a: page,
      url: urlPage(page.article.slug),
      message: `📝 Publier la page métier ${page.article.slug}`,
      preparer: () => o.ecrirePage(page, entreePage(page, date, o.pages())),
    },
    ignoresPages,
  );

  const parties = [pourArticle, pourPage].filter((v): v is Partie => v.etat === "partie");
  const enLigne = await attendreEnLigne(o, parties);
  const issueArticle = await conclure(o, pourArticle, enLigne);
  const issuePage = await conclure(o, pourPage, enLigne);
  const rienADire = issuePage.etat === "rien" && issuePage.ignores.length === 0;
  return { ...issueArticle, confirmes, ...(rienADire ? {} : { page: issuePage }) };
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
      const { articles } = (await r.json()) as { articles: AValider[] };
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
