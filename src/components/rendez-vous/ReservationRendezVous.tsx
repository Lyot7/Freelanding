"use client";

/**
 * Réservation Cal.com, entièrement dessinée ici — composant CLIENT.
 *
 * PAS D'IFRAME, ET C'EST LE POINT DE DÉPART. L'embed Cal.com impose sa
 * typographie, ses couleurs, ses rayons de 8 px et une seconde feuille de
 * style ; ce site tient au pixel près à un dessin anguleux, une seule police et
 * un seul accent. Les points de terminaison v2 employés ici répondent sans
 * clef d'API (vérifié, voir `src/lib/rendez-vous/cal-com.ts`), donc rien
 * n'obligeait à l'iframe.
 *
 * UN STEPPER, UNE ÉTAPE À L'ÉCRAN (2026-10-01). La version précédente empilait
 * les étapes et grandissait à chaque choix : arrivé aux coordonnées, le bloc
 * dépassait deux écrans. Eliott : « assez indigeste et qui s'agrandit, faire
 * plutôt une sorte de stepper ». Quatre temps, un seul affiché :
 *   01 le sujet — trois cartes ; un clic passe à la suite ;
 *   02 le créneau — durée, calendrier du mois, heures du jour retenu ;
 *   03 le projet — budget, objectif, échéance, et le retour « ce que tu peux
 *      espérer à ce budget » calculé sur place depuis la grille de l'offre ;
 *   04 les coordonnées — nom, adresse, et un message facultatif.
 * La barre de progression rend chaque étape franchie cliquable, et le
 * récapitulatif garde sous les yeux ce qui a déjà été choisi.
 *
 * LA DURÉE EST CHOISIE PAR LE VISITEUR, présélectionnée sur la valeur par
 * défaut du type d'événement Cal.com. Les options viennent de Cal.com par la
 * route des créneaux : le site n'en recopie aucune.
 *
 * LE QUESTIONNAIRE VIENT APRÈS LE CRÉNEAU, PAS AVANT (2026-09-23). Trois
 * questions posées avant de voir un agenda sont une barrière à l'entrée ;
 * posées une fois l'heure retenue, elles se remplissent parce que le visiteur
 * a déjà choisi de venir.
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  OPTIONS_ECHEANCE,
  optionsObjectif,
  retourBudget,
  tranchesBudget,
} from "@/lib/rendez-vous/questionnaire";
import type { RetourBudget } from "@/lib/rendez-vous/questionnaire";

const contenu = rendezVousContent;

/** Ce qui empêche d'afficher des créneaux, du plus bénin au plus définitif. */
type EtatCreneaux = "aucune" | "reseau" | "indisponible";

/** Index des quatre étapes, dans l'ordre de la barre de progression. */
const ETAPE_SUJET = 0;
const ETAPE_CRENEAU = 1;
const ETAPE_PROJET = 2;
const ETAPE_COORDONNEES = 3;

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

const CLASSE_LIBELLE =
  "text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60";

const CLASSE_CHAMP =
  "h-[50px] w-full border border-border bg-transparent px-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/25 focus:border-b-accent tablet:text-[14px]";

const CLASSE_TEXTE =
  "text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60";

const CLASSE_BOUTON_SECONDAIRE =
  "flex min-h-[44px] items-center gap-[8px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60 transition-colors hover:text-accent motion-reduce:transition-none";

const CLASSE_BOUTON_PRINCIPAL =
  "flex h-[50px] w-full items-center justify-center bg-accent px-[24px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:w-fit";

const TITRES_ETAPES = [
  contenu.etapes.sujet,
  contenu.etapes.creneau,
  contenu.etapes.projet,
  contenu.etapes.coordonnees,
] as const;

/**
 * Barre de progression : quatre segments, numéro et titre sous chacun.
 *
 * Une étape FRANCHIE est un bouton qui y ramène ; l'étape courante et celles à
 * venir ne sont pas cliquables, parce qu'on n'atteint pas le créneau sans
 * sujet, ni les coordonnées sans questionnaire.
 */
function Progression({
  etape,
  onAller,
}: {
  etape: number;
  onAller: (index: number) => void;
}) {
  return (
    <ol className="m-0 grid list-none grid-cols-4 gap-[6px] p-0">
      {TITRES_ETAPES.map((titre, index) => {
        const faite = index < etape;
        const courante = index === etape;
        const corps = (
          <>
            <span
              aria-hidden
              className={`block h-[2px] w-full transition-colors motion-reduce:transition-none ${
                faite || courante ? "bg-accent" : "bg-white/15"
              }`}
            />
            <span className="flex flex-col gap-[4px] pt-[10px] text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em]">
              <span className={faite || courante ? "text-accent" : "text-foreground-60"}>
                {numero(index)}
              </span>
              <span className={courante ? "text-foreground" : "text-foreground-60"}>
                {titre}
              </span>
            </span>
          </>
        );
        return (
          <li key={titre} aria-current={courante ? "step" : undefined}>
            {faite ? (
              <button
                type="button"
                onClick={() => onAller(index)}
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
              <span className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent">
                {type.duree}
              </span>
              <span className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
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
  legende,
  options,
  choisi,
  onChoisir,
  erreur,
  refPremier,
}: {
  nom: string;
  legende: string;
  options: readonly OptionQuestion[];
  choisi: string;
  onChoisir: (id: string) => void;
  /** Texte affiché sous le groupe ; absent = pas d'erreur. */
  erreur?: string;
  /** Reçoit la première pastille, pour y poser le focus. */
  refPremier?: RefObject<HTMLInputElement | null>;
}) {
  const idErreur = `rdv-${nom}-erreur`;
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
                name={nom}
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
 * « Ce que tu peux espérer à ce budget ».
 *
 * LA RÉGION LIVE EXISTE AVANT SON CONTENU : un lecteur d'écran n'annonce pas
 * une région qui apparaît déjà remplie. Vide, elle ne prend aucune place.
 */
function RetourEspere({ retour }: { retour: RetourBudget | undefined }) {
  const texte = "text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60";
  return (
    <div aria-live="polite">
      {retour ? (
        <div className="mt-[12px] flex flex-col gap-[14px] border border-border p-[16px]">
          <p className={CLASSE_LIBELLE}>{contenu.retour.titre}</p>

          {retour.type === "forfaits"
            ? retour.lignes.map((ligne) => (
                <div key={ligne.forfait} className="flex flex-col gap-[6px]">
                  {ligne.prestation ? (
                    <p className={CLASSE_LIBELLE}>{ligne.prestation}</p>
                  ) : null}
                  <p className="flex flex-wrap items-baseline justify-between gap-x-[12px] gap-y-[4px]">
                    <span className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
                      {ligne.forfait}
                    </span>
                    <span className="text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent">
                      {ligne.prix}
                    </span>
                  </p>
                  <p className={texte}>{ligne.promesse}</p>
                  {ligne.complement ? <p className={texte}>{ligne.complement}</p> : null}
                </div>
              ))
            : null}

          {retour.type === "aucun" ? (
            <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
              {retour.texte}
            </p>
          ) : null}

          {retour.type === "inconnu" ? (
            <div className="flex flex-col gap-[6px]">
              <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
                {retour.texte}
              </p>
              <ul className="m-0 flex list-none flex-col gap-[4px] p-0">
                {retour.reperes.map((repere) => (
                  <li key={repere} className={texte}>
                    {repere}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Calendrier d'un mois : les jours qui ont au moins un créneau sont
 * cliquables et marqués d'un point, les autres restent lisibles mais grisés.
 *
 * UN MOIS ENTIER ET NON UNE BANDE DE JOURS : le prospect voit d'un coup d'œil
 * quand il y a de la place, et un jour sans créneau se lit comme tel au lieu
 * de disparaître de la bande.
 */
function Calendrier({
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
  const classeNavigation =
    "flex size-[36px] items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground motion-reduce:transition-none";

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
            disabled={donnees.fenetre.premiere || chargement}
            onClick={() => onDecaler(-1)}
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
            disabled={donnees.fenetre.derniere || chargement}
            onClick={() => onDecaler(1)}
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
              className={`relative flex h-[44px] items-center justify-center border text-[14px] font-medium leading-none tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : disponible
                    ? "border-border text-foreground hover:border-accent hover:text-accent"
                    : "cursor-default border-transparent text-white/25"
              }`}
            >
              {numeroDuJour(jour)}
              {disponible && !actif ? (
                <span
                  aria-hidden
                  className="absolute bottom-[6px] left-1/2 size-[4px] -translate-x-1/2 rounded-full bg-accent"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Heures libres du jour retenu, en grille serrée. */
function Heures({
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
        className="grid grid-cols-4 content-start gap-[6px] desktop:absolute desktop:inset-x-0 desktop:bottom-0 desktop:top-[50px] desktop:grid-cols-3 desktop:overflow-y-auto desktop:overscroll-contain desktop:pr-[6px] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]"
      >
        {jour.creneaux.map((creneau) => {
          const actif = creneau.debut === choisi?.debut;
          return (
            <button
              key={creneau.debut}
              type="button"
              aria-pressed={actif}
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
   * changer. Présent, il ouvre directement l'étape du créneau : le visiteur
   * vient de choisir son sujet en cliquant le lien, inutile de le lui redemander.
   */
  typeInitial?: IdRendezVous;
}) {
  const [etape, setEtape] = useState(typeInitial ? ETAPE_CRENEAU : ETAPE_SUJET);
  const [type, setType] = useState<IdRendezVous | undefined>(typeInitial);
  const [creneau, setCreneau] = useState<Creneau | undefined>(undefined);
  /** Durée demandée ; `undefined` = celle par défaut du type chez Cal.com. */
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
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  /** Vrai après un « Continuer » refusé : les champs requis vides s'affichent en erreur. */
  const [envoiTente, setEnvoiTente] = useState(false);
  const tranches = useMemo(() => (type ? tranchesBudget(type) : []), [type]);
  const objectifs = useMemo(() => (type ? optionsObjectif(type) : []), [type]);
  const budgetChoisi = tranches.some((t) => t.id === budget) ? budget : "";
  const objectifChoisi = objectifs.some((o) => o.id === objectif) ? objectif : "";
  const retour = useMemo(
    () => (type && budgetChoisi ? retourBudget(type, budgetChoisi) : undefined),
    [type, budgetChoisi],
  );
  const erreurBudget =
    (envoiTente && !budgetChoisi) || champEnErreur === "budget"
      ? contenu.questionnaire.budget.erreur
      : undefined;
  const erreurObjectif =
    (envoiTente && !objectifChoisi) || champEnErreur === "objectif"
      ? contenu.questionnaire.objectif.erreur
      : undefined;

  const choisirBudget = useCallback((id: string) => {
    setBudget(id);
    setChampEnErreur((champ) => (champ === "budget" ? undefined : champ));
  }, []);
  const choisirObjectif = useCallback((id: string) => {
    setObjectif(id);
    setChampEnErreur((champ) => (champ === "objectif" ? undefined : champ));
  }, []);

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
  const refBudget = useRef<HTMLInputElement | null>(null);
  const refObjectif = useRef<HTMLInputElement | null>(null);
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
        setEnvoiTente(false);
      }
      setEtatEnvoi("repos");
      setMessageEnvoi("");
      setEtape(ETAPE_CRENEAU);
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
      setEtape(ETAPE_PROJET);
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

  const continuerVersCoordonnees = useCallback(() => {
    if (!budgetChoisi || !objectifChoisi) {
      setEnvoiTente(true);
      (budgetChoisi ? refObjectif : refBudget).current?.focus();
      return;
    }
    setEtape(ETAPE_COORDONNEES);
  }, [budgetChoisi, objectifChoisi]);

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
    setMessage("");
    setEnvoiTente(false);
    setEtape(ETAPE_SUJET);
    refDebut.current = Date.now();
  }, []);

  const typeChoisi = useMemo(
    () => types.find((entree) => entree.id === type),
    [types, type],
  );

  const gererSoumission = useCallback(
    async (evenement: FormEvent<HTMLFormElement>) => {
      // Interdit la soumission native, donc toute donnée en chaîne de requête.
      evenement.preventDefault();
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
            message,
            budget: budgetChoisi,
            objectif: objectifChoisi,
            echeance,
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
            budget: budgetChoisi,
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
        // l'identique. Une réponse du questionnaire refusée renvoie à sa question.
        if (champ === "creneau" || champ === "duree") {
          setCreneau(undefined);
          setTentative((valeur) => valeur + 1);
          setEtape(ETAPE_CRENEAU);
        } else if (champ === "budget" || champ === "objectif" || champ === "echeance") {
          setEtape(ETAPE_PROJET);
        }
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
    },
    [
      etatEnvoi,
      type,
      creneau,
      dureeRetenue,
      nom,
      email,
      message,
      protection,
      emailContact,
      budgetChoisi,
      objectifChoisi,
      echeance,
    ],
  );

  if (etatEnvoi === "succes") {
    return (
      <div className="flex flex-col gap-[16px] border border-accent bg-accent/[0.07] p-[20px]">
        <p className="text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
          {contenu.succes.titre}
        </p>
        {creneau ? (
          <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
            {creneau.resume}
          </p>
        ) : null}
        <p className={CLASSE_TEXTE}>{contenu.succes.texte}</p>
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
    dureeRetenue !== undefined ? contenu.creneaux.duree(dureeRetenue) : undefined,
    etape > ETAPE_CRENEAU ? creneau?.resume : undefined,
  ].filter((morceau): morceau is string => Boolean(morceau));

  const boutonRetour = (vers: number) => (
    <button type="button" onClick={() => setEtape(vers)} className={CLASSE_BOUTON_SECONDAIRE}>
      <Icon name="arrow" size={14} className="rotate-180" />
      {contenu.actions.retour}
    </button>
  );

  return (
    // `scroll-mt` : le haut du bloc ne doit pas finir sous l'en-tête fixe quand
    // le changement d'étape le ramène en vue.
    <div ref={racine} className="flex scroll-mt-[100px] flex-col gap-[28px]">
      <Progression etape={etape} onAller={setEtape} />

      {etape > ETAPE_SUJET && recapitulatif.length > 0 ? (
        <div className="flex flex-col gap-[6px] border-l-2 border-accent pl-[14px]">
          <p className={CLASSE_LIBELLE}>{contenu.recapitulatif}</p>
          <p className="m-0 text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
            {recapitulatif.join(" · ")}
          </p>
        </div>
      ) : null}

      {etape === ETAPE_SUJET ? (
        <Etape titre={contenu.etapes.sujet} refTitre={refTitre}>
          <ChoixType types={types} choisi={type} onChoisir={choisirType} />
        </Etape>
      ) : null}

      {etape === ETAPE_CRENEAU && typeChoisi ? (
        <Etape titre={contenu.etapes.creneau} refTitre={refTitre}>
          <div className="flex flex-col gap-[24px]">
            {durees && durees.options.length > 1 ? (
              <ChoixUnique
                nom="duree"
                legende={contenu.creneaux.libelleDuree}
                options={durees.options.map((minutes) => ({
                  id: String(minutes),
                  libelle: contenu.creneaux.duree(minutes),
                }))}
                choisi={dureeRetenue !== undefined ? String(dureeRetenue) : ""}
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
          <div>{boutonRetour(ETAPE_SUJET)}</div>
        </Etape>
      ) : null}

      {etape >= ETAPE_PROJET && typeChoisi && creneau ? (
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
          {etape === ETAPE_PROJET ? (
            <Etape titre={contenu.etapes.projet} refTitre={refTitre}>
              <div className="flex flex-col gap-[24px]">
                <div>
                  <ChoixUnique
                    nom="budget"
                    legende={contenu.questionnaire.budget.legende}
                    options={tranches}
                    choisi={budgetChoisi}
                    onChoisir={choisirBudget}
                    erreur={erreurBudget}
                    refPremier={refBudget}
                  />
                  <RetourEspere retour={retour} />
                </div>
                <ChoixUnique
                  nom="objectif"
                  legende={contenu.questionnaire.objectif.legende}
                  options={objectifs}
                  choisi={objectifChoisi}
                  onChoisir={choisirObjectif}
                  erreur={erreurObjectif}
                  refPremier={refObjectif}
                />
                <ChoixUnique
                  nom="echeance"
                  legende={contenu.questionnaire.echeance.legende}
                  options={OPTIONS_ECHEANCE}
                  choisi={echeance}
                  onChoisir={setEcheance}
                />
              </div>
              <div className="flex flex-col-reverse gap-[12px] tablet:flex-row tablet:items-center tablet:justify-between">
                {boutonRetour(ETAPE_CRENEAU)}
                <button
                  type="button"
                  onClick={continuerVersCoordonnees}
                  className={CLASSE_BOUTON_PRINCIPAL}
                >
                  {contenu.actions.continuer}
                </button>
              </div>
            </Etape>
          ) : (
            <Etape titre={contenu.etapes.coordonnees} refTitre={refTitre}>
              <div className="flex flex-col gap-[14px]">
                <label htmlFor="rdv-nom" className="flex w-full flex-col gap-[10px]">
                  <span className={CLASSE_LIBELLE}>{contenu.formulaire.nomLabel}</span>
                  <input
                    id="rdv-nom"
                    name="nom"
                    type="text"
                    required
                    autoComplete="name"
                    value={nom}
                    onChange={(evenement) => setNom(evenement.target.value)}
                    placeholder={contenu.formulaire.nomPlaceholder}
                    aria-invalid={champEnErreur === "nom" || undefined}
                    className={`${CLASSE_CHAMP} ${champEnErreur === "nom" ? "border-accent" : ""}`}
                  />
                </label>

                <label htmlFor="rdv-email" className="flex w-full flex-col gap-[10px]">
                  <span className={CLASSE_LIBELLE}>{contenu.formulaire.emailLabel}</span>
                  <input
                    id="rdv-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(evenement) => setEmail(evenement.target.value)}
                    placeholder={contenu.formulaire.emailPlaceholder}
                    aria-invalid={champEnErreur === "email" || undefined}
                    className={`${CLASSE_CHAMP} ${champEnErreur === "email" ? "border-accent" : ""}`}
                  />
                </label>

                <label htmlFor="rdv-message" className="flex w-full flex-col gap-[10px]">
                  <span className={CLASSE_LIBELLE}>{contenu.formulaire.messageLabel}</span>
                  <textarea
                    id="rdv-message"
                    name="message"
                    maxLength={1500}
                    value={message}
                    onChange={(evenement) => setMessage(evenement.target.value)}
                    placeholder={contenu.formulaire.messagePlaceholder}
                    aria-invalid={champEnErreur === "message" || undefined}
                    className="min-h-[90px] w-full resize-y border border-border bg-transparent p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/25 focus:border-b-accent tablet:text-[14px]"
                  />
                </label>
              </div>

              <div className="flex flex-col-reverse gap-[12px] tablet:flex-row tablet:items-center tablet:justify-between">
                {boutonRetour(ETAPE_PROJET)}
                <button type="submit" disabled={enCours} className={CLASSE_BOUTON_PRINCIPAL}>
                  {enCours ? contenu.formulaire.envoiEnCours : contenu.formulaire.envoyer}
                </button>
              </div>

              <MessageEtat
                etat={etatEnvoi}
                message={messageEnvoi}
                ton="clair"
                className="max-w-[420px]"
              />

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
            </Etape>
          )}

          {/* Toujours montés, quelle que soit l'étape du formulaire : le widget
              Turnstile ne survit pas à un démontage entre 03 et 04. */}
          <ChampsProtection refConteneur={protection.refConteneur} />
        </form>
      ) : null}
    </div>
  );
}
