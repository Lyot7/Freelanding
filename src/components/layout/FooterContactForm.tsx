"use client";

/**
 * Formulaire du pied de page — composant CLIENT.
 *
 * UN SEUL ÉCRAN DEPUIS LE 2026-11-01. Le site promet « deux lignes » : la tâche,
 * une adresse, un nom. Le budget et l'échéance restent possibles, repliés, sans
 * jamais être demandés. La demande part sur `POST /api/contact`, avec l'intention
 * `footer`.
 */

import { SwapCopies } from "@/components/ui/SwapCopies";
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import {
  ChampsProtection,
  MessageEtat,
  ReplisSansScript,
} from "@/components/forms/ProtectionFormulaire";
import { useEnvoiFormulaire } from "@/components/forms/useEnvoiFormulaire";
import { SignatureTracee } from "@/components/motion/SignatureTracee";
import { OPTIONS_ECHEANCE, tranchesBudget } from "@/lib/rendez-vous/questionnaire";
import type { OptionQuestion } from "@/content/rendez-vous";
import type { SiteConfig } from "@/lib/content/types";

/** Le pied de page ne rend ce composant que si la donnée existe. */
type FooterFormContent = NonNullable<SiteConfig["footerForm"]>;

/** Champ de formulaire (libellé à gauche, champ à bordure subtile). */
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
    <label className="relative flex w-full flex-col items-start gap-[10px]">
      <span className="h-auto w-auto whitespace-pre text-left text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
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
}: {
  label: string;
  enCours?: boolean;
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
        type="submit"
        disabled={enCours}
        className="group relative flex h-[50px] w-full flex-none flex-row items-center justify-center gap-[15px] overflow-hidden bg-accent px-[20px] transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:w-auto"
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
 * Question à choix (budget, échéance) : contour et chevron portés par
 * `.footer-select-wrapper`. Les valeurs sont les identifiants de
 * `questionnaire.ts`, vérifiés en liste fermée par le serveur.
 */
function QuestionField({
  name,
  label,
  placeholder,
  options,
  enErreur,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: readonly OptionQuestion[];
  enErreur: boolean;
}) {
  return (
    <label className="relative flex w-full flex-col items-start gap-[10px]">
      <span className="h-auto w-auto whitespace-pre text-left text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
        {label}
      </span>
      <div className="footer-select-wrapper w-full">
        <select
          name={name}
          defaultValue=""
          aria-invalid={enErreur || undefined}
          className="block h-[54px] w-full appearance-none border-0 bg-transparent p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground tablet:h-[50px] tablet:text-[14px]"
        >
          <option value="" className="text-background">
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
  const { precisions } = footerForm;
  // Un champ refusé par le serveur rouvre les précisions, sans fermer ce que le
  // visiteur a ouvert : `open` absent ne touche pas au `<details>`.
  const precisionEnErreur = envoi.champEnErreur === "budget" || envoi.champEnErreur === "echeance";

  return (
    <form
      className="relative flex w-full flex-col items-start gap-[14px] tablet:gap-[16px]"
      /* Voir `ReplisSansScript` : en POST, jamais en GET, pour qu'une
         soumission sans script ne remonte pas les données dans l'URL. */
      method="post"
      action="/api/contact"
      onSubmit={envoi.gererSoumission}
      onFocusCapture={envoi.protection.activer}
    >
      <label className="relative flex w-full flex-col items-start gap-[10px]">
        <span className="h-auto w-auto text-left text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
          {footerForm.messageLabel}
        </span>
        <textarea
          name="message"
          rows={4}
          required
          minLength={10}
          maxLength={4000}
          placeholder={footerForm.messagePlaceholder}
          aria-invalid={envoi.champEnErreur === "message" || undefined}
          className={`block min-h-[120px] w-full resize-y border-y border-r bg-transparent px-[16px] py-[14px] text-[16px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground transition-colors placeholder:text-[rgba(255,255,255,0.3)] focus:border-b-accent tablet:text-[14px] ${
            envoi.champEnErreur === "message" ? "border-accent" : "border-[rgba(255,255,255,0.1)]"
          }`}
        />
      </label>
      <FormField
        label={footerForm.emailLabel}
        /* `type="email"` et non `text` : le clavier des téléphones bascule sur la
           disposition adaptée, et le navigateur signale une adresse manifestement
           fausse avant l'envoi. */
        type="email"
        name="email"
        autoComplete="email"
        placeholder={footerForm.emailPlaceholder ?? ""}
        enErreur={envoi.champEnErreur === "email"}
      />
      <FormField
        label={footerForm.nameLabel}
        type="text"
        name="nom"
        autoComplete="name"
        placeholder={footerForm.namePlaceholder ?? ""}
        enErreur={envoi.champEnErreur === "nom"}
      />

      <details open={precisionEnErreur || undefined} className="group/precisions w-full">
        <summary className="cta-lien w-fit cursor-pointer list-none text-foreground [&::-webkit-details-marker]:hidden">
          {precisions.ouvrir}
        </summary>
        <div className="flex w-full flex-col gap-[14px] pt-[18px] tablet:gap-[16px]">
          <QuestionField
            name="budget"
            label={precisions.budget.label}
            placeholder={precisions.budget.placeholder}
            options={tranchesBudget()}
            enErreur={envoi.champEnErreur === "budget"}
          />
          <QuestionField
            name="echeance"
            label={precisions.echeance.label}
            placeholder={precisions.echeance.placeholder}
            options={OPTIONS_ECHEANCE}
            enErreur={envoi.champEnErreur === "echeance"}
          />
        </div>
      </details>

      <div className="relative flex w-full flex-col items-start gap-[12px] pt-[10px] tablet:flex-row tablet:items-center tablet:gap-[20px]">
        <SubmitButton label={footerForm.submitLabel} enCours={envoi.etat === "envoi"} />
        <p className="m-0 text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground">
          {footerForm.delaiReponse}
        </p>
      </div>
      {/* Les trois morceaux de phrase encadrant les deux liens viennent de la donnée. */}
      <p className="m-0 w-full max-w-[420px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60">
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

      {/* État d'envoi, annoncé aussi aux lecteurs d'écran. */}
      <MessageEtat
        etat={envoi.etat}
        message={envoi.message}
        ton="clair"
        className="max-w-[420px] text-[16px]"
      />
      {envoi.etat === "succes" ? <SignatureTracee className="w-[160px] text-foreground" /> : null}

      {/* Le piège du template comptait ONZE champs cachés, dont un
          nommé `message` — et aucun n'était lu, faute de serveur. Un
          seul champ suffit dès lors qu'il est VÉRIFIÉ : voir
          `ChampsProtection`. */}
      <ReplisSansScript emailContact={emailContact} />
      <ChampsProtection refConteneur={envoi.protection.refConteneur} />
    </form>
  );
}
