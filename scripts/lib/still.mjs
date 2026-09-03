/**
 * Fige les animations DE FOND, des DEUX côtés, depuis le harnais.
 *
 * POURQUOI PAS DANS LE SITE. La tentation est de retirer temporairement le
 * grain du code pour obtenir un rendu stable. C'est une mauvaise idée pour deux
 * raisons : l'interrupteur de test finit par être oublié dans le code livré, et
 * surtout il ne s'appliquerait qu'à NOTRE version — la source, elle, continuerait
 * de granuler, donc toute comparaison d'image resterait bruitée. On fige donc
 * depuis Playwright, ce qui traite les deux côtés exactement de la même façon.
 *
 * POURQUOI LE GEL CSS SEUL NE SUFFISAIT PAS.
 * La version précédente ne posait qu'une feuille `animation-play-state: paused`.
 * Cela n'arrête que les animations déclarées par `@keyframes` — c'est-à-dire les
 * nôtres, et rien d'autre. Le grain de la SOURCE n'est pas une animation CSS :
 * c'est un composant Framer qui réécrit `element.style.transform` à chaque image
 * dans une boucle `requestAnimationFrame`. Aucune propriété d'animation ne le
 * concerne, donc `animation-play-state` glissait dessus sans effet. Conséquence
 * mesurée : deux captures successives d'une même zone immobile de la source
 * différaient sur environ 40 % des pixels, ce qui rendait toute comparaison
 * d'image inexploitable — on ne pouvait pas distinguer un vrai écart de mise en
 * page du scintillement du bruit.
 *
 * CE QUI EST FIGÉ MAINTENANT, ET COMMENT.
 *   1. Toutes les animations déclarées, quel que soit leur moteur : la feuille
 *      CSS pour les `@keyframes`, et `document.getAnimations()` pour ce que
 *      l'API Web Animations a créé en JavaScript.
 *   2. Les calques de grain, identifiés PAR STRUCTURE et non par nom de fichier
 *      ni par classe : image de fond répétée, motif de moins de 512 px, calque
 *      au moins deux fois plus grand que son parent, opacité inférieure à 1.
 *      C'est la même définition que `scripts/grain-audit.mjs`, et elle attrape
 *      aussi bien nos calques que ceux de la source (dont l'hôte porte
 *      `data-framer-name="Grain"` ou `"Grain Overlay"`, mais on ne s'appuie pas
 *      dessus : Framer renomme, et certaines cartes n'ont aucun nom).
 *
 *      Ces calques reçoivent un attribut, et une règle `!important` les épingle.
 *      C'est le point clé : dans la cascade CSS, une déclaration d'auteur
 *      `!important` passe DEVANT les animations ET devant un style en ligne sans
 *      priorité. La boucle `requestAnimationFrame` de Framer peut donc continuer
 *      d'écrire son `transform` à chaque image, il ne sera plus appliqué. On
 *      n'a ni à intercepter `requestAnimationFrame` (ce qui gèlerait aussi les
 *      apparitions qu'on cherche à mesurer) ni à monkey-patcher le style.
 *
 *      Un observateur de mutations réapplique l'attribut sur les calques créés
 *      après coup, une section révélée en cours de défilement montant les siens.
 *
 * CE QUI N'EST PAS FIGÉ. Les apparitions pilotées en JavaScript, par
 * `motion/react` chez nous et par le moteur Framer sur la source, continuent de
 * jouer : c'est exactement le partage voulu, on gèle le bruit de fond et on
 * garde le mouvement qu'on cherche à reproduire. Les TRANSITIONS ne sont pas
 * touchées non plus : ce sont elles qui portent les états de survol, de focus et
 * d'activation, qu'il faut au contraire pouvoir mesurer.
 */

const ATTR = "data-still-grain";

const CSS = `
  *, *::before, *::after {
    animation-play-state: paused !important;
    animation-delay: -1s !important;
  }
  [${ATTR}] {
    transform: none !important;
    animation: none !important;
    transition: none !important;
    will-change: auto !important;
  }
`;

/**
 * Script marqueur, exécuté dans la page. Autonome (aucune fermeture), pour
 * pouvoir être passé tel quel à `addInitScript` comme à `evaluate`.
 */
const MARQUEUR = (attr) => {
  const estCalqueDeGrain = (el) => {
    const cs = getComputedStyle(el);
    if (!/url\(/.test(cs.backgroundImage)) return false;
    if (!/repeat/.test(cs.backgroundRepeat) || /no-repeat/.test(cs.backgroundRepeat)) return false;
    const op = parseFloat(cs.opacity);
    if (!(op < 1) || !op) return false;
    const p = el.parentElement;
    if (!p) return false;
    const r = el.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    if (!pr.width || !pr.height) return false;
    if (r.width < pr.width * 2 && r.height < pr.height * 2) return false;
    // Motif petit devant le calque : la texture fait 256 px, un décor tuilé de
    // grande maille n'est pas du grain.
    const m = cs.backgroundSize.match(/^([\d.]+)px\s+([\d.]+)px$/);
    if (m && (parseFloat(m[1]) > 512 || parseFloat(m[2]) > 512)) return false;
    return true;
  };

  const passe = () => {
    for (const el of document.querySelectorAll("*")) {
      if (el.hasAttribute(attr)) continue;
      if (estCalqueDeGrain(el)) el.setAttribute(attr, "");
    }
    // Les animations créées en JavaScript (API Web Animations) ignorent
    // `animation-play-state` : on les arrête et on les place à un instant fixe,
    // identique à chaque exécution et sur les deux versions.
    //
    // PAS LES APPARITIONS ÉCRITES EN JAVASCRIPT. `document.getAnimations()`
    // renvoie trois espèces à la fois : les transitions CSS (`CSSTransition`),
    // les `@keyframes` (`CSSAnimation`) et ce qu'un script a créé avec
    // `element.animate()` (`Animation` nu). Les épingler toutes produisait un
    // faux écart tenace, sur la seule route qui anime son header.
    //
    // L'entrée du header de la home est, sur la SOURCE, une `Animation` nue.
    // `passe()` étant rejoué par l'observateur de mutations, elle était remise
    // en pause à `currentTime = 1000` À CHAQUE mutation, donc épinglée pour de
    // bon à mi-parcours : relevé image par image, la source sautait à l'échelle
    // 1,0529 vers 825 ms et n'en bougeait plus, ni au repos ni au défilement,
    // soit un CTA de 130,94 × 31,59 au lieu de 124,36 × 30. Notre entrée,
    // pilotée par `motion/react`, allait elle jusqu'à l'échelle 1. D'où un
    // rapport de 1,053 sur la largeur, la hauteur ET la largeur du texte, qui
    // ressemblait à s'y méprendre à une échelle résiduelle du produit. Sans
    // gel, les deux versions se stabilisent à l'identique : 124,359 × 30,
    // échelle 1, à 390 comme à 1440, y compris pendant le défilement.
    //
    // Une `Animation` nue à durée finie va donc au bout de sa course des deux
    // côtés — c'est l'état de repos qu'un audit veut mesurer, et c'est ce que
    // promet déjà la section « CE QUI N'EST PAS FIGÉ » ci-dessus. Tout le reste
    // garde l'ancien traitement : les `@keyframes` et les boucles restent
    // épinglées à un instant fixe, et les TRANSITIONS aussi, car `currentTime =
    // 1000` les mène au-delà de leur fin et donne donc l'état stabilisé de
    // survol, de focus ou d'activation dont `interaction-audit` a besoin.
    const nue = (a) =>
      (typeof CSSTransition === "undefined" || !(a instanceof CSSTransition)) &&
      (typeof CSSAnimation === "undefined" || !(a instanceof CSSAnimation));
    for (const a of document.getAnimations()) {
      try {
        const t = a.effect?.getComputedTiming?.();
        if (nue(a) && t && Number.isFinite(t.endTime) && t.iterations !== Infinity) continue;
        a.pause();
        a.currentTime = 1000;
      } catch {
        /* Une animation sans timeline résolue refuse l'écriture. */
      }
    }
  };

  passe();
  // Les sections révélées en cours de défilement montent leurs propres calques.
  if (!window.__stillObs) {
    window.__stillObs = new MutationObserver(() => passe());
    window.__stillObs.observe(document.documentElement, { childList: true, subtree: true });
  }
  window.__stillPasse = passe;
};

/**
 * Ajoute le gel à une page déjà ouverte.
 *
 * `animation-delay: -1s` en plus de la pause : une animation mise en pause avant
 * son premier tour reste à son image de départ, ce qui n'est pas représentatif.
 * Un délai négatif la place d'abord à un instant fixe de son cycle, identique à
 * chaque exécution et sur les deux versions.
 */
export async function freezeCssAnimations(page) {
  await page.addStyleTag({ content: CSS });
  await page.evaluate(MARQUEUR, ATTR);
}

/**
 * Variante à poser AVANT la navigation, pour que le gel s'applique dès la
 * première image peinte. Indispensable pour la vidéo : une feuille ajoutée après
 * le chargement laisse passer les premières images granulées.
 */
export async function freezeCssAnimationsOnLoad(page) {
  await page.addInitScript((args) => {
    const appliquer = () => {
      const style = document.createElement("style");
      style.textContent = args.css;
      document.head?.appendChild(style);
    };
    if (document.head) appliquer();
    else document.addEventListener("DOMContentLoaded", appliquer, { once: true });
    // Le marquage ne peut rien tant qu'il n'y a pas de DOM : on l'accroche au
    // chargement, l'observateur de mutations prend le relais ensuite.
    const lancer = () => new Function("attr", `(${args.marqueur})(attr)`)(args.attr);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", lancer, { once: true });
    } else lancer();
  }, { css: CSS, attr: ATTR, marqueur: MARQUEUR.toString() });
}

/**
 * Re-marque après un défilement ou une interaction, quand des sections ont pu
 * monter de nouveaux calques. Sans effet si tout est déjà marqué.
 */
export async function refreezeGrain(page) {
  await page.evaluate(() => window.__stillPasse?.());
}
