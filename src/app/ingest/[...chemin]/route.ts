/**
 * PROXY D'INGESTION POSTHOG — un vrai relais, et non plus une réécriture.
 *
 * CE QUI NE MARCHAIT PAS, et personne ne pouvait le voir. Le proxy passait par
 * `rewrites()` dans `next.config.ts`. Une réécriture vers un hôte externe
 * transmet l'en-tête `Host` de la requête d'origine : PostHog recevait
 * `Host: eliottbouquerel.fr`, répondait **403**, et Next remontait un **500**.
 * Mesuré le 2026-09-08 : `/ingest/e`, `/ingest/decide` et
 * `/ingest/static/array.js` échouaient tous, alors que les mêmes chemins
 * répondaient 200 en direct. Autrement dit la mesure d'audience ne recevait
 * RIEN depuis sa mise en service, sans une seule erreur visible sur le site.
 *
 * POURQUOI GARDER UN PROXY PLUTÔT QUE POINTER SUR POSTHOG. Les listes de
 * filtrage bloquent les domaines d'analytics connus. Sur un site à fort volume
 * c'est une perte statistique ; ici, où quelques dizaines de visites par mois
 * sont autant de prospects appelés un par un, perdre un tiers de la mesure
 * revient à perdre la trace de la personne qu'on cherchait.
 *
 * DEUX HÔTES, ET LEUR ORDRE COMPTE. Le SDK va chercher ses modules optionnels
 * (enregistreur de session, barre d'outils) sur l'hôte d'ASSETS, distinct de
 * l'hôte d'INGESTION. Confondre les deux donne des 404 silencieux sur des
 * modules dont l'absence ne se voit qu'à l'usage.
 *
 * CE QUI N'EST PAS RELAYÉ, et c'est délibéré : `host`, `connection` et les
 * en-têtes propres au saut réseau. Les transmettre reproduirait exactement la
 * panne qu'on corrige. Le reste passe, cookies compris, sans quoi PostHog ne
 * pourrait pas reconnaître une visite d'une autre.
 *
 * RIEN NE PART AVANT LE CONSENTEMENT : ce relais déplace une adresse, jamais
 * une règle. Voir `src/lib/analytics/posthog.ts`.
 */

const INGESTION = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "").trim()
  || "https://eu.i.posthog.com";

/**
 * L'hôte d'assets se déduit de celui d'ingestion, jamais d'une variable à part :
 * deux réglages pour une même région finiraient par diverger, et le symptôme
 * serait un enregistreur de session qui ne charge plus.
 */
const ASSETS = INGESTION.includes("us.i.posthog.com")
  ? "https://us-assets.i.posthog.com"
  : "https://eu-assets.i.posthog.com";

/** En-têtes qui décrivent le saut réseau, pas la requête. */
const ENTETES_A_NE_PAS_RELAYER = new Set([
  "host",
  "connection",
  "keep-alive",
  "transfer-encoding",
  "upgrade",
  "proxy-authorization",
  "proxy-authenticate",
  "te",
  "trailer",
  "content-length",
]);

function cible(chemin: string[], recherche: string): string {
  // `/ingest/static/...` part vers l'hôte d'assets, tout le reste vers
  // l'ingestion. Le préfixe `static` est retiré côté assets : il appartient au
  // chemin public, pas à celui de PostHog.
  const base = chemin[0] === "static" ? ASSETS : INGESTION;
  return `${base}/${chemin.join("/")}${recherche}`;
}

async function relayer(requete: Request, chemin: string[]): Promise<Response> {
  const url = new URL(requete.url);
  const destination = cible(chemin, url.search);

  const entetes = new Headers();
  requete.headers.forEach((valeur, nom) => {
    if (!ENTETES_A_NE_PAS_RELAYER.has(nom.toLowerCase())) entetes.set(nom, valeur);
  });

  try {
    const reponse = await fetch(destination, {
      method: requete.method,
      headers: entetes,
      body: requete.method === "GET" || requete.method === "HEAD"
        ? undefined
        : await requete.arrayBuffer(),
      redirect: "follow",
      // Un relais de mesure ne doit jamais retenir la page : au-delà de ce
      // délai, mieux vaut perdre un événement que faire attendre un visiteur.
      signal: AbortSignal.timeout(10_000),
    });

    const sortie = new Headers(reponse.headers);
    // L'encodage a déjà été défait par `fetch` : le réannoncer ferait lire au
    // navigateur un corps compressé qui ne l'est plus.
    sortie.delete("content-encoding");
    sortie.delete("content-length");

    return new Response(reponse.body, {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: sortie,
    });
  } catch {
    // 502 et non 500 : la panne est chez le fournisseur ou sur le lien, pas
    // dans cette route. Le SDK réessaiera, et le visiteur ne voit rien.
    return new Response(null, { status: 502 });
  }
}

async function contexte(params: Promise<{ chemin: string[] }>) {
  return (await params).chemin ?? [];
}

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ chemin: string[] }> },
) {
  return relayer(requete, await contexte(params));
}

export async function POST(
  requete: Request,
  { params }: { params: Promise<{ chemin: string[] }> },
) {
  return relayer(requete, await contexte(params));
}

export async function OPTIONS(
  requete: Request,
  { params }: { params: Promise<{ chemin: string[] }> },
) {
  return relayer(requete, await contexte(params));
}

/*
 * `force-dynamic` : chaque appel doit partir. Une mise en cache, fût-elle d'une
 * seconde, transformerait deux visites distinctes en une seule.
 */
export const dynamic = "force-dynamic";
