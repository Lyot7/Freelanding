"use client";

import type { EtatEnvoi } from "./useEnvoiFormulaire";
import { NOM_CHAMP_PIEGE } from "./useEnvoiFormulaire";
import type { RefObject } from "react";

/**
 * Champs invisibles communs aux trois formulaires : piège à robots et conteneur
 * du widget Turnstile.
 *
 * MASQUAGE DU PIÈGE. Pas de `display:none` seul : un champ ainsi masqué reste
 * un champ que le remplissage automatique du navigateur ou un gestionnaire de
 * mots de passe peut renseigner, et le prospect serait alors rejeté sans
 * comprendre. Le champ est donc sorti du flux visuel (`position:absolute` très
 * à gauche, 1 × 1 px, `overflow:hidden`), retiré de l'ordre de tabulation
 * (`tabIndex={-1}`), retiré de l'arbre d'accessibilité (`aria-hidden`) et privé
 * de remplissage automatique (`autoComplete="off"`).
 *
 * SON NOM NE RESSEMBLE À AUCUN CHAMP CONNU. « website », « company » ou
 * « phone » — les noms de piège traditionnels — sont précisément ceux que
 * Chrome et Safari remplissent tout seuls. `referenceInterne` n'active aucune
 * heuristique de remplissage, tout en restant un champ texte qu'un robot qui
 * remplit tout ce qu'il trouve renseignera.
 */
export function ChampsProtection({
  refConteneur,
}: {
  /**
   * Conteneur du widget Turnstile, fourni par `useProtectionTurnstile`.
   *
   * Passé en identifiant simple et non via l'objet `protection` : la règle
   * `react-hooks/refs` interdit de lire `objet.refConteneur` pendant le rendu.
   */
  refConteneur: RefObject<HTMLDivElement | null>;
}) {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute left-[-9999px] top-0 h-px w-px overflow-hidden"
      >
        <input
          type="text"
          name={NOM_CHAMP_PIEGE}
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>
      {/* Turnstile en mode `interaction-only` : ce conteneur reste vide et de
          hauteur nulle tant que Cloudflare n'a pas besoin d'une épreuve. */}
      <div ref={refConteneur} className="empty:hidden" />
    </>
  );
}

/**
 * Zone de statut du formulaire.
 *
 * `role="status"` et `aria-live="polite"` : le changement d'état est annoncé
 * aux lecteurs d'écran. Sans ça, un utilisateur non voyant appuie sur
 * « Envoyer » et n'apprend jamais si son message est parti — exactement le
 * problème d'origine, transposé.
 *
 * Le conteneur est rendu EN PERMANENCE, même vide : une région live insérée en
 * même temps que son contenu n'est pas annoncée par tous les lecteurs d'écran.
 */
export function MessageEtat({
  etat,
  message,
  className = "",
  ton = "sombre",
}: {
  etat: EtatEnvoi;
  message: string;
  className?: string;
  /** `sombre` = texte foncé sur fond clair ; `clair` = l'inverse (pied de page). */
  ton?: "sombre" | "clair";
}) {
  const couleur =
    etat === "erreur"
      ? "text-accent"
      : ton === "clair"
        ? "text-foreground"
        : "text-background";

  return (
    <p
      role="status"
      aria-live="polite"
      data-etat={etat}
      className={`text-[12px] font-medium leading-[1.3] tracking-[-0.01em] empty:hidden ${couleur} ${className}`}
    >
      {message}
    </p>
  );
}

/**
 * Repli quand JavaScript ne s'exécute pas.
 *
 * SANS CE BLOC, LE BUG D'ORIGINE REVIENT. La soumission est annulée par un
 * gestionnaire d'événement : si le script ne tourne pas (extension de blocage,
 * paquet perdu, JavaScript désactivé), le navigateur soumet le formulaire
 * lui-même. C'est pour ça que les trois formulaires portent désormais
 * `method="post" action="/api/contact"` : sans gestionnaire, la soumission part
 * en POST vers la route, donc dans un CORPS, et plus jamais dans l'URL.
 *
 * Elle n'aboutira pas pour autant — la route exige du JSON et un jeton
 * anti-robot, qu'aucun des deux ne peut être produit sans script. D'où ce
 * message, qui dit la vérité et donne la sortie : l'adresse e-mail directe.
 */
export function ReplisSansScript({ emailContact }: { emailContact: string }) {
  return (
    <noscript>
      <p className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em]">
        Ce formulaire a besoin de JavaScript pour vérifier qu’il n’est pas
        rempli par un robot. Écris-moi directement à{" "}
        <a href={`mailto:${emailContact}`}>{emailContact}</a>.
      </p>
    </noscript>
  );
}
