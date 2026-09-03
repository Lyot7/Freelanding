"use client";

import { consentCopy } from "@/content/consent";
import { useConsent } from "./ConsentProvider";

/**
 * LIEN PERMANENT DE RETOUR SUR LE CHOIX.
 *
 * Le droit de retirer son consentement à tout moment n'existe que s'il est
 * atteignable à tout moment : un panneau qu'on ne peut rouvrir qu'en effaçant
 * ses données de navigation n'est pas réversible. Ce lien est donc rendu sur
 * TOUTES les pages, y compris le 404, en dernier nœud du document.
 *
 * POURQUOI UNE BANDE À PART PLUTÔT QU'UNE ENTRÉE DANS LE PIED DE PAGE. Le pied
 * de page (`components/layout/Footer.tsx`) est en cours de modification par un
 * autre chantier ; y toucher en parallèle garantissait un conflit. La bande
 * reprend le fond, la gouttière et la typographie de la barre légale du pied de
 * page, de sorte qu'elle en prolonge la lecture. Le jour où le pied de page
 * pourra être édité, il suffira d'y poser un lien portant `data-consent-open` —
 * `ConsentProvider` l'écoute déjà — et de retirer cette bande.
 *
 * Rendu même sans clé PostHog : sans clé il n'y a rien à mesurer, la bannière
 * ne s'ouvre jamais, et un lien qui ne mène nulle part serait pire que rien.
 */
export function ConsentFooterBar() {
  const { configured, openPanel } = useConsent();
  if (!configured) return null;

  return (
    <div
      data-consent-ui=""
      /* Retrait bas GÉNÉREUX sous 810, et ce n'est pas une marge décorative :
         la pastille du menu flottant est en `position: fixed`, centrée en bas,
         et occupe les 70 derniers pixels de la fenêtre. Sans ce retrait, le lien
         passe DESSOUS une fois la page défilée jusqu'en bas et devient
         partiellement incliquable au doigt — exactement sur la seule commande
         qui permet de revenir sur son consentement. */
      className="relative z-[3] w-full border-t border-white/10 bg-background px-[20px] pb-[86px] pt-[14px] tablet:px-[24px] tablet:pb-[14px] desktop:px-[30px]"
    >
      <div className="mx-auto flex w-full max-w-[1440px] justify-start">
        <button
          type="button"
          onClick={openPanel}
          className="whitespace-pre text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 underline decoration-[#ffffff21] underline-offset-[3px] transition-[color,text-decoration-color,text-underline-offset] duration-200 hover:text-foreground hover:underline-offset-4 motion-reduce:transition-none"
        >
          {consentCopy.footerLink}
        </button>
      </div>
    </div>
  );
}
