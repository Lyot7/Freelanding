"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

/**
 * Chargement et pilotage du widget Cloudflare Turnstile.
 *
 * CHARGEMENT PARESSEUX, ET C'EST LE POINT. Le formulaire du pied de page est
 * présent sur les neuf routes du site : charger le script au montage ferait
 * partir une requête vers Cloudflare sur CHAQUE page, pour un formulaire que la
 * plupart des visiteurs ne touchent jamais. Le script n'est donc demandé qu'à la
 * PREMIÈRE interaction avec le formulaire (`activer`, branché sur
 * `onFocusCapture`). Un visiteur qui ne remplit rien ne contacte jamais
 * Cloudflare.
 *
 * POURQUOI TURNSTILE ET PAS reCAPTCHA v3 : voir l'en-tête de
 * `src/lib/contact/captcha.ts`. En deux mots, reCAPTCHA v3 est un traceur tiers
 * soumis au consentement, ce qui entre en collision frontale avec la bannière
 * de consentement que le site met en avant ; Turnstile fait le même travail
 * sans cookie de suivi.
 *
 * RENDU EXPLICITE et non `render=auto` : le rendu automatique cherche les
 * `.cf-turnstile` au chargement du script, ce qui est exactement le mauvais
 * moment dans une application React où le conteneur peut apparaître après.
 */

const URL_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface OptionsRendu {
  sitekey: string;
  callback: (jeton: string) => void;
  "error-callback": () => void;
  "expired-callback": () => void;
  appearance: "interaction-only";
  theme: "auto";
  language: "fr";
}

interface ApiTurnstile {
  render(conteneur: HTMLElement, options: OptionsRendu): string | undefined;
  reset(idWidget?: string): void;
  remove(idWidget: string): void;
}

declare global {
  interface Window {
    turnstile?: ApiTurnstile;
  }
}

/** Clef publique. Absente = protection non configurée, cf. `configure`. */
const CLE_SITE = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

/** Une seule promesse de chargement pour toute la page, quel que soit le nombre de formulaires. */
let chargementScript: Promise<void> | undefined;

function chargerScript(): Promise<void> {
  if (chargementScript) return chargementScript;
  chargementScript = new Promise<void>((resoudre, rejeter) => {
    if (window.turnstile) {
      resoudre();
      return;
    }
    const balise = document.createElement("script");
    balise.src = URL_SCRIPT;
    balise.async = true;
    balise.defer = true;
    balise.addEventListener("load", () => resoudre());
    balise.addEventListener("error", () => {
      // La promesse est oubliée pour qu'une nouvelle tentative soit possible :
      // une coupure réseau passagère ne doit pas condamner le formulaire.
      chargementScript = undefined;
      rejeter(new Error("script turnstile indisponible"));
    });
    document.head.appendChild(balise);
  });
  return chargementScript;
}

export interface ProtectionTurnstile {
  /** `false` quand `NEXT_PUBLIC_TURNSTILE_SITE_KEY` manque. */
  readonly configure: boolean;
  /** Conteneur du widget, à poser dans le formulaire. */
  readonly refConteneur: RefObject<HTMLDivElement | null>;
  /** À brancher sur `onFocusCapture` du formulaire : déclenche le chargement. */
  activer: () => void;
  /** Jeton courant, ou `undefined` s'il n'est pas encore délivré. */
  obtenirJeton: (attenteMaxMs?: number) => Promise<string | undefined>;
  /** Le jeton est à usage unique : à rappeler après chaque envoi. */
  reinitialiser: () => void;
}

export function useProtectionTurnstile(): ProtectionTurnstile {
  const refConteneur = useRef<HTMLDivElement | null>(null);
  const refIdWidget = useRef<string | undefined>(undefined);
  const refJeton = useRef<string | undefined>(undefined);
  const [actif, setActif] = useState(false);

  const activer = useCallback(() => {
    if (CLE_SITE) setActif(true);
  }, []);

  useEffect(() => {
    if (!actif || !CLE_SITE) return;
    let annule = false;

    chargerScript()
      .then(() => {
        if (annule) return;
        const conteneur = refConteneur.current;
        if (!conteneur || !window.turnstile || refIdWidget.current) return;
        refIdWidget.current = window.turnstile.render(conteneur, {
          sitekey: CLE_SITE,
          callback: (jeton) => {
            refJeton.current = jeton;
          },
          "error-callback": () => {
            refJeton.current = undefined;
          },
          "expired-callback": () => {
            refJeton.current = undefined;
          },
          // Le widget ne s'affiche QUE s'il a besoin d'une interaction ; sinon
          // il reste invisible et note la requête en arrière-plan.
          appearance: "interaction-only",
          theme: "auto",
          language: "fr",
        });
      })
      .catch(() => {
        // Le jeton restera absent : la route répondra 403 avec un message
        // lisible plutôt que de laisser passer. Rien à faire de plus ici.
      });

    return () => {
      annule = true;
    };
  }, [actif]);

  const obtenirJeton = useCallback(
    async (attenteMaxMs = 12_000): Promise<string | undefined> => {
      if (!CLE_SITE) return undefined;
      // Un envoi peut partir avant que le widget ait fini : on l'active au
      // besoin et on attend, plutôt que de refuser un formulaire correct.
      setActif(true);
      const echeance = Date.now() + attenteMaxMs;
      while (!refJeton.current && Date.now() < echeance) {
        await new Promise((resoudre) => setTimeout(resoudre, 150));
      }
      return refJeton.current;
    },
    [],
  );

  const reinitialiser = useCallback(() => {
    refJeton.current = undefined;
    if (window.turnstile && refIdWidget.current) {
      window.turnstile.reset(refIdWidget.current);
    }
  }, []);

  return {
    configure: CLE_SITE.length > 0,
    refConteneur,
    activer,
    obtenirJeton,
    reinitialiser,
  };
}
