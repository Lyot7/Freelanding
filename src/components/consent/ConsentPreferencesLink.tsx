"use client";

import { consentCopy } from "@/content/consent";

/**
 * Retour sur le consentement, DANS la rangée légale du pied de page.
 *
 * CE QU'IL REMPLACE. La commande vivait dans une bande séparée sous le pied de
 * page (`ConsentFooterBar`), posée là parce que le pied de page était alors
 * modifié par un autre chantier. Elle portait « Gérer mes préférences de
 * confidentialité », à quelques centimètres d'un lien « Confidentialité » qui
 * mène à la politique : deux intitulés presque identiques pour deux choses
 * différentes, et une bande de plus en bas de chaque page.
 *
 * LE LIBELLÉ NOMME LA COMMANDE, PAS LE DOCUMENT. « Cookies » dit ce que le
 * bouton ouvre ; « Confidentialité », juste à côté, dit ce que la page
 * explique.
 *
 * PAS DE `useConsent` ICI, ET C'EST LA RAISON D'ÊTRE DE CE FICHIER. Le pied de
 * page est rendu HORS de `ConsentProvider` : appeler le hook y jette
 * « useConsent doit être appelé sous <ConsentProvider> » et casse toutes les
 * pages. Le provider écoute déjà les clics sur `[data-consent-open]` au niveau
 * du document — c'est ce contrat-là qu'on utilise, et il ne suppose aucune
 * position dans l'arbre.
 *
 * LA CLEF EST LUE DIRECTEMENT parce que sans elle il n'y a rien à rouvrir : la
 * bannière ne s'ouvre jamais, et une commande qui ne mènerait nulle part serait
 * pire que son absence. `NEXT_PUBLIC_*` est figée au build, donc la condition
 * est évaluée à la construction et le bouton n'existe même pas dans le HTML.
 *
 * Le droit de retirer son consentement à tout moment n'existe que s'il est
 * atteignable à tout moment : ce bouton est rendu sur toutes les pages, 404
 * comprise, puisque le pied de page l'est.
 */
export function ConsentPreferencesLink() {
  const mesureConfiguree = Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim(),
  );
  if (!mesureConfiguree) return null;

  return (
    <p className="relative h-auto w-auto whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em]">
      <button
        type="button"
        data-consent-open=""
        className="text-foreground-60 underline decoration-[rgba(255,255,255,0.13)] underline-offset-[3px] transition-[color,text-underline-offset] duration-200 hover:text-foreground hover:underline-offset-[4px]"
      >
        {consentCopy.footerShortLink}
      </button>
    </p>
  );
}
