"use client";

import { useSyncExternalStore } from "react";

const REQUETE = "(prefers-reduced-motion: reduce)";

function ecouter(rappel: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};
  const media = window.matchMedia(REQUETE);
  media.addEventListener("change", rappel);
  return () => media.removeEventListener("change", rappel);
}

function lire(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REQUETE).matches;
}

/**
 * Le serveur n'a pas de media query : il ne peut que répondre « mouvement
 * normal ». C'est aussi la valeur que React réutilise pour le rendu
 * d'hydratation, ce qui est précisément l'objet de ce module.
 */
function lireSurLeServeur(): boolean {
  return false;
}

/**
 * `prefers-reduced-motion`, mais SEULEMENT à partir du rendu qui suit
 * l'hydratation.
 *
 * POURQUOI CE DÉTOUR. Le hook `useReducedMotion` de framer-motion connaît la
 * vraie préférence dès le PREMIER rendu client, là où le serveur rend toujours
 * « mouvement normal ». Tout ce qui en dérive pour décider d'un style RENDU
 * diverge donc entre les deux arbres, et React rejette l'hydratation.
 *
 * LE DÉFAUT RÉEL QU'IL CORRIGE, reproduit sur `/`, `/about` et
 * `/legal/mentions-legales` avec `prefers-reduced-motion: reduce`, et vérifié
 * absent en mouvement normal : trois emplacements écrivaient `reduced ? null : y`
 * DANS un attribut `style`. Le serveur y posait une valeur de mouvement, le
 * client aucune, d'où un `<img>` portant `transform: translateY(-6.14035%)` d'un
 * seul côté. Le même écart déplaçait `top` et `height` : quand la valeur de
 * mouvement est présente, framer-motion prend la main sur `style` et
 * re-sérialise les nombres, si bien que `-7.000000000000001%` d'un côté
 * devenait `-7%` de l'autre.
 *
 * COMMENT. `useSyncExternalStore` est fait pour ça : React lit d'abord
 * l'instantané SERVEUR, y compris pour le rendu d'hydratation côté client, puis
 * bascule sur l'instantané réel juste après. Les deux arbres comparés sont donc
 * identiques par construction, et le retrait du mouvement arrive dans une mise à
 * jour ordinaire, hors du chemin d'hydratation. Un `useState` posé depuis un
 * `useEffect` donnerait le même résultat visible, mais au prix d'un rendu en
 * cascade que la règle de lint du projet refuse, à raison.
 *
 * CE QUE ÇA COÛTE. Chez qui demande moins d'animation, le mouvement est posé
 * pendant une image puis retiré. C'est le prix inhérent à une préférence que le
 * serveur ne peut pas connaître : aucun en-tête HTTP ne la transporte
 * aujourd'hui. Il se paie une fois par montage, et jamais chez les autres.
 *
 * NE PAS remplacer par un appel direct à `useReducedMotion` dans un `style` :
 * c'est exactement le défaut corrigé ici. Pour une animation DÉCLENCHÉE (au
 * survol, au clic, à l'entrée dans l'écran), l'appel direct reste juste, car
 * elle ne participe pas au rendu initial.
 */
export function useReducedMotionAfterMount(): boolean {
  return useSyncExternalStore(ecouter, lire, lireSurLeServeur);
}

/**
 * Un pourcentage CSS écrit de façon déterministe.
 *
 * `-0.07 * 100` ne vaut pas `-7` en virgule flottante, mais
 * `-7.000000000000001`. La chaîne partait telle quelle dans le `style`, et la
 * moindre re-sérialisation par framer-motion la ramenait à `-7%` : à elle seule,
 * cette différence d'écriture faisait diverger les deux rendus. Quatre décimales
 * couvrent largement les débords employés (0,06 et 0,07) sans jamais rendre un
 * arrondi visible : 0,0001 % d'un cadre de 1000 px vaut un millième de pixel.
 */
export function pourcentage(valeur: number): string {
  return `${Number(valeur.toFixed(4))}%`;
}
