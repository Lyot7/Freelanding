"use client";

/**
 * Réservation Cal.com, entièrement dessinée ici — composant CLIENT.
 *
 * PAS D'IFRAME, ET C'EST LE POINT DE DÉPART. L'embed Cal.com impose sa
 * typographie, ses couleurs, ses rayons de 8 px et une seconde feuille de
 * style ; ce site tient au pixel près à un dessin anguleux, une seule police et
 * un seul accent. Les deux points de terminaison v2 employés ici répondent sans
 * clef d'API (vérifié, voir `src/lib/rendez-vous/cal-com.ts`), donc rien
 * n'obligeait à l'iframe.
 *
 * TROIS TEMPS, ET UN SEUL VISIBLE À LA FOIS :
 *   01 le sujet — quatre entrées, en boutons, jamais en menu déroulant. Un menu
 *      cache ses options derrière un clic et ne laisse pas lire les durées ;
 *   02 le créneau — alimenté par notre route, pas par Cal.com en direct ;
 *   03 les coordonnées — nom, adresse, et un message facultatif.
 * Les étapes déjà franchies restent affichées en résumé, avec de quoi revenir.
 *
 * AUCUNE ANIMATION D'APPARITION ICI, contrairement au reste du site. `Reveal`
 * rend l'état MASQUÉ dès le serveur et compte sur une animation pour le lever :
 * dans un onglet d'arrière-plan, les images ne sont plus servies et le bloc
 * resterait invisible. Sur une section décorative, c'est un défaut de rendu ;
 * sur le formulaire par lequel passe un rendez-vous, c'est une conversion
 * perdue. Le bloc est donc peint à son état final, tout de suite, toujours.
 *
 * ACCESSIBILITÉ — les trois points qui comptent :
 *   - le choix du sujet est un vrai `radiogroup` (`fieldset` + `input[radio]`),
 *     donc les flèches naviguent et un lecteur d'écran annonce « 1 sur 4 ». Une
 *     rangée de `<button aria-pressed>` n'aurait dit ni l'un ni l'autre ;
 *   - la pastille du radio est VISIBLE et fait 14 px : l'anneau de focus global
 *     (`src/app/focus.css`) a donc une cible réelle à entourer. Un
 *     `sr-only` l'aurait posé sur un carré de 1 px, invisible au clavier ;
 *   - la grille de créneaux est un `group` nommé, chaque jour porte son propre
 *     libellé, et l'état d'envoi passe par la région live de `MessageEtat`.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
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
import type { IdRendezVous, TypeRendezVous } from "@/content/rendez-vous";
import {
  ajouterJours,
  JOURS_PAR_FENETRE,
  lireReponseCreneaux,
} from "@/lib/rendez-vous/creneaux";
import type {
  Creneau,
  JourDeCreneaux,
  ReponseCreneaux,
} from "@/lib/rendez-vous/creneaux";

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

const CLASSE_LIBELLE =
  "text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground-60";

const CLASSE_CHAMP =
  "h-[50px] w-full border border-border bg-transparent px-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/25 focus:border-b-accent tablet:text-[14px]";

/**
 * Une étape, repliée en résumé quand elle est franchie.
 *
 * Le résumé n'est pas décoratif : sans lui, un prospect arrivé à la
 * confirmation ne voit plus ce qu'il a choisi et doit revenir en arrière pour
 * le vérifier, ce qui est exactement le moment où l'on abandonne.
 */
function Etape({
  index,
  titre,
  ouverte,
  resume,
  onChanger,
  children,
}: {
  index: number;
  titre: string;
  ouverte: boolean;
  /** Affiché à la place du contenu une fois l'étape franchie. */
  resume?: string;
  /** Absent = étape non modifiable (la dernière). */
  onChanger?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[16px] border-t border-border pt-[20px] first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-[16px]">
        <p className={CLASSE_LIBELLE}>
          <span className="text-accent">{numero(index)}</span>
          <span className="pl-[10px]">{titre}</span>
        </p>
        {!ouverte && onChanger ? (
          <button
            type="button"
            onClick={onChanger}
            className="text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground underline decoration-white/30 underline-offset-4 transition-colors hover:text-accent motion-reduce:transition-none"
          >
            {contenu.actions.changer}
          </button>
        ) : null}
      </div>
      {ouverte ? (
        children
      ) : (
        <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
          {resume}
        </p>
      )}
    </div>
  );
}

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
    // DEUX COLONNES SEULEMENT À PARTIR DE 1200, et non de 810. Entre les deux,
    // le bloc n'occupe déjà que la moitié droite de la grille du site : deux
    // colonnes de plus y donnent des cartes de 170 px où la description tombe
    // sur sept lignes. Mesuré à 810.
    <fieldset className="m-0 grid grid-cols-1 gap-[10px] border-0 p-0 desktop:grid-cols-2">
      <legend className="sr-only">{contenu.etapes.sujet}</legend>
      {types.map((type) => {
        const actif = type.id === choisi;
        return (
          <label
            key={type.id}
            className={`flex cursor-pointer flex-col gap-[10px] border p-[16px] transition-colors has-[:focus-visible]:border-accent motion-reduce:transition-none ${
              actif ? "border-accent bg-accent/[0.07]" : "border-border hover:border-white/35"
            }`}
          >
            <span className="flex items-start justify-between gap-[12px]">
              <span className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
                {type.nom}
              </span>
              {/* Pastille RÉELLE de 14 px, jamais `sr-only` : c'est elle que
                  l'anneau de focus global entoure au clavier. */}
              <input
                type="radio"
                name="typeRendezVous"
                value={type.id}
                checked={actif}
                onChange={() => onChoisir(type.id)}
                className="mt-[3px] size-[14px] flex-none cursor-pointer appearance-none rounded-full border border-white/40 bg-transparent transition-colors checked:border-accent checked:bg-accent motion-reduce:transition-none"
              />
            </span>
            <span className="text-[11px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent">
              {type.duree}
            </span>
            <span className="text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
              {type.description}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function NavigationSemaine({
  donnees,
  chargement,
  onDecaler,
}: {
  donnees: ReponseCreneaux;
  chargement: boolean;
  onDecaler: (jours: number) => void;
}) {
  const classe =
    "flex size-[36px] items-center justify-center border border-border text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground motion-reduce:transition-none";
  return (
    <div className="flex items-center justify-between gap-[16px]">
      <p className="text-[14px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
        {donnees.fenetre.libelle}
      </p>
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          className={classe}
          disabled={donnees.fenetre.premiere || chargement}
          onClick={() => onDecaler(-JOURS_PAR_FENETRE)}
        >
          <Icon
            name="arrow"
            size={16}
            className="rotate-180"
            label={contenu.actions.semainePrecedente}
          />
        </button>
        <button
          type="button"
          className={classe}
          disabled={donnees.fenetre.derniere || chargement}
          onClick={() => onDecaler(JOURS_PAR_FENETRE)}
        >
          <Icon name="arrow" size={16} label={contenu.actions.semaineSuivante} />
        </button>
      </div>
    </div>
  );
}

/**
 * Bande de jours, puis créneaux du jour retenu.
 *
 * POURQUOI PAS LES SEPT JOURS EMPILÉS. C'était la première version, et elle
 * était mesurable : sur un agenda ouvert en 15 minutes, une semaine fait
 * une centaine de créneaux, soit une section de plus de 3 000 px sur laquelle
 * le reste de la page ne pesait plus rien. Un jour à la fois tient dans un
 * écran, et c'est aussi ce que le prospect fait mentalement — il choisit un
 * jour, puis une heure.
 *
 * PAS DE CONTENEUR QUI DÉFILE non plus, ce qui aurait été l'autre réponse : le
 * site pilote son défilement avec Lenis, réglé en `allowNestedScroll: false`.
 * Une zone qui défile à l'intérieur aurait exigé un `data-lenis-prevent` et un
 * comportement de molette différent du reste de la page.
 */
function GrilleCreneaux({
  donnees,
  jourActif,
  onChoisirJour,
  onChoisir,
}: {
  donnees: ReponseCreneaux;
  jourActif: JourDeCreneaux;
  onChoisirJour: (jour: string) => void;
  onChoisir: (creneau: Creneau) => void;
}) {
  return (
    <div className="flex flex-col gap-[20px]">
      {/* Défilement HORIZONTAL seulement : Lenis ne pilote que la verticale,
          celui-ci ne lui dispute donc rien. */}
      <div
        role="group"
        aria-label={contenu.creneaux.libelleJours}
        className="-mx-[20px] flex gap-[8px] overflow-x-auto px-[20px] pb-[4px] tablet:mx-0 tablet:flex-wrap tablet:overflow-visible tablet:px-0"
      >
        {donnees.jours.map((jour) => {
          const actif = jour.jour === jourActif.jour;
          return (
            <button
              key={jour.jour}
              type="button"
              aria-pressed={actif}
              onClick={() => onChoisirJour(jour.jour)}
              // PAS DE CAPITALES ICI, contrairement aux autres libellés du
              // site : le quantième du premier du mois s'écrit « 1er », et
              // `text-transform: uppercase` en fait « 1ER », qui n'existe pas.
              className={`min-h-[44px] flex-none border px-[14px] text-[13px] font-medium leading-[1.2] tracking-[-0.01em] transition-colors motion-reduce:transition-none ${
                actif
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border text-foreground hover:border-accent hover:text-accent"
              }`}
            >
              {jour.libelleCourt}
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label={`${contenu.creneaux.libelleGrille} ${jourActif.libelle}`}
        className="flex flex-wrap gap-[8px]"
      >
        {jourActif.creneaux.map((creneau) => (
          <button
            key={creneau.debut}
            type="button"
            onClick={() => onChoisir(creneau)}
            className="min-h-[44px] border border-border px-[14px] text-[13px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
          >
            {creneau.heure}
          </button>
        ))}
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
   * changer, et un changement d'URL sans rechargement ne doit pas lui reprendre
   * son choix sous les doigts. Un sujet inconnu, ou non configuré chez Cal.com,
   * n'arrive jamais jusqu'ici : l'appelant le laisse tomber en silence.
   */
  typeInitial?: IdRendezVous;
}) {
  const [type, setType] = useState<IdRendezVous | undefined>(typeInitial);
  const [creneau, setCreneau] = useState<Creneau | undefined>(undefined);
  const [semaine, setSemaine] = useState("");
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
   * résultat reçu ne répond pas à la question posée. Le tenir en état obligerait
   * à poser un `setChargement(true)` en tête d'effet, c'est-à-dire une cascade
   * de rendus dont React (et `react-hooks/set-state-in-effect`) ne veut pas —
   * et surtout un état de plus à remettre d'aplomb dans les quatre gestionnaires
   * qui changent de type, de semaine ou relancent la requête.
   */
  const cle = type ? `${type}|${semaine}|${tentative}` : "";
  const chargement = type !== undefined && resultat.cle !== cle;
  // Les créneaux du type PRÉCÉDENT ne survivent pas à un changement de sujet ;
  // ceux de la semaine précédente, si, le temps que la suivante arrive.
  const donnees = resultat.type === type ? resultat.donnees : undefined;
  const etatCreneaux: EtatCreneaux =
    resultat.type === type && resultat.cle === cle ? resultat.etat : "aucune";
  /**
   * Jour affiché — DÉDUIT, jamais synchronisé.
   *
   * Le jour retenu par le prospect ne survit pas forcément à un changement de
   * semaine ou de sujet : plutôt que de le remettre à zéro dans un effet à
   * chaque fois, on retombe simplement sur le premier jour encore disponible.
   * Un état de moins, et aucune fenêtre de rendu où le jour affiché n'existe
   * plus dans la donnée.
   */
  const jourActif =
    donnees?.jours.find((jour) => jour.jour === jourChoisi) ?? donnees?.jours[0];

  const [etatEnvoi, setEtatEnvoi] = useState<EtatEnvoi>("repos");
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [champEnErreur, setChampEnErreur] = useState<string | undefined>(undefined);
  const protection = useProtectionTurnstile();

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
   * Le focus SUIT l'étape.
   *
   * Choisir un créneau replie la grille : sans ce déplacement, le focus
   * retomberait sur le document et un utilisateur au clavier repartirait du
   * haut de la page pour atteindre le champ suivant. Le déplacement vaut aussi
   * pour la souris, où il économise un clic.
   *
   * IL NE SE DÉCLENCHE JAMAIS SUR L'ÉTAT INITIAL, et c'est ce qui rend
   * `typeInitial` sans danger : `creneau` vaut toujours `undefined` au premier
   * rendu, quel que soit le sujet présélectionné. Un focus posé au chargement
   * ferait atterrir le clavier au milieu de la page et un lecteur d'écran
   * annoncerait l'étape 02 avant le titre. La garde ci-dessous est donc la
   * condition, pas une commodité : ne jamais la remplacer par un déclenchement
   * sur le changement de `type`.
   */
  const refNom = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (creneau) refNom.current?.focus();
  }, [creneau]);

  /*
   * UN SUJET PRÉSÉLECTIONNÉ FRANCHIT LA MÊME MARCHE QU'UN SUJET CHOISI.
   *
   * Sur `/services/*` et sur `/contact?sujet=…`, le prospect n'appuie sur rien :
   * la page décide pour lui. Sans cet envoi, l'entonnoir ne verrait jamais
   * l'étape 2 pour ces visites-là, et le chemin le plus court vers la
   * réservation apparaîtrait comme le moins performant. `preselected`
   * distingue les deux populations, dont les taux de suite n'ont aucune raison
   * de se ressembler.
   *
   * IL NE PART QU'UNE FOIS, et la garde est un `ref` plutôt qu'un tableau de
   * dépendances vide : `typeInitial` reste dans les dépendances, donc la règle
   * d'exhaustivité n'a pas à être désactivée, et le doublon est empêché par
   * l'état plutôt que par une exception au lint.
   */
  const sujetInitialAnnonce = useRef(false);
  useEffect(() => {
    if (!typeInitial || sujetInitialAnnonce.current) return;
    sujetInitialAnnonce.current = true;
    capture(ANALYTICS_EVENTS.rdvTypeSelected, {
      rdv_type: typeInitial,
      preselected: true,
    });
  }, [typeInitial]);

  useEffect(() => {
    const typeDemande = type;
    if (!typeDemande) return;
    const controleur = new AbortController();

    const parametres = new URLSearchParams({ type: typeDemande });
    if (semaine) parametres.set("debut", semaine);

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
         * prospect : l'écran est le même que celui d'une panne. L'événement
         * part quand même, avec le compte à zéro, pour que l'entonnoir
         * distingue « agenda vide » de « appel échoué » — deux causes qui
         * demandent deux corrections opposées.
         */
        const creneauxOfferts = charge.jours.reduce(
          (total, jour) => total + jour.creneaux.length,
          0,
        );
        capture(ANALYTICS_EVENTS.rdvSlotsLoaded, {
          rdv_type: typeDemande,
          slots_count: creneauxOfferts,
          days_count: charge.jours.length,
        });
      })
      .catch(() => {
        // Une requête annulée n'est pas une panne : c'est nous qui l'avons
        // interrompue parce que la question a changé. Écrire son échec
        // afficherait « la connexion a échoué » à chaque changement de semaine.
        if (controleur.signal.aborted) return;
        setResultat({ cle, type: typeDemande, etat: "reseau" });
        capture(ANALYTICS_EVENTS.rdvSlotsFailed, {
          rdv_type: typeDemande,
          reason: "reseau",
        });
      });

    return () => controleur.abort();
  }, [type, semaine, cle]);

  const choisirType = useCallback((id: IdRendezVous) => {
    capture(ANALYTICS_EVENTS.rdvTypeSelected, {
      rdv_type: id,
      preselected: false,
    });
    setType(id);
    setCreneau(undefined);
    // La semaine repart d'aujourd'hui : les disponibilités d'un rendez-vous de
    // 30 minutes n'ont aucune raison d'être celles d'un rendez-vous de 15.
    setSemaine("");
    setEtatEnvoi("repos");
    setMessageEnvoi("");
  }, []);

  /*
   * LE CRÉNEAU RETENU, avec le DÉLAI qu'il représente et non son horaire.
   *
   * `days_ahead` répond à une question qu'aucune autre mesure ne pose : le
   * prospect prend-il le premier créneau venu, ou repousse-t-il à la semaine
   * suivante ? Un délai qui s'allonge est le signal qu'il faut ouvrir des
   * disponibilités, bien avant que le taux de réservation ne bouge.
   *
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
      });
      setCreneau(choix);
    },
    [type],
  );

  const decalerSemaine = useCallback(
    (jours: number) => {
      if (!donnees) return;
      setSemaine(ajouterJours(donnees.fenetre.debut, jours));
    },
    [donnees],
  );

  const recommencer = useCallback(() => {
    setType(undefined);
    setCreneau(undefined);
    setSemaine("");
    setEtatEnvoi("repos");
    setMessageEnvoi("");
    setChampEnErreur(undefined);
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

      const formulaire = evenement.currentTarget;
      const donneesFormulaire = new FormData(formulaire);
      const lire = (nom: string): string => {
        const valeur = donneesFormulaire.get(nom);
        return typeof valeur === "string" ? valeur : "";
      };

      setEtatEnvoi("envoi");
      setMessageEnvoi("");
      setChampEnErreur(undefined);

      if (!protection.configure) {
        setEtatEnvoi("erreur");
        setMessageEnvoi(messageProtectionAbsente(emailContact));
        /*
         * ÉCHEC LE PLUS COÛTEUX DE TOUS, et le plus silencieux : le prospect a
         * choisi son sujet, son créneau, rempli ses coordonnées, appuyé sur le
         * bouton, et rien ne part. Turnstile mal configuré a tenu le formulaire
         * de contact hors service pendant des semaines sans qu'aucune mesure ne
         * le dise (relevé le 2026-09-08).
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
            nom: lire("nom"),
            email: lire("email"),
            message: lire("message"),
            debutMs: refDebut.current,
            [NOM_CHAMP_PIEGE]: lire(NOM_CHAMP_PIEGE),
            ...(jetonCaptcha ? { jetonCaptcha } : {}),
          }),
        });
        const charge: unknown = await reponse.json().catch(() => null);

        if (reponse.ok) {
          setEtatEnvoi("succes");
          setMessageEnvoi("");
          protection.reinitialiser();
          /*
           * LA SEULE CONVERSION QUI COMPTE, et elle n'était mesurée nulle part.
           * `form_submitted`, émis par la délégation globale, part au clic :
           * il compte donc aussi les envois que Cal.com a refusés. L'entonnoir
           * se termine ici, sur la réponse du serveur.
           */
          capture(ANALYTICS_EVENTS.rdvConfirmed, { rdv_type: type });
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
         * écrit. C'est lui qui sépare les trois causes d'échec qui demandent
         * trois corrections différentes : `creneau` = course entre deux
         * réservations, `jetonCaptcha` = protection mal réglée, le reste =
         * validation trop stricte.
         */
        capture(ANALYTICS_EVENTS.rdvFailed, {
          rdv_type: type,
          reason: "refus_serveur",
          status: reponse.status,
          field: champ ?? "inconnu",
        });
        // Créneau pris entre l'affichage et la confirmation : on renvoie le
        // prospect à la grille, en la rechargeant, plutôt que de le laisser
        // réappuyer sur un bouton qui échouera à l'identique.
        if (champ === "creneau") {
          setCreneau(undefined);
          setTentative((valeur) => valeur + 1);
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
    [etatEnvoi, type, creneau, protection, emailContact],
  );

  if (etatEnvoi === "succes") {
    return (
      <div className="flex flex-col gap-[16px] border border-accent bg-accent/[0.07] p-[20px]">
        <p className="text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground">
          {contenu.succes.titre}
        </p>
        <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
          {contenu.succes.texte}
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

  return (
    <div className="flex flex-col gap-[20px]">
      {/* L'étape 01 ne se replie JAMAIS, et ce n'est pas un oubli de symétrie.
          Dans un `radiogroup`, les flèches déplacent la sélection : replier le
          groupe dès le premier choix ferait disparaître le contrôle sous les
          doigts, la troisième et la quatrième entrée deviendraient
          inatteignables au clavier, et le focus retomberait sur le document.
          Le choix reste donc visible, simplement mis en évidence. */}
      <Etape index={0} titre={contenu.etapes.sujet} ouverte>
        <ChoixType types={types} choisi={type} onChoisir={choisirType} />
      </Etape>

      {typeChoisi ? (
        <Etape
          index={1}
          titre={contenu.etapes.creneau}
          ouverte={!creneau}
          resume={creneau ? creneau.resume : undefined}
          onChanger={() => setCreneau(undefined)}
        >
          <div className="flex flex-col gap-[20px]">
            <p className={CLASSE_LIBELLE}>{contenu.noteFuseau}</p>

            {etatCreneaux === "indisponible" ? (
              <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                {contenu.creneaux.indisponible}
              </p>
            ) : null}

            {etatCreneaux === "reseau" ? (
              <div className="flex flex-col items-start gap-[12px]">
                <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                  {contenu.creneaux.erreur}
                </p>
                <button
                  type="button"
                  onClick={() => setTentative((valeur) => valeur + 1)}
                  className="min-h-[44px] border border-border px-[16px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
                >
                  {contenu.actions.reessayer}
                </button>
              </div>
            ) : null}

            {/* La navigation reste POSÉE pendant le chargement, boutons
                désactivés : la faire disparaître à chaque changement de semaine
                déplacerait la grille sous le curseur du prospect au moment
                précis où il vise le bouton suivant. */}
            {donnees ? (
              <NavigationSemaine
                donnees={donnees}
                chargement={chargement}
                onDecaler={decalerSemaine}
              />
            ) : null}

            {chargement ? (
              <div className="flex items-center gap-[10px]">
                <Spinner size="sm" label={contenu.creneaux.chargement} />
                <span aria-hidden className={CLASSE_LIBELLE}>
                  {contenu.creneaux.chargement}
                </span>
              </div>
            ) : null}

            {donnees && !chargement ? (
              donnees.jours.length > 0 ? (
                <GrilleCreneaux
                  donnees={donnees}
                  jourActif={jourActif ?? donnees.jours[0]}
                  onChoisirJour={setJourChoisi}
                  onChoisir={choisirCreneau}
                />
              ) : (
                <p className="text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
                  {contenu.creneaux.vide}
                </p>
              )
            ) : null}
          </div>
        </Etape>
      ) : null}

      {typeChoisi && creneau ? (
        <Etape index={2} titre={contenu.etapes.coordonnees} ouverte>
          <form
            /* SANS CE NOM, la mesure appelle ce formulaire « form » : `formId`
               retombe sur cette chaîne quand ni `data-analytics-form`, ni
               `name`, ni `id` ne sont posés, et les trois formulaires de
               contact du site se confondent alors dans un même seau. */
            data-analytics-form="rendez-vous"
            className="relative flex flex-col gap-[14px]"
            /* `method="post"` et `action` : sans script, le navigateur soumet
               lui-même, en POST et dans un CORPS. La route refusera faute de
               JSON et de jeton, mais aucune donnée personnelle ne peut partir
               dans une chaîne de requête. Même raisonnement que les trois
               formulaires de contact. */
            method="post"
            action="/api/rendez-vous"
            onSubmit={gererSoumission}
            /* Première interaction = chargement du script Turnstile. Tant que
               personne ne touche le formulaire, aucune requête ne part vers
               Cloudflare. */
            onFocusCapture={protection.activer}
          >
            <label htmlFor="rdv-nom" className="flex w-full flex-col gap-[10px]">
              <span className={CLASSE_LIBELLE}>{contenu.formulaire.nomLabel}</span>
              <input
                id="rdv-nom"
                ref={refNom}
                name="nom"
                type="text"
                required
                autoComplete="name"
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
                placeholder={contenu.formulaire.messagePlaceholder}
                aria-invalid={champEnErreur === "message" || undefined}
                className="min-h-[90px] w-full resize-y border border-border bg-transparent p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/25 focus:border-b-accent tablet:text-[14px]"
              />
            </label>

            <button
              type="submit"
              disabled={enCours}
              className="mt-[6px] flex h-[50px] w-full items-center justify-center bg-accent px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:w-fit"
            >
              {enCours ? contenu.formulaire.envoiEnCours : contenu.formulaire.envoyer}
            </button>

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

            <ChampsProtection refConteneur={protection.refConteneur} />
          </form>
        </Etape>
      ) : null}
    </div>
  );
}
