"use client";

/**
 * Formulaire de la page `/contact` — composant CLIENT.
 *
 * IL ÉTAIT INERTE. Le `<form>` n'avait ni `action`, ni `onSubmit`, ni action
 * serveur, et portait `method="get"` : appuyer sur « Envoyer » rechargeait
 * `/contact?projectType=…&name=…&email=…&message=…`. Le nom, l'adresse et le
 * message du prospect partaient donc dans l'URL — donc dans l'historique du
 * navigateur, dans les journaux d'accès et dans l'en-tête `Referer` — pendant
 * qu'Eliott ne recevait rien et que le prospect croyait avoir écrit.
 *
 * CE QUI A CHANGÉ, ET RIEN D'AUTRE : la soumission, les `name` alignés sur le
 * contrat de `POST /api/contact`, l'état affiché, le piège et le widget
 * anti-robot. Le balisage, les classes et les commentaires de relevé sont
 * repris tels quels depuis `ContactPage.tsx` : la fidélité visuelle au pixel
 * près n'est pas négociable sur ce projet.
 *
 * POURQUOI UN FICHIER À PART : `ContactPage` est un composant serveur `async`.
 * Un gestionnaire d'événement impose `"use client"`, et marquer toute la page
 * comme cliente aurait fait passer la lecture du contenu, le JSON-LD et les
 * métadonnées côté navigateur.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Icon, SwapText } from "@/components/ui";
import {
  ChampsProtection,
  MessageEtat,
  ReplisSansScript,
} from "@/components/forms/ProtectionFormulaire";
import { useEnvoiFormulaire } from "@/components/forms/useEnvoiFormulaire";
import {
  OPTIONS_ECHEANCE,
  optionsObjectif,
  rendezVousDuTypeProjet,
  tranchesBudget,
} from "@/lib/rendez-vous/questionnaire";
import type { OptionQuestion } from "@/content/rendez-vous";
import type {
  ContactFormContent,
  Link as ContentLink,
} from "@/lib/content/types";

/**
 * Fondu d'apparition d'une ligne de formulaire.
 *
 * MESURÉ sur le live (motion-sweep /contact) : les quatre libellés et le bouton
 * d'envoi apparaissent en FONDU — `-O LABEL "What are you looking for"`,
 * `"Name *"`, `"Your email address *"`, `"Anything else?"` et
 * `-O DIV "Send messageSend message"` — opacité seule, aucune translation. Chez
 * nous ces cinq éléments étaient strictement immobiles (13 éléments animés
 * contre 17 sur la source).
 *
 * Le fondu est porté par un `div` ENVELOPPANT et non par le `<label>` lui-même :
 * `Reveal` ne sait rendre que div/span/p/header/footer/nav/section. Le `<label>`
 * est laissé intact à l'intérieur — `htmlFor`, focus, soumission et lecture
 * d'écran ne changent pas. `w-full` reproduit exactement la largeur que le
 * `<label>` occupait comme enfant direct de la colonne flex du formulaire, donc
 * le rendu au repos ne bouge pas d'un pixel.
 */
function FieldReveal({
  delay,
  className = "w-full",
  children,
}: {
  delay: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Reveal
      as="div"
      className={className}
      initialOpacity={0.001}
      duration={0.8}
      delay={delay}
    >
      {children}
    </Reveal>
  );
}

function FormField({
  id,
  name,
  label,
  placeholder,
  type = "text",
  delay,
  enErreur = false,
}: {
  id: string;
  /**
   * Nom envoyé au serveur, DISTINCT de l'`id`.
   *
   * L'`id` reste celui du balisage d'origine (il porte le `htmlFor` du
   * libellé) ; le `name`, lui, doit correspondre au champ attendu par
   * `POST /api/contact`. Les confondre obligerait à renommer les `id` du
   * relevé, ou à traduire les noms côté serveur.
   */
  name: string;
  label: string;
  placeholder: string;
  type?: "text" | "email";
  /** Délai du fondu d'apparition, en secondes (cf. {@link FieldReveal}). */
  delay: number;
  /** Surligne le champ que le serveur a désigné comme fautif. */
  enErreur?: boolean;
}) {
  return (
    <FieldReveal delay={delay}>
      <label htmlFor={id} className="flex w-full flex-col items-end gap-[10px]">
        <span className="text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60">
          {label} *
        </span>
        <input
          id={id}
          name={name}
          type={type}
          required
          placeholder={placeholder}
          aria-invalid={enErreur || undefined}
          // Bord GAUCHE nul dès 810, comme la source (cf. le commentaire du
          // `<select>`) ; le bord bas passe bien à l'accent au focus.
          // `outline-none` retiré : voir `src/app/focus.css`.
          className={`h-[50px] w-full border bg-transparent px-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background transition-colors placeholder:text-black/30 focus:border-b-accent tablet:border-l-0 tablet:text-[14px] ${
            enErreur ? "border-accent" : "border-black/10"
          }`}
        />
      </label>
    </FieldReveal>
  );
}

/**
 * Question à choix du questionnaire (budget, objectif, échéance), au dessin
 * du sélecteur « Que cherchez-vous ? ». Les valeurs envoyées sont les
 * identifiants de `questionnaire.ts`, vérifiés en liste fermée par le serveur.
 */
function QuestionField({
  name,
  label,
  placeholder,
  options,
  requis,
  delay,
  enErreur,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly OptionQuestion[];
  requis: boolean;
  delay: number;
  enErreur: boolean;
}) {
  const id = `contact-${name}`;
  return (
    <FieldReveal delay={delay}>
      <label htmlFor={id} className="flex w-full flex-col items-end gap-[10px]">
        <span className="text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60">
          {label}
          {requis ? " *" : ""}
        </span>
        <span className="relative block w-full">
          <select
            id={id}
            name={name}
            required={requis}
            defaultValue=""
            aria-invalid={enErreur || undefined}
            className={`h-[50px] w-full appearance-none border bg-transparent px-[16px] pr-[48px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background transition-colors tablet:border-l-0 tablet:text-[14px] ${
              enErreur ? "border-accent" : "border-black/10"
            }`}
          >
            <option value="" disabled={requis}>
              {placeholder}
            </option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.libelle}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={16}
            className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-background"
          />
        </span>
      </label>
    </FieldReveal>
  );
}

/** Étape qui porte chaque champ, pour y revenir quand le serveur le refuse. */
const ETAPE_DU_CHAMP: Readonly<Record<string, number>> = {
  typeProjet: 0,
  objectif: 0,
  budget: 1,
  echeance: 1,
  nom: 2,
  email: 2,
  message: 2,
};

const DERNIERE_ETAPE = 2;

/**
 * Barre de progression, même dessin que la prise de rendez-vous : un segment,
 * un numéro et un titre par étape. En sombre et non en accent : l'accent clair
 * de la prise de rendez-vous disparaît sur le fond clair de cette page. Une étape franchie ramène à elle ; on
 * n'atteint pas une étape à venir sans valider la courante.
 */
function Progression({
  titres,
  etape,
  onAller,
}: {
  titres: readonly string[];
  etape: number;
  onAller: (index: number) => void;
}) {
  return (
    <ol className="m-0 grid w-full list-none grid-cols-3 gap-[6px] p-0">
      {titres.map((titre, index) => {
        const faite = index < etape;
        const courante = index === etape;
        const corps = (
          <>
            <span
              aria-hidden
              className={`block h-[2px] w-full transition-colors motion-reduce:transition-none ${
                faite || courante ? "bg-background" : "bg-black/10"
              }`}
            />
            <span className="flex flex-col gap-[4px] pt-[10px] text-[12px] font-medium uppercase leading-[1.2] tracking-[-0.01em]">
              <span className={faite || courante ? "text-background" : "text-background/60"}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={courante ? "text-background" : "text-background/60"}>
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

const CLASSE_BOUTON_PLEIN =
  "group flex h-[50px] w-full items-center justify-center bg-background px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:w-auto";

const CLASSE_BOUTON_RETOUR =
  "flex h-[50px] w-full items-center justify-center border border-black/10 px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-background transition-colors hover:border-black/30 motion-reduce:transition-none tablet:w-auto";

function linkedDisclaimer(
  text: string,
  links: readonly ContentLink[],
): ReactNode[] {
  const orderedLinks = links
    .map((link) => ({ link, index: text.indexOf(link.label) }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index);

  const parts: ReactNode[] = [];
  let cursor = 0;
  orderedLinks.forEach(({ link, index }) => {
    if (index > cursor) {
      parts.push(text.slice(cursor, index));
    }
    parts.push(
      <Link
        key={`${link.href}-${index}`}
        href={link.href}
        // MESURÉ sur le live (preset `framer-styles-preset-cltove`) : ces deux
        // liens de la mention légale ne sont PAS soulignés
        // (`text-decoration-line: none`) et passent de `rgb(11,11,11)` à
        // `rgb(255,69,0)` au survol, avec exactement
        // `transition: color .2s cubic-bezier(.44,0,.56,1)`. Le nôtre portait un
        // soulignement inventé à 20 % et restait inerte au survol.
        className="text-background no-underline transition-colors duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:text-accent motion-reduce:transition-none"
      >
        {link.label}
      </Link>,
    );
    cursor = index + link.label.length;
  });
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return parts;
}

export function ContactForm({
  form,
  emailContact,
}: {
  form: ContactFormContent;
  /** Adresse publiée, affichée en repli quand l'envoi ne peut pas aboutir. */
  emailContact: string;
}) {
  const firstOption = form.projectType.options[0];
  const envoi = useEnvoiFormulaire("projet", emailContact);
  // Le type choisi règle les listes du questionnaire, comme le sujet du
  // rendez-vous : tranches et objectifs d'un site ne sont pas ceux d'un logiciel.
  const [typeProjet, setTypeProjet] = useState(firstOption);
  const idRendezVous = rendezVousDuTypeProjet(typeProjet);
  const { questionnaire } = form;
  const enCours = envoi.etat === "envoi";

  /*
   * TROIS ÉTAPES, UNE SEULE AFFICHÉE, depuis le 2026-10-16 : sept champs d'un
   * bloc faisaient long (Eliott). Tous les champs restent dans le formulaire,
   * les étapes cachées par `hidden` : la soumission lit toujours le même
   * `FormData`, et le repli sans script garde ses champs.
   */
  const [etape, setEtape] = useState(0);
  const refFormulaire = useRef<HTMLFormElement>(null);
  const refPremierRendu = useRef(true);

  // Le focus suit l'étape, sauf au premier affichage de la page.
  useEffect(() => {
    if (refPremierRendu.current) {
      refPremierRendu.current = false;
      return;
    }
    conteneurEtape(etape)
      ?.querySelector<HTMLElement>("select, input, textarea")
      ?.focus({ preventScroll: true });
  }, [etape]);

  // Un champ refusé par le serveur ramène à son étape (ajusté au rendu, sans
  // effet : https://react.dev/learn/you-might-not-need-an-effect).
  const [champVu, setChampVu] = useState(envoi.champEnErreur);
  if (envoi.champEnErreur !== champVu) {
    setChampVu(envoi.champEnErreur);
    const cible = envoi.champEnErreur ? ETAPE_DU_CHAMP[envoi.champEnErreur] : undefined;
    if (cible !== undefined) setEtape(cible);
  }

  function conteneurEtape(index: number): HTMLElement | null | undefined {
    return refFormulaire.current?.querySelector<HTMLElement>(`[data-etape="${index}"]`);
  }

  /** Valide les champs de l'étape affichée, puis passe à la suivante. */
  function continuer() {
    const conteneur = conteneurEtape(etape);
    const champs = conteneur
      ? Array.from(
          conteneur.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
            "select, input, textarea",
          ),
        )
      : [];
    const invalide = champs.find((champ) => !champ.checkValidity());
    if (invalide) {
      invalide.reportValidity();
      return;
    }
    setEtape((courante) => Math.min(courante + 1, DERNIERE_ETAPE));
  }

  const { etapes } = form;

  return (
    <form
      ref={refFormulaire}
      // Bas de formulaire MESURÉ sur la source : `padding-bottom: 30px` sous 810
      // (hauteur de formulaire 526 contre 518 chez nous), 80 au-dessus. Il était
      // à 16 en mobile.
      className="relative flex w-full flex-col gap-[14px] pb-[30px] tablet:ml-auto tablet:w-1/2 tablet:gap-[16px] tablet:pb-[80px]"
      /* `method="get"` est devenu `method="post"`, et c'est LA correction du
         bug : la soumission normale passe par `gererSoumission`, qui poste un
         corps JSON ; si le script ne tourne pas, le navigateur soumet lui-même,
         et ces deux attributs garantissent qu'il le fera en POST vers la route
         plutôt qu'en GET vers `/contact?nom=…&email=…&message=…`. Voir
         `ReplisSansScript`. */
      method="post"
      action="/api/contact"
      onSubmit={envoi.gererSoumission}
      onReset={() => {
        setTypeProjet(firstOption);
        setEtape(0);
      }}
      /* Première interaction = chargement du script Turnstile. Tant que
         personne ne touche le formulaire, aucune requête ne part vers
         Cloudflare. */
      onFocusCapture={envoi.protection.activer}
      noValidate={false}
    >
      <FieldReveal delay={0.1}>
        <Progression titres={etapes.titres} etape={etape} onAller={setEtape} />
      </FieldReveal>

      {/* 01 — le projet : ce qui est cherché, et pour obtenir quoi. */}
      <div data-etape={0} hidden={etape !== 0} className="flex w-full flex-col gap-[14px] tablet:gap-[16px]">
        <FieldReveal delay={0.15}>
          <label
            htmlFor="projectType"
            className="flex w-full flex-col items-end gap-[10px]"
          >
            <span className="text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60">
              {form.projectType.label}
            </span>
            <span className="relative block w-full">
              {/* Deux écarts MESURÉS contre `.framer-90sxxy` :
                  - bord GAUCHE nul à partir de 810 (`--framer-input-border-left-width:
                    0px`, remis à 1px seulement sous le seuil). Relevé des quatre
                    champs, bords t/r/b/l : source 1/1/1/0 à 810 et 1440, 1/1/1/1 à
                    390 ; nous 1/1/1/1 partout ;
                  - le SELECT ne change PAS de couleur au focus : contrairement au
                    champ texte, son enveloppe ne déclare aucun
                    `--framer-input-focused-border-color`, et le relevé le confirme
                    (bord `rgba(0,0,0,0.1)` identique au repos et au focus). Le
                    nôtre passait son bord bas à l'accent. */}
              <select
                id="projectType"
                name="typeProjet"
                value={typeProjet}
                onChange={(evenement) => setTypeProjet(evenement.target.value)}
                aria-invalid={envoi.champEnErreur === "typeProjet" || undefined}
                // `outline-none` retiré : voir `src/app/focus.css`.
                className="h-[50px] w-full appearance-none border border-black/10 bg-transparent px-[16px] pr-[48px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background transition-colors tablet:border-l-0 tablet:text-[14px]"
              >
                {form.projectType.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <Icon
                name="chevron-down"
                size={16}
                className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-background"
              />
            </span>
          </label>
        </FieldReveal>
        {/* `key` sur le type : changer de type remet la réponse à zéro,
            puisque la liste change. */}
        <QuestionField
          key={`objectif-${idRendezVous}`}
          name="objectif"
          label={questionnaire.objectif.label}
          placeholder={questionnaire.objectif.placeholder}
          options={optionsObjectif(idRendezVous)}
          requis
          delay={0.2}
          enErreur={envoi.champEnErreur === "objectif"}
        />
      </div>

      {/* 02 — le budget et l'échéance. */}
      <div data-etape={1} hidden={etape !== 1} className="flex w-full flex-col gap-[14px] tablet:gap-[16px]">
        <QuestionField
          key={`budget-${idRendezVous}`}
          name="budget"
          label={questionnaire.budget.label}
          placeholder={questionnaire.budget.placeholder}
          options={tranchesBudget(idRendezVous)}
          requis
          delay={0}
          enErreur={envoi.champEnErreur === "budget"}
        />
        <QuestionField
          name="echeance"
          label={questionnaire.echeance.label}
          placeholder={questionnaire.echeance.placeholder}
          options={OPTIONS_ECHEANCE}
          requis={false}
          delay={0}
          enErreur={envoi.champEnErreur === "echeance"}
        />
      </div>

      {/* 03 — les coordonnées, puis l'envoi. */}
      <div data-etape={2} hidden={etape !== 2} className="flex w-full flex-col gap-[14px] tablet:gap-[16px]">
        <FormField
          id="name"
          name="nom"
          label={form.name.label}
          placeholder={form.name.placeholder}
          delay={0}
          enErreur={envoi.champEnErreur === "nom"}
        />
        <FormField
          id="email"
          name="email"
          label={form.email.label}
          placeholder={form.email.placeholder}
          type="email"
          delay={0}
          enErreur={envoi.champEnErreur === "email"}
        />
        <FieldReveal delay={0}>
          <label
            htmlFor="message"
            className="flex w-full flex-col items-end gap-[10px]"
          >
            <span className="text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60">
              {form.message.label}
            </span>
            <textarea
              id="message"
              name="message"
              maxLength={4000}
              aria-invalid={envoi.champEnErreur === "message" || undefined}
              placeholder={form.message.placeholder}
              // Bord GAUCHE nul dès 810 (cf. le commentaire du `<select>`).
              // `outline-none` retiré : voir `src/app/focus.css`.
              className="min-h-[100px] w-full resize-y border border-black/10 bg-transparent p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-background transition-colors placeholder:text-black/30 focus:border-b-accent tablet:border-l-0 tablet:text-[14px]"
            />
          </label>
        </FieldReveal>
      </div>

      {/* Rangée des boutons : `padding-top` MESURÉ sur la source à 0 sous 810
          et 20 au-dessus. La mention légale n'accompagne que l'envoi. */}
      <div className="flex flex-col items-start gap-[16px] tablet:flex-row tablet:items-center tablet:gap-[20px] tablet:pt-[20px]">
        <FieldReveal delay={0.3} className="flex w-full flex-col gap-[10px] tablet:w-auto tablet:flex-row">
          {etape > 0 ? (
            <button
              type="button"
              onClick={() => setEtape((courante) => Math.max(courante - 1, 0))}
              className={CLASSE_BOUTON_RETOUR}
            >
              {etapes.retour}
            </button>
          ) : null}
          {etape < DERNIERE_ETAPE ? (
            <button type="button" onClick={continuer} className={CLASSE_BOUTON_PLEIN}>
              <SwapText travel={12}>{etapes.continuer}</SwapText>
            </button>
          ) : (
            <button
              type="submit"
              disabled={enCours}
              // Aucun style de focus ici : l'indicateur est global
              // (`src/app/focus.css`).
              className={CLASSE_BOUTON_PLEIN}
            >
              {/* Motif `.framer-yuvr8` : 12 px vers le BAS, fondu croisé, 430 ms. */}
              <SwapText travel={12}>
                {enCours ? "Envoi en cours…" : form.submitLabel}
              </SwapText>
            </button>
          )}
        </FieldReveal>
        {etape === DERNIERE_ETAPE ? (
          <p className="max-w-[189px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-background/60">
            {linkedDisclaimer(form.disclaimer.text, form.disclaimer.links)}
          </p>
        ) : null}
      </div>

      {/* État d'envoi : c'est le retour que le prospect n'avait pas du tout. */}
      <MessageEtat etat={envoi.etat} message={envoi.message} className="max-w-[420px]" />

      <ReplisSansScript emailContact={emailContact} />
      <ChampsProtection refConteneur={envoi.protection.refConteneur} />
    </form>
  );
}
