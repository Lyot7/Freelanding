import { uiLabels } from "@/content/ui";

/**
 * SkipLink — lien d'évitement « aller au contenu ».
 *
 * Premier geste attendu d'une navigation clavier, et il manquait : sans lui,
 * atteindre le contenu d'une page depuis la barre d'adresse impose de traverser
 * le logo, la tagline, les quatre liens du header et le CTA, sur CHAQUE page.
 *
 * Il n'y a volontairement aucune classe utilitaire ici : tout le style vit dans
 * `src/app/focus.css` (`.skip-link`), avec le reste de la mécanique de focus.
 * Le composant ne porte que la structure et la cible.
 *
 * La cible `#main-content` est le `<main tabindex="-1">` de chaque page. Le
 * `tabindex` est indispensable : sans lui, Safari déplace le défilement mais
 * PAS le focus, et la tabulation suivante repart du header — le saut n'a alors
 * servi à rien.
 *
 * Le libellé vient de `uiLabels.chrome.skipToContent`. L'import est DIRECT et
 * non passé par la couche `content` asynchrone : ce composant est rendu par
 * `SiteDocument`, qui sert aussi `global-not-found`, une route sans layout donc
 * sans accès au repository.
 */
export function SkipLink() {
  return (
    <a className="skip-link" href="#main-content">
      {uiLabels.chrome.skipToContent}
    </a>
  );
}
