import type { BlogPost } from "@/lib/content/types";
import { articlesDuCockpit, entreeDuCockpit, type ArticleDuCockpit } from "@/content/blog-cockpit";

/**
 * L'APERÇU D'UN ARTICLE AVANT SA PUBLICATION, montré dans le cockpit.
 *
 * Le cockpit affiche `/apercu/blog/<id>?exp=…&sig=…` dans un cadre. Le site ne
 * détient aucun secret : il transmet la signature au cockpit, qui la vérifie
 * (dix minutes de validité) et rend l'article. Une adresse d'aperçu qui fuit ne
 * montre donc qu'un brouillon, quelques minutes, et rien d'autre.
 *
 * L'adresse du cockpit est LITTÉRALE : rien de la requête ne la compose, sinon
 * la route deviendrait un relais vers n'importe quel hôte.
 */
export const COCKPIT = "https://admin.eliottbouquerel.fr";

/** Ce que le cadre affiche quand l'article ne vient pas : la carte du cockpit en signe une nouvelle à son affichage. */
export const MESSAGE_INDISPONIBLE = "Aperçu expiré ou indisponible. Recharge la carte dans le cockpit.";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EXPIRATION = /^\d{10,12}$/;
const SIGNATURE = /^[\w-]{43}$/;

export interface DemandeApercu {
  id: string;
  exp: string;
  sig: string;
}

/** Les trois paramètres, tels quels s'ils ont la bonne forme ; null sinon. */
export function demandeApercu(id: string, exp: unknown, sig: unknown): DemandeApercu | null {
  if (!UUID.test(id) || typeof exp !== "string" || typeof sig !== "string") return null;
  if (!EXPIRATION.test(exp) || !SIGNATURE.test(sig)) return null;
  return { id, exp, sig };
}

export interface ArticleApercu {
  id: string;
  titre: string;
  corps: string;
  article: ArticleDuCockpit;
}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;
const estTexte = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
const estRequete = (v: unknown): v is { requete: string } => estObjet(v) && estTexte(v.requete);

function lireArticle(a: unknown): ArticleDuCockpit | null {
  if (!estObjet(a) || !estTexte(a.slug) || !estTexte(a.description)) return null;
  if (!estRequete(a.motCle) || !estObjet(a.pageServie) || !estTexte(a.pageServie.url)) return null;
  const visuel = estObjet(a.visuel) && estTexte(a.visuel.svg) && estTexte(a.visuel.alt) ? a.visuel : null;
  return {
    slug: a.slug,
    description: a.description,
    categorie: estTexte(a.categorie) ? a.categorie : undefined,
    motCle: { requete: a.motCle.requete },
    motsCles: Array.isArray(a.motsCles) ? a.motsCles.filter(estRequete) : undefined,
    pageServie: { url: a.pageServie.url },
    visuel: visuel ? { svg: String(visuel.svg), alt: String(visuel.alt) } : undefined,
  };
}

/** La réponse du cockpit, lue champ par champ ; null si elle n'a pas la forme attendue. */
export function lireReponse(id: string, corps: unknown): ArticleApercu | null {
  if (!estObjet(corps) || !estTexte(corps.titre) || typeof corps.corps !== "string") return null;
  const article = lireArticle(corps.article);
  return article ? { id, titre: corps.titre, corps: corps.corps, article } : null;
}

/** L'article à prévisualiser, ou null : signature refusée, expirée, cockpit muet. */
export async function chargerApercu(
  demande: DemandeApercu,
  lire: typeof fetch = fetch,
): Promise<ArticleApercu | null> {
  const url = new URL(`/api/apercu/article/${demande.id}`, COCKPIT);
  url.searchParams.set("exp", demande.exp);
  url.searchParams.set("sig", demande.sig);
  try {
    const r = await lire(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!r.ok) return null;
    return lireReponse(demande.id, await r.json());
  } catch {
    return null;
  }
}

/** Un SVG en adresse d'image : affiché comme une image, il n'exécute rien. */
export const uriSvg = (svg: string): string => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

/** Sans visuel, l'aperçu garde la place du héros, en aplat sombre. */
const SANS_VISUEL = '<svg xmlns="http://www.w3.org/2000/svg" width="2400" height="1350"><rect width="2400" height="1350" fill="#0b0b0b"/></svg>';

/**
 * Le `BlogPost` que la page publiée recevra, construit par les mêmes fonctions
 * que la publication (`entreeDuCockpit`, `articlesDuCockpit`). Seules les images
 * changent : les JPG n'existent qu'après la publication, l'aperçu montre le SVG.
 */
export function articleDApercu(a: ArticleApercu, base: readonly BlogPost[], date: string): BlogPost {
  const entree = entreeDuCockpit(a, date);
  const [post] = articlesDuCockpit(base, [{ ...entree, alt: entree.alt || a.article.description }]);
  const image = uriSvg(a.article.visuel?.svg ?? SANS_VISUEL);
  const og = { src: image, alt: post.cover.alt, width: 1200, height: 630 };
  return {
    ...post,
    cover: { ...post.cover, src: image },
    heroImage: post.heroImage && { ...post.heroImage, src: image, og },
    seo: { title: post.title, description: post.excerpt, ogImage: og },
  };
}
