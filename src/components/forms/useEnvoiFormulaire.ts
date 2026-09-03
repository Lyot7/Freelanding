"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useProtectionTurnstile } from "./turnstile";
import type { ProtectionTurnstile } from "./turnstile";

/**
 * Logique commune aux trois formulaires du site.
 *
 * UN SEUL ENDROIT décide de ce qui part sur le réseau, de l'état affiché et du
 * moment où un événement d'analyse est émis. Les trois formulaires gardent
 * leur balisage propre — la fidélité visuelle du site tient au pixel près — mais
 * pas leur logique.
 *
 * `evenement.preventDefault()` EST LA CORRECTION D'ORIGINE. Sans lui, le
 * navigateur soumet le formulaire lui-même ; et comme aucun n'avait de
 * gestionnaire, celui de `/contact` partait en `method="get"` avec le nom,
 * l'adresse et le message du prospect DANS L'URL. Aucune donnée ne doit
 * atteindre une chaîne de requête : tout passe par un corps JSON en POST.
 *
 * POINTS D'ACCROCHE POUR L'ANALYSE D'AUDIENCE. Trois événements DOM sont émis
 * sur `window`, avec `detail: { intention }` :
 *   - `formulaire:envoi`  au départ de la requête ;
 *   - `formulaire:succes` sur réponse 200 ;
 *   - `formulaire:echec`  sinon, avec `statut` (code HTTP ou 0) et `motif`.
 * Un écouteur PostHog s'y branche sans toucher à ce fichier ni aux composants.
 * Le `detail` ne contient JAMAIS de donnée saisie : ni adresse, ni message.
 */

/** Les trois intentions reconnues par `POST /api/contact`. */
export type IntentionFormulaire = "projet" | "footer" | "newsletter";

export type EtatEnvoi = "repos" | "envoi" | "succes" | "erreur";

/** Nom du champ piège. Identique côté serveur (`src/lib/contact/validation.ts`). */
export const NOM_CHAMP_PIEGE = "referenceInterne";

/* « SOUVENT SOUS DEUX HEURES » A ÉTÉ RETIRÉ le 2026-08-31, ici comme dans
   l'accusé de réception (`src/lib/contact/emails.ts`) et partout sur le site.
   Eliott a supprimé la promesse des deux heures : l'engagement tenu est une
   réponse à chaque message sous 24 heures ouvrées. */
const MESSAGES_SUCCES: Record<IntentionFormulaire, string> = {
  projet:
    "Message envoyé. Un accusé de réception vient de partir vers ta boîte : je te réponds sous 24 heures ouvrées.",
  footer:
    "Message envoyé. Un accusé de réception vient de partir vers ta boîte : je te réponds sous 24 heures ouvrées.",
  newsletter:
    "Adresse enregistrée. Un e-mail de confirmation vient de partir vers ta boîte.",
};

const MESSAGE_RESEAU =
  "La connexion a échoué. Vérifie ton réseau et réessaie.";

function estMessage(charge: unknown): charge is { message: string; champ?: string } {
  return (
    typeof charge === "object" &&
    charge !== null &&
    typeof (charge as Record<string, unknown>).message === "string"
  );
}

function emettre(nom: string, detail: Record<string, string | number>): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(nom, { detail }));
}

export interface EnvoiFormulaire {
  readonly etat: EtatEnvoi;
  /** Message à afficher, quel que soit l'état. Vide au repos. */
  readonly message: string;
  /** Nom du champ fautif quand le serveur le désigne, pour le surligner. */
  readonly champEnErreur: string | undefined;
  readonly protection: ProtectionTurnstile;
  /**
   * Gestionnaire de `onSubmit`. Nommé et exporté tel quel : un agent d'analyse
   * peut l'envelopper sans avoir à déterrer la logique.
   */
  gererSoumission: (evenement: FormEvent<HTMLFormElement>) => Promise<void>;
  /** Repasse au repos, pour offrir « écrire un autre message ». */
  reprendre: () => void;
}

/**
 * @param intention Détermine les champs attendus et le message de succès.
 * @param emailContact Adresse publiée, affichée en repli quand l'envoi échoue.
 */
export function useEnvoiFormulaire(
  intention: IntentionFormulaire,
  emailContact: string,
): EnvoiFormulaire {
  const [etat, setEtat] = useState<EtatEnvoi>("repos");
  const [message, setMessage] = useState("");
  const [champEnErreur, setChampEnErreur] = useState<string | undefined>(undefined);
  const protection = useProtectionTurnstile();

  /**
   * Horodatage d'affichage, posé APRÈS le montage.
   *
   * Il n'est pas initialisé pendant le rendu : la valeur serait calculée une
   * première fois côté serveur, et le serveur d'un site statique peut rendre la
   * page des heures avant qu'un visiteur ne l'ouvre.
   */
  const refDebut = useRef(0);
  useEffect(() => {
    refDebut.current = Date.now();
  }, []);

  const reprendre = useCallback(() => {
    setEtat("repos");
    setMessage("");
    setChampEnErreur(undefined);
  }, []);

  const gererSoumission = useCallback(
    async (evenement: FormEvent<HTMLFormElement>) => {
      // Interdit la soumission native, donc toute donnée en chaîne de requête.
      evenement.preventDefault();
      if (etat === "envoi") return;

      const formulaire = evenement.currentTarget;
      const donnees = new FormData(formulaire);
      const lire = (nom: string): string => {
        const valeur = donnees.get(nom);
        return typeof valeur === "string" ? valeur : "";
      };

      setEtat("envoi");
      setMessage("");
      setChampEnErreur(undefined);
      emettre("formulaire:envoi", { intention });

      if (!protection.configure) {
        // Le cas « clef absente » est traité ici ET côté serveur : le serveur
        // reste l'autorité, le client évite juste un aller-retour inutile et
        // dit la vérité au lieu d'afficher une roue qui tourne.
        setEtat("erreur");
        setMessage(
          `Le formulaire est momentanément indisponible (protection anti-robot non configurée). Écris-moi directement à ${emailContact}.`,
        );
        emettre("formulaire:echec", { intention, statut: 0, motif: "captcha_absent" });
        return;
      }

      const jetonCaptcha = await protection.obtenirJeton();

      const corps: Record<string, unknown> = {
        intention,
        email: lire("email"),
        debutMs: refDebut.current,
        [NOM_CHAMP_PIEGE]: lire(NOM_CHAMP_PIEGE),
        ...(jetonCaptcha ? { jetonCaptcha } : {}),
      };
      if (intention !== "newsletter") {
        corps.nom = lire("nom");
        corps.typeProjet = lire("typeProjet");
      }
      if (intention === "projet") {
        corps.message = lire("message");
      }

      try {
        const reponse = await fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(corps),
        });
        const charge: unknown = await reponse.json().catch(() => null);

        if (reponse.ok) {
          setEtat("succes");
          setMessage(MESSAGES_SUCCES[intention]);
          formulaire.reset();
          protection.reinitialiser();
          emettre("formulaire:succes", { intention });
          return;
        }

        setEtat("erreur");
        setMessage(
          estMessage(charge)
            ? charge.message
            : `Ton message n’a pas pu être envoyé. Écris-moi directement à ${emailContact}.`,
        );
        setChampEnErreur(estMessage(charge) ? charge.champ : undefined);
        // Le jeton est à usage unique : sans réinitialisation, la deuxième
        // tentative échouerait en boucle sur un jeton déjà consommé.
        protection.reinitialiser();
        emettre("formulaire:echec", {
          intention,
          statut: reponse.status,
          motif: "reponse_erreur",
        });
      } catch {
        setEtat("erreur");
        setMessage(MESSAGE_RESEAU);
        protection.reinitialiser();
        emettre("formulaire:echec", { intention, statut: 0, motif: "reseau" });
      }
    },
    [etat, intention, emailContact, protection],
  );

  return { etat, message, champEnErreur, protection, gererSoumission, reprendre };
}
