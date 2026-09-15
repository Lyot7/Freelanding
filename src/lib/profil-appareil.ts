/**
 * Profil d'appareil : « complet » ou « léger », décidé AVANT la première
 * peinture et posé sur `<html data-profil>`.
 *
 * POURQUOI. Le site porte des effets coûteux (grain animé sur une vingtaine de
 * calques, parallaxe au défilement, défilement lissé, vidéo de fond, entrées
 * animées). Sur un ordinateur récent ils ne coûtent rien de visible ; sur un
 * téléphone d'entrée de gamme, en 3G ou en mode économie de données, ils
 * retardent la peinture du contenu et vident la batterie. Le profil léger garde
 * le même contenu, les mêmes images et la même mise en page, et retire le
 * mouvement.
 *
 * CRITÈRES, du plus explicite au plus déduit :
 *  - `prefers-reduced-motion: reduce` — demandé par la personne ;
 *  - `navigator.connection.saveData` — mode économie de données ;
 *  - `effectiveType` en `slow-2g`, `2g` ou `3g` — réseau lent mesuré par le
 *    navigateur ;
 *  - `deviceMemory` ≤ 2 Go, ou ≤ 2 cœurs, ou 4 cœurs ET ≤ 4 Go — appareil
 *    modeste. Un ordinateur à 4 cœurs et 8 Go reste en profil complet.
 * Les API absentes (Safari, Firefox) ne font jamais basculer : faute de signal,
 * le profil reste complet, sauf mouvement réduit.
 *
 * SCRIPT INLINE ET NON MODULE : il doit tourner avant le CSS appliqué au
 * premier rendu et avant le démarreur d'apparitions, donc sans dépendre du
 * chargement du JavaScript applicatif.
 */
export const PROFIL_SCRIPT = `(function(){try{
var N=navigator,W=window,c=N.connection||{},m=N.deviceMemory,h=N.hardwareConcurrency,l=false;
if(W.matchMedia&&W.matchMedia("(prefers-reduced-motion: reduce)").matches)l=true;
if(c.saveData)l=true;
if(/^(slow-2g|2g|3g)$/.test(c.effectiveType||""))l=true;
if((m&&m<=2)||(h&&h<=2)||(h&&h<=4&&m&&m<=4))l=true;
document.documentElement.setAttribute("data-profil",l?"leger":"complet");
}catch(e){}})();`;

/** Lecture côté client ; toujours `false` sur le serveur. */
export function estProfilLeger(): boolean {
  return (
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-profil") === "leger"
  );
}
