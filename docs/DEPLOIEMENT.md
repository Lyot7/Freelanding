# Déploiement sur Coolify

Le site est construit par **Nixpacks** avec **Bun**, à partir de la branche
`main` du dépôt GitHub. Aucun Dockerfile, aucun `docker-compose.yaml` : la
configuration tient dans `nixpacks.toml`, à la racine.

## Pourquoi Nixpacks et pas Docker

Le besoin est une application Next.js sans service annexe : pas de base de
données, pas de file d'attente, pas de second conteneur. Un Dockerfile
multi-étages apporterait une image plus légère et une reproductibilité au
gramme près, au prix de deux fichiers à tenir à jour à chaque montée de version
de Bun ou de Next.

Nixpacks détecte le projet seul, mais **il choisit npm** dès qu'il voit un
`package.json`. `nixpacks.toml` lui impose Bun et les commandes exactes, ce qui
coûte huit lignes et supprime toute ambiguïté.

Si un jour le site gagne une base de données ou un service à côté, c'est le
moment de repasser à Docker Compose, pas avant.

## Réglages de l'application dans Coolify

| Réglage | Valeur |
| --- | --- |
| Build Pack | **Nixpacks** |
| Repository | `Lyot7/Freelanding` |
| Branch | `main` |
| Base Directory | `/` |
| Port | `3000` |
| Domaine | `https://www.eliottbouquerel.fr` |

Le type de build est le premier réglage à changer : l'application était en
**Docker Compose** pour l'ancien projet SvelteKit, et cherchait un
`docker-compose.yaml` qui n'existe plus.

## Les variables d'environnement

**Quatre d'entre elles doivent être cochées « Build variable ».** Next fige les
variables `NEXT_PUBLIC_*` dans le JavaScript envoyé au navigateur pendant
`next build` : posées seulement au démarrage, elles n'existent pas côté client.
Le symptôme est silencieux, le formulaire se déploie désactivé sans une seule
erreur dans les journaux.

| Variable | Build | Rôle | Si absente |
| --- | :---: | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | **oui** | adresse canonique, sitemap, données structurées | replis sur `http://localhost:3000`, ce qui casse le sitemap en production |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | **oui** | widget anti-robot du formulaire | formulaire désactivé, message honnête affiché |
| `TURNSTILE_SECRET_KEY` | non | vérification du jeton côté serveur | idem |
| `NEXT_PUBLIC_POSTHOG_KEY` | **oui** | mesure d'audience | aucune mesure, aucune erreur |
| `NEXT_PUBLIC_POSTHOG_HOST` | **oui** | hôte d'ingestion | replis sur l'Union européenne |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | **oui** | preuve de propriété Search Console | balise absente |
| `SMTP_HOTE` | non | envoi du formulaire | route en 503, message honnête |
| `SMTP_PORT` | non | port SMTP | replis sur 465 |
| `SMTP_UTILISATEUR` | non | compte SMTP | route en 503 |
| `SMTP_MOT_DE_PASSE` | non | mot de passe d'application | route en 503 |
| `CONTACT_FROM_EMAIL` | non | expéditeur affiché | route en 503 |
| `CONTACT_TO_EMAIL` | non | destinataire des demandes | route en 503 |
| `RESEND_API_KEY` | non | chemin d'envoi préféré s'il est posé | bascule sur SMTP |
| `CAL_COM_USERNAME` | non | compte Cal.com | prise de rendez-vous masquée |
| `CAL_COM_EVENT_SITE` | non | type d'événement « un site » | entrée masquée |
| `CAL_COM_EVENT_OUTIL` | non | type « un outil » | entrée masquée |
| `CAL_COM_EVENT_LOGICIEL` | non | type « un logiciel » | entrée masquée |
| `CAL_COM_EVENT_DECOUVERTE` | non | type « je ne sais pas encore » | entrée masquée |

**Aucune absence ne provoque d'erreur visible pour le visiteur** : chaque
fonction se désactive proprement et le dit. C'est voulu, et c'est aussi ce qui
rend les oublis difficiles à repérer. D'où ce tableau.

## Le déploiement automatique

Coolify redéploie à chaque poussée sur `main` **si le webhook GitHub est
posé**. Dans Coolify, onglet **Webhooks** de l'application, copier l'URL de
déploiement, puis dans GitHub, `Settings` → `Webhooks` → `Add webhook`, coller
l'URL, choisir `application/json` et l'événement `push` seul.

Le raccourci : si le dépôt est connecté par une **GitHub App** plutôt que par
une URL publique, Coolify pose le webhook tout seul et il n'y a rien à faire.

## Vérifier après le premier déploiement

1. `https://www.eliottbouquerel.fr` répond en 200, et `/contact` aussi. C'était
   le défaut de l'ancien site : la racine répondait, `/contact` renvoyait 404.
2. Le formulaire de contact envoie vraiment. **Un accusé `250` du serveur ne
   prouve rien** : le rejet arrive après, sous forme de message de
   `mailer-daemon`. Vérifier la réception, pas l'envoi.
3. Le widget anti-robot s'affiche. S'il manque, la variable de site n'était pas
   cochée « Build variable ».
4. `https://www.eliottbouquerel.fr/sitemap.xml` liste 30 adresses en `https://`
   et non en `localhost`.
