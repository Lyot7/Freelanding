import { plancherSuivi, prestation, prixPlancher, tauxSuivi } from "@/content/offre";
import type { FaqItem } from "@/lib/content/types";

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
 *     L'échéancier réel, celui des CGV, est 40 / 30 / 30 depuis le 2026-09-29 (30 / 40 / 30 avant).
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
/*
 * CINQ ENTRÉES DEPUIS LE 2026-09-24, décision d'Eliott : la FAQ ne garde que
 * ce que le client se demande avant de réserver ET dont la réponse n'est écrite
 * nulle part ailleurs sur le site. Sont sorties : les maquettes (la section
 * méthode le dit), le site à quelques centaines d'euros, l'agence (la page À
 * propos le dit), la rédaction du contenu (les pages de prestation le disent). La hausse
 * possible du suivi est fusionnée dans « après la mise en ligne ».
 *
 * LA DURÉE EST ENTRÉE, parce que le site ne publie aucun délai chiffré, pas
 * même le simulateur depuis le 2026-10-05. La réponse dit où la date est
 * écrite (au devis, avant signature) et de quoi elle dépend, sans inventer de
 * nombre.
 */
export const faqItems: FaqItem[] = [
  {
    question: "Combien coûte un projet, et comment c’est facturé ?",
    /* Les planchers sont lus dans `offre.ts`. Les 40 / 30 / 30 de
       l'échéancier restent des pourcentages, pas des montants. */
    answer: `Un site démarre à ${prixPlancher(prestation("vitrine"))} HT, une solution métier à ${prixPlancher(prestation("logiciel"))} HT. Au-delà, le prix dépend de ton projet : le nombre de pages ou de modules, les outils à relier, la reprise de tes données. Chaque page de prestation dit ce qui est compris et ce qui fait monter le prix. Je fixe le montant au devis, avant de commencer, et il ne bouge plus. Tu verses 40 % à la signature, 30 % à mi-parcours et 30 % à la livraison.`,
  },
  {
    question: "Combien de temps ça prend ?",
    answer:
      "La date de mise en ligne est écrite dans le devis, avant que tu signes. Elle dépend de ton projet et de la rapidité de tes retours : tes photos, ta relecture des textes, tes réponses à mes questions. Je ne mène qu’un projet à la fois : une fois le devis signé, je travaille sur le tien, et tu le vois avancer sur une adresse en ligne.",
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
    question: "Que se passe-t-il après la mise en ligne ?",
    /* Le taux et le plancher du suivi sont lus dans `offre.ts`. L'exemple
       chiffré (mensualité d'un projet de référence) est parti le 2026-10-05
       avec le prix ferme du palier du milieu : aucun projet de référence ne tient
       sans palier publié.

       LA CLAUSE DE HAUSSE, ajoutée le 2026-08-27 et fusionnée ici le
       2026-09-24. Un forfait de suivi engage un prix sur une charge qui peut
       bouger. Elle reste BORNÉE, et c'est ce qui la rend acceptable : un seul
       déclencheur nommé, l'annonce avant et non après, un montant et une
       date, et le droit de dire non. L'hébergement est au nom du client : la
       machine plus grosse passe par SA facture, le suivi bouge parce qu'il y
       a plus à surveiller. */
    answer: `Je ne disparais pas. Je propose un suivi mensuel qui revient à ${tauxSuivi()} du prix du projet par an, avec un minimum de ${plancherSuivi()} par mois. Il couvre ce qui existe : mises à jour, sauvegardes vérifiées, corrections. Une demande nouvelle fait l’objet d’un devis, parce qu’elle n’était pas au cadrage. Ce montant ne bouge que dans un cas : ton site reçoit beaucoup plus de monde, ou ton hébergeur augmente ses prix. Il faut alors une machine plus puissante, payée sur ta facture d’hébergement, qui est à ton nom, et un suivi plus large. Je te préviens avant, avec le nouveau montant et la date, et rien ne change tant que tu n’as pas dit oui. Tu n’as pas besoin de ce suivi pour continuer à te servir de ce que je t’ai livré.`,
  },
];
