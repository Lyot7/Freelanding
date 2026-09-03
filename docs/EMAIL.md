# Envoi des e-mails et protection des formulaires

Ce que ce document couvre : la mise en service des trois formulaires du site.
Ils postent tous sur `POST /api/contact`, qui envoie deux e-mails (notification
à Eliott, accusé de réception au prospect) et vérifie un jeton Cloudflare
Turnstile. Les e-mails partent par Resend, ou à défaut par SMTP : le chemin de
repli est décrit en section 4 bis, et il permet de publier sans attendre la
vérification DNS du domaine.

Tant que les clefs ne sont pas posées, **la route répond 503 et le formulaire
affiche un message explicite renvoyant vers `contact@eliottbouquerel.fr`**. Elle
n'affiche jamais « envoyé » sans avoir envoyé.

Aucune étape ci-dessous n'engage de dépense. Les deux services ont une offre
gratuite suffisante et ne demandent pas de carte bancaire.

---

## 1. Compte Resend

Une étape par ligne, dans l'ordre.

1. Ouvrir <https://resend.com/signup>.
2. Créer le compte avec `eliott.bouquerel@gmail.com`. **Ce compte est personnel :
   le compte Resend utilisé sur l'ancien projet MegaService n'appartient pas à
   Eliott et ne doit servir à rien ici.**
3. Confirmer l'adresse via l'e-mail reçu.
4. Rester sur l'offre **Free** : 3 000 e-mails par mois, 100 par jour. Ne rien
   activer d'autre.

## 2. Vérification du domaine `eliottbouquerel.fr`

C'est l'étape qui décide si les messages arrivent. **Sans domaine vérifié,
Resend refuse tout envoi depuis `contact@eliottbouquerel.fr`** (erreur 403 sur
l'API, donc 502 côté site) ; et si l'envoi passait par une adresse non
authentifiée, Gmail et Outlook classeraient les messages en indésirables ou les
rejetteraient. Un prospect qu'Eliott vient d'appeler ne verrait jamais l'accusé
de réception.

1. Dans Resend, ouvrir **Domains** puis **Add Domain**.
2. Saisir `eliottbouquerel.fr` (le domaine nu, pas `www`).
3. Choisir la région **EU (Ireland)** : les données restent dans l'Union, ce qui
   s'aligne avec la politique de confidentialité publiée sur le site.
4. Resend affiche trois à quatre enregistrements DNS. Les laisser ouverts.
5. Ouvrir la zone DNS du domaine chez le registrar, section « Enregistrements
   DNS ».
6. Créer l'enregistrement **MX** dicté par Resend, sur le sous-domaine `send`
   (`send.eliottbouquerel.fr`), priorité `10`, valeur `feedback-smtp.eu-west-1.amazonses.com`.
   Il sert aux rebonds et aux plaintes.
7. Créer l'enregistrement **SPF** : type `TXT`, nom `send`, valeur
   `v=spf1 include:amazonses.com ~all`. Il déclare quels serveurs ont le droit
   d'écrire au nom du domaine.
8. Créer l'enregistrement **DKIM** : type `TXT`, nom
   `resend._domainkey`, valeur = la clef publique longue affichée par Resend,
   copiée telle quelle, sans retour à la ligne. Il signe chaque message.
9. Créer l'enregistrement **DMARC** : type `TXT`, nom `_dmarc`, valeur
   `v=DMARC1; p=none; rua=mailto:eliott.bouquerel@gmail.com`. Il indique aux
   destinataires quoi faire d'un message qui échoue à SPF et DKIM, et où envoyer
   les rapports.
10. Si le registrar ajoute automatiquement le domaine à la fin du nom
    (`resend._domainkey.eliottbouquerel.fr.eliottbouquerel.fr`), ne saisir que
    la partie gauche.
11. Attendre la propagation : quelques minutes en général, jusqu'à 24 h au pire.
12. Revenir dans Resend et cliquer **Verify DNS Records**. Le domaine doit
    passer à **Verified**.
13. Vérifier depuis un terminal si le statut tarde :
    `dig TXT resend._domainkey.eliottbouquerel.fr +short`.

### Passer `p=none` à `p=quarantine`

`p=none` est une position d'observation : rien n'est rejeté, mais les rapports
arrivent. Au bout de deux à quatre semaines sans anomalie dans les rapports
DMARC, remplacer `p=none` par `p=quarantine`. C'est ce qui empêche réellement
quelqu'un d'écrire en se faisant passer pour `contact@eliottbouquerel.fr` — un
risque concret pour un freelance qui fait de la prospection sortante.

## 3. Clef d'API Resend

1. Dans Resend, ouvrir **API Keys** puis **Create API Key**.
2. Nommer la clef `site-eliottbouquerel-prod`.
3. Permission : **Sending access**. Rien de plus.
4. Domaine : `eliottbouquerel.fr`.
5. Copier la clef (`re_…`). **Elle ne s'affiche qu'une fois.**
6. En local : `secret set resend-eliottbouquerel` puis coller la valeur, et
   reporter la ligne `RESEND_API_KEY=…` dans `.env.local` (permissions `0600`,
   jamais versionné).
7. En production : poser `RESEND_API_KEY` dans le gestionnaire de secrets de
   l'hébergeur. Jamais dans le dépôt.

## 4. Cloudflare Turnstile

Pourquoi Turnstile et pas reCAPTCHA v3 : reCAPTCHA charge un script Google,
dépose des cookies et transmet des signaux comportementaux à Google. C'est un
traceur tiers soumis au consentement, ce qui contredirait la bannière de
consentement mise en avant sur le site — sur un formulaire de contact, où
refuser le consentement rendrait le formulaire inutilisable. Turnstile fait le
même travail (score de risque, invisible par défaut, épreuve seulement au
besoin) sans cookie de suivi. Le raisonnement complet est dans
`src/lib/contact/captcha.ts`.

1. Ouvrir <https://dash.cloudflare.com>. Créer un compte si besoin (gratuit,
   sans carte). Aucun transfert de domaine n'est nécessaire : Turnstile
   fonctionne sur un domaine hébergé ailleurs.
2. Menu **Turnstile** puis **Add site**.
3. Nom du site : `eliottbouquerel.fr`.
4. Domaines : ajouter `eliottbouquerel.fr`, `www.eliottbouquerel.fr` et
   `localhost` (ce dernier pour le développement).
5. Widget mode : **Managed**.
6. Créer. Cloudflare affiche une **Site Key** (publique) et une **Secret Key**.
7. Poser `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = Site Key. Elle est publique, elle
   part dans le navigateur : ce n'est pas un secret.
8. Poser `TURNSTILE_SECRET_KEY` = Secret Key. Celle-là ne quitte jamais le
   serveur.

### Clefs de test, pour le développement local

Cloudflare publie des clefs factices documentées. Elles ne sont rattachées à
aucun compte et n'ont aucune valeur.

| Usage | Site Key | Secret Key |
| --- | --- | --- |
| Passe toujours | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Échoue toujours | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |

## 4 bis. Chemin de repli SMTP, pour publier sans attendre le DNS

**Le problème que cette section règle.** Resend n'écrit à un tiers qu'une fois le
domaine vérifié (section 2) : compte à créer, enregistrements à poser chez
Hostinger, propagation à attendre. Tant que ce n'est pas fait, l'accusé de
réception au prospect ne part pas. Le site n'a pas à attendre le DNS pour
accepter un message.

**Ce que fait le code.** `src/lib/contact/mailer.ts` choisit son chemin à chaque
requête, dans cet ordre :

1. `RESEND_API_KEY` posée → Resend, toujours. C'est le chemin nominal : il donne
   la délivrabilité, les journaux d'envoi et les rebonds.
2. sinon, les trois variables `SMTP_*` obligatoires posées → envoi par SMTP.
3. sinon → 503 et message honnête, exactement comme avant.

Les deux chemins envoient **le même contenu**, composé par
`src/lib/contact/emails.ts`. Poser Resend plus tard ne change rien d'autre que la
variable : aucun code à toucher, aucun texte à réécrire.

**Les quatre variables**, à poser dans `.env.local` en local et dans le
gestionnaire de secrets du service en production :

```
SMTP_HOTE=smtp.gmail.com
SMTP_PORT=465
SMTP_UTILISATEUR=eliott.bouquerel@gmail.com
SMTP_MOT_DE_PASSE=<mot de passe d'application, 16 caractères>
CONTACT_FROM_EMAIL=Eliott Bouquerel <contact@eliottbouquerel.fr>
```

**Deux conditions côté Gmail**, sans lesquelles rien ne part :

- la validation en deux étapes doit être active sur le compte, sinon aucun mot
  de passe d'application n'est proposable ;
- l'adresse de `CONTACT_FROM_EMAIL` doit figurer dans « Envoyer des e-mails en
  tant que » et y être vérifiée, sinon Gmail réécrit l'expéditeur.

Le mot de passe d'application se crée sur
<https://myaccount.google.com/apppasswords>. Ce n'est **pas** le mot de passe du
compte, et il se révoque seul.

**Ce que SMTP ne donne pas, et qu'il faut savoir.** Pas de tableau de bord des
envois, pas de journal des rebonds, pas de statistiques d'ouverture. Un rejet du
serveur distant n'arrive pas dans la réponse SMTP : le `250` ne prouve que
l'acceptation par le relais, le rebond revient ensuite sous forme de message de
`mailer-daemon`. C'est pour ça que Resend reste le chemin visé, et que le
contrôle de la section 6 se fait toujours **côté réception**, jamais sur le code
de retour.

**STARTTLS n'est pas géré**, volontairement : la connexion est chiffrée dès
l'ouverture (TLS implicite, port 465). Un port en clair qu'on promeut ensuite
ajouterait un mode dégradé que rien ne testerait.

## 5. Variables à renseigner, récapitulatif

| Variable | Où la trouver | Sans elle |
| --- | --- | --- |
| `RESEND_API_KEY` | Resend → API Keys | 503, message honnête, aucun envoi |
| `CONTACT_FROM_EMAIL` | facultative | repli `Eliott Bouquerel <contact@eliottbouquerel.fr>` |
| `CONTACT_TO_EMAIL` | facultative | repli `contact@eliottbouquerel.fr` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare → Turnstile | formulaire désactivé, message explicite |
| `TURNSTILE_SECRET_KEY` | Cloudflare → Turnstile | 503, message honnête |
| `SMTP_HOTE` | serveur de messagerie (section 4 bis) | chemin SMTP désactivé |
| `SMTP_PORT` | facultative | repli `465` |
| `SMTP_UTILISATEUR` | compte authentifié auprès du serveur | chemin SMTP désactivé |
| `SMTP_MOT_DE_PASSE` | mot de passe d'application. **Secret** | chemin SMTP désactivé |

Les quatre dernières ne servent que si `RESEND_API_KEY` est absente. Aucune des
deux familles posée : 503 et message honnête, jamais un faux « envoyé ».

## 6. Contrôle après mise en service

1. Ouvrir `/contact`, remplir les quatre champs, envoyer.
2. Vérifier que l'onglet **Réseau** montre un `POST /api/contact` en 200 et
   qu'aucune donnée n'apparaît dans l'URL.
3. Vérifier la notification dans la boîte `contact@eliottbouquerel.fr`, et que
   « Répondre » vise bien l'adresse du prospect.
4. Vérifier l'accusé de réception dans la boîte du prospect, y compris le
   dossier « indésirables » : s'il y atterrit, le domaine n'est pas correctement
   vérifié, reprendre l'étape 2.
5. Contrôler la note d'authentification avec <https://www.mail-tester.com> :
   envoyer un message depuis le formulaire vers l'adresse jetable fournie, viser
   9/10 ou 10/10.

## 7. Ce que la protection ne couvre pas

- **La limitation de débit vit en mémoire du processus.** Elle ne survit pas à
  un redémarrage et ne se partage pas entre plusieurs instances : derrière deux
  conteneurs, le plafond réel double. Sur un hébergeur qui répartit les
  requêtes, la bonne réponse est une règle côté hébergeur, pas un Redis ajouté
  pour ce seul usage. Détail dans `src/lib/contact/rate-limit.ts`.
- **Le contrôle du temps de remplissage repose sur un horodatage client.** Il
  attrape les robots naïfs ; un robot déterminé l'antidate. La défense réelle
  est Turnstile.
- **Le site ne pose aucun en-tête de sécurité global.** `next.config.ts` n'a pas
  de fonction `headers()`. La route `/api/contact` pose les siens
  (`no-store`, `nosniff`, `no-referrer`), mais les pages HTML n'ont ni
  `Content-Security-Policy`, ni `Strict-Transport-Security`, ni
  `X-Frame-Options`. À traiter dans `next.config.ts`, qui appartient à un autre
  chantier en cours.

## 8. Basculer sur reCAPTCHA v3, si le choix change

La vérification est isolée derrière l'interface `VerificateurCaptcha`
(`src/lib/contact/captcha.ts`). Le changement tient en trois points :

1. écrire `creerVerificateurRecaptcha(secret)` sur le même modèle que
   `creerVerificateurTurnstile` : POST vers
   `https://www.google.com/recaptcha/api/siteverify`, puis comparer le `score`
   renvoyé à un seuil (0,5 est le réglage courant) en plus du `success` ;
2. le retourner depuis `resoudreVerificateur()` ;
3. remplacer le chargement du script dans `src/components/forms/turnstile.ts`
   par `https://www.google.com/recaptcha/api.js?render=<clef>` et appeler
   `grecaptcha.execute` au lieu de `turnstile.render`.

Rien d'autre dans le projet ne connaît le fournisseur. **À faire alors, sans
quoi le site serait en infraction** : déclarer reCAPTCHA dans la bannière de
consentement comme traceur tiers non exempté, et ne charger son script qu'après
acceptation — ce qui signifie qu'un visiteur qui refuse ne peut plus envoyer de
message.
