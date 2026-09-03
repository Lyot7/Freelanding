import {
  packEntree,
  plancherSuivi,
  prixPack,
  suiviMensuel,
  tauxSuivi,
  TJM,
} from "@/content/offre";
import type { FaqItem } from "@/lib/content/types";

/**
 * Le pack d'entrée du logiciel sert DEUX FOIS dans cette FAQ : comme montant
 * haut de la gamme, et comme projet de référence de l'exemple de suivi. Il est
 * nommé une fois ici pour que les deux ne puissent pas diverger entre eux, en
 * plus de ne pas diverger du module.
 */
const PACK_LOGICIEL = packEntree("logiciel");

/**
 * Source unique de la FAQ. Rendue à l'identique sur la page d'accueil, sur
 * `/contact` et sur les pages projet.
 *
 * REFONTE DU 2026-08-31 : dix entrées, contre sept.
 *
 * LA RÈGLE QUI A PRÉSIDÉ À CETTE PASSE : rien ne s'écrit ici qui ne soit dans
 * les mots d'Eliott (`~/vault/wiki/business/copy-matiere-brute.md`). Sa crainte,
 * telle qu'il l'a formulée : « je veux que le client ne me sorte pas y'a écrit
 * ça sur le site alors que j'suis pas au courant ». Une FAQ est justement
 * l'endroit où un client va chercher la phrase à ressortir.
 *
 * CE QUI A ÉTÉ CORRIGÉ, ET C'ÉTAIT FAUX :
 *
 *   - « Vous versez 30 % à la signature, LE RESTE LE JOUR DE LA MISE EN LIGNE ».
 *     L'échéancier réel, celui des CGV, est 30 / 40 / 30.
 *   - « Puis-je voir le design avant que vous le développiez ? Bien sûr […] le
 *     développement ne commence qu'une fois les maquettes relues et validées ».
 *     Eliott NE FAIT PAS DE MAQUETTE. Il signe et il code, et le client suit une
 *     adresse en ligne. C'était la contradiction la plus dangereuse du site :
 *     elle promettait une étape de validation qui n'existe pas.
 *
 * CE QUI A ÉTÉ AJOUTÉ, parce que ça manquait :
 *
 *   - la reprise d'un existant et l'audit de code qui la précède. C'est une
 *     prestation à part entière et une porte d'entrée commerciale, elle
 *     n'existait nulle part sur le site ;
 *   - les DEUX concurrents, séparément et avec deux argumentaires distincts :
 *     le site généré (belle carrosserie, moteur lent) et l'agence (frais de
 *     structure, corps de métier empilés). Les confondre les affaiblit tous les
 *     deux ;
 *   - l'IA, qu'Eliott a tranché de dire. La nuance porte tout : son concurrent
 *     fait GÉNÉRER le site, lui s'en sert pour DÉCIDER et écrit le code.
 *
 * CE QUI EST RESTÉ HORS DE CE FICHIER : « moi j'ai tout à prouver, une agence
 * non ». Écarté par Eliott lui-même, parce que ça se périme à sa première
 * signature. Argument d'entretien, pas de page web.
 *
 * MONTANTS : AUCUN N'EST ÉCRIT ICI, et c'est vérifié par un test qui lit ce
 * fichier source, pas seulement le texte rendu.
 *
 * CE QU'IL Y AVAIT AVANT, jusqu'au 2026-09-01 : les trois montants d'entrée de
 * gamme en toutes lettres dans la réponse « combien ça coûte », plus les
 * quatre chiffres du suivi. Ils étaient JUSTES le jour où ils ont été écrits,
 * et c'est ce qui rend la faute difficile à voir : elle ne se déclare que le
 * jour où le curseur bouge. Tout le reste du site dérive ses prix d'un seul
 * endroit (`offre.ts`) ; cette FAQ était le dernier point où ils vivaient en
 * double, c'est-à-dire la reproduction exacte du bug que l'en-tête de
 * `offre.ts` documente, quand les prix vivaient à la fois dans `services.ts`
 * et dans `pricing.ts` et ont divergé sans que rien ne le signale.
 *
 * LE TUTOIEMENT, DEPUIS LE 2026-09-02. Les RÉPONSES tutoient le lecteur ; les
 * QUESTIONS, elles, sont écrites dans sa voix à lui et tutoient donc Eliott
 * (« Tu le reprends ? », « Pourquoi toi plutôt qu'une agence ? »). Le
 * tutoiement est réciproque ou il n'est pas : une question qui vouvoierait au
 * milieu de réponses qui tutoient se lirait comme deux personnes différentes.
 *
 * Les réponses concernées sont donc des gabarits : elles appellent les mêmes
 * fonctions que les pages de service. Un montant réintroduit à la main ici
 * fait échouer `offre.test.mjs`.
 */
export const faqItems: FaqItem[] = [
  {
    question: "Combien coûte un projet, et comment c’est facturé ?",
    /* « 3 périmètres » et non « trois » : règle posée par Eliott le 2026-09-01,
       les nombres s'écrivent en chiffres, déjà appliquée dans
       `service-pages.ts`, `tarifs.ts` et `services.ts`. Les 30 / 40 / 30 de
       l'échéancier restent des pourcentages, pas des montants. */
    answer: `Un site vitrine démarre à ${prixPack(packEntree("vitrine"))}, une fonction branchée sur ton existant à ${prixPack(packEntree("outil"))}, un logiciel métier complet à ${prixPack(PACK_LOGICIEL)}. Chaque prestation existe en 3 périmètres, détaillés sur sa page : ce qui change de l’un à l’autre y est écrit ligne à ligne. Le montant est arrêté avant que je commence, et il ne bouge plus. Tu verses 30 % à la signature, 40 % à mi-parcours et 30 % à la livraison.`,
  },
  {
    question: "Qu’est-ce que je vois avant la mise en ligne ?",
    answer:
      "Ton site, en train de se construire. Je ne travaille pas en maquettes : avant la signature, on cale ensemble le périmètre et la direction visuelle, tu me montres ce qui te plaît et tu m’envoies les références que tu as déjà trouvées. Le jour où tu signes, je commence à développer, et tu reçois une adresse en ligne qui se remplit au fil des jours. Tu n’attends ni captures d’écran ni dossier de présentation : tu cliques dedans pendant que ça avance.",
  },
  {
    question: "Est-ce que je reste propriétaire de ce que tu construis ?",
    answer:
      "Oui, entièrement. Les droits sur le code te sont cédés au paiement intégral, c’est écrit dans mes conditions générales de vente. Le code vit sur ton dépôt et ton serveur, tes données et ton fichier client restent chez toi, et aucun abonnement n’est nécessaire pour continuer à te servir de ce que je t’ai livré. Tu n’es captif de personne, moi compris : un autre développeur peut reprendre le travail, il est documenté pour ça.",
  },
  {
    question: "J’ai déjà un site ou un logiciel. Tu le reprends ?",
    answer:
      "Par défaut, je construis du neuf. Reprendre du code écrit par quelqu’un d’autre est risqué, et je ne m’y engage pas à l’aveugle. La reprise reste possible si ton logiciel repose sur une base JavaScript récente et qu’il est correctement construit : je commence alors par un audit de son code, qui répond à cette question-là et à aucune autre. Sur du PHP ou du Laravel, je n’y touche pas, et je te le dis avant que ça te coûte quoi que ce soit. Dans les autres cas, je te propose un outil neuf qui vit à côté de l’ancien, sans y toucher.",
  },
  {
    question: "Pourquoi pas un site à quelques centaines d’euros ?",
    answer:
      "Parce qu’à ce prix-là, personne n’a le temps de réfléchir à ton affaire et de rester rentable. Ce que tu achètes impressionne au premier coup d’œil et ne t’amène rien. Je facture au-dessus parce que je passe du temps, avant la première ligne de code, sur ce qui doit te rapporter : ton positionnement, ce que tu vends, la façon dont on te trouve, ce qui transforme un visiteur en appel ou en devis. Un site ne se juge pas à ce qu’il montre, mais à ce qu’il te rapporte.",
  },
  {
    question: "Pourquoi toi plutôt qu’une agence ?",
    answer:
      "Une agence, ce sont des salariés, des plannings, des ressources humaines et plusieurs corps de métier : des frais qui courent que ton projet avance ou non, et une chaîne de personnes entre toi et le travail. Je vais droit au but. Je suis développeur, et je suis à l’aise avec les métiers qui gravitent autour : positionnement, marketing, design, référencement, accessibilité. Tu parles à celui qui écrit le code.",
  },
  {
    question: "Tu utilises l’intelligence artificielle ?",
    answer:
      "Oui, et je préfère le dire. Pas pour fabriquer ton site : pour décider. Avant d’écrire une ligne, je m’en sers comme d’un contradicteur sur les arbitrages qui comptent : ton positionnement, ce qu’il faut montrer et à qui, l’architecture du projet, les outils sur lesquels il reposera encore dans deux ans. Le code, lui, je l’écris et j’en réponds. C’est l’inverse d’un site généré, où la machine produit et où personne n’a rien décidé.",
  },
  {
    question: "Tu écris le contenu ou je dois le fournir ?",
    answer:
      "Les deux fonctionnent. Tu peux fournir tes propres textes, ou je les rédige moi-même : un contenu professionnel, optimisé pour la recherche locale, calé sur ton métier et tes objectifs.",
  },
  {
    question: "Que se passe-t-il après la mise en ligne ?",
    /* Les quatre chiffres du suivi (taux, plancher, mensualité de l'exemple et
       projet de référence) sont dérivés : l'exemple se recalcule tout seul le
       jour où le taux ou la grille bougent, au lieu de rester juste par
       coïncidence. */
    answer: `Je ne disparais pas. Je propose un suivi mensuel qui revient à ${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} : compte ${suiviMensuel(TJM * PACK_LOGICIEL.jours)} par mois pour un projet à ${prixPack(PACK_LOGICIEL)}. Il couvre ce qui existe : mises à jour, sauvegardes vérifiées, corrections. Une demande nouvelle, elle, fait l’objet d’un devis, parce qu’elle n’était pas au cadrage : tu sais toujours ce que tu paies. Et tu n’as pas besoin de ce suivi pour continuer à te servir de ce que je t’ai livré.`,
  },
  /*
   * LA CLAUSE D'INFRASTRUCTURE, ajoutée le 2026-08-27.
   *
   * ELLE EXISTE PARCE QU'UN FORFAIT DE SUIVI EST UN ENGAGEMENT DE PRIX SUR UNE
   * CHARGE QUI, ELLE, PEUT BOUGER. Un trafic qui décuple, un volume de données
   * qui déborde la machine, un hébergeur qui relève ses tarifs : ces trois cas
   * arrivent, et un forfait muet dessus se termine soit par une perte assumée en
   * silence, soit par une hausse annoncée après coup, ce qui est pire.
   *
   * ELLE EST BORNÉE, ET C'EST CE QUI LA REND ACCEPTABLE. Un seul déclencheur
   * nommé, l'annonce avant et non après, un montant et une date, et le droit de
   * dire non. Sans ces quatre éléments, la clause se lirait comme « je peux
   * augmenter quand je veux », ce qui vaut moins que pas de clause du tout.
   *
   * L'HÉBERGEMENT EST AU NOM DU CLIENT sur toutes les prestations, donc la
   * hausse de la machine ne passe pas par la facture d'Eliott : elle passe par
   * la sienne. Ce qui bouge côté suivi, c'est la surveillance d'une
   * infrastructure devenue plus grosse. La réponse dit les deux, sinon elle
   * laisserait croire qu'Eliott refacture un coût qu'il ne supporte pas.
   */
  {
    question: "Le montant du suivi peut-il augmenter ?",
    answer:
      "Dans un seul cas : si ton site reçoit beaucoup plus de monde qu’aujourd’hui, ou si ton hébergeur augmente ses prix. Il faut alors une machine plus puissante, et deux choses bougent : ta facture d’hébergement, qui est à ton nom et que tu règles directement, et le suivi, parce qu’une installation plus grosse demande plus de surveillance. Je te préviens avant, je te donne le nouveau montant et la date, et rien ne change tant que tu n’as pas dit oui. En dehors de ce cas, tu paies ce qui était prévu au départ.",
  },
];
