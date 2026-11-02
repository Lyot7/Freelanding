# Prise de rendez-vous : moteur du cockpit

Depuis le 2026-11-02, le bloc « Réserver un créneau » du site ne passe plus par
Cal.com. Le moteur de réservation est le cockpit d'Eliott
(`admin.eliottbouquerel.fr`) : il calcule les créneaux libres depuis Google
Agenda, pose l'événement avec un lien Meet, écrit au prospect, met la fiche
client à jour et bloque les relances de prospection. Le site garde son interface
(composant, questionnaire, Turnstile, limites) et n'a changé que de moteur.

Raison du changement : Cal.com voyait les données d'Eliott et de ses prospects,
et deux réservations Cal.com n'avaient pas atteint le cockpit (une relance
allait partir chez un prospect qui avait réservé).

## 1. Le chemin d'une réservation

```
navigateur ──> /api/rendez-vous/creneaux ──> cockpit GET  /api/rdv/creneaux
navigateur ──> /api/rendez-vous          ──> cockpit POST /api/rdv
                (origine, débit, captcha)     (Bearer RDV_TOKEN, serveur à serveur)
```

- Le navigateur ne parle qu'au site. Le jeton `RDV_TOKEN` ne quitte jamais le
  serveur du site : `src/lib/rendez-vous/cockpit.ts` n'est importé que par des
  routes et des pages serveur.
- Les types sont désignés par leur clé cockpit (`CLES_COCKPIT` dans
  `src/lib/rendez-vous/config.ts`) : `logiciel` et `decouverte` aujourd'hui.
  Le cockpit connaît aussi `site`, `ia`, `cto`, `demonstration` et
  `point-d-etape` ; le sélecteur du site n'en propose que deux depuis le
  2026-10-31.
- Les durées viennent de `GET /api/rdv/types` du cockpit (gardées cinq minutes).
  Le cockpit est l'autorité : la durée du contenu (`src/content/rendez-vous.ts`)
  n'est qu'un affichage.
- Les réponses au questionnaire partent deux fois : en texte dans `notes`
  (composé par `composerNotes`, téléphone facultatif en première ligne, c'est ce
  qu'Eliott lit dans son agenda), et brutes dans `reponses` (identifiants).
- Horizon : 60 jours (`HORIZON_JOURS`, le même qu'au cockpit). Préavis réel :
  deux heures, tenu par le cockpit ; le site ne filtre qu'à une heure.

### Ce que le site renvoie au navigateur

| Cas | Réponse du cockpit | Réponse du site |
|---|---|---|
| Réservé | 201 | 200 `{ ok: true }` |
| Créneau pris entre-temps | 409 `creneau_pris` | 409, « Ce créneau vient d'être pris », champ `creneau` |
| Jeton refusé, champs refusés | 401, 400 | 502, repli « écrivez-moi » |
| Cockpit sans `RDV_TOKEN`, agenda en panne | 503, 502 | 502, repli « écrivez-moi » |
| Cockpit injoignable, délai dépassé | aucune | 504, repli « écrivez-moi » |
| Site sans `RDV_TOKEN` | non appelé | 503, et le bloc n'est pas rendu |

Le code d'erreur du cockpit va au journal serveur (`[rendez-vous] …`), jamais au
navigateur.

## 2. Déplacer ou annuler : `/rdv/gerer/[jeton]`

Le mail de confirmation et la description de l'événement Google portent le lien
`https://eliottbouquerel.fr/rdv/gerer/<jeton>`. Le jeton (32 octets, base64url)
est la seule preuve demandée : pas de captcha, page `noindex`, sans référent,
sans nom ni e-mail affichés.

- La page lit le rendez-vous au cockpit côté serveur
  (`GET /api/rdv/gestion/[jeton]`) et montre sujet, date et heure de Paris,
  durée. États : à venir (actions), annulé, déplacé (ancien lien), passé (dès
  l'heure de début), lien inconnu, cockpit injoignable.
- **Annuler** : motif facultatif (1 000 caractères au plus), puis
  `POST /api/rendez-vous/gestion/[jeton]/annuler` → cockpit
  `POST /api/rdv/gestion/[jeton]/annuler`.
- **Déplacer** : le calendrier et la colonne des heures du formulaire
  (`Calendrier`, `Heures`, exportés de `ReservationRendezVous.tsx`), nourris par
  `GET /api/rendez-vous/gestion/[jeton]/creneaux` au type et à la durée du
  rendez-vous, puis `POST /api/rendez-vous/gestion/[jeton]/deplacer`. Le
  cockpit rend un jeton neuf : la page remplace son adresse par le nouveau lien.
- Protections des routes de gestion (`src/lib/rendez-vous/garde-gestion.ts`) :
  origine, `content-type` JSON pour les écritures, débit (6 écritures et 40
  lectures par quart d'heure et par adresse), format du jeton avant tout appel,
  503 sans `RDV_TOKEN`.

## 3. Variables d'environnement (application Coolify du site)

| Variable | Valeur | Secret |
|---|---|---|
| `RDV_TOKEN` | le même jeton que `RDV_TOKEN` du cockpit | oui |
| `COCKPIT_URL` | facultative, `https://admin.eliottbouquerel.fr` par défaut | non |

Sans `RDV_TOKEN`, le bloc de réservation ne se rend pas et les routes répondent
503 : c'est l'état par défaut du dépôt. `COCKPIT_URL` n'accepte `http:` que vers
la machine locale (le jeton partirait en clair). Les variables `CAL_COM_*` ne
servent plus et peuvent être retirées de Coolify.

Les variables sont lues au rendu : après les avoir posées, redéployer.

## 4. Recette, une fois les variables posées

1. `/contact`, onglet rendez-vous : le calendrier montre des créneaux, en
   semaine, à l'heure de Paris.
2. Réserver un créneau de test : l'événement apparaît dans Google Agenda avec
   le lien Meet, le mail de confirmation arrive, la fiche apparaît au cockpit.
3. Ouvrir le lien « déplacer ou annuler » du mail : déplacer, vérifier que
   l'événement Google a bougé et que l'adresse de la page a changé ; l'ancien
   lien affiche « Rendez-vous déplacé ».
4. Annuler : l'événement disparaît, la page affiche « Rendez-vous annulé ».

## 5. Où vit quoi

| Fichier | Rôle |
|---|---|
| `src/lib/rendez-vous/cockpit.ts` | client du cockpit : créneaux, durées, réservation, gestion par jeton |
| `src/lib/rendez-vous/config.ts` | `RDV_TOKEN`, `COCKPIT_URL`, clés des types, sujets d'URL |
| `src/lib/rendez-vous/gestion.ts` | états de la page, validation annuler/déplacer, traduction des refus |
| `src/lib/rendez-vous/garde-gestion.ts` | contrôles communs des routes de gestion |
| `src/app/api/rendez-vous/` | routes du formulaire et de la gestion |
| `src/app/(site)/rdv/gerer/[jeton]/page.tsx` | page de gestion |
| `src/components/rendez-vous/` | formulaire et actions de gestion |
| `src/content/rendez-vous.ts` | tous les textes, page de gestion comprise |

Côté cockpit : `src/lib/rdv/` et `src/app/api/rdv/` (spécification :
`.claude/spec-rdv-maison.md` du dépôt Cockpit).
