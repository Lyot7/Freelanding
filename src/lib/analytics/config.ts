/**
 * Configuration de la mesure, lue dans l'environnement.
 *
 * RÈGLE TENUE PARTOUT DANS CE DOSSIER : l'ABSENCE de clé n'est pas une panne,
 * c'est un mode de fonctionnement. Sans `NEXT_PUBLIC_POSTHOG_KEY`, le site
 * s'affiche et se navigue exactement pareil, la bannière ne s'affiche même pas
 * (rien à consentir), et aucune requête ne part. C'est l'état par défaut du
 * dépôt : `.env.example` livre les lignes vides.
 *
 * POURQUOI `NEXT_PUBLIC_`. La clé de projet PostHog est publique par
 * construction — elle voyage dans chaque requête d'ingestion émise par le
 * navigateur, elle est visible de n'importe quel visiteur. Elle n'autorise que
 * l'écriture d'événements, jamais la lecture. Ce n'est PAS un secret, et la
 * traiter comme tel n'apporterait rien. La clé d'API personnelle de PostHog,
 * elle, en est un : elle n'a rien à faire dans ce fichier ni dans ce dépôt.
 */

/**
 * CHAQUE VARIABLE EST LUE PAR UN ACCÈS STATIQUE `process.env.NEXT_PUBLIC_…`,
 * ET C'EST OBLIGATOIRE.
 *
 * MESURÉ, et le défaut était invisible. Une première version passait par un
 * helper paramétré qui lisait `process.env` par clé variable. Le bundler ne
 * remplace une variable d'environnement dans le code NAVIGATEUR que lorsqu'elle
 * est écrite en toutes lettres : un accès par variable n'est pas analysable, il
 * survit tel quel jusqu'au navigateur, où `process.env` est un objet vide.
 * Résultat constaté sur `localhost` : la clé valait la bonne valeur au rendu
 * serveur et la chaîne vide au rendu client. `ConsentFooterBar` rendait donc son
 * bloc côté serveur puis rien côté client, la bannière n'apparaissait jamais, et
 * RIEN ne le signalait — ni le compilateur, ni le lint, ni la console. Seule
 * l'inspection du DOM hydraté l'a montré : le nœud était là, sans fibre React.
 *
 * Ne jamais remplacer ces trois lignes par une boucle ou un helper paramétré.
 */
const RAW_POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const RAW_POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const RAW_GOOGLE_SITE_VERIFICATION =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

function clean(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Clé de projet PostHog (`phc_…`). Vide = mesure entièrement désactivée. */
export const POSTHOG_KEY = clean(RAW_POSTHOG_KEY);

/**
 * Instance PostHog. Défaut : l'UNION EUROPÉENNE, jamais les États-Unis.
 *
 * Ce n'est pas une préférence. Le site est français, les visiteurs sont des
 * TPE françaises, et l'instance US impose un transfert hors UE qu'il faudrait
 * documenter et justifier dans la politique de confidentialité. `eu.i.posthog.com`
 * est l'hôte d'INGESTION ; il ne faut surtout pas le confondre avec
 * `eu.posthog.com`, l'interface, qui sert uniquement de cible aux liens du
 * toolbar (`ui_host`).
 */
export const POSTHOG_HOST =
  clean(RAW_POSTHOG_HOST) || "https://eu.i.posthog.com";

/** Interface PostHog correspondante, déduite de l'hôte d'ingestion. */
export const POSTHOG_UI_HOST = POSTHOG_HOST.includes("us.i.posthog.com")
  ? "https://us.posthog.com"
  : "https://eu.posthog.com";

/**
 * Chemin du PROXY SAME-ORIGIN, réécrit vers PostHog par `next.config.ts`.
 *
 * CE QU'IL ACHÈTE. Les listes de filtrage (uBlock, Brave, DNS filtrants, et le
 * navigateur Safari par défaut sur certains points) bloquent les requêtes vers
 * les domaines d'analytics connus. Sur un site où trente visites par mois
 * valent chacune un appel commercial, perdre un tiers de la mesure n'est pas un
 * détail statistique : c'est perdre la trace du prospect qu'on cherchait.
 * Servi depuis l'origine du site, le trafic n'est plus reconnaissable à son
 * domaine.
 *
 * CE QU'IL N'ACHÈTE PAS. Ce n'est pas un contournement du consentement : rien
 * ne part tant que le visiteur n'a pas accepté. Le proxy déplace l'adresse, pas
 * la règle.
 *
 * Volontairement neutre (`/ingest`) plutôt que `/posthog` : un chemin qui
 * nomme le fournisseur se retrouve dans les listes de filtrage au bout de
 * quelques mois.
 */
export const POSTHOG_PROXY_PATH = "/ingest";

/**
 * Jeton de propriété Google Search Console.
 *
 * Google en propose plusieurs formes ; la balise `<meta>` est la seule qui ne
 * dépende ni du DNS ni d'un fichier déposé à la racine, donc la seule qui
 * survive à un changement d'hébergeur sans intervention. Elle est publique par
 * nature — elle est lue dans le HTML de chaque page — et n'accorde aucun droit :
 * elle prouve seulement qu'on contrôle le site.
 *
 * Vide par défaut : rien n'est rendu tant qu'Eliott n'a pas la valeur.
 */
export const GOOGLE_SITE_VERIFICATION = clean(RAW_GOOGLE_SITE_VERIFICATION);

/** Vrai si une clé est configurée. Seul test à faire avant de proposer un choix. */
export function isAnalyticsConfigured(): boolean {
  return POSTHOG_KEY.length > 0;
}
