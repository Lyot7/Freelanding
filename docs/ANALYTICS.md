# Mesure d'audience, consentement, Search Console

## Où vivent les choses

| Quoi | Où |
|---|---|
| Logique de consentement (pure, testée) | `src/lib/analytics/consent.ts` |
| Tests de cette logique | `src/lib/analytics/consent.test.mjs` |
| Stockage du choix (magasin externe React) | `src/lib/analytics/consent-store.ts` |
| Variables d'environnement | `src/lib/analytics/config.ts` |
| Registre des événements et entonnoirs | `src/lib/analytics/events.ts` |
| Pilotage du SDK PostHog | `src/lib/analytics/posthog.ts` |
| État partagé du consentement | `src/components/consent/ConsentProvider.tsx` |
| Bannière et panneau | `src/components/consent/ConsentBanner.tsx` |
| Lien permanent de révocation | `src/components/consent/ConsentFooterBar.tsx` |
| Textes de la bannière | `src/content/consent.ts` |
| Courroie consentement → SDK | `src/components/analytics/AnalyticsRuntime.tsx` |
| Vues, défilement, sections, temps | `src/components/analytics/PageAnalytics.tsx` |
| Clics, formulaires (délégation) | `src/components/analytics/GlobalAnalytics.tsx` |
| Point de montage | `src/app/(site)/SiteDocument.tsx` |
| Proxy d'ingestion | `next.config.ts` |

---

## 1. Ce qu'Eliott doit renseigner

Trois variables, toutes dans `.env.local` en local et dans le gestionnaire de
secrets de l'hébergeur en production. **Tant qu'elles sont vides, le site
fonctionne normalement, la bannière ne s'affiche pas et aucune requête ne part.**
C'est testé.

| Variable | Obligatoire ? | Où l'obtenir |
|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | pour mesurer | PostHog → Settings → Project → **Project API Key** (`phc_…`) |
| `NEXT_PUBLIC_POSTHOG_HOST` | non | Laisser vide = `https://eu.i.posthog.com` (Union européenne) |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | pour Search Console | Google Search Console, méthode « Balise HTML » (voir §5) |

La clé de projet PostHog **n'est pas un secret** : elle voyage dans chaque
requête émise par le navigateur et n'autorise que l'écriture d'événements. La
clé d'API *personnelle* de PostHog, elle, en est un et n'a rien à faire dans ce
dépôt.

### Créer le compte PostHog

1. Aller sur `posthog.com` et créer un compte.
2. **Choisir la région « EU »** à l'inscription. Ce choix est DÉFINITIF : il
   n'est proposé qu'à ce moment-là et une instance US ne se migre pas. Le site
   est français, sa cible aussi : la région US imposerait un transfert hors UE à
   documenter dans la politique de confidentialité.
3. Créer le projet, nom libre.
4. Settings → Project → copier la **Project API Key** dans
   `NEXT_PUBLIC_POSTHOG_KEY`.
5. Settings → Project → **Session replay** → activer l'interrupteur. Sans ça,
   le SDK a beau être configuré pour enregistrer, le serveur ne le lui autorise
   pas et aucun rejeu n'apparaît. C'est un réglage de projet, pas de code.
6. Settings → Project → **Heatmaps** → activer (même logique).
7. Offre gratuite : 1 M d'événements et 5 000 rejeux par mois, sans carte
   bancaire. Le volume attendu ici est deux à trois ordres de grandeur en
   dessous. **Ne pas ouvrir de facturation.**

---

## 2. Ce qui est mesuré

### Vues (émises manuellement : l'App Router ne recharge pas le document)

| Événement | Quand |
|---|---|
| `$pageview` | Chaque chargement ET chaque navigation interne |
| `$pageleave` | Sortie de page, avec `active_seconds`, `max_scroll_depth`, `sections` |
| `home_viewed` | Accueil |
| `service_page_viewed` | `/services/<slug>` |
| `work_index_viewed` / `work_page_viewed` | `/work` et `/work/<slug>` |
| `blog_index_viewed` / `article_viewed` | `/blog` et `/blog/<slug>` |
| `about_viewed`, `contact_page_viewed`, `legal_page_viewed` | pages correspondantes |

Les vues nommées doublent `$pageview` à dessein : un entonnoir monté sur
`$pageview` oblige à filtrer sur `$current_url` et casse dès qu'un chemin change.

### Intentions commerciales

| Événement | Quand | Propriétés utiles |
|---|---|---|
| `cta_clicked` | Lien vers `/contact`, ou lien à fond volt | `zone`, `destination`, `cta_id` |
| `contact_phone_clicked` | Clic sur un `tel:` | `zone` |
| `contact_email_clicked` | Clic sur un `mailto:` | `zone` |
| `service_link_clicked` | Lien vers une prestation | `service_slug` |
| `work_link_clicked` | Lien vers une réalisation | `work_slug` |
| `article_link_clicked` | Lien vers un article | `article_slug` |
| `legal_link_clicked`, `nav_link_clicked` | autres liens internes | `destination` |
| `social_link_clicked` | LinkedIn, GitHub, X, Malt… | `network`, `host` |
| `external_link_clicked` | tout autre domaine | `host` |

`zone` dit **d'où part le clic** : `header`, `footer`, `floating_nav`, ou le nom
de la section (`hero`, `about`, `showreel`, `works`, `whyus`, `services`,
`numbers`, `faq`, `testimonials`, `logoBand`, `articles`, `packs`).

### Prix

| Événement | Quand |
|---|---|
| `service_expanded` / `service_collapsed` | Ouverture/fermeture d'une ligne de l'accordéon Services (la grille tarifaire est dedans) |
| `pricing_viewed` | Ouverture d'une ligne, ou section `packs` d'une page prestation entrée dans le champ |

### Engagement

| Événement | Quand |
|---|---|
| `section_viewed` | Une section traverse la bande centrale de la fenêtre. `section`, `position`, `time_to_view_ms` |
| `scroll_depth_reached` | Paliers 25 / 50 / 75 / 100 % |
| `article_read_progress` | Mêmes paliers, sur un article. `depth`, `article_slug` |
| `article_completed` | 100 % d'un article |
| `page_engagement` | À la sortie : temps actif, profondeur maximale, liste des sections vues |
| `faq_opened` | Ouverture d'une question |
| `accordion_toggled` | Autre bascule `aria-expanded` |
| `menu_opened` | Menu flottant |
| `filter_applied` | Filtres des grilles blog et réalisations |

### Formulaires

Mesurés **par délégation**, sans que le formulaire ait à savoir quoi que ce soit :
`form_started` (premier focus), `form_field_completed` (perte de focus d'un
champ), `form_submitted` (soumission native, qui remonte même quand React fait
`preventDefault`).

`form_succeeded` et `form_failed` disent l'ISSUE, ce que `form_submitted` ne
peut pas dire : il part au clic, avant la réponse du serveur. Un envoi refusé
par la protection anti-robot y comptait donc comme une conversion. `form_failed`
porte `reason` (`captcha_absent`, `reponse_erreur`, `reseau`) et `status`.

**Aucune valeur saisie ne quitte le navigateur.** On enregistre le NOM du champ
et un booléen `filled`, jamais son contenu.

### Prise de rendez-vous

Six événements dédiés, parce que le parcours de réservation ne se ramène pas à
un formulaire : `rdv_type_selected` (`preselected` distingue le clic du sujet
imposé par `/services/*` ou `?sujet=`), `rdv_slots_loaded` (`slots_count` à zéro
= agenda vide, ce qui n'est pas une panne), `rdv_slots_failed`
(`non_configure` = Cal.com absent ou mal réglé, `reseau` = appel échoué),
`rdv_slot_selected` (`days_ahead`, jamais l'horaire, qui identifierait la
personne une fois croisé avec l'agenda), `rdv_confirmed`, `rdv_failed`.

`rdv_confirmed` EST LA SEULE CONVERSION. Il part sur la réponse du serveur,
jamais au clic.

Quand le sujet est imposé par la page (`/services/*`) ou par `?sujet=`,
`rdv_type_selected` attend que le bloc soit resté visible une demi-seconde, et
non le montage : émis au chargement, il devançait le `section_viewed` qui ouvre
l'entonnoir, et un entonnoir ordonné bloquait alors la visite à l'étape 1 quoi
qu'elle fasse ensuite.

### Automatique, en plus

Autocapture (tous les clics et changements), rageclick, dead clicks, heatmaps
(`$$heatmap`), Web Vitals (`$web_vitals`).

---

## 3. Entonnoirs à monter dans PostHog

**ILS SONT DÉJÀ MONTÉS** depuis le 2026-09-08, sur le tableau de bord
« Parcours commerciaux » :
https://eu.posthog.com/project/121262/dashboard/940936

Ils sont aussi déclarés en code (`RECOMMENDED_FUNNELS` dans
`src/lib/analytics/events.ts`) : le compilateur y refuse une étape qui n'existe
plus. **Les deux listes doivent rester d'accord** — modifier un entonnoir dans
l'interface sans toucher au code laisse une documentation qui ment. Pour en
ajouter un à la main : **Product analytics → New insight → Funnel**.

Le tableau porte aussi deux COURBES qui ne sont pas des entonnoirs et sans
lesquelles les entonnoirs se lisent de travers : « Pannes de créneaux » et
« Échecs d'envoi de formulaire », toutes deux décomposées par `reason`. Une
chute d'entonnoir sans coup d'œil à ces deux courbes se met sur le compte du
désintérêt alors qu'elle vient d'une panne.

1. **Prise de contact** (le principal) — fenêtre 7 jours
   `home_viewed` → `service_page_viewed` → `contact_page_viewed` → `form_submitted`
2. **Appel direct** — fenêtre 1 jour
   `$pageview` → `contact_phone_clicked`
3. **Effet du prix** — fenêtre 7 jours
   `home_viewed` → `service_expanded` → `pricing_viewed` → `cta_clicked` → `form_submitted`
4. **Blog vers contact** — fenêtre 7 jours
   `article_viewed` → `article_read_progress` (filtrer `depth = 75`) → `cta_clicked` → `form_submitted`
5. **La preuve convertit-elle** — fenêtre 7 jours
   `work_page_viewed` → `contact_page_viewed` → `form_submitted`
   À décomposer par `work_slug`.
6. **Canal e-mail** — fenêtre 1 jour
   `$pageview` → `contact_email_clicked`
7. **Prise de rendez-vous** — fenêtre 1 jour
   `section_viewed` (filtrer `section = rendez-vous`) → `rdv_type_selected` →
   `rdv_slots_loaded` → `rdv_slot_selected` → `form_submitted` → `rdv_confirmed`

   Une chute entre les étapes 2 et 3 se lit à côté de `rdv_slots_failed` AVANT
   d'être attribuée au désintérêt : une panne Cal.com dessine exactement la même
   courbe. Le 2026-09-06, les quatre types pointaient sur des identifiants
   inexistants et aucun créneau ne s'affichait ; rien ne le disait.

Avec quelques dizaines de visites par mois, **les taux ne veulent rien dire**.
Ce qui vaut, c'est le rejeu de session du prospect qu'Eliott vient d'appeler,
et l'endroit exact où il a décroché. Les entonnoirs servent à repérer CE
parcours-là, pas à faire des moyennes.

---

## 4. Consentement

### Ce qui est garanti, et vérifié

- **Aucun traceur avant le choix.** `posthog-js` est chargé par un `import()`
  dynamique déclenché uniquement après acceptation. Vérifié dans l'onglet
  réseau : zéro requête, zéro cookie, zéro entrée `localStorage` avant.
- **Refuser est aussi simple qu'accepter.** Deux boutons de géométrie
  strictement identique (même chaîne de classes), tous deux en aplat plein
  fortement contrasté (blanc 20,6:1, volt 14,4:1), sur le PREMIER écran, avec
  « Tout refuser » en premier dans l'ordre de lecture et de tabulation.
- **Trois finalités distinctes** : strictement nécessaire (le choix lui-même,
  exempté), mesure d'audience, enregistrement de session. Aucune case
  pré-cochée. Le rejeu est subordonné à la mesure — même SDK — et l'interface
  le dit.
- **Six mois** pour l'acceptation COMME pour le refus.
- **Révocable à tout moment** par le lien permanent en bas de chaque page.
  La révocation efface le choix, coupe l'émission et **retire les cookies
  `ph_…` déjà posés**.
- **Pas de blocage** : encart en bas, pas de voile, pas de modale plein écran.
  Le focus n'est piégé que dans le panneau « Personnaliser », qui s'annonce
  alors `role="dialog" aria-modal`.
- `respect_dnt: true` : le signal « Do Not Track » s'ajoute au consentement.

### Ce qui est stocké

`localStorage["eb-consent"]` :

```json
{ "version": 1, "decidedAt": 1787922092926, "choices": { "analytics": false, "replay": false } }
```

Rien d'autre. Pas d'identifiant. C'est un traceur exempté de consentement
(délibération CNIL n° 2020-091, art. 5) : sans lui la bannière se rouvrirait à
chaque page.

Un enregistrement absent, illisible, d'une autre `version`, daté du futur ou
périmé est traité comme **absent**, donc comme un refus, et rouvre la bannière.

### Brancher le lien de révocation ailleurs

N'importe quel élément portant `data-consent-open` rouvre le panneau, et
l'événement `window` `eb:consent:open` fait la même chose depuis du code hors
React. Le jour où `layout/Footer.tsx` pourra être édité, il suffira d'y poser un
lien avec cet attribut et de retirer `ConsentFooterBar` de `SiteDocument.tsx`.

### Changer les finalités

Incrémenter `CONSENT_VERSION` dans `src/lib/analytics/consent.ts`. Un
consentement donné pour deux finalités ne vaut pas pour une troisième : tous les
choix en cours sont alors invalidés et la bannière se rouvre. Mettre à jour
`src/content/consent.ts` **et** la politique de confidentialité.

---

## 5. Google Search Console — procédure de mise en ligne

À faire **une fois le site en ligne sur `https://www.eliottbouquerel.fr`**, dans
cet ordre. Une étape par ligne.

1. Ouvrir `https://search.google.com/search-console` avec le compte Google d'Eliott.
2. « Ajouter une propriété » → colonne **« Préfixe de l'URL »** (pas « Domaine », qui exige un enregistrement DNS).
3. Saisir exactement `https://www.eliottbouquerel.fr` — avec `https`, avec `www`, sans barre oblique finale.
4. Dans la liste des méthodes de validation, déplier **« Balise HTML »**.
5. Copier UNIQUEMENT la valeur de l'attribut `content`, sans la balise autour.
6. Renseigner `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<cette valeur>` dans les variables d'environnement de l'hébergement de production.
7. Redéployer. La variable est inlinée à la construction : sans redéploiement, la balise n'existe pas.
8. Vérifier : `curl -s https://www.eliottbouquerel.fr | grep google-site-verification` doit renvoyer une ligne.
9. Revenir dans Search Console et cliquer « Valider ».
10. **Ne jamais retirer la variable** ensuite : Google revérifie périodiquement et retire la propriété si la balise disparaît.
11. Menu « Sitemaps » → saisir `sitemap.xml` → « Envoyer ».
12. Vérifier que l'état passe à « Réussite » et que le nombre d'URL découvertes correspond à ce que renvoie `curl -s https://www.eliottbouquerel.fr/sitemap.xml | grep -c '<loc>'`.
13. Menu « Inspection de l'URL » → saisir `https://www.eliottbouquerel.fr/` → « Demander une indexation ». Répéter pour `/contact` et les trois pages `/services/…` : ce sont celles qui vendent.
14. Menu « Paramètres » → « Utilisateurs et autorisations » → vérifier qu'Eliott est bien « Propriétaire ».
15. Menu « Paramètres » → activer les **notifications par e-mail** : c'est ainsi qu'arrivent les alertes d'indexation et de sécurité.
16. Revenir au bout de **trois à sept jours** : avant, les rapports « Couverture » et « Performances » sont vides et cela n'a rien d'anormal.
17. Une fois les données arrivées, regarder « Performances » → onglet « Requêtes » : ce sont les mots que les prospects tapent réellement.

### Sitemap et robots

- `src/app/robots.ts` autorise tout sauf `/r/` (redirections des e-mails,
  voir §9) et déclare `sitemap.xml`.
- `src/app/(site)/sitemap.ts` dérive les URL de `src/content/routes.ts`.
- `lastModified` n'est publié **que là où une vraie date existe** : les articles
  (leur `date` dans `src/content/blog.ts`) et `/blog` (la plus récente d'entre
  elles). Inventer une date pour les autres routes se ferait repérer dès la
  deuxième exploration, et Google cesserait alors de lire la balise partout, y
  compris là où elle était juste.
- Ni `changeFrequency` ni `priority` : Google a annoncé publiquement les ignorer.
- **`/ingest` n'est volontairement PAS déclaré dans `robots.txt`.** Ce serait le
  meilleur moyen de faire figurer le chemin du proxy dans les listes de
  filtrage : elles sont alimentées, entre autres, en moissonnant les
  `robots.txt`. Le chemin ne répond qu'en POST et ne renvoie aucun contenu
  indexable ; le laisser silencieux est plus sûr que de l'annoncer.

---

## 6. Identification — point d'accroche NON branché

Le site reste **anonyme de bout en bout** : `person_profiles:
"identified_only"`, et rien n'appelle `identify`.

Le jour où le formulaire de contact aboutit, et **à ce moment-là seulement**,
appeler :

```ts
import { identifyVisitor } from "@/lib/analytics/posthog";

identifyVisitor(email, { source: "formulaire-contact" });
```

Appelé plus tôt, cela créerait un profil pour chaque visiteur de passage — ce
que `identified_only` sert justement à éviter. La fonction est sans effet si le
consentement n'a pas été donné.

---

## 7. Vérifier soi-même que rien ne fuit

Sur `localhost:3000`, onglet réseau filtré sur `ingest` :

| Situation | Attendu |
|---|---|
| Aucun choix fait | 0 requête, 0 cookie `ph_`, 0 entrée `localStorage` `ph_` |
| Après « Tout refuser » | idem, et le choix survit au rechargement |
| Après « Tout accepter » | `GET /ingest/static/…`, `POST /ingest/flags`, `POST /ingest/e`, tous sur l'origine du site |
| Après « Retirer mon consentement » | `eb-consent` effacé, cookies et entrées `ph_…` disparus |

Pour lire les événements émis : `localStorage.setItem("ph_debug","true")` puis
recharger. Chaque capture est journalisée dans la console sous la forme
`[PostHog.js] send "<nom>"`. Retirer la clé ensuite.

---

## 8. Pièges rencontrés, à ne pas rouvrir

- **`process.env` lu par clé variable.** Un helper `read(nom)` faisant
  `process.env[nom]` fonctionne côté serveur et rend la chaîne vide côté
  navigateur : le bundler n'inline que les accès écrits en toutes lettres. La
  bannière rendait alors son HTML serveur puis disparaissait à l'hydratation,
  sans une seule erreur. Voir l'entête de `src/lib/analytics/config.ts`.
- **Ordre de la purge à la révocation.** Effacer les cookies avant de couper la
  persistance du SDK ne sert à rien : il les réécrit dans la foulée. Il faut
  `set_config({ disable_persistence: true, disable_cookie: true })` d'abord.
- **`posthog-js` est un singleton.** Rappeler `init()` après un refus ne
  réapplique rien. Le parcours « accepte → révoque → réaccepte » passe par
  `set_config` + `opt_in_capturing`, pas par un second `init`.
- **`/ingest/static/:path*` doit précéder `/ingest/:path*`** dans les
  réécritures, sinon les modules du SDK sont demandés au mauvais domaine.
- **Rejeu et heatmaps se règlent AUSSI côté projet PostHog.** Le code peut être
  parfait, si l'interrupteur du projet est fermé il ne se passe rien.

---

## 9. Clics sur les liens des e-mails

Le lien « Prendre contact » de la signature des e-mails de prospection pointe
vers `https://eliottbouquerel.fr/r/<id>`, un identifiant unique par e-mail
généré par le pipeline d'envoi. Aucun pixel, aucun cookie : seul le clic est
connu.

| Quoi | Où |
|---|---|
| Route | `src/app/r/[id]/route.ts` |
| Logique (pure, injectée) | `src/lib/clic/signature.ts` |
| Tests | `src/lib/clic/signature.test.mjs` |

- **Réponse.** Toujours un 302 vers
  `/contact?utm_source=email&utm_medium=signature&utm_campaign=prospection`,
  avec `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow` et
  `Referrer-Policy: no-referrer`. La destination est fixe, rien de la requête
  n'y entre. `robots.txt` interdit `/r/`.
- **Notification.** Seulement pour un `GET` dont l'identifiant matche
  `^[a-z0-9-]{3,80}$`. `HEAD` et identifiant invalide redirigent sans rien
  envoyer. L'envoi part après la réponse (`after()`), par le mailer du
  formulaire de contact (Resend, sinon SMTP), vers `CONTACT_TO_EMAIL`. Un échec
  est journalisé (`[clic] notification_echouee`, identifiant seul) et ne touche
  jamais la redirection.
- **Format**, parsé par le pipeline, à ne pas modifier sans lui. Sujet
  `Clic signature : <id>`, corps :

  ```
  Identifiant : <id>
  Date : <ISO 8601 UTC>
  Navigateur : <user-agent, une ligne, 300 caractères au plus>
  Robot probable : oui|non
  ```

  `oui` quand le user-agent est vide ou ressemble à un robot, un aperçu de
  lien, une passerelle de sécurité (SafeLinks, Proofpoint, Mimecast,
  Barracuda) ou un client HTTP. Ces passerelles suivent les liens avant le
  destinataire : un `oui` n'est pas un clic humain.
- **Plafond.** Une notification par identifiant toutes les 10 minutes, 30 par
  heure au total, au-delà redirection sans notification. Compteurs en mémoire
  du processus : remis à zéro à chaque redéploiement.
- **Sonder la production en `HEAD` uniquement** (`curl -I`). Un `GET` avec un
  identifiant valide envoie une vraie notification.
