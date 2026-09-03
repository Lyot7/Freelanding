# CAL.COM — prise de rendez-vous sur mesure

Le bloc « Réserver un créneau » de `/contact` n'est **pas** un embed Cal.com.
C'est une interface écrite ici, dans le dessin du site, qui parle à l'API
publique v2 par deux routes à nous. Ce document dit ce qu'il reste à faire chez
Cal.com, ce que le code ne peut pas faire à ta place, et pourquoi les durées
recommandées sont celles-là.

---

## 1. Le fait vérifié qui rend tout ça possible

L'embed n'est obligatoire pour personne. Les deux points de terminaison
employés répondent **sans clef d'API**. Vérifié à la main le 2026-08-31, en
ligne de commande :

```bash
# Créneaux : 200, sans le moindre en-tête d'autorisation.
curl -s -o /dev/null -w '%{http_code}\n' \
  'https://api.cal.com/v2/slots?eventTypeSlug=15min&username=rick&start=2026-09-01&end=2026-09-03&timeZone=Europe/Paris' \
  -H 'cal-api-version: 2024-09-04'
# -> 200

# Réservation : 400 sur la VALIDATION du corps, pas 401 sur l'autorisation.
curl -s -X POST 'https://api.cal.com/v2/bookings' \
  -H 'cal-api-version: 2024-08-13' -H 'Content-Type: application/json' -d '{}'
# -> 400 BadRequestException : « start property is wrong… attendee should not be
#    null… eventTypeId or eventTypeSlug + username must be provided »

# Et avec un corps valide mais un identifiant inexistant :
curl -s -X POST 'https://api.cal.com/v2/bookings' \
  -H 'cal-api-version: 2024-08-13' -H 'Content-Type: application/json' \
  -d '{"start":"2027-09-01T13:00:00Z","eventTypeId":999999999,
       "attendee":{"name":"Test","email":"t@exemple.invalid",
                   "timeZone":"Europe/Paris","language":"fr"}}'
# -> 404 « Event type with id 999999999 not found. »
```

Un 401 aurait voulu dire « il faut une clef ». Un 400 puis un 404 veulent dire
« l'endpoint est ouvert, c'est ton corps qui est faux ». D'où une interface
entièrement dessinée, sans iframe, sans seconde feuille de style, sans script
tiers dans le navigateur du prospect.

**L'en-tête de version est obligatoire et il DIFFÈRE d'un endpoint à l'autre :**
`2024-09-04` pour les créneaux, `2024-08-13` pour les réservations. Sans lui,
Cal.com sert une version antérieure, qui réclame des champs que l'on n'envoie
pas. Les deux valeurs vivent dans `src/lib/rendez-vous/cal-com.ts`.

---

## 2. Ma recommandation de durées, et pourquoi

Tu penchais pour 15 à 20 minutes plutôt que 30 sur une première prise de
contact. **Tu as raison sur trois cas sur quatre, et tort sur le quatrième.**
Voilà ce que je propose, et l'argument derrière chaque ligne.

| Type de rendez-vous     | Durée | Pourquoi cette durée |
| ----------------------- | ----- | -------------------- |
| Un site                 | **20 min** | Assez pour couvrir ce qui existe, ce qui coince, l'échéance et l'ordre de grandeur du budget. Assez court pour qu'on le réserve sans en parler à personne. |
| Un outil métier         | **20 min** | Même raisonnement. Le sujet est concret (« qu'est-ce que vous faites à la main aujourd'hui »), il n'appelle pas de tour d'horizon. |
| Un logiciel sur mesure  | **30 min** | Plusieurs utilisateurs, plusieurs rôles, des données à tenir. Cadrer ça en 20 minutes produit une estimation fausse, et une estimation fausse coûte infiniment plus cher que dix minutes d'agenda. |
| Je ne sais pas encore   | **15 min** | Le prospect n'a pas de quoi remplir vingt minutes : il a un problème, pas encore une demande. Le but ici n'est pas de cadrer, c'est de qualifier puis de reprendre un créneau plus long. Quinze minutes est la barrière la plus basse qu'on puisse poser. |

**L'argument de fond.** Un créneau court se réserve plus facilement, c'est
mécanique : moins d'engagement demandé, moins d'hésitation. Mais il ne s'agit
pas de maximiser le nombre de rendez-vous, il s'agit de maximiser le nombre de
rendez-vous **utiles**. Un rendez-vous de 20 minutes sur un logiciel métier ne
produit pas une demi-information : il produit une information fausse, sur
laquelle tu chiffres, et que tu paies ensuite pendant tout le projet. Le bon
réglage n'est donc ni « toujours court » ni « toujours 30 », c'est **une durée
par type** — et c'est exactement ce que le sélecteur d'entrée permet. C'est lui
qui justifie l'existence des quatre entrées, bien plus que le confort
d'affichage.

**Sur les 30 minutes que tu voulais éviter.** Elles ne sont pas le problème en
soi. Le problème, c'est 30 minutes demandées à quelqu'un qui n'a pas encore
décidé de te parler. Quelqu'un qui clique « Un logiciel sur mesure » a déjà
décidé : lui demander 30 minutes ne lui coûte rien, et lui en demander 20
t'obligerait à en reprendre 30 la semaine suivante.

**Ce que je ne recommande pas :** un créneau unique de 15 minutes pour tout.
Tu aurais un taux de réservation plus haut et des rendez-vous où tu passerais
les cinq dernières minutes à dire « il faudrait qu'on se reparle ». C'est un
rendez-vous de plus à caler, pas un de gagné.

---

## 3. Créer les quatre types d'événements, étape par étape

Compte Cal.com gratuit, aucune carte bancaire, aucune facturation à ouvrir.
Répète la procédure quatre fois, une par ligne du tableau ci-dessus.

### 3.1 Le compte et la disponibilité, une fois pour toutes

1. Créer le compte sur <https://cal.com/signup>. Le nom d'utilisateur choisi
   devient l'URL publique `cal.com/<username>` : c'est lui qui ira dans
   `CAL_COM_USERNAME`.
2. **Connecter l'agenda** : `Settings > Calendars > Add > Google Calendar`
   (ou Apple/Outlook). Sans ça, Cal.com propose des créneaux où tu es déjà pris.
   C'est la seule étape dont l'oubli produit un vrai dégât : un double
   rendez-vous.
   Coche la case « check for conflicts » sur l'agenda concerné, et choisis
   l'agenda de destination où les rendez-vous seront écrits.
3. **Créer une disponibilité dédiée** : `Availability > New > « Prospection »`.
   Ma recommandation : **mardi, mercredi et jeudi, 14 h — 18 h**, fuseau
   `Europe/Paris`. Raison : ça laisse les matinées entières hors de portée d'un
   rendez-vous, et les matinées sont le seul moment où on écrit du code
   sérieusement. Lundi et vendredi restent libres pour les rendez-vous clients
   en cours.
4. Cette disponibilité sera assignée aux quatre types d'événements. Une seule à
   maintenir.

### 3.2 Chaque type d'événement

`Event Types > New`, puis, onglet par onglet :

**Onglet « Setup »**

| Champ | Valeur |
| ----- | ------ |
| Title | `Un site`, `Un outil métier`, `Un logiciel sur mesure`, `Je ne sais pas encore` |
| URL (slug) | `site-20min`, `outil-20min`, `logiciel-30min`, `decouverte-15min` |
| Description | Reprendre la description affichée sur le site (`src/content/rendez-vous.ts`) : elle sera reprise dans l'e-mail de confirmation. |
| Duration | 20 / 20 / 30 / 15 minutes |
| Location | **Cal Video**. C'est ce qui fait générer le lien de visioconférence annoncé par l'écran de succès du site. Ne pas laisser « Attendee phone number » ni « Link meeting » : le premier exige un champ que notre formulaire n'envoie pas, le second exige une URL. |

**Onglet « Availability »** : sélectionner la disponibilité `Prospection`.

**Onglet « Limits »**

| Réglage | Valeur | Pourquoi |
| ------- | ------ | -------- |
| Minimum notice | **4 heures** | Un prospect motivé aujourd'hui doit pouvoir réserver demain matin. Vingt-quatre heures est le réglage réflexe, et il coûte les rendez-vous les plus chauds. Quatre heures suffisent à ne pas être pris en embuscade. Si tu préfères une marge confortable, monte à 12 h, pas à 24. |
| Buffer after event | **10 minutes** | Prendre trois notes et souffler. Sans lui, deux rendez-vous consécutifs se touchent et le second démarre en retard. |
| Buffer before event | 0 | Le préavis fait déjà ce travail. |
| Time-slot intervals | **15 minutes** | Granularité des heures proposées sur le site. Plus fin donne un mur d'heures, plus large fait perdre des créneaux. |
| Limit future bookings | **30 jours glissants** | Au-delà, personne ne tient son agenda. Notre code borne de son côté à 120 jours (`HORIZON_JOURS`) : le plus strict des deux gagne, c'est-à-dire Cal.com. |
| Limit booking frequency | 3 par jour, 8 par semaine | Facultatif. Empêche une journée entière de disparaître en appels de découverte. |

**Onglet « Advanced » — c'est ici que ça se joue**

> ⚠️ **Un champ de réservation OBLIGATOIRE que notre formulaire n'envoie pas
> fait échouer la réservation, en 400, pour tout le monde.** C'est le seul
> réglage de cette page qui peut casser le site depuis Cal.com.

| Champ de réservation | État attendu | Pourquoi |
| -------------------- | ------------ | -------- |
| `name` (Your name) | activé, obligatoire | Envoyé par le formulaire. |
| `email` (Email address) | activé, obligatoire | Envoyé par le formulaire. |
| `notes` (Additional notes) | **activé, FACULTATIF** | Le message libre du formulaire y est déposé. S'il est désactivé, Cal.com refuse la réponse ; s'il est obligatoire, un prospect qui ne l'a pas rempli est refusé. |
| `attendeePhoneNumber` | **désactivé** | Non envoyé. |
| `title` (What is this meeting about) | **désactivé** | Non envoyé. |
| `guests` | désactivé | Non envoyé, et sans usage ici. |
| Tout champ personnalisé ajouté plus tard | **facultatif obligatoirement** | Même raison. Un champ personnalisé requis casse la route le jour où tu l'ajoutes, sans rien changer dans le dépôt. |

Toujours dans « Advanced » :

- **Requires confirmation** : laisser **désactivé**. Activé, le prospect reçoit
  « en attente de confirmation » là où l'écran de succès du site lui annonce que
  c'est réservé. Les deux messages se contrediraient.
- **Requires booker email verification** : laisser **désactivé**. Activé,
  Cal.com attend un code à six chiffres (`emailVerificationCode`) que notre
  formulaire n'envoie pas.
- **Hide notes in calendar** : au choix, sans effet sur le site.

**Onglet « Workflows »** (facultatif, mais recommandé)

- `Email reminder to attendee`, 1 heure avant. Réduit les absences, et c'est
  gratuit sur l'offre de base. L'e-mail part en français : la langue du
  participant est transmise par notre code (`attendee.language: "fr"`).

---

## 4. Les variables d'environnement

Gabarit complet et commenté dans `.env.example`. En local, les valeurs vont
dans `.env.local` (permissions `0600`, jamais versionné) ; en production, dans
le gestionnaire de secrets du service.

| Variable | Où la trouver | Obligatoire ? |
| -------- | ------------- | ------------- |
| `CAL_COM_USERNAME` | Le `<username>` de ton URL publique `cal.com/<username>`. Aussi dans `Settings > My Account > Username`. | Seulement si les variables ci-dessous portent des **slugs**. |
| `CAL_COM_EVENT_SITE` | Slug ou identifiant du type « Un site ». | Non, mais son absence retire l'entrée du sélecteur. |
| `CAL_COM_EVENT_OUTIL` | Idem, « Un outil métier ». | Non. |
| `CAL_COM_EVENT_LOGICIEL` | Idem, « Un logiciel sur mesure ». | Non. |
| `CAL_COM_EVENT_DECOUVERTE` | Idem, « Je ne sais pas encore ». | Non. |

**Deux façons de désigner un type d'événement**, au choix, variable par
variable :

- le **slug**, lu dans l'URL publique. `cal.com/eliott/site-20min` donne
  `CAL_COM_EVENT_SITE=site-20min`. Facile à recopier, mais il change si tu
  renommes l'URL de l'événement, et il exige `CAL_COM_USERNAME` ;
- l'**identifiant numérique**, lu dans l'URL de l'écran d'édition.
  `app.cal.com/event-types/1234567?tabName=setup` donne
  `CAL_COM_EVENT_SITE=1234567`. Il survit à un renommage et se suffit à
  lui-même.

Recommandation : les **slugs** pour démarrer, ils se vérifient à l'œil ; les
identifiants le jour où tu renommes.

**Aucun secret là-dedans.** Ces valeurs sont publiques par construction : elles
figurent déjà dans l'URL de ta page de réservation. Elles restent malgré tout
côté serveur, parce qu'il n'y a aucune raison de publier la carte de ta
configuration dans le paquet JavaScript de chaque visiteur.

### Ce que produit chaque état

| État | Ce que voit le visiteur | Ce que répondent les routes |
| ---- | ----------------------- | --------------------------- |
| Aucune variable posée | **Rien.** La section n'existe pas dans le HTML. Le reste de `/contact` est intact. | `503` avec un message honnête. |
| Une seule variable posée | Le sélecteur ne propose que cette entrée. | Normal pour elle, `503` pour les autres. |
| Turnstile non configuré | Les créneaux s'affichent, la confirmation annonce l'indisponibilité et renvoie vers l'adresse e-mail. | `503` sur `POST /api/rendez-vous`. |
| Cal.com en panne | Message d'erreur et bouton « Réessayer ». | `502` ou `504`. |

> ⚠️ **Ces variables sont lues au RENDU.** Sur une page prérendue à la
> construction, leur valeur y est figée. Les poser en production ne suffit pas :
> il faut **redéployer**.

---

## 5. Ce qui reste à faire chez Cal.com, et que le code ne fera jamais

Le dépôt ne contient pas ton compte. Tout ce qui suit se règle dans l'interface
Cal.com, et seulement là :

1. **Créer le compte et les quatre types d'événements** (partie 3).
2. **Connecter l'agenda** — la seule étape dont l'oubli produit un double
   rendez-vous.
3. **Régler durées, disponibilité, préavis, tampons et fenêtre de réservation.**
   Le site n'en sait rien et n'a pas à en savoir : ce sont des décisions
   d'agenda, elles doivent pouvoir changer sans déployer. Corollaire : les
   durées **affichées** sur le site vivent dans `src/content/rendez-vous.ts`.
   Si tu changes une durée chez Cal.com, change-la là aussi — rien ne peut le
   détecter automatiquement.
4. **Choisir le lieu** (Cal Video) et vérifier que le lien de visioconférence
   est bien généré, en réservant **toi-même** un créneau une fois, puis en
   l'annulant.
5. **Vérifier la liste des champs de réservation** après chaque modification
   d'un type d'événement (partie 3.2, tableau « Advanced »).
6. **Signer l'accord de sous-traitance (DPA) de Cal.com** et récupérer les
   clauses contractuelles types. `src/content/legal.ts` les annonce déjà comme
   la base du transfert hors UE : la page est en avance sur le contrat tant que
   ce n'est pas fait. `Settings > Security` chez Cal.com, ou par leur support.
7. **Régler la langue du compte en français**, pour que les e-mails de
   confirmation et d'annulation ne partent pas en anglais. Notre code envoie
   déjà `attendee.language: "fr"`, mais le gabarit de l'organisateur suit son
   propre réglage.

---

## 6. RGPD — ce que dit déjà `src/content/legal.ts`, et ce qui manque

**Contrôlé, pas modifié** : ce chantier n'a touché aucun texte légal.

Ce qui est **déjà juste** :

- Cal.com est nommé dans les mentions légales (prestataire de stockage, adresse
  complète) et dans la politique de confidentialité (sous-traitant, États-Unis,
  clauses contractuelles types de la décision d'exécution (UE) 2021/914).
- La politique écrit noir sur blanc « quand vous remplissez le formulaire, **que
  vous réservez un créneau** ou que vous m'écrivez », et liste nom, adresse
  e-mail et contenu du message. C'est exactement ce que le formulaire envoie :
  `name`, `email`, et le message libre déposé dans le champ `notes`.
- La finalité applicable est « répondre à votre demande et préparer un devis »,
  base légale « mesures précontractuelles » (art. 6.1.b), conservation 3 ans.
  Elle couvre la prise de rendez-vous sans acrobatie.

Ce qui est **meilleur que prévu**, et qui mérite d'être su : parce que le
navigateur ne parle jamais à Cal.com — tout passe par nos routes — **Cal.com ne
voit ni l'adresse IP du visiteur, ni son navigateur, et ne dépose aucun cookie
chez lui**. Avec l'embed, ce serait l'inverse : un script tiers, des cookies, et
une catégorie de plus à faire accepter dans la bannière de consentement. Il n'y
a donc **rien à ajouter dans `src/content/consent.ts`**, et c'est vérifié : le
fichier ne mentionne pas Cal.com, et il n'a pas à le faire.

**Trois écarts constatés. Signalés, non corrigés** — la copie du site est
réécrite par un autre chantier, ces lignes lui reviennent :

1. **Durée de conservation chez Cal.com.** La politique donne la durée de
   conservation *de mon côté* (3 ans) mais ne dit rien de ce que Cal.com garde
   d'un rendez-vous passé ou annulé. Une phrase suffirait.
2. **Turnstile au singulier.** La finalité anti-robot est rédigée « bloquer les
   envois automatisés **sur le formulaire** ». Il y a désormais deux
   formulaires, et la réservation est protégée par le même mécanisme. Le
   pluriel serait plus exact.
3. **Le message libre du rendez-vous.** Il est couvert par « le contenu de votre
   message », mais un lecteur pointilleux peut lire cette ligne comme ne visant
   que le formulaire de contact. Rendre explicite que la note jointe à une
   réservation part aussi chez Cal.com lèverait l'ambiguïté.

Aucun de ces trois points n'est un manquement : ce sont des précisions.

---

## 7. Recette, une fois les variables posées

Dans l'ordre, et sans créer une seule vraie réservation avant le point 5 :

1. `bun run dev`, puis `/contact`. La section « Réserver un créneau »
   apparaît, avec exactement les entrées dont la variable est renseignée.
2. `curl -s 'http://localhost:3000/api/rendez-vous/creneaux?type=site' | head -c 400`
   doit rendre une fenêtre et des jours. Un `503` signifie que la variable n'est
   pas lue (serveur non redémarré, la plupart du temps).
3. Cliquer une entrée, vérifier que les créneaux affichés correspondent à ta
   disponibilité **en heure de Paris**, et que la semaine suivante fonctionne.
4. Vérifier les bornes : le bouton « semaine précédente » est désactivé sur la
   semaine en cours, « semaine suivante » l'est au bout de la fenêtre autorisée.
5. **Réserver un créneau toi-même, une fois.** Vérifier l'e-mail de
   confirmation, la présence du lien de visioconférence, la reprise du message
   libre dans la note, et l'apparition dans ton agenda. **Puis annuler.**
6. Vérifier le chemin d'erreur sans rien casser : remplacer temporairement une
   variable par `999999999`, tenter une confirmation, constater le message de
   repli vers l'adresse e-mail. Remettre la bonne valeur.

---

## 8. Où vit quoi

| Fichier | Rôle |
| ------- | ---- |
| `src/content/rendez-vous.ts` | Les quatre entrées et tout le texte affiché. Seul endroit à toucher pour changer un libellé ou une durée affichée. |
| `src/lib/rendez-vous/config.ts` | Lecture de l'environnement, résolution slug/identifiant. |
| `src/lib/rendez-vous/creneaux.ts` | Dates, fuseau, bornes de fenêtre, lecture des créneaux. Module pur. |
| `src/lib/rendez-vous/validation.ts` | Validation serveur d'une réservation. Module pur. |
| `src/lib/rendez-vous/cal-com.ts` | Le client HTTP, et les deux versions d'en-tête. |
| `src/lib/rendez-vous/limites.ts` | Débits autorisés par adresse. |
| `src/app/api/rendez-vous/creneaux/route.ts` | `GET` — créneaux d'une semaine. |
| `src/app/api/rendez-vous/route.ts` | `POST` — création de la réservation. |
| `src/components/rendez-vous/SectionRendezVous.tsx` | Composant serveur : décide si la section existe. |
| `src/components/rendez-vous/ReservationRendezVous.tsx` | Composant client : les trois étapes. |
