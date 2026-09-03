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
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { Icon, SwapText } from "@/components/ui";
import {
  ChampsProtection,
  MessageEtat,
  ReplisSansScript,
} from "@/components/forms/ProtectionFormulaire";
import { useEnvoiFormulaire } from "@/components/forms/useEnvoiFormulaire";
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
        <span className="text-right text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60">
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
  const enCours = envoi.etat === "envoi";

  return (
    <form
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
      /* Première interaction = chargement du script Turnstile. Tant que
         personne ne touche le formulaire, aucune requête ne part vers
         Cloudflare. */
      onFocusCapture={envoi.protection.activer}
      noValidate={false}
    >
      {/* Fondus échelonnés de 0,1 s, dans l'ordre de lecture du formulaire. */}
      <FieldReveal delay={0.1}>
        <label
          htmlFor="projectType"
          className="flex w-full flex-col items-end gap-[10px]"
        >
          <span className="text-right text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60">
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
              defaultValue={firstOption}
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

      <FormField
        id="name"
        name="nom"
        label={form.name.label}
        placeholder={form.name.placeholder}
        delay={0.2}
        enErreur={envoi.champEnErreur === "nom"}
      />
      <FormField
        id="email"
        name="email"
        label={form.email.label}
        placeholder={form.email.placeholder}
        type="email"
        delay={0.3}
        enErreur={envoi.champEnErreur === "email"}
      />

      <FieldReveal delay={0.4}>
        <label
          htmlFor="message"
          className="flex w-full flex-col items-end gap-[10px]"
        >
          <span className="text-right text-[11px] font-medium leading-[1.2] tracking-[-0.01em] text-background/60">
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

      {/* Rangée bouton + mention : `padding-top` MESURÉ sur la source à 0 sous
          810 (rangée de 97px = 50 + 16 + 31) et 20 au-dessus (rangée de 70px =
          20 + 50). Elle était à 6 des deux côtés du seuil. */}
      <div className="flex flex-col items-start gap-[16px] tablet:flex-row tablet:items-center tablet:gap-[20px] tablet:pt-[20px]">
        {/* Le bouton fond lui aussi (`-O DIV "Send messageSend message"` sur le
            live) ; `w-full tablet:w-auto` recopie la largeur qu'il avait comme
            enfant direct de cette rangée flex. */}
        <FieldReveal delay={0.5} className="w-full tablet:w-auto">
          <button
            type="submit"
            disabled={enCours}
            // Aucun style de focus ici, comme partout ailleurs : l'indicateur
            // est global (`src/app/focus.css`). Le relevé de la source sur ce
            // bouton (anneau par défaut du navigateur, `outline: 1px auto
            // rgb(0,95,204)`, offset 0) reste vrai, mais c'est précisément
            // l'anneau que le propriétaire a demandé de remplacer partout.
            className="group flex h-[50px] w-full items-center justify-center bg-background px-[20px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-opacity disabled:cursor-progress disabled:opacity-60 tablet:w-auto"
          >
            {/* Motif `.framer-yuvr8` : 12 px vers le BAS, fondu croisé, 430 ms.
                Relevé sur `/live-proxy/contact` à 1440, copie en attente posée à
                `top: -12px` et non sous la boîte. */}
            <SwapText travel={12}>
              {enCours ? "Envoi en cours…" : form.submitLabel}
            </SwapText>
          </button>
        </FieldReveal>
        <p className="max-w-[189px] text-[12px] font-medium leading-[1.3] tracking-[-0.01em] text-background/60">
          {linkedDisclaimer(form.disclaimer.text, form.disclaimer.links)}
        </p>
      </div>

      {/* État d'envoi : c'est le retour que le prospect n'avait pas du tout. */}
      <MessageEtat etat={envoi.etat} message={envoi.message} className="max-w-[420px]" />

      <ReplisSansScript emailContact={emailContact} />
      <ChampsProtection refConteneur={envoi.protection.refConteneur} />
    </form>
  );
}
