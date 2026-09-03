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
      <span className="h-auto w-auto whitespace-pre text-right text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
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
  enCours,
}: {
  label: string;
  enCours: boolean;
}) {
  // Course de 12 px VERS LE BAS et non de la hauteur de ligne : mesuré sur le
  // live, où ce bouton (`.framer-yuvr8`, le même que l'envoi du formulaire de
  // contact) permute plus court que les CTA « START A PROJECT » (22 px vers le
  // haut) et dans l'autre sens.
  // `leading-[1.2]` et non `leading-[16px]` : le cadre clippant de la source
  // mesure 15,59 px (13 px × 1,2), le nôtre en mesurait 16.
  const textCls =
    "text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-[#0b0b0b]";
  return (
    <div className="h-[50px] w-full tablet:w-auto">
      <button
        type="submit"
        disabled={enCours}
        className="group relative flex h-[50px] w-full flex-none flex-row items-center justify-center gap-[15px] overflow-hidden bg-foreground px-[20px] transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:w-min"
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

  return (
    <form
      className="relative flex w-full flex-col items-start gap-[14px] overflow-hidden tablet:gap-[16px]"
      /* Voir `ReplisSansScript` : en POST, jamais en GET, pour qu'une
         soumission sans script ne remonte pas les données dans l'URL. */
      method="post"
      action="/api/contact"
      onSubmit={envoi.gererSoumission}
      onFocusCapture={envoi.protection.activer}
    >
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
      {/* framer-4tlyn3 : select « What are you looking for? »
          Contour et chevron sont portés par le wrapper
          (`.footer-select-wrapper`, cf. globals.css) exactement comme
          sur le live : bordure sans côté gauche via `::after`, chevron
          en masque SVG via `::before`. Le `<select>` est donc nu, ce
          qui ramène sa largeur de 682,5 à 666,5px. */}
      <label className="relative flex w-full flex-col items-end gap-[10px]">
        <span className="h-auto w-auto whitespace-pre text-right text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground-60">
          {footerForm.selectLabel}
        </span>
        <div className="footer-select-wrapper w-full">
          <select
            name="typeProjet"
            required
            defaultValue={footerForm.selectOptions[0]}
            aria-invalid={
              envoi.champEnErreur === "typeProjet" || undefined
            }
            // `outline-none` retiré : voir `src/app/focus.css`.
            className="block h-[54px] w-full appearance-none border-0 bg-transparent p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground tablet:h-[50px] tablet:text-[14px]"
          >
            {footerForm.selectOptions.map((opt) => (
              <option key={opt} value={opt} className="text-[#0b0b0b]">
                {opt}
              </option>
            ))}
          </select>
        </div>
      </label>

      {/* framer-vx7pd3 : bouton + disclaimer */}
      <div className="relative flex w-full flex-col items-start gap-[16px] overflow-visible tablet:flex-row tablet:items-center tablet:gap-[20px] tablet:pt-[26px]">
        <SubmitButton
          label={footerForm.submitLabel}
          enCours={envoi.etat === "envoi"}
        />
        {/* framer-pqglgl : disclaimer (preset 1epsd85 12px, blanc 60 %, max 189) */}
        <p className="h-auto w-full max-w-[189px] flex-1 whitespace-pre-wrap break-words text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground-60 tablet:w-px">
          {/* Les trois morceaux de phrase encadrant les deux liens
              viennent de la donnée (`disclaimerPrefix` / `Joiner` /
              `Suffix`). Ils étaient écrits en anglais dans le JSX :
              traduire `footerForm` laissait donc la mention en
              anglais autour de deux liens français. */}
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
