"use client";

/**
 * Prise de rendez-vous, entièrement dessinée ici — composant CLIENT.
 *
 * LE MOTEUR EST LE COCKPIT depuis le 2026-11-02 (avant : Cal.com). Ce composant
 * ne parle qu'aux routes du site (`/api/rendez-vous/*`), qui relaient au
 * cockpit côté serveur (`src/lib/rendez-vous/cockpit.ts`). `Calendrier` et
 * `Heures` sont exportés : la page `/rdv/gerer/[jeton]` les réutilise.
 *
 * UN STEPPER, UNE ÉTAPE À L'ÉCRAN (2026-10-01). La version précédente empilait
 * les étapes et grandissait à chaque choix. Eliott : « assez indigeste et qui
 * s'agrandit, faire plutôt une sorte de stepper ». Un seul temps affiché, la
 * barre de progression rend chaque étape franchie cliquable, et le
 * récapitulatif garde sous les yeux ce qui a déjà été choisi.
 *
 * LE QUESTIONNAIRE VIENT AVANT LE CRÉNEAU depuis le 2026-11-10, pour les
 * prospects (logiciel, découverte) : sujet → entreprise → besoin →
 * coordonnées (téléphone obligatoire) → créneau. Des rendez-vous pris sans
 * contexte finissaient en absence ; celui qui a expliqué son cas avant de voir
 * l'agenda vient, et Eliott arrive préparé. Les clients en cours
 * (démonstration, point d'étape) gardent le parcours court : sujet → créneau →
 * une ou deux questions → coordonnées (`ordreDe`).
 *
 * LA DURÉE EST CHOISIE PAR LE VISITEUR, présélectionnée sur la valeur par
 * défaut du type au cockpit. Les options viennent du cockpit par la route des
 * créneaux : le site n'en recopie aucune.
 *
 * AUCUNE ANIMATION D'APPARITION ICI, contrairement au reste du site. `Reveal`
 * rend l'état MASQUÉ dès le serveur et compte sur une animation pour le lever :
 * dans un onglet d'arrière-plan, le bloc resterait invisible. Sur le
 * formulaire par lequel passe un rendez-vous, c'est une conversion perdue.
 *
 * ACCESSIBILITÉ — les points qui comptent :
 *   - le focus SUIT l'étape : il se pose sur le titre de l'étape affichée, sans
 *     quoi il retomberait sur le document à chaque changement ;
 *   - la barre de progression est une liste ordonnée, l'étape courante porte
 *     `aria-current="step"` ;
 *   - durée et questionnaire sont de vrais `radio` dans un `fieldset`, avec
 *     une pastille visible que l'anneau de focus global peut entourer ;
 *   - chaque jour du calendrier porte son libellé complet, les jours sans
 *     créneau sont désactivés, et l'état d'envoi passe par la région live de
 *     `MessageEtat`.
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode, RefObject } from "react";
import {
  ChampsProtection,
  MessageEtat,
} from "@/components/forms/ProtectionFormulaire";
import { useProtectionTurnstile } from "@/components/forms/turnstile";
import { NOM_CHAMP_PIEGE } from "@/components/forms/useEnvoiFormulaire";
import type { EtatEnvoi } from "@/components/forms/useEnvoiFormulaire";
import {
  MESSAGE_RESEAU,
  messageEchecInconnu,
  messageProtectionAbsente,
} from "@/components/rendez-vous/messages";
import { Icon, Spinner } from "@/components/ui";
import { rendezVousContent } from "@/content/rendez-vous";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { capture } from "@/lib/analytics/posthog";
import type {
  IdRendezVous,
  OptionQuestion,
  TypeRendezVous,
} from "@/content/rendez-vous";
import {
  ajouterMois,
  formaterJour,
  grilleMois,
  JOURS_SEMAINE,
  lireReponseCreneaux,
  numeroDuJour,
} from "@/lib/rendez-vous/creneaux";
import type {
  Creneau,
  JourDeCreneaux,
  ReponseCreneaux,
} from "@/lib/rendez-vous/creneaux";
import {
  LONGUEUR_ACTIVITE_MAX,
  LONGUEUR_COINCE_MAX,
  LONGUEUR_COINCE_MIN,
  LONGUEUR_ENTREPRISE_MAX,
  LONGUEUR_PROJET_MAX,
  OPTIONS_COUT,
  OPTIONS_DECISION,
  OPTIONS_ECHEANCE,
  OPTIONS_ESSAYE,
  OPTIONS_TAILLE,
  optionsObjectif,
  questionsDuType,
  retourBudget,
  tranchesBudget,
} from "@/lib/rendez-vous/questionnaire";
import type { RetourBudget } from "@/lib/rendez-vous/questionnaire";

const contenu = rendezVousContent;

/** Ce qui empêche d'afficher des créneaux, du plus bénin au plus définitif. */
type EtatCreneaux = "aucune" | "reseau" | "indisponible";

/**
 * Dernier résultat reçu, avec la QUESTION à laquelle il répond.
 *
 * Garder la clef à côté de la réponse est ce qui permet de déduire le
 * chargement au lieu de le stocker, et d'écarter au rendu une réponse arrivée
 * après que le prospect a changé d'avis.
 */
interface ResultatCreneaux {
  readonly cle: string;
  readonly type: IdRendezVous | undefined;
  readonly etat: EtatCreneaux;
  readonly donnees?: ReponseCreneaux;
}

function estMessage(charge: unknown): charge is { message: string; champ?: string } {
  return (
    typeof charge === "object" &&
    charge !== null &&
    typeof (charge as Record<string, unknown>).message === "string"
  );
}

/** Numéro d'étape, sur deux chiffres, comme la numérotation de la FAQ du site. */
function numero(index: number): string {
  return String(index + 1).padStart(2, "0");
}

export const CLASSE_LIBELLE =
  "text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground/80";

export const CLASSE_CHAMP =
  "h-[52px] w-full border border-white/45 bg-white/[0.04] px-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/45 hover:border-white/60 focus:border-accent tablet:text-[15px]";

export const CLASSE_TEXTE =
  "text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60";

export const CLASSE_BOUTON_SECONDAIRE =
  "flex min-h-[44px] items-center gap-[8px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 transition-colors hover:text-accent motion-reduce:transition-none";

export const CLASSE_BOUTON_PRINCIPAL =
  "flex h-[52px] w-full items-center justify-center bg-accent px-[28px] text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none tablet:w-fit";

/**
 * Les étapes du parcours, dans l'ordre que suit le sujet choisi.
 *
 * DEUX ORDRES (2026-11-10). Un prospect (logiciel, découverte) répond au cadrage
 * et donne ses coordonnées AVANT de voir l'agenda : Eliott arrive préparé, et
 * celui qui a pris trois minutes pour expliquer son cas vient au rendez-vous.
 * Un client déjà en cours (démonstration, point d'étape) garde le parcours
 * court : le créneau d'abord, une question, ses coordonnées.
 */
export type IdEtape = "sujet" | "entreprise" | "besoin" | "cadre" | "coordonnees" | "creneau" | "projet";

const ORDRE_CADRAGE: readonly IdEtape[] = ["sujet", "entreprise", "besoin", "cadre", "coordonnees", "creneau"];
const ORDRE_COURT: readonly IdEtape[] = ["sujet", "creneau", "projet", "coordonnees"];

/** Ordre du sujet ; sans sujet, celui du cadrage, que suivent les sujets proposés d'emblée. */
function ordreDe(type: IdRendezVous | undefined): readonly IdEtape[] {
  return !type || questionsDuType(type).cadrage ? ORDRE_CADRAGE : ORDRE_COURT;
}

/** Étape qui suit `etape` dans l'ordre du sujet ; la dernière reste la dernière. */
function suivante(type: IdRendezVous | undefined, etape: IdEtape): IdEtape {
  const ordre = ordreDe(type);
  return ordre[Math.min(ordre.indexOf(etape) + 1, ordre.length - 1)];
}

const TITRES_ETAPES: Readonly<Record<IdEtape, string>> = {
  sujet: contenu.etapes.sujet,
  entreprise: contenu.etapes.entreprise,
  besoin: contenu.etapes.besoin,
  cadre: contenu.etapes.projet,
  coordonnees: contenu.etapes.coordonnees,
  creneau: contenu.etapes.creneau,
  projet: contenu.etapes.projet,
};

/**
 * Étape où renvoie un refus du serveur qui nomme son champ : le visiteur
 * retrouve la question fautive au lieu d'un message loin d'elle.
 */
export function etapeDuChamp(champ: string | undefined, cadrage: boolean): IdEtape | undefined {
  switch (champ) {
    case "creneau":
    case "duree":
      return "creneau";
    case "entreprise":
    case "activite":
    case "taille":
      return "entreprise";
    case "coince":
    case "cout":
    case "essaye":
      return "besoin";
    case "objectif":
      return cadrage ? "besoin" : "projet";
    case "decision":
    case "budget":
    case "echeance":
      return cadrage ? "cadre" : "projet";
    case "projet":
      return "projet";
    case "nom":
    case "email":
    case "telephone":
    case "message":
      return "coordonnees";
    default:
      return undefined;
  }
}

/**
 * Barre de progression : un segment par étape, numéro et titre sous chacun.
 *
 * Une étape FRANCHIE est un bouton qui y ramène ; l'étape courante et celles à
 * venir ne sont pas cliquables, parce qu'on n'atteint pas le créneau sans
 * avoir répondu, ni les coordonnées sans sujet.
 */
function Progression({
  ordre,
  etape,
  onAller,
}: {
  ordre: readonly IdEtape[];
  etape: IdEtape;
  onAller: (etape: IdEtape) => void;
}) {
  const courant = ordre.indexOf(etape);
  return (
    <ol
      className="m-0 grid list-none gap-[6px] p-0"
      style={{ gridTemplateColumns: `repeat(${ordre.length}, minmax(0, 1fr))` }}
    >
      {ordre.map((id, index) => {
        const faite = index < courant;
        const courante = index === courant;
        const titre = TITRES_ETAPES[id];
        const corps = (
          <>
            <span
              aria-hidden
              className={`block h-[2px] w-full transition-colors motion-reduce:transition-none ${
                faite || courante ? "bg-accent" : "bg-white/15"
              }`}
            />
            <span className="flex flex-col gap-[4px] pt-[10px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]">
              <span className={faite || courante ? "text-accent" : "text-foreground-60"}>
                {numero(index)}
              </span>
              {/* Sur un téléphone, cinq titres ne tiennent pas côte à côte : les
                  numéros suffisent, le titre de l'étape est juste dessous. */}
              <span
                className={`sr-only tablet:not-sr-only ${courante ? "text-foreground" : "text-foreground-60"}`}
              >
                {titre}
              </span>
            </span>
          </>
        );
        return (
          <li key={id} aria-current={courante ? "step" : undefined}>
            {faite ? (
              <button
                type="button"
                onClick={() => onAller(id)}
                className="block w-full text-left transition-opacity hover:opacity-70 motion-reduce:transition-none"
              >
                {corps}
              </button>
            ) : (
              <div>{corps}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Vrai quand le visiteur a demandé moins de mouvement ; faux là où la requête n'existe pas. */
function mouvementReduit(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Une réponse libre : libellé, champ (une ligne ou plusieurs), erreur dessous.
 *
 * L'erreur est reliée au champ par `aria-describedby`, comme celle d'un groupe
 * de `ChoixUnique` : le lecteur d'écran la lit en arrivant sur le champ.
 */
function ChampTexte({
  id,
  nom,
  legende,
  valeur,
  onChanger,
  placeholder,
  erreur,
  aide,
  refChamp,
  multiligne = false,
  maxLength,
  type = "text",
  autoComplete,
  inputMode,
  requis = false,
  invalide = false,
}: {
  id: string;
  nom: string;
  legende: string;
  valeur: string;
  onChanger: (valeur: string) => void;
  placeholder?: string;
  erreur?: string;
  aide?: string;
  refChamp?: RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  multiligne?: boolean;
  maxLength?: number;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel";
  requis?: boolean;
  /** Bordure d'erreur sans texte : le message du serveur s'affiche sous le formulaire. */
  invalide?: boolean;
}) {
  const idErreur = `${id}-erreur`;
  const idAide = `${id}-aide`;
  const decrit = [aide ? idAide : undefined, erreur ? idErreur : undefined]
    .filter(Boolean)
    .join(" ");
  const commun = {
    id,
    name: nom,
    value: valeur,
    maxLength,
    placeholder,
    required: requis || undefined,
    "aria-invalid": erreur || invalide ? true : undefined,
    "aria-describedby": decrit || undefined,
  } as const;
  return (
    // Le libellé ne porte que la légende : l'aide et l'erreur passent par
    // `aria-describedby`, sans être lues deux fois.
    <div className="flex w-full flex-col gap-[10px]">
      <label htmlFor={id} className={CLASSE_LIBELLE}>
        {legende}
      </label>
      {multiligne ? (
        <textarea
          {...commun}
          ref={refChamp as RefObject<HTMLTextAreaElement | null> | undefined}
          onChange={(evenement) => onChanger(evenement.target.value)}
          className={`min-h-[110px] w-full resize-y border border-white/45 bg-white/[0.04] p-[16px] text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/45 hover:border-white/60 focus:border-accent tablet:text-[15px] ${erreur || invalide ? "border-accent" : ""}`}
        />
      ) : (
        <input
          {...commun}
          ref={refChamp as RefObject<HTMLInputElement | null> | undefined}
          type={type}
          autoComplete={autoComplete}
          inputMode={inputMode}
          onChange={(evenement) => onChanger(evenement.target.value)}
          className={`${CLASSE_CHAMP} ${erreur || invalide ? "border-accent" : ""}`}
        />
      )}
      {aide ? (
        <span id={idAide} className="-mt-[2px] mb-[8px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
          {aide}
        </span>
      ) : null}
      {erreur ? (
        <span
          id={idErreur}
          className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-accent"
        >
          {erreur}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Une étape : son titre, qui reçoit le focus quand elle s'affiche, puis son
 * contenu.
 */
function Etape({
  titre,
  refTitre,
  children,
}: {
  titre: string;
  refTitre: RefObject<HTMLHeadingElement | null>;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[20px]">
      <h3
        ref={refTitre}
        tabIndex={-1}
        className="m-0 text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground outline-none tablet:text-[26px]"
      >
        {titre}
      </h3>
      {children}
    </div>
  );
}

/**
 * Les trois sujets, en cartes-boutons : un clic retient le sujet ET passe au
 * créneau. Des boutons et non des `radio` : dans un `radiogroup`, les flèches
 * changent la sélection, et un passage automatique à l'étape suivante ferait
 * disparaître le groupe sous les doigts d'un utilisateur au clavier.
 */
function ChoixType({
  types,
  choisi,
  onChoisir,
}: {
  types: readonly TypeRendezVous[];
  choisi: IdRendezVous | undefined;
  onChoisir: (id: IdRendezVous) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-[10px]">
      {types.map((type) => {
        const actif = type.id === choisi;
        return (
          <button
            key={type.id}
            type="button"
            aria-pressed={actif}
            onClick={() => onChoisir(type.id)}
            className={`group flex w-full items-start justify-between gap-[16px] border p-[16px] text-left transition-colors motion-reduce:transition-none ${
              actif ? "border-accent bg-accent/[0.07]" : "border-border hover:border-white/35"
            }`}
          >
            <span className="flex flex-col gap-[10px]">
              <span className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
                {type.nom}
              </span>
              <span className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60">
                {type.duree}
              </span>
              <span className="text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                {type.description}
              </span>
            </span>
            <Icon
              name="arrow"
              size={16}
              className="mt-[2px] flex-none text-foreground-60 transition-[color,transform] group-hover:translate-x-[3px] group-hover:text-accent motion-reduce:transition-none"
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Une question à choix unique du questionnaire.
 *
 * MÊME MÉCANIQUE QUE `ChoixType` : `fieldset` + `legend` + vrais `radio`, donc
 * flèches au clavier et « 2 sur 5 » au lecteur d'écran, et une pastille
 * visible que l'anneau de focus global peut entourer. En pastilles qui passent
 * à la ligne plutôt qu'en cartes : les réponses tiennent en quelques mots.
 *
 * PAS D'ATTRIBUT `required` sur les radios : le navigateur afficherait sa
 * propre bulle, dans sa langue et son dessin. L'erreur s'écrit sous le groupe,
 * et c'est le serveur qui fait autorité.
 */
function ChoixUnique({
  nom,
  prefixe,
  legende,
  options,
  choisi,
  onChoisir,
  erreur,
  refPremier,
}: {
  nom: string;
  /** Propre à chaque instance : deux réservations peuvent cohabiter sur une page. */
  prefixe: string;
  legende: string;
  options: readonly OptionQuestion[];
  choisi: string;
  onChoisir: (id: string) => void;
  /** Texte affiché sous le groupe ; absent = pas d'erreur. */
  erreur?: string;
  /** Reçoit la première pastille, pour y poser le focus. */
  refPremier?: RefObject<HTMLInputElement | null>;
}) {
  const idErreur = `${prefixe}-${nom}-erreur`;
  return (
    <fieldset
      className="m-0 min-w-0 border-0 p-0"
      aria-describedby={erreur ? idErreur : undefined}
    >
      <legend className={`${CLASSE_LIBELLE} mb-[10px] p-0`}>{legende}</legend>
      <div className="flex flex-wrap gap-[8px]">
        {options.map((option, index) => {
          const actif = option.id === choisi;
          return (
            <label
              key={option.id}
              className={`flex min-h-[44px] cursor-pointer items-center gap-[10px] border px-[14px] py-[10px] transition-colors has-[:focus-visible]:border-accent motion-reduce:transition-none ${
                actif ? "border-accent bg-accent/[0.07]" : "border-border hover:border-white/35"
              }`}
            >
              <input
                ref={index === 0 ? refPremier : undefined}
                type="radio"
                name={`${prefixe}-${nom}`}
                value={option.id}
                checked={actif}
                onChange={() => onChoisir(option.id)}
                className="size-[14px] flex-none cursor-pointer appearance-none rounded-full border border-white/40 bg-transparent transition-colors checked:border-accent checked:bg-accent motion-reduce:transition-none"
              />
              <span className="text-[13px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
                {option.libelle}
              </span>
            </label>
          );
        })}
      </div>
      {erreur ? (
        <p
          id={idErreur}
          className="mt-[10px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-accent"
        >
          {erreur}
        </p>
      ) : null}
    </fieldset>
  );
}

/**
 * « Ce que vous pouvez espérer à ce budget ».
 *
 * LA RÉGION LIVE EXISTE AVANT SON CONTENU : un lecteur d'écran n'annonce pas
 * une région qui apparaît déjà remplie. Vide, elle ne prend aucune place.
 */
function RetourEspere({ retour }: { retour: RetourBudget | undefined }) {
  return (
    <div aria-live="polite">
      {retour ? (
        <div className="mt-[12px] flex flex-col gap-[14px] border border-border p-[16px]">
          <p className={CLASSE_LIBELLE}>{contenu.retour.titre}</p>
          <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
            {retour.texte}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Calendrier d'un mois : les jours qui ont au moins un créneau sont des
 * cases bordées cliquables, les autres restent lisibles mais grisés et sans
 * cadre.
 *
 * UN MOIS ENTIER ET NON UNE BANDE DE JOURS : le prospect voit d'un coup d'œil
 * quand il y a de la place, et un jour sans créneau se lit comme tel au lieu
 * de disparaître de la bande.
 */
export function Calendrier({
  donnees,
  jourActif,
  chargement,
  onChoisirJour,
  onDecaler,
}: {
  donnees: ReponseCreneaux;
  jourActif: JourDeCreneaux | undefined;
  chargement: boolean;
  onChoisirJour: (jour: string) => void;
  onDecaler: (mois: number) => void;
}) {
  const disponibles = new Map(donnees.jours.map((jour) => [jour.jour, jour]));
  const cases = grilleMois(donnees.fenetre.mois);
  // `aria-disabled` et non `disabled` : un bouton désactivé perd le focus, et
  // il le perdrait au moment précis où le clavier vient de l'actionner (le
  // chargement du mois suivant, ou l'arrivée au bout de la fenêtre).
  const classeNavigation =
    "flex size-[36px] items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent aria-disabled:cursor-not-allowed aria-disabled:opacity-30 aria-disabled:hover:border-border aria-disabled:hover:text-foreground motion-reduce:transition-none";
  const precedentBloque = donnees.fenetre.premiere || chargement;
  const suivantBloque = donnees.fenetre.derniere || chargement;

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center justify-between gap-[16px]">
        <p className="m-0 text-[14px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground">
          {donnees.fenetre.libelle}
        </p>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            className={classeNavigation}
            aria-disabled={precedentBloque}
            onClick={() => {
              if (!precedentBloque) onDecaler(-1);
            }}
          >
            <Icon
              name="arrow"
              size={16}
              className="rotate-180"
              label={contenu.actions.moisPrecedent}
            />
          </button>
          <button
            type="button"
            className={classeNavigation}
            aria-disabled={suivantBloque}
            onClick={() => {
              if (!suivantBloque) onDecaler(1);
            }}
          >
            <Icon name="arrow" size={16} label={contenu.actions.moisSuivant} />
          </button>
        </div>
      </div>

      <div
        role="group"
        aria-label={contenu.creneaux.libelleCalendrier}
        aria-busy={chargement}
        className={`grid grid-cols-7 gap-[4px] transition-opacity motion-reduce:transition-none ${
          chargement ? "opacity-40" : ""
        }`}
      >
        {JOURS_SEMAINE.map((jour) => (
          <span
            key={jour}
            aria-hidden
            className="pb-[4px] text-center text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60"
          >
            {jour}
          </span>
        ))}
        {cases.map((jour, index) => {
          if (jour === null) return <span key={`vide-${index}`} aria-hidden />;
          const disponible = disponibles.get(jour);
          const actif = disponible !== undefined && jour === jourActif?.jour;
          return (
            <button
              key={jour}
              type="button"
              disabled={!disponible || chargement}
              aria-pressed={disponible ? actif : undefined}
              aria-label={disponible ? disponible.libelle : formaterJour(jour)}
              onClick={() => onChoisirJour(jour)}
              className={`flex h-[44px] items-center justify-center border text-[14px] font-medium leading-none tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : disponible
                    ? "border-border text-foreground hover:border-accent hover:text-accent"
                    : "cursor-default border-transparent text-white/40"
              }`}
            >
              {numeroDuJour(jour)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Heures libres du jour retenu, en grille serrée. */
export function Heures({
  jour,
  choisi,
  onChoisir,
}: {
  jour: JourDeCreneaux;
  choisi: Creneau | undefined;
  onChoisir: (creneau: Creneau) => void;
}) {
  return (
    <div className="relative flex flex-col gap-[14px] desktop:h-full">
      {/* Pas de capitales ici : « 1er » deviendrait « 1ER ». */}
      <p className="m-0 flex min-h-[36px] items-center text-[14px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
        {jour.libelle}
      </p>
      {/* À PARTIR DE 1200, LA COLONNE DÉFILE à la hauteur du calendrier, qu'elle
          épouse en position absolue sous le libellé du jour (36 + 14 px) : une
          journée ouverte au quart d'heure compte près de trente heures, soit
          deux fois la hauteur du mois d'à côté. `data-lenis-prevent` rend la
          molette à cette colonne, Lenis gardant la page. En dessous, la grille
          passe sous le calendrier sur quatre colonnes et tient sans défiler. */}
      <div
        role="group"
        aria-label={`${contenu.creneaux.libelleGrille} ${jour.libelle}`}
        data-lenis-prevent
        className="grid grid-cols-4 content-start gap-[6px] desktop:absolute desktop:inset-x-0 desktop:bottom-0 desktop:top-[50px] desktop:grid-cols-3 desktop:overflow-y-auto desktop:overscroll-contain desktop:pb-[28px] desktop:pr-[6px] desktop:[mask-image:linear-gradient(to_bottom,black_calc(100%-40px),transparent)] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]"
      >
        {jour.creneaux.map((creneau) => {
          const actif = creneau.debut === choisi?.debut;
          return (
            <button
              key={creneau.debut}
              type="button"
              aria-pressed={actif}
              // Anneau INTÉRIEUR : la colonne défile, et un anneau extérieur y
              // serait rogné par le bord du conteneur.
              data-focus-ring="inset"
              onClick={() => onChoisir(creneau)}
              className={`h-[44px] border text-[13px] font-medium leading-[1.2] tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              {creneau.heure}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReservationRendezVous({
  types,
  emailContact,
  typeInitial,
}: {
  /** Types RÉELLEMENT configurés, résolus côté serveur. Jamais vide ici. */
  types: readonly TypeRendezVous[];
  /** Adresse publiée, affichée en repli quand la réservation ne peut aboutir. */
  emailContact: string;
  /**
   * Sujet déjà choisi à l'arrivée, lu dans `?sujet` par l'appelant.
   *
   * VALEUR INITIALE, PAS VALEUR CONTRÔLÉE : le prospect reste libre d'en
   * changer. Présent, il ouvre directement l'étape qui suit le sujet : le
   * visiteur vient de le choisir en cliquant le lien, inutile de le redemander.
   */
  typeInitial?: IdRendezVous;
}) {
  // Préfixe des identifiants et des groupes de boutons radio : la page de
  // contact et le pied de page peuvent monter deux réservations à la fois.
  const instance = `rdv${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [etape, setEtape] = useState<IdEtape>(
    typeInitial ? suivante(typeInitial, "sujet") : "sujet",
  );
  const [type, setType] = useState<IdRendezVous | undefined>(typeInitial);
  const [creneau, setCreneau] = useState<Creneau | undefined>(undefined);
  /** Durée demandée ; `undefined` = celle par défaut du type au cockpit. */
  const [duree, setDuree] = useState<number | undefined>(undefined);
  const [mois, setMois] = useState("");
  const [jourChoisi, setJourChoisi] = useState("");
  /** Incrémenté par « Réessayer » : c'est ce qui relance l'effet à l'identique. */
  const [tentative, setTentative] = useState(0);
  const [resultat, setResultat] = useState<ResultatCreneaux>({
    cle: "",
    type: undefined,
    etat: "aucune",
  });

  /**
   * Clef de la requête EN COURS DE VALIDITÉ.
   *
   * `chargement` n'est PAS un état : c'est le simple constat que le dernier
   * résultat reçu ne répond pas à la question posée. Le tenir en état
   * obligerait à un `setChargement(true)` en tête d'effet, donc à une cascade
   * de rendus dont `react-hooks/set-state-in-effect` ne veut pas.
   *
   * LES CRÉNEAUX SE CHARGENT DÈS LE SUJET CHOISI, même quand le créneau vient
   * en dernier : ils sont prêts quand le visiteur y arrive.
   */
  const cle = type ? `${type}|${mois}|${duree ?? ""}|${tentative}` : "";
  const chargement = type !== undefined && resultat.cle !== cle;
  // Les créneaux du type PRÉCÉDENT ne survivent pas à un changement de sujet ;
  // ceux du mois ou de la durée précédents, si, le temps que la suite arrive.
  const donnees = resultat.type === type ? resultat.donnees : undefined;
  const etatCreneaux: EtatCreneaux =
    resultat.type === type && resultat.cle === cle ? resultat.etat : "aucune";
  /**
   * Jour affiché — DÉDUIT, jamais synchronisé : le jour retenu s'il existe
   * encore dans la donnée, sinon le premier jour disponible du mois.
   */
  const jourActif =
    donnees?.jours.find((jour) => jour.jour === jourChoisi) ?? donnees?.jours[0];
  const durees = donnees?.durees ?? undefined;
  /** Durée réellement retenue, pour le récapitulatif et l'envoi. */
  const dureeRetenue = durees ? (duree ?? donnees?.duree ?? durees.defaut) : undefined;

  const [etatEnvoi, setEtatEnvoi] = useState<EtatEnvoi>("repos");
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [champEnErreur, setChampEnErreur] = useState<string | undefined>(undefined);
  const protection = useProtectionTurnstile();

  /*
   * LE QUESTIONNAIRE ET LES COORDONNÉES vivent en état, et non dans le DOM :
   * une étape quittée est démontée, et revenir en arrière ne doit rien effacer.
   * La VALIDITÉ des réponses pour le sujet courant est déduite : une tranche qui
   * n'existe pas pour le nouveau sujet cesse simplement de compter.
   */
  const [budget, setBudget] = useState("");
  const [objectif, setObjectif] = useState("");
  const [echeance, setEcheance] = useState("");
  const [projet, setProjet] = useState("");
  const [entreprise, setEntreprise] = useState("");
  const [activite, setActivite] = useState("");
  const [taille, setTaille] = useState("");
  const [decision, setDecision] = useState("");
  const [coince, setCoince] = useState("");
  const [cout, setCout] = useState("");
  const [essaye, setEssaye] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  /**
   * Étapes dont le « Continuer » a été refusé : leurs réponses manquantes
   * s'affichent en erreur. Par étape, pour qu'une étape encore jamais vue
   * n'arrive pas couverte d'erreurs.
   */
  const [tentees, setTentees] = useState<readonly IdEtape[]>([]);
  /** Questions que le sujet pose : ni budget ni échéance pour une démonstration. */
  const posees = useMemo(() => questionsDuType(type), [type]);
  const ordre = ordreDe(type);
  const derniere = ordre[ordre.length - 1];
  const tranches = useMemo(
    () => (posees.budget ? tranchesBudget() : []),
    [posees],
  );
  const objectifs = useMemo(() => (type ? optionsObjectif(type) : []), [type]);
  const budgetChoisi = tranches.some((t) => t.id === budget) ? budget : "";
  const objectifChoisi = objectifs.some((o) => o.id === objectif) ? objectif : "";
  const retour = useMemo(
    () => (budgetChoisi ? retourBudget(budgetChoisi) : undefined),
    [budgetChoisi],
  );

  /** Réponses absentes, question par question, pour le sujet courant. */
  const manquants = {
    entreprise: posees.cadrage && entreprise.trim().length === 0,
    activite: posees.cadrage && activite.trim().length < 2,
    taille: posees.cadrage && !taille,
    decision: posees.cadrage && !decision,
    coince: posees.cadrage && coince.trim().length < LONGUEUR_COINCE_MIN,
    cout: posees.cadrage && !cout,
    essaye: posees.cadrage && !essaye,
    echeance: posees.cadrage && posees.echeance && !echeance,
    budget: tranches.length > 0 && !budgetChoisi,
    objectif: !objectifChoisi,
    projet: posees.projet && projet.trim().length === 0,
  } as const;
  type Question = keyof typeof manquants;

  /** Le message d'erreur d'une question : après un « Continuer » refusé, ou un refus du serveur. */
  const erreurDe = (question: Question, ou: IdEtape, texte: string): string | undefined =>
    (tentees.includes(ou) && manquants[question]) || champEnErreur === question ? texte : undefined;
  const etapeObjectif: IdEtape = posees.cadrage ? "besoin" : "projet";
  const etapeBudget: IdEtape = posees.cadrage ? "cadre" : "projet";
  const q = contenu.questionnaire;
  const erreurs = {
    entreprise: erreurDe("entreprise", "entreprise", q.entreprise.erreur),
    activite: erreurDe("activite", "entreprise", q.activite.erreur),
    taille: erreurDe("taille", "entreprise", q.taille.erreur),
    decision: erreurDe("decision", "cadre", q.decision.erreur),
    coince: erreurDe("coince", "besoin", q.coince.erreur),
    cout: erreurDe("cout", "besoin", q.cout.erreur),
    essaye: erreurDe("essaye", "besoin", q.essaye.erreur),
    echeance: erreurDe("echeance", "cadre", q.echeance.erreur),
    budget: erreurDe("budget", etapeBudget, q.budget.erreur),
    objectif: erreurDe("objectif", etapeObjectif, q.objectif.erreur),
    projet: erreurDe("projet", "projet", q.projet.erreur),
  };

  /** Une réponse donnée efface l'erreur que le serveur avait posée sur elle. */
  const repondre = useCallback(
    (question: string, poser: (valeur: string) => void) => (valeur: string) => {
      poser(valeur);
      setChampEnErreur((champ) => (champ === question ? undefined : champ));
    },
    [],
  );

  /**
   * Horodatage d'affichage, posé APRÈS le montage.
   *
   * Il n'est pas initialisé pendant le rendu : la valeur serait calculée côté
   * serveur, et une page servie il y a deux heures ferait rejeter la
   * réservation par le contrôle de délai maximal.
   */
  const refDebut = useRef(0);
  useEffect(() => {
    refDebut.current = Date.now();
  }, []);

  /**
   * Le focus SUIT l'étape, et le bloc revient en vue.
   *
   * IL NE SE DÉCLENCHE JAMAIS SUR L'ÉTAT INITIAL, et c'est ce qui rend
   * `typeInitial` sans danger : un focus posé au chargement ferait atterrir le
   * clavier au milieu de la page, et un lecteur d'écran annoncerait l'étape
   * avant le titre de la page. D'où la comparaison avec l'étape précédente
   * plutôt qu'un simple déclenchement sur `etape`.
   *
   * LE DÉFILEMENT NE REMONTE QUE SI LE HAUT DU BLOC EST SORTI PAR LE HAUT : une
   * étape plus courte que la précédente laisserait sinon le visiteur face au
   * pied de page, sans repère.
   */
  const racine = useRef<HTMLDivElement | null>(null);
  const refTitre = useRef<HTMLHeadingElement | null>(null);
  /** Premier champ de chaque question, pour y poser le focus quand elle manque. */
  const refEntreprise = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const refActivite = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const refTaille = useRef<HTMLInputElement | null>(null);
  const refDecision = useRef<HTMLInputElement | null>(null);
  const refCoince = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const refCout = useRef<HTMLInputElement | null>(null);
  const refEssaye = useRef<HTMLInputElement | null>(null);
  const refEcheance = useRef<HTMLInputElement | null>(null);
  const refBudget = useRef<HTMLInputElement | null>(null);
  const refObjectif = useRef<HTMLInputElement | null>(null);
  const refProjet = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const refConfirmer = useRef<HTMLDivElement | null>(null);
  const etapeAffichee = useRef(etape);
  useEffect(() => {
    if (etapeAffichee.current === etape) return;
    etapeAffichee.current = etape;
    refTitre.current?.focus({ preventScroll: true });
    const noeud = racine.current;
    if (noeud && noeud.getBoundingClientRect().top < 0) {
      const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      noeud.scrollIntoView({ block: "start", behavior: reduit ? "auto" : "smooth" });
    }
  }, [etape]);

  /**
   * Le succès REMPLACE le formulaire, bouton d'envoi compris : sans ce focus,
   * le clavier retomberait sur le document et rien ne serait annoncé.
   */
  const refSucces = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (etatEnvoi === "succes") refSucces.current?.focus();
  }, [etatEnvoi]);

  /*
   * UN SUJET PRÉSÉLECTIONNÉ FRANCHIT LA MÊME MARCHE QU'UN SUJET CHOISI.
   *
   * Sur `/services/*` et sur `/contact?sujet=…`, le prospect n'appuie sur rien :
   * la page décide pour lui. Sans cet envoi, l'entonnoir ne verrait jamais
   * l'étape 2 pour ces visites-là. `preselected` distingue les deux populations.
   *
   * IL NE PART PAS AU MONTAGE MAIS À LA PREMIÈRE VISIBILITÉ DU BLOC : un
   * entonnoir PostHog ordonné n'accepte une étape que si la précédente
   * (`section_viewed`) l'a précédée dans le temps. La bande observée est celle
   * de `PageAnalytics` (`-20 %` en haut et en bas), et le délai de 500 ms rend
   * l'ordre certain entre deux observateurs déclenchés par le même défilement.
   *
   * IL NE PART QU'UNE FOIS : `disconnect` sur la première intersection, et la
   * garde par `ref` couvre le double montage du mode strict.
   */
  const sujetInitialAnnonce = useRef(false);
  useEffect(() => {
    if (!typeInitial || sujetInitialAnnonce.current) return;

    const annoncer = () => {
      if (sujetInitialAnnonce.current) return;
      sujetInitialAnnonce.current = true;
      capture(ANALYTICS_EVENTS.rdvTypeSelected, {
        rdv_type: typeInitial,
        preselected: true,
      });
    };

    const noeud = racine.current;
    if (!noeud || typeof IntersectionObserver === "undefined") {
      annoncer();
      return;
    }

    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (!entrees.some((entree) => entree.isIntersecting)) return;
        observateur.disconnect();
        minuterie = setTimeout(annoncer, 500);
      },
      { threshold: 0, rootMargin: "-20% 0px -20% 0px" },
    );
    observateur.observe(noeud);
    return () => {
      observateur.disconnect();
      if (minuterie !== undefined) clearTimeout(minuterie);
    };
  }, [typeInitial]);

  useEffect(() => {
    const typeDemande = type;
    if (!typeDemande) return;
    const controleur = new AbortController();

    const parametres = new URLSearchParams({ type: typeDemande });
    if (mois) parametres.set("mois", mois);
    if (duree !== undefined) parametres.set("duree", String(duree));

    fetch(`/api/rendez-vous/creneaux?${parametres.toString()}`, {
      signal: controleur.signal,
    })
      .then(async (reponse) => {
        // 503 = la prise de rendez-vous n'est pas configurée. Ce n'est pas une
        // panne passagère : proposer « Réessayer » y serait mensonger.
        if (reponse.status === 503) {
          setResultat({ cle, type: typeDemande, etat: "indisponible" });
          capture(ANALYTICS_EVENTS.rdvSlotsFailed, {
            rdv_type: typeDemande,
            reason: "non_configure",
          });
          return;
        }
        if (!reponse.ok) throw new Error(String(reponse.status));
        const charge = lireReponseCreneaux(await reponse.json());
        if (!charge) throw new Error("charge_illisible");
        setResultat({ cle, type: typeDemande, etat: "aucune", donnees: charge });
        /*
         * ZÉRO CRÉNEAU N'EST PAS UN CHARGEMENT RÉUSSI, du point de vue du
         * prospect. L'événement part quand même, avec le compte à zéro, pour que
         * l'entonnoir distingue « agenda vide » de « appel échoué ».
         */
        const creneauxOfferts = charge.jours.reduce(
          (total, jour) => total + jour.creneaux.length,
          0,
        );
        capture(ANALYTICS_EVENTS.rdvSlotsLoaded, {
          rdv_type: typeDemande,
          slots_count: creneauxOfferts,
          days_count: charge.jours.length,
          duration_min: charge.duree,
        });
      })
      .catch(() => {
        // Une requête annulée n'est pas une panne : c'est nous qui l'avons
        // interrompue parce que la question a changé.
        if (controleur.signal.aborted) return;
        setResultat({ cle, type: typeDemande, etat: "reseau" });
        capture(ANALYTICS_EVENTS.rdvSlotsFailed, {
          rdv_type: typeDemande,
          reason: "reseau",
        });
      });

    return () => controleur.abort();
  }, [type, mois, duree, cle]);

  const choisirType = useCallback(
    (id: IdRendezVous) => {
      capture(ANALYTICS_EVENTS.rdvTypeSelected, {
        rdv_type: id,
        preselected: false,
      });
      // Même sujet : rien à remettre à zéro, on reprend où on en était.
      if (id !== type) {
        setType(id);
        setCreneau(undefined);
        // Chaque type a ses propres durées et sa propre disponibilité.
        setDuree(undefined);
        setMois("");
        setJourChoisi("");
        setTentees([]);
      }
      setEtatEnvoi("repos");
      setMessageEnvoi("");
      setEtape(suivante(id, "sujet"));
    },
    [type],
  );

  const choisirDuree = useCallback((valeur: string) => {
    setDuree(Number(valeur));
    // Un créneau retenu pour 30 minutes ne tient pas forcément en 45.
    setCreneau(undefined);
  }, []);

  /*
   * LE CRÉNEAU RETENU, avec le DÉLAI qu'il représente et non son horaire.
   *
   * `days_ahead` dit si le prospect prend le premier créneau venu ou repousse.
   * L'HEURE PRÉCISE N'EST PAS ENVOYÉE : elle identifierait la réservation, donc
   * la personne, dès qu'on la croise avec l'agenda.
   *
   * QUAND LE CRÉNEAU EST LA DERNIÈRE ÉTAPE, on reste sur place et le bouton de
   * confirmation vient en vue : sur un téléphone, il est sous la grille des heures.
   */
  const choisirCreneau = useCallback(
    (choix: Creneau) => {
      const delai = Math.max(
        0,
        Math.round(
          (new Date(choix.debut).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
        ),
      );
      capture(ANALYTICS_EVENTS.rdvSlotSelected, {
        rdv_type: type,
        days_ahead: delai,
        duration_min: dureeRetenue,
      });
      setCreneau(choix);
      const ordreDuType = ordreDe(type);
      if (ordreDuType[ordreDuType.length - 1] !== "creneau") {
        setEtape(suivante(type, "creneau"));
        return;
      }
      // Le bloc existe déjà (il invite à choisir une heure) : il passe en haut
      // de l'écran, et la confirmation qui s'y affiche reste en vue.
      refConfirmer.current?.scrollIntoView({ block: "start", behavior: mouvementReduit() ? "auto" : "smooth" });
    },
    [type, dureeRetenue],
  );

  const decalerMois = useCallback(
    (decalage: number) => {
      if (!donnees) return;
      setMois(ajouterMois(donnees.fenetre.mois, decalage));
      setJourChoisi("");
    },
    [donnees],
  );

  /** Questions de chaque étape, dans l'ordre affiché : le focus va à la première sans réponse. */
  const QUESTIONS_ETAPE: Readonly<Partial<Record<IdEtape, readonly Question[]>>> = {
    entreprise: ["entreprise", "activite", "taille"],
    besoin: ["objectif", "coince", "cout", "essaye"],
    cadre: ["decision", "echeance", "budget"],
    projet: ["projet", "objectif"],
  };

  /**
   * « Continuer » : refusé tant qu'une question de l'étape reste sans réponse,
   * avec le focus sur la première. Les coordonnées passent par la validation
   * du navigateur, comme avant (champs `required`, `type="email"`).
   */
  const continuer = () => {
    const questions = QUESTIONS_ETAPE[etape] ?? [];
    const premiere = questions.find((question) => manquants[question]);
    if (premiere) {
      setTentees((deja) => (deja.includes(etape) ? deja : [...deja, etape]));
      const champs = {
        entreprise: refEntreprise,
        activite: refActivite,
        taille: refTaille,
        decision: refDecision,
        coince: refCoince,
        cout: refCout,
        essaye: refEssaye,
        echeance: refEcheance,
        budget: refBudget,
        objectif: refObjectif,
        projet: refProjet,
      };
      champs[premiere].current?.focus();
      return;
    }
    // Les coordonnées ne sont jamais la dernière étape du cadrage : leur
    // « Continuer » est un `submit`, que le navigateur ne laisse passer qu'une
    // fois nom, adresse et téléphone valides (`required`, `type="email"`).
    if (etape === "coordonnees") {
      capture(ANALYTICS_EVENTS.rdvQuestionnaireCompleted, { rdv_type: type, budget: budgetChoisi });
    }
    setEtape(suivante(type, etape));
  };

  const recommencer = useCallback(() => {
    setType(undefined);
    setCreneau(undefined);
    setDuree(undefined);
    setMois("");
    setJourChoisi("");
    setEtatEnvoi("repos");
    setMessageEnvoi("");
    setChampEnErreur(undefined);
    setBudget("");
    setObjectif("");
    setEcheance("");
    setProjet("");
    setCoince("");
    setCout("");
    setEssaye("");
    setMessage("");
    setTentees([]);
    setEtape("sujet");
    refDebut.current = Date.now();
  }, []);

  const typeChoisi = useMemo(
    () => types.find((entree) => entree.id === type),
    [types, type],
  );

  const gererSoumission = async (evenement: FormEvent<HTMLFormElement>) => {
      // Interdit la soumission native, donc toute donnée en chaîne de requête.
      evenement.preventDefault();
      // Entrée dans un champ d'une étape intermédiaire : on passe à la suite.
      if (etape !== derniere) {
        continuer();
        return;
      }
      if (etatEnvoi === "envoi" || !type || !creneau) return;

      const donneesFormulaire = new FormData(evenement.currentTarget);
      const piege = donneesFormulaire.get(NOM_CHAMP_PIEGE);

      setEtatEnvoi("envoi");
      setMessageEnvoi("");
      setChampEnErreur(undefined);

      if (!protection.configure) {
        setEtatEnvoi("erreur");
        setMessageEnvoi(messageProtectionAbsente(emailContact));
        /*
         * ÉCHEC LE PLUS COÛTEUX DE TOUS, et le plus silencieux : Turnstile mal
         * configuré a tenu le formulaire de contact hors service pendant des
         * semaines sans qu'aucune mesure ne le dise (relevé le 2026-09-08).
         */
        capture(ANALYTICS_EVENTS.rdvFailed, {
          rdv_type: type,
          reason: "protection_absente",
        });
        return;
      }

      const jetonCaptcha = await protection.obtenirJeton();

      try {
        const reponse = await fetch("/api/rendez-vous", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type,
            debut: creneau.debut,
            ...(dureeRetenue !== undefined ? { duree: dureeRetenue } : {}),
            nom,
            email,
            ...(telephone.trim() ? { telephone } : {}),
            message,
            ...(budgetChoisi ? { budget: budgetChoisi } : {}),
            ...(posees.projet ? { projet } : {}),
            objectif: objectifChoisi,
            ...(posees.echeance ? { echeance } : {}),
            ...(posees.cadrage
              ? { entreprise, activite, taille, decision, coince, cout, essaye }
              : {}),
            debutMs: refDebut.current,
            [NOM_CHAMP_PIEGE]: typeof piege === "string" ? piege : "",
            ...(jetonCaptcha ? { jetonCaptcha } : {}),
          }),
        });
        const charge: unknown = await reponse.json().catch(() => null);

        if (reponse.ok) {
          setEtatEnvoi("succes");
          setMessageEnvoi("");
          protection.reinitialiser();
          // LA SEULE CONVERSION QUI COMPTE, mesurée sur la réponse du serveur.
          // La tranche, jamais un montant.
          capture(ANALYTICS_EVENTS.rdvConfirmed, {
            rdv_type: type,
            // Vide pour les sujets sans tranche : la propriété est omise.
            ...(budgetChoisi ? { budget: budgetChoisi } : {}),
            duration_min: dureeRetenue,
          });
          return;
        }

        setEtatEnvoi("erreur");
        setMessageEnvoi(
          estMessage(charge) ? charge.message : messageEchecInconnu(emailContact),
        );
        const champ = estMessage(charge) ? charge.champ : undefined;
        setChampEnErreur(champ);
        /*
         * `field` EST LE NOM DU CHAMP FAUTIF, jamais ce que le prospect y a
         * écrit : `creneau` = course entre deux réservations, `jetonCaptcha` =
         * protection mal réglée, le reste = validation trop stricte.
         */
        capture(ANALYTICS_EVENTS.rdvFailed, {
          rdv_type: type,
          reason: "refus_serveur",
          status: reponse.status,
          field: champ ?? "inconnu",
        });
        // Créneau pris ou durée retirée entre l'affichage et la confirmation :
        // retour au calendrier, rechargé, plutôt qu'un bouton qui échouera à
        // l'identique. Une réponse refusée renvoie à l'étape de sa question.
        if (champ === "creneau" || champ === "duree") {
          setCreneau(undefined);
          setTentative((valeur) => valeur + 1);
        }
        const retourVers = etapeDuChamp(champ, posees.cadrage);
        if (retourVers) setEtape(retourVers);
        // Le jeton est à usage unique : sans réinitialisation, la deuxième
        // tentative échouerait en boucle sur un jeton déjà consommé.
        protection.reinitialiser();
      } catch {
        setEtatEnvoi("erreur");
        setMessageEnvoi(MESSAGE_RESEAU);
        protection.reinitialiser();
        capture(ANALYTICS_EVENTS.rdvFailed, {
          rdv_type: type,
          reason: "reseau",
        });
      }
  };

  if (etatEnvoi === "succes") {
    return (
      <div className="flex flex-col gap-[16px] border border-accent bg-accent/[0.07] p-[20px]">
        <p
          ref={refSucces}
          tabIndex={-1}
          className="text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground outline-none"
        >
          {contenu.succes.titre}
        </p>
        {creneau ? (
          <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
            {creneau.resume}
          </p>
        ) : null}
        <p className={CLASSE_TEXTE}>
          {posees.cadrage ? contenu.succes.texteCadrage : contenu.succes.texte}
        </p>
        <button
          type="button"
          onClick={recommencer}
          className="mt-[4px] flex h-[50px] w-full items-center justify-center border border-border px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none tablet:w-fit"
        >
          {contenu.succes.autre}
        </button>
      </div>
    );
  }

  const enCours = etatEnvoi === "envoi";
  const recapitulatif = [
    typeChoisi?.nom,
    dureeRetenue !== undefined && (etape === "creneau" || creneau)
      ? contenu.creneaux.duree(dureeRetenue)
      : undefined,
    creneau && etape !== "creneau" ? creneau.resume : undefined,
  ].filter((morceau): morceau is string => Boolean(morceau));

  const precedente = ordre[Math.max(ordre.indexOf(etape) - 1, 0)];
  const boutonRetour = (
    <button type="button" onClick={() => setEtape(precedente)} className={CLASSE_BOUTON_SECONDAIRE}>
      <Icon name="arrow" size={14} className="rotate-180" />
      {contenu.actions.retour}
    </button>
  );

  /** Pied d'une étape : retour, et « Continuer » ou la confirmation sur la dernière. */
  const pied = (
    <div className="flex flex-col-reverse gap-[12px] tablet:flex-row tablet:items-center tablet:justify-between">
      {boutonRetour}
      {etape === derniere ? (
        <button type="submit" disabled={enCours} className={CLASSE_BOUTON_PRINCIPAL}>
          {enCours ? contenu.formulaire.envoiEnCours : contenu.formulaire.envoyer}
        </button>
      ) : (
        // `submit` : Entrée dans un champ avance aussi, `gererSoumission` aiguille.
        <button type="submit" className={CLASSE_BOUTON_PRINCIPAL}>
          {contenu.actions.continuer}
        </button>
      )}
    </div>
  );

  const mention = (
    <p className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
      {contenu.formulaire.mention}{" "}
      <Link
        href={contenu.formulaire.mentionHref}
        className="text-foreground no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none"
      >
        {contenu.formulaire.mentionLien}
      </Link>
      .
    </p>
  );

  const champObjectif = (
    <ChoixUnique
      prefixe={instance}
      nom="objectif"
      legende={posees.legendeObjectif}
      options={objectifs}
      choisi={objectifChoisi}
      onChoisir={repondre("objectif", setObjectif)}
      erreur={erreurs.objectif}
      refPremier={refObjectif}
    />
  );

  const champBudget = posees.budget ? (
    <div>
      <ChoixUnique
        prefixe={instance}
        nom="budget"
        legende={q.budget.legende}
        options={tranches}
        choisi={budgetChoisi}
        onChoisir={repondre("budget", setBudget)}
        erreur={erreurs.budget}
        refPremier={refBudget}
      />
      <RetourEspere retour={retour} />
    </div>
  ) : null;

  return (
    // `scroll-mt` : le haut du bloc ne doit pas finir sous l'en-tête fixe quand
    // le changement d'étape le ramène en vue.
    <div ref={racine} className="flex scroll-mt-[100px] flex-col gap-[28px]">
      <Progression ordre={ordre} etape={etape} onAller={setEtape} />

      {/* UNE LIGNE, pas un bloc : sur un téléphone, le premier champ de
          chaque écran doit rester au-dessus de la ligne de flottaison. */}
      {etape !== "sujet" && recapitulatif.length > 0 ? (
        <p className="m-0 border-y border-border py-[10px] text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
          <span className={`${CLASSE_LIBELLE} mr-[8px]`}>{contenu.recapitulatif}</span>
          {recapitulatif.join(" · ")}
        </p>
      ) : null}

      <form
        /* SANS CE NOM, la mesure appelle ce formulaire « form » et les
           formulaires de contact du site se confondent dans un même seau. */
        data-analytics-form="rendez-vous"
        className="relative flex flex-col gap-[20px]"
        /* `method="post"` et `action` : sans script, le navigateur soumet
           lui-même, en POST et dans un CORPS. Aucune donnée personnelle ne
           peut partir dans une chaîne de requête. */
        method="post"
        action="/api/rendez-vous"
        onSubmit={gererSoumission}
        /* Première interaction = chargement du script Turnstile. */
        onFocusCapture={protection.activer}
      >
        {etape === "sujet" ? (
          <Etape titre={contenu.etapes.sujet} refTitre={refTitre}>
            <ChoixType types={types} choisi={type} onChoisir={choisirType} />
          </Etape>
        ) : null}

        {etape === "entreprise" && typeChoisi ? (
          <Etape titre={contenu.etapes.entreprise} refTitre={refTitre}>
            <p className={CLASSE_TEXTE}>{contenu.introCadrage}</p>
            <div className="flex flex-col gap-[24px]">
              <div className="grid grid-cols-1 gap-[14px] tablet:grid-cols-2">
                <ChampTexte
                  id={`${instance}-entreprise`}
                  nom="entreprise"
                  legende={q.entreprise.legende}
                  valeur={entreprise}
                  onChanger={repondre("entreprise", setEntreprise)}
                  placeholder={q.entreprise.placeholder}
                  erreur={erreurs.entreprise}
                  refChamp={refEntreprise}
                  maxLength={LONGUEUR_ENTREPRISE_MAX}
                  autoComplete="organization"
                />
                <ChampTexte
                  id={`${instance}-activite`}
                  nom="activite"
                  legende={q.activite.legende}
                  valeur={activite}
                  onChanger={repondre("activite", setActivite)}
                  placeholder={q.activite.placeholder}
                  erreur={erreurs.activite}
                  refChamp={refActivite}
                  maxLength={LONGUEUR_ACTIVITE_MAX}
                />
              </div>
              <ChoixUnique
                prefixe={instance}
                nom="taille"
                legende={q.taille.legende}
                options={OPTIONS_TAILLE}
                choisi={taille}
                onChoisir={repondre("taille", setTaille)}
                erreur={erreurs.taille}
                refPremier={refTaille}
              />
            </div>
            {pied}
          </Etape>
        ) : null}

        {etape === "besoin" && typeChoisi ? (
          <Etape titre={contenu.etapes.besoin} refTitre={refTitre}>
            <div className="flex flex-col gap-[24px]">
              {champObjectif}
              <ChampTexte
                id={`${instance}-coince`}
                nom="coince"
                legende={q.coince.legende}
                valeur={coince}
                onChanger={repondre("coince", setCoince)}
                placeholder={q.coince.placeholders[typeChoisi.id]}
                erreur={erreurs.coince}
                refChamp={refCoince}
                multiligne
                maxLength={LONGUEUR_COINCE_MAX}
              />
              <ChoixUnique
                prefixe={instance}
                nom="cout"
                legende={q.cout.legende}
                options={OPTIONS_COUT}
                choisi={cout}
                onChoisir={repondre("cout", setCout)}
                erreur={erreurs.cout}
                refPremier={refCout}
              />
              <ChoixUnique
                prefixe={instance}
                nom="essaye"
                legende={q.essaye.legende}
                options={OPTIONS_ESSAYE}
                choisi={essaye}
                onChoisir={repondre("essaye", setEssaye)}
                erreur={erreurs.essaye}
                refPremier={refEssaye}
              />
            </div>
            {pied}
          </Etape>
        ) : null}

        {etape === "cadre" && typeChoisi ? (
          <Etape titre={contenu.etapes.projet} refTitre={refTitre}>
            <div className="flex flex-col gap-[24px]">
              <ChoixUnique
                prefixe={instance}
                nom="decision"
                legende={q.decision.legende}
                options={OPTIONS_DECISION}
                choisi={decision}
                onChoisir={repondre("decision", setDecision)}
                erreur={erreurs.decision}
                refPremier={refDecision}
              />
              <ChoixUnique
                prefixe={instance}
                nom="echeance"
                legende={q.echeance.legende}
                options={OPTIONS_ECHEANCE}
                choisi={echeance}
                onChoisir={repondre("echeance", setEcheance)}
                erreur={erreurs.echeance}
                refPremier={refEcheance}
              />
              {champBudget}
            </div>
            {pied}
          </Etape>
        ) : null}

        {etape === "projet" && typeChoisi ? (
          <Etape titre={contenu.etapes.projet} refTitre={refTitre}>
            <div className="flex flex-col gap-[24px]">
              {posees.projet ? (
                <ChampTexte
                  id={`${instance}-projet`}
                  nom="projet"
                  legende={q.projet.legende}
                  valeur={projet}
                  onChanger={repondre("projet", setProjet)}
                  placeholder={q.projet.placeholder}
                  erreur={erreurs.projet}
                  refChamp={refProjet}
                  maxLength={LONGUEUR_PROJET_MAX}
                />
              ) : null}
              {champObjectif}
            </div>
            {pied}
          </Etape>
        ) : null}

        {etape === "coordonnees" && typeChoisi ? (
          <Etape titre={contenu.etapes.coordonnees} refTitre={refTitre}>
            <div className="flex flex-col gap-[14px]">
              <ChampTexte
                id={`${instance}-nom`}
                nom="nom"
                legende={contenu.formulaire.nomLabel}
                valeur={nom}
                onChanger={setNom}
                placeholder={contenu.formulaire.nomPlaceholder}
                invalide={champEnErreur === "nom"}
                autoComplete="name"
                requis
              />
              <ChampTexte
                id={`${instance}-email`}
                nom="email"
                type="email"
                legende={contenu.formulaire.emailLabel}
                valeur={email}
                onChanger={setEmail}
                placeholder={contenu.formulaire.emailPlaceholder}
                invalide={champEnErreur === "email"}
                autoComplete="email"
                inputMode="email"
                requis
              />
              <ChampTexte
                id={`${instance}-telephone`}
                nom="telephone"
                type="tel"
                legende={
                  posees.cadrage
                    ? contenu.formulaire.telephoneLabel
                    : contenu.formulaire.telephoneFacultatif
                }
                aide={posees.cadrage ? contenu.formulaire.telephoneAide : undefined}
                valeur={telephone}
                onChanger={setTelephone}
                placeholder={contenu.formulaire.telephonePlaceholder}
                invalide={champEnErreur === "telephone"}
                autoComplete="tel"
                inputMode="tel"
                requis={posees.cadrage}
              />
              <ChampTexte
                id={`${instance}-message`}
                nom="message"
                legende={contenu.formulaire.messageLabel}
                valeur={message}
                onChanger={setMessage}
                placeholder={contenu.formulaire.messagePlaceholder}
                multiligne
                maxLength={1500}
              />
            </div>
            {pied}
            {etape === derniere ? mention : null}
          </Etape>
        ) : null}

        {etape === "creneau" && typeChoisi ? (
          <Etape titre={contenu.etapes.creneau} refTitre={refTitre}>
            <div className="flex flex-col gap-[24px]">
              {durees && durees.options.length > 1 ? (
                <ChoixUnique
                  prefixe={instance}
                  nom="duree"
                  legende={contenu.creneaux.libelleDuree}
                  options={durees.options.map((minutes) => ({
                    id: String(minutes),
                    libelle: contenu.creneaux.duree(minutes),
                  }))}
                  choisi={String(dureeRetenue)}
                  onChoisir={choisirDuree}
                />
              ) : null}

              {etatCreneaux === "indisponible" ? (
                <p className={CLASSE_TEXTE}>{contenu.creneaux.indisponible}</p>
              ) : null}

              {etatCreneaux === "reseau" ? (
                <div className="flex flex-col items-start gap-[12px]">
                  <p className={CLASSE_TEXTE}>{contenu.creneaux.erreur}</p>
                  <button
                    type="button"
                    onClick={() => setTentative((valeur) => valeur + 1)}
                    className="min-h-[44px] border border-border px-[16px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
                  >
                    {contenu.actions.reessayer}
                  </button>
                </div>
              ) : null}

              {chargement && !donnees ? (
                <div className="flex min-h-[320px] items-center gap-[10px]">
                  <Spinner size="sm" label={contenu.creneaux.chargement} />
                  <span aria-hidden className={CLASSE_LIBELLE}>
                    {contenu.creneaux.chargement}
                  </span>
                </div>
              ) : null}

              {/* Calendrier et heures restent POSÉS pendant un rechargement (mois
                  ou durée), simplement estompés : les faire disparaître
                  déplacerait la grille sous le curseur du prospect. */}
              {donnees ? (
                <div className="grid grid-cols-1 gap-[28px] desktop:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
                  <Calendrier
                    donnees={donnees}
                    jourActif={jourActif}
                    chargement={chargement}
                    onChoisirJour={setJourChoisi}
                    onDecaler={decalerMois}
                  />
                  {jourActif ? (
                    <div
                      className={`transition-opacity motion-reduce:transition-none desktop:min-h-[300px] ${
                        chargement ? "pointer-events-none opacity-40" : ""
                      }`}
                    >
                      <Heures jour={jourActif} choisi={creneau} onChoisir={choisirCreneau} />
                    </div>
                  ) : (
                    <p className={`${CLASSE_TEXTE} desktop:pt-[50px]`}>
                      {contenu.creneaux.vide}
                    </p>
                  )}
                </div>
              ) : null}

              <p className={CLASSE_LIBELLE}>{contenu.noteFuseau}</p>
            </div>

            {derniere === "creneau" ? (
              <div ref={refConfirmer} className="flex scroll-mt-[100px] flex-col gap-[16px]">
                {/* La région existe avant son contenu : le choix d'une heure s'annonce. */}
                <div aria-live="polite">
                  {creneau ? (
                    <div className="flex flex-col gap-[6px] border border-accent bg-accent/[0.07] px-[16px] py-[12px]">
                      <p className={CLASSE_LIBELLE}>{contenu.recapitulatif}</p>
                      <span className="sr-only">{contenu.formulaire.confirmerCiDessous}</span>
                      <p className="m-0 text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
                        {dureeRetenue !== undefined
                          ? `${creneau.resume} · ${contenu.creneaux.duree(dureeRetenue)}`
                          : creneau.resume}
                      </p>
                    </div>
                  ) : (
                    <p className={CLASSE_TEXTE}>{contenu.formulaire.choisirHeure}</p>
                  )}
                </div>
                {creneau ? pied : <div>{boutonRetour}</div>}
                {creneau ? mention : null}
              </div>
            ) : (
              <div>{boutonRetour}</div>
            )}
          </Etape>
        ) : null}

        {/* Toujours montés, quelle que soit l'étape : le widget Turnstile ne
            survit pas à un démontage entre deux étapes. */}
        <ChampsProtection refConteneur={protection.refConteneur} />
      </form>

      {/* HORS DES ÉTAPES, toujours monté : un refus du serveur peut renvoyer
          au calendrier ou au questionnaire, et le message doit s'y lire et
          s'y annoncer aussi. */}
      <MessageEtat etat={etatEnvoi} message={messageEnvoi} ton="clair" className="max-w-[420px]" />

      {/* Ce que montre la colonne des heures, dit au lecteur d'écran. Région
          montée en permanence : une région qui apparaît déjà remplie n'est
          pas annoncée. */}
      <p aria-live="polite" className="sr-only">
        {etape !== "creneau"
          ? ""
          : chargement
            ? contenu.creneaux.chargement
            : etatCreneaux === "reseau"
              ? contenu.creneaux.erreur
              : jourActif
                ? contenu.creneaux.annonce(jourActif.libelle, jourActif.creneaux.length)
                : donnees
                  ? contenu.creneaux.vide
                  : ""}
      </p>
    </div>
  );
}
