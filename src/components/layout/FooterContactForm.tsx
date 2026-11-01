"use client";

/**
 * Formulaire du pied de page — composant CLIENT.
 *
 * IL ÉTAIT DÉCORATIF, et le code le disait : « formulaire (statique, sans
 * backend) ». Aucun `action`, aucun `onSubmit`, onze champs pièges que personne
 * ne lisait. Il est présent sur les NEUF routes du site : c'est le formulaire
 * le plus vu, et c'était celui qui ne menait nulle part.
 *
 * IL N'A PAS ÉTÉ RETIRÉ, il a été branché. Ce n'est pas une inscription à une
 * lettre d'information — les champs demandent un nom, une adresse et un type de
 * projet —, c'est une demande de contact. Elle part donc sur la MÊME route que
 * `/contact`, avec l'intention `footer`, qui la distingue dans la boîte
 * d'Eliott sans dupliquer une ligne de serveur.
 *
 * Le balisage, les classes et les commentaires de relevé Framer sont repris
 * tels quels depuis `Footer.tsx`.
 */

import { SwapCopies } from "@/components/ui/SwapCopies";
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import {
  ChampsProtection,
  MessageEtat,
  ReplisSansScript,
} from "@/components/forms/ProtectionFormulaire";
import { useEnvoiFormulaire } from "@/components/forms/useEnvoiFormulaire";
import { useEffect, useRef, useState } from "react";
import {
  OPTIONS_ECHEANCE,
  optionsObjectif,
  rendezVousDuTypeProjet,
  tranchesBudget,
} from "@/lib/rendez-vous/questionnaire";
import type { OptionQuestion } from "@/content/rendez-vous";
import type { SiteConfig } from "@/lib/content/types";

/** Le pied de page ne rend ce composant que si la donnée existe. */
type FooterFormContent = NonNullable<SiteConfig["footerForm"]>;

/** Champ de formulaire (label aligné droite + input à bordure subtile). */
function FormField({
  label,
  type,
  name,
  placeholder,
  autoComplete,
  enErreur = false,
}: {
  label: string;
  type: string;
  /** Nom attendu par `POST /api/contact` (`nom`, `email`). */
  name: string;
  placeholder: string;
  autoComplete?: string;
  /** Surligne le champ que le serveur a désigné comme fautif. */
  enErreur?: boolean;
}) {
  return (
    // framer-x05314 / 1cbluft : label (flex col, items-end, gap 10)
    <label className="relative flex w-full flex-col items-end gap-[10px]">
      {/* preset 18rrjz2 (11px), color rgba(255,255,255,.6), aligné droite */}
      <span className="h-auto w-auto whitespace-pre text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
        {label}
      </span>
      {/* framer-70kwgc : input 50px (54 mobile), border top+right+bottom rgba(255,255,255,.1) */}
      <input
        type={type}
        name={name}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={enErreur || undefined}
        // `outline-none` retiré : la suppression de l'anneau par défaut est
        // désormais globale (`src/app/focus.css`), qui pose aussi l'anneau
        // clavier. Le passage du bord bas à l'accent au focus, lui, est bien de
        // la source et reste ici.
        className={`h-[54px] w-full border-y border-r bg-transparent px-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-[rgba(255,255,255,0.3)] focus:border-b-accent tablet:h-[50px] tablet:text-[14px] ${
          enErreur ? "border-accent" : "border-[rgba(255,255,255,0.1)]"
        }`}
      />
    </label>
  );
}

/** Bouton « Send message » (blanc, texte sombre, swap vertical CSS au survol). */
function SubmitButton({
  label,
  enCours = false,
  onClick,
}: {
  label: string;
  enCours?: boolean;
  /** Présent = bouton « Continuer » d'une étape, qui n'envoie rien. */
  onClick?: () => void;
}) {
  // Course de 12 px VERS LE BAS et non de la hauteur de ligne : mesuré sur le
  // live, où ce bouton (`.framer-yuvr8`, le même que l'envoi du formulaire de
  // contact) permute plus court que les CTA « START A PROJECT » (22 px vers le
  // haut) et dans l'autre sens.
  // `leading-[1.2]` et non `leading-[16px]` : le cadre clippant de la source
  // mesure 15,59 px (13 px × 1,2), le nôtre en mesurait 16.
  const textCls =
    "text-[14px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink";
  return (
    <div className="h-[50px] w-full tablet:w-auto">
      <button
        type={onClick ? "button" : "submit"}
        onClick={onClick}
        disabled={enCours}
        className="group relative flex h-[50px] w-full flex-none flex-row items-center justify-center gap-[15px] overflow-hidden bg-accent px-[20px] transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:w-min"
      >
        <span className="relative block h-[15.6px] overflow-hidden">
          <SwapCopies travel={12} textClassName={textCls}>
            {enCours ? "Envoi…" : label}
          </SwapCopies>
        </span>
      </button>
    </div>
  );
}

/**
 * Question à choix (budget, objectif, échéance), au dessin du sélecteur
 * « Que cherchez-vous ? » : contour et chevron portés par
 * `.footer-select-wrapper`. Les valeurs sont les identifiants de
 * `questionnaire.ts`, vérifiés en liste fermée par le serveur.
 */
function QuestionField({
  name,
  label,
  placeholder,
  options,
  requis,
  enErreur,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly OptionQuestion[];
  requis: boolean;
  enErreur: boolean;
}) {
  return (
    <label className="relative flex w-full flex-col items-end gap-[10px]">
      <span className="h-auto w-auto whitespace-pre text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
        {label}
        {requis ? " *" : ""}
      </span>
      <div className="footer-select-wrapper w-full">
        <select
          name={name}
          required={requis}
          defaultValue=""
          aria-invalid={enErreur || undefined}
          className="block h-[54px] w-full appearance-none border-0 bg-transparent p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground tablet:h-[50px] tablet:text-[14px]"
        >
          <option value="" disabled={requis} className="text-background">
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.id} value={option.id} className="text-background">
              {option.libelle}
            </option>
          ))}
        </select>
      </div>
    </label>
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
 * Barre de progression, même dessin que la prise de rendez-vous voisine : un
 * segment, un numéro et un titre par étape. Une étape franchie ramène à elle ;
 * une étape à venir ne s'atteint qu'en validant la courante.
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
                faite || courante ? "bg-accent" : "bg-white/15"
              }`}
            />
            <span className="flex flex-col gap-[4px] pt-[10px] micro">
              <span className={faite || courante ? "text-accent" : "text-foreground-60"}>
                {String(index + 1).padStart(2, "0")}
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

export function FooterContactForm({
  footerForm,
  emailContact,
  inlineLinkCls,
}: {
  footerForm: FooterFormContent;
  /** Adresse publiée, affichée en repli quand l'envoi ne peut pas aboutir. */
  emailContact: string;
  /** Classe des liens en ligne, définie une seule fois dans `Footer.tsx`. */
  inlineLinkCls: string;
}) {
  const envoi = useEnvoiFormulaire("footer", emailContact);
  const { questionnaire, etapes } = footerForm;
  const premierType = footerForm.selectOptions[0];

  /*
   * TROIS ÉTAPES, UNE SEULE AFFICHÉE, depuis le 2026-10-16. Ce formulaire est
   * devenu le seul du site et pose les questions de la prise de rendez-vous ;
   * d'un bloc, ça faisait long (Eliott). Tous les champs restent dans le
   * `<form>`, les étapes cachées par `hidden` : la soumission lit toujours le
   * même `FormData`.
   */
  const [etape, setEtape] = useState(0);
  // Le type choisi règle les listes, comme le sujet du rendez-vous.
  const [typeProjet, setTypeProjet] = useState(premierType);
  const idRendezVous = rendezVousDuTypeProjet(typeProjet);
  const refFormulaire = useRef<HTMLFormElement>(null);
  const refPremierRendu = useRef(true);

  function conteneurEtape(index: number): HTMLElement | null | undefined {
    return refFormulaire.current?.querySelector<HTMLElement>(`[data-etape="${index}"]`);
  }

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

  return (
    <form
      ref={refFormulaire}
      className="relative flex w-full flex-col items-start gap-[14px] overflow-hidden tablet:gap-[16px]"
      /* Voir `ReplisSansScript` : en POST, jamais en GET, pour qu'une
         soumission sans script ne remonte pas les données dans l'URL. */
      method="post"
      action="/api/contact"
      onSubmit={envoi.gererSoumission}
      onReset={() => {
        setTypeProjet(premierType);
        setEtape(0);
      }}
      onFocusCapture={envoi.protection.activer}
    >
      <Progression titres={etapes.titres} etape={etape} onAller={setEtape} />

      {/* 01 — le projet : ce qui est cherché, et pour obtenir quoi. */}
      <div data-etape={0} hidden={etape !== 0} className="flex w-full flex-col gap-[14px] tablet:gap-[16px]">
        {/* framer-4tlyn3 : select « What are you looking for? »
            Contour et chevron sont portés par le wrapper
            (`.footer-select-wrapper`, cf. globals.css) exactement comme
            sur le live : bordure sans côté gauche via `::after`, chevron
            en masque SVG via `::before`. Le `<select>` est donc nu. */}
        <label className="relative flex w-full flex-col items-end gap-[10px]">
          <span className="h-auto w-auto whitespace-pre text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
            {footerForm.selectLabel}
          </span>
          <div className="footer-select-wrapper w-full">
            <select
              name="typeProjet"
              required
              value={typeProjet}
              onChange={(evenement) => setTypeProjet(evenement.target.value)}
              aria-invalid={envoi.champEnErreur === "typeProjet" || undefined}
              // `outline-none` retiré : voir `src/app/focus.css`.
              className="block h-[54px] w-full appearance-none border-0 bg-transparent p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground tablet:h-[50px] tablet:text-[14px]"
            >
              {footerForm.selectOptions.map((opt) => (
                <option key={opt} value={opt} className="text-background">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </label>
        {/* `key` sur le type : changer de type remet la réponse à zéro,
            puisque la liste change. */}
        <QuestionField
          key={`objectif-${idRendezVous}`}
          name="objectif"
          label={questionnaire.objectif.label}
          placeholder={questionnaire.objectif.placeholder}
          options={optionsObjectif(idRendezVous)}
          requis
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
          options={tranchesBudget()}
          requis
          enErreur={envoi.champEnErreur === "budget"}
        />
        <QuestionField
          name="echeance"
          label={questionnaire.echeance.label}
          placeholder={questionnaire.echeance.placeholder}
          options={OPTIONS_ECHEANCE}
          requis={false}
          enErreur={envoi.champEnErreur === "echeance"}
        />
      </div>

      {/* 03 — les coordonnées, un message si l'on veut, puis l'envoi. */}
      <div data-etape={2} hidden={etape !== 2} className="flex w-full flex-col gap-[14px] tablet:gap-[16px]">
        <FormField
          label={footerForm.nameLabel}
          type="text"
          name="nom"
          autoComplete="name"
          placeholder={footerForm.namePlaceholder ?? ""}
          enErreur={envoi.champEnErreur === "nom"}
        />
        <FormField
          label={footerForm.emailLabel}
          /* `type="email"` et non `text` : le clavier des téléphones
             bascule sur la disposition adaptée, et le navigateur
             signale une adresse manifestement fausse avant l'envoi. */
          type="email"
          name="email"
          autoComplete="email"
          placeholder={footerForm.emailPlaceholder ?? ""}
          enErreur={envoi.champEnErreur === "email"}
        />
        {footerForm.messageLabel ? (
          <label className="relative flex w-full flex-col items-end gap-[10px]">
            <span className="h-auto w-auto whitespace-pre text-right text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
              {footerForm.messageLabel}
            </span>
            <textarea
              name="message"
              rows={3}
              maxLength={4000}
              placeholder={footerForm.messagePlaceholder ?? ""}
              aria-invalid={envoi.champEnErreur === "message" || undefined}
              className={`block min-h-[96px] w-full resize-y border-y border-r bg-transparent px-[16px] py-[14px] text-[16px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground transition-colors placeholder:text-[rgba(255,255,255,0.3)] focus:border-b-accent tablet:text-[14px] ${
                envoi.champEnErreur === "message" ? "border-accent" : "border-[rgba(255,255,255,0.1)]"
              }`}
            />
          </label>
        ) : null}
      </div>

      {/* framer-vx7pd3 : boutons + disclaimer (la mention n'accompagne que l'envoi) */}
      <div className="relative flex w-full flex-col items-start gap-[16px] overflow-visible tablet:flex-row tablet:items-center tablet:gap-[20px] tablet:pt-[26px]">
        <div className="flex w-full flex-col gap-[10px] tablet:w-auto tablet:flex-row">
          {etape > 0 ? (
            <button
              type="button"
              onClick={() => setEtape((courante) => Math.max(courante - 1, 0))}
              className="flex h-[50px] w-full items-center justify-center border border-white/10 px-[20px] text-[14px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-white/35 motion-reduce:transition-none tablet:w-auto"
            >
              {etapes.retour}
            </button>
          ) : null}
          {etape < DERNIERE_ETAPE ? (
            <SubmitButton label={etapes.continuer} onClick={continuer} />
          ) : (
            <SubmitButton label={footerForm.submitLabel} enCours={envoi.etat === "envoi"} />
          )}
        </div>
        {etape === DERNIERE_ETAPE ? (
          /* framer-pqglgl : disclaimer (preset 1epsd85 12px, blanc 60 %, max 189) */
          <p className="h-auto w-full max-w-[189px] flex-1 whitespace-pre-wrap break-words text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60 tablet:w-px">
            {/* Les trois morceaux de phrase encadrant les deux liens
                viennent de la donnée (`disclaimerPrefix` / `Joiner` /
                `Suffix`). */}
            {footerForm.disclaimerPrefix}
            {footerForm.disclaimerLinks?.[0] ? (
              <HoverPrefetchLink href={footerForm.disclaimerLinks[0].href} className={inlineLinkCls}>
                {footerForm.disclaimerLinks[0].label}
              </HoverPrefetchLink>
            ) : null}{" "}
            {footerForm.disclaimerJoiner}
            {footerForm.disclaimerLinks?.[1] ? (
              <HoverPrefetchLink href={footerForm.disclaimerLinks[1].href} className={inlineLinkCls}>
                {footerForm.disclaimerLinks[1].label}
              </HoverPrefetchLink>
            ) : null}
            {footerForm.disclaimerSuffix}
          </p>
        ) : null}
      </div>

      {/* État d'envoi, annoncé aussi aux lecteurs d'écran. */}
      <MessageEtat
        etat={envoi.etat}
        message={envoi.message}
        ton="clair"
        className="max-w-[420px]"
      />

      {/* Le piège du template comptait ONZE champs cachés, dont un
          nommé `message` — et aucun n'était lu, faute de serveur. Un
          seul champ suffit dès lors qu'il est VÉRIFIÉ : voir
          `ChampsProtection`. */}
      <ReplisSansScript emailContact={emailContact} />
      <ChampsProtection refConteneur={envoi.protection.refConteneur} />
    </form>
  );
}
