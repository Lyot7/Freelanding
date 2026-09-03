import { EASE_FRAMER, type MotionValues } from "@/components/motion/Reveal";
import type { Transition } from "motion/react";

/**
 * Loi d'ENTRÉE des visuels, commune à tout le site et MESURÉE sur la source.
 *
 * Un seul composant Framer porte l'apparition de TOUTES les images du site :
 * `.framer-1ambeg8-container`, qui vit à `opacity: 0` et `transform: scale(1.1)`
 * au repos et rejoint `opacity: 1` / `scale(1)`. On le retrouve à l'identique sur
 * la photo de studio et les portraits de `/about`, sur le visuel d'article, sur
 * les six cartes de `/blog` et sur les cartes liées de l'article. Le relevé
 * ci-dessous a donc UNE seule loi à décrire, quel que soit l'emplacement.
 *
 * UN SEUL CALQUE, PAS DEUX. Il existe bien un endroit du site où la source
 * imbrique DEUX conteneurs portant le même effet, tous deux à `opacity: 0` et
 * `scale(1.1)` : les cinq visuels 690 × 399 de l'accordéon de `/about`. Là, les
 * échelles se composent (1,1 x 1,1 = 1,21) et les opacités aussi. Ce n'est PAS le
 * cas ici : relevé d'inventaire sur `/live-proxy/blog` et
 * `/live-proxy/blog/stop-hiding-your-prices` à 1440 x 900, chacun des cadres
 * 688 × 688 n'a QU'UN calque masqué, et son unique enfant est à `opacity: 1`.
 * Reproduire deux calques ici donnerait une échelle de départ de 1,21 et un
 * fondu deux fois trop précoce.
 *
 * COUPLAGE OPACITÉ / ÉCHELLE. Les deux valeurs sont pilotées par la même
 * progression : sur 310 images relevées à la suite sur une carte de `/blog`,
 * `(1,1 - échelle) / 0,1` et l'opacité ne s'écartent jamais de plus de 5e-5.
 *
 * CHRONOLOGIE relevée image par image sur une carte 688 × 688 de `/blog`
 * (fenêtre 1440 x 900, défilement arrêté, `t = 0` à la première image après le
 * franchissement du seuil) : 0,021 à 99 ms · 0,060 à 201 · 0,129 à 300 · 0,289 à
 * 399 · 0,695 à 499 · 0,842 à 599 · 0,911 à 699 · 0,951 à 800 · 0,976 à 899 ·
 * 0,991 à 1003 · 0,998 à 1099 · 1,000 à 1199.
 *
 * DURÉE : voir le commentaire de {@link MEDIA_REVEAL_TRANSITION}.
 *
 * AUCUN ÉCHELONNEMENT entre cartes. Les deux cartes d'une même rangée de `/blog`
 * ont été échantillonnées simultanément : à chacune des 310 images, leurs
 * opacités sont ÉGALES au chiffre près. Il n'y a donc ni décalage de départ ni
 * cascade — ce qui se comprend, chaque carte a son propre déclencheur et les
 * deux franchissent le seuil à la même image puisqu'elles sont sur la même ligne.
 */
export const MEDIA_REVEAL_FROM: MotionValues = { opacity: 0.001, scale: 1.1 };

/**
 * Durée et courbe de l'entrée.
 *
 * COURBE : `cubic-bezier(0.68, 0, 0, 1)`, la courbe Framer du site
 * ({@link EASE_FRAMER}). Vérification de la FORME, indépendamment de la durée :
 * on relève l'instant auquel la source franchit chaque palier d'opacité et on le
 * rapporte à l'instant du même palier chez nous. De 0,2 à 0,99, les douze
 * rapports tiennent entre 0,928 et 0,948 — un rapport CONSTANT, c'est-à-dire une
 * simple mise à l'échelle du temps : la forme est bien la même des deux côtés,
 * seule la durée diffère.
 *
 * DURÉE : 1,17 s. Elle n'est PAS déduite d'un ajustement des moindres carrés sur
 * un modèle, mais de l'écart d'OPACITÉ réellement affiché : pour chaque durée
 * candidate, on compare image par image l'opacité du modèle à celle du relevé de
 * la source, et on retient celle qui minimise l'écart. C'est le critère qui
 * correspond à ce qu'un œil voit. Résultat, sur deux emplacements indépendants :
 *
 *     écart MOYEN d'opacité, par durée candidate
 *     durée (ms)                1150     1165     1170     1200     1250
 *     /blog, carte 688 x 688   0,0058   0,0046   0,0047   0,0086   0,0163
 *     /about, portrait 110     0,0062   0,0048   0,0045   0,0076   0,0132
 *     article, visuel 690      0,0063   0,0049   0,0046   0,0074   0,0148
 *
 * Les TROIS minimums tombent au même endroit, 1165-1175 ms, et l'écart maximal y
 * descend à 0,04 (contre 0,15 à 1,25 s, atteint vers 450 ms — soit une image à
 * 15 % d'opacité de retard au moment le plus raide de la courbe).
 *
 * POURQUOI 1,25 s AVAIT ÉTÉ RETENU AILLEURS, ET POURQUOI C'ÉTAIT TROP LENT. La
 * valeur précédente venait d'un rapport d'AMPLITUDE TOTALE : durée entre le
 * premier et le dernier échantillon, source contre clone. Cet estimateur est
 * dominé par les deux queues de la courbe, or `cubic-bezier(0.68, 0, 0, 1)` finit
 * sa course avec une tangente nulle : les 3 derniers pourcents s'étalent sur plus
 * de 150 ms et quelques images de plus ou de moins y déplacent l'estimation de
 * 80 ms. Le critère d'écart d'opacité, lui, pèse chaque instant à sa valeur.
 *
 * Une valeur de 0,9 s (celle qui avait été posée sur le visuel d'article) donne
 * 0,52 à 399 ms là où la source vaut 0,29 : l'image y est à moitié apparue quand
 * la source commence à peine.
 */
export const MEDIA_REVEAL_DURATION = 1.17;

export const MEDIA_REVEAL_TRANSITION: Transition = {
  type: "tween",
  duration: MEDIA_REVEAL_DURATION,
  ease: EASE_FRAMER,
};

/*
 * SEUIL DE DÉCLENCHEMENT, encadré sur la source (carte 688 × 688 de `/blog`,
 * fenêtre 1440 x 900, saut direct puis attente de 1,8 s, une page neuve par
 * niveau, ordonnée rapportée à la MISE EN PAGE) :
 *
 *     haut du cadre à 940 · 920 · 910  ->  encore MASQUÉ
 *     haut du cadre à 900 · 890 · 870  ->  déjà RÉVÉLÉ
 *
 * C'est donc le bord bas de la fenêtre, marge nulle, exactement comme le reste du
 * site. Aucune marge locale à ajouter.
 *
 * ET C'EST LA POSITION DE MISE EN PAGE QUI COMMANDE, pas la boîte transformée.
 * Le relevé le prouve : au niveau 920, la boîte transformée du calque avait son
 * haut à 886, donc déjà DANS la fenêtre, et le calque restait pourtant masqué.
 * L'explication est structurelle et il faut la reproduire : `IntersectionObserver`
 * découpe la boîte de la cible par les zones de clip de ses ancêtres, or ce
 * calque agrandi de 10 % vit dans un conteneur `overflow: clip` exactement à la
 * taille du cadre. Le débord du `scale` est donc rogné avant le calcul, et
 * l'observateur ne voit que le cadre non transformé.
 *
 * CONSÉQUENCE POUR NOUS : le calque animé doit rester à l'INTÉRIEUR du cadre qui
 * clippe, jamais l'être lui-même. Posé sur le cadre, il déclencherait 34 px trop
 * tôt sur une carte de 688 px (688 x 0,1 / 2), au-delà de la tolérance de
 * `scripts/reveal-threshold.mjs`.
 */
