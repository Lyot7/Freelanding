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
 * CE QUI EST RELAYÉ EST ÉNUMÉRÉ, jamais déduit par exclusion : voir
 * `ENTETES_RELAYES` plus bas et la raison pour laquelle la liste noire de la
 * première version échouait en production.
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

/**
 * LISTE BLANCHE, ET NON LISTE NOIRE. La version précédente relayait tout sauf
 * une liste d'exclusions, et échouait en production là où elle passait en
 * local : derrière le proxy inverse, la requête porte des en-têtes que le
 * client n'a pas envoyés (`x-forwarded-*`, `accept-encoding: br`) et dont
 * certains font échouer l'appel sortant. Énumérer ce qui sert est la seule
 * façon de ne pas dépendre de ce que la couche réseau ajoute au passage.
 *
 * `cookie` EST RELAYÉ, et il le faut : c'est lui qui permet à PostHog de
 * reconnaître deux visites de la même personne. Sans lui, chaque page vue
 * compterait comme un nouveau visiteur.
 *
 * `accept-encoding` N'EST PAS RELAYÉ : `fetch` négocie sa propre compression
 * avec le serveur et livre un corps déjà décodé. Transmettre celui du client
 * revient à demander un encodage qu'on ne saura pas forcément défaire.
 */
const ENTETES_RELAYES = [
  "content-type",
  "cookie",
  "user-agent",
  "referer",
  "origin",
  "accept",
  "accept-language",
] as const;

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
  for (const nom of ENTETES_RELAYES) {
    const valeur = requete.headers.get(nom);
    if (valeur) entetes.set(nom, valeur);
  }

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

    /*
     * LE CORPS EST MATÉRIALISÉ, jamais retransmis en flux. Rendre le
     * `ReadableStream` de la réponse amont marche en local et se casse derrière
     * un proxy inverse, où la réponse est recompressée : le flux est alors
     * consommé deux fois. Ces charges utiles font quelques kilo-octets, les
     * garder en mémoire ne coûte rien.
     */
    const corps = await reponse.arrayBuffer();

    /*
     * SEULS LES EN-TÊTES QU'ON SAIT JUSTES SONT RENVOYÉS. `content-encoding` et
     * `content-length` décrivent le corps AMONT, déjà décodé par `fetch` : les
     * réannoncer ferait lire au navigateur un contenu compressé qui ne l'est
     * plus. Le reste (cache, sécurité) appartient à PostHog et n'a pas de sens
     * une fois servi depuis notre origine.
     */
    const sortie = new Headers();
    const type = reponse.headers.get("content-type");
    if (type) sortie.set("content-type", type);
    const cookies = reponse.headers.get("set-cookie");
    if (cookies) sortie.set("set-cookie", cookies);
    sortie.set("cache-control", "no-store");

    return new Response(corps, {
      status: reponse.status,
      statusText: reponse.statusText,
      headers: sortie,
    });
  } catch (erreur) {
    /*
     * 502 et non 500 : la panne est chez le fournisseur ou sur le lien, pas
     * dans cette route. Le SDK réessaiera, et le visiteur ne voit rien.
     *
     * LA CAUSE EST JOURNALISÉE, parce que l'absence de trace est exactement ce
     * qui a laissé cette panne invisible pendant des semaines : le relais
     * échouait, le site continuait de s'afficher, et rien ne le disait.
     */
    console.error(
      "[ingest] relais impossible",
      destination,
      erreur instanceof Error ? erreur.message : String(erreur),
    );
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
