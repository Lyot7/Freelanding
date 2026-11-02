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
 * NÉOMORPHISME depuis le 2026-11-02 (maquette validée par Eliott) : la carte,
 * les pastilles, les champs et les boutons sont dessinés par les classes
 * `.neo-*` de `globals.css`. Les choix fermés (type, objectif, budget,
 * échéance) sont des boutons radio natifs à la place des `<select>` : mêmes
 * `name`, mêmes valeurs envoyées, et chaque réponse se voit sans ouvrir de liste.
 */

import { SwapCopies } from "@/components/ui/SwapCopies";
import { HoverPrefetchLink } from "@/components/ui/HoverPrefetchLink";
import {
  ChampsProtection,
  MessageEtat,
  ReplisSansScript,
} from "@/components/forms/ProtectionFormulaire";
import { useEnvoiFormulaire } from "@/components/forms/useEnvoiFormulaire";
import { useEffect, useId, useRef, useState } from "react";
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

/** Libellé de champ : à gauche, au-dessus, en capitales 13 px. */
const LIBELLE_CLS =
  "text-left text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground";

/**
 * Dessin commun des champs en creux. Le contour à 40 % de blanc tient 3,8:1
 * sur la matière de la carte (`#131313`), au-dessus des 3:1 de WCAG 1.4.11 ;
 * le survol monte d'un cran. La couleur d'état (vérifié, refusé) est portée
 * par `.neo-champ` selon `data-etat` et `aria-invalid`.
 */
const CHAMP_CLS =
  "neo-champ w-full border border-white/40 px-[18px] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground placeholder:text-white/50 hover:border-white/60 focus:border-accent";

/** Une adresse qu'on peut écrire : quelque chose, une arobase, un domaine à point. */
const FORME_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type EtatEmail = "repos" | "valide" | "refuse";

/**
 * État d'une adresse à la sortie du champ : rien tant qu'elle est vide, vert
 * quand le navigateur l'accepte ET qu'elle a un domaine à point (le navigateur
 * laisse passer `nom@domaine`), rouge sinon.
 */
export function etatAdresse(valeur: string, accepteeParLeNavigateur: boolean): EtatEmail {
  const adresse = valeur.trim();
  if (adresse.length === 0) return "repos";
  return accepteeParLeNavigateur && FORME_EMAIL.test(adresse) ? "valide" : "refuse";
}

/** Champ de saisie en creux, libellé au-dessus. */
function FormField({
  label,
  type,
  name,
  placeholder,
  autoComplete,
  enErreur = false,
  requis = true,
  inputMode,
  etat,
  aide,
  onBlur,
  onInput,
}: {
  label: string;
  type: string;
  /** Nom attendu par `POST /api/contact` (`nom`, `email`). */
  name: string;
  placeholder: string;
  autoComplete?: string;
  /** Surligne le champ que le serveur, ou la vérification locale, a refusé. */
  enErreur?: boolean;
  /** Faux pour un champ facultatif (le téléphone). */
  requis?: boolean;
  inputMode?: "tel";
  /** Contour vert quand la saisie a été vérifiée. */
  etat?: EtatEmail;
  /** Ligne d'aide sous le champ, réservée même vide pour ne rien décaler. */
  aide?: string;
  onBlur?: (champ: HTMLInputElement) => void;
  onInput?: (champ: HTMLInputElement) => void;
}) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <label htmlFor={id} className={LIBELLE_CLS}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        required={requis}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={enErreur || undefined}
        aria-describedby={aide !== undefined ? `${id}-aide` : undefined}
        data-etat={etat === "valide" ? "valide" : undefined}
        onBlur={onBlur ? (evenement) => onBlur(evenement.currentTarget) : undefined}
        onInput={onInput ? (evenement) => onInput(evenement.currentTarget) : undefined}
        className={`${CHAMP_CLS} h-[54px]`}
      />
      {aide !== undefined ? (
        <p id={`${id}-aide`} aria-live="polite" className="neo-aide m-0 min-h-[1lh] text-[13px] leading-[1.3]">
          {aide}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Bouton principal, volt, en relief : il s'enfonce au clic. Le texte permute
 * verticalement au survol (`SwapCopies`), comme les autres boutons du site.
 */
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
  // `leading-[1.2]` et non `leading-[16px]` : le cadre clippant de la source
  // mesure 15,59 px (13 px × 1,2), le nôtre en mesurait 16.
  const textCls =
    "text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-accent-ink";
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={enCours}
      className="neo-bouton neo-bouton--principal group relative flex h-[52px] flex-none items-center justify-center px-[28px] disabled:cursor-progress disabled:opacity-60"
    >
      <span className="relative block h-[15.6px] overflow-hidden">
        <SwapCopies travel={12} textClassName={textCls}>
          {enCours ? "Envoi…" : label}
        </SwapCopies>
      </span>
    </button>
  );
}

/**
 * Question à choix, en pastilles en relief : une pastille choisie s'enfonce,
 * son point et son contour passent au vert. Ce sont des boutons radio natifs,
 * cachés sous la pastille : le clavier (flèches), le formulaire et la
 * validation du navigateur marchent sans une ligne de plus. Les valeurs sont
 * les identifiants de `questionnaire.ts`, vérifiés en liste fermée par le
 * serveur.
 */
function ChoixField({
  name,
  legende,
  options,
  requis,
  enErreur,
  tuiles = false,
  valeur,
  onChoisir,
}: {
  name: string;
  legende: string;
  options: readonly OptionQuestion[];
  requis: boolean;
  enErreur: boolean;
  /** Grandes tuiles côte à côte (le type de projet), lignes sur téléphone. */
  tuiles?: boolean;
  /** Présent = choix contrôlé (le type, qui règle la liste des objectifs). */
  valeur?: string;
  onChoisir?: (valeur: string) => void;
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className={`${LIBELLE_CLS} mb-[12px] p-0`}>{legende}</legend>
      <div
        role="radiogroup"
        aria-invalid={enErreur || undefined}
        className={tuiles ? "neo-choix neo-choix--tuiles" : "neo-choix"}
      >
        {options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name={name}
              value={option.id}
              required={requis}
              {...(valeur !== undefined
                ? {
                    checked: valeur === option.id,
                    onChange: () => onChoisir?.(option.id),
                  }
                : {})}
            />
            <span className="neo-pastille">{option.libelle}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Zone de message libre, en creux comme les autres champs. */
function FieldTexte({
  label,
  placeholder,
  enErreur,
}: {
  label: string;
  placeholder: string;
  enErreur: boolean;
}) {
  const id = useId();
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <label htmlFor={id} className={LIBELLE_CLS}>
        {label}
      </label>
      <textarea
        id={id}
        name="message"
        rows={3}
        maxLength={4000}
        placeholder={placeholder}
        aria-invalid={enErreur || undefined}
        className={`${CHAMP_CLS} block min-h-[110px] resize-y py-[15px]`}
      />
    </div>
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
  telephone: 2,
  message: 2,
};

const DERNIERE_ETAPE = 2;

/**
 * Barre de progression : une piste creusée par étape, qui se remplit de volt
 * quand on l'atteint, un numéro et un titre dessous. Une étape franchie ramène
 * à elle ; une étape à venir ne s'atteint qu'en validant la courante.
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
    <ol className="m-0 grid w-full list-none grid-cols-3 gap-[10px] p-0">
      {titres.map((titre, index) => {
        const faite = index < etape;
        const courante = index === etape;
        const corps = (
          <>
            <span aria-hidden className="neo-piste" data-rempli={faite || courante}>
              <span />
            </span>
            <span className="flex flex-col gap-[8px] pt-[10px] text-[12px] font-medium leading-[1.25]">
              <span className={`text-[13px] font-semibold ${faite || courante ? "text-foreground" : "text-foreground-60"}`}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={courante ? "text-foreground" : "text-foreground-60"}>{titre}</span>
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
  // Le type de projet est envoyé en clair : sa valeur est son libellé.
  const optionsType = footerForm.selectOptions.map((libelle) => ({ id: libelle, libelle }));

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
  // L'adresse est vérifiée à la sortie du champ, pas à chaque frappe.
  const [etatEmail, setEtatEmail] = useState<EtatEmail>("repos");
  const refFormulaire = useRef<HTMLFormElement>(null);
  // Dernière étape focalisée : comparer l'étape plutôt qu'un drapeau de premier
  // rendu, que le double effet du mode strict de React consommait (le premier
  // choix prenait le focus dès l'affichage en développement).
  const refEtapeVue = useRef(etape);

  function conteneurEtape(index: number): HTMLElement | null | undefined {
    return refFormulaire.current?.querySelector<HTMLElement>(`[data-etape="${index}"]`);
  }

  function verifierEmail(champ: HTMLInputElement) {
    setEtatEmail(etatAdresse(champ.value, champ.checkValidity()));
  }

  // Le focus suit l'étape, sauf au premier affichage de la page.
  useEffect(() => {
    if (refEtapeVue.current === etape) return;
    refEtapeVue.current = etape;
    const conteneur = conteneurEtape(etape);
    (
      conteneur?.querySelector<HTMLElement>("input:checked") ??
      conteneur?.querySelector<HTMLElement>("input, textarea")
    )?.focus({ preventScroll: true });
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
      ? Array.from(conteneur.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea"))
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
      className="relative flex w-full flex-col items-start gap-[26px]"
      /* Voir `ReplisSansScript` : en POST, jamais en GET, pour qu'une
         soumission sans script ne remonte pas les données dans l'URL. */
      method="post"
      action="/api/contact"
      onSubmit={envoi.gererSoumission}
      onReset={() => {
        setTypeProjet(premierType);
        setEtatEmail("repos");
        setEtape(0);
      }}
      onFocusCapture={envoi.protection.activer}
    >
      <Progression titres={etapes.titres} etape={etape} onAller={setEtape} />

      {/* 01 — le projet : ce qui est cherché, et pour obtenir quoi. */}
      <div data-etape={0} hidden={etape !== 0} className="neo-etape flex w-full flex-col gap-[26px]">
        <ChoixField
          name="typeProjet"
          legende={footerForm.selectLabel}
          options={optionsType}
          requis
          tuiles
          enErreur={envoi.champEnErreur === "typeProjet"}
          valeur={typeProjet}
          onChoisir={setTypeProjet}
        />
        {/* `key` sur le type : changer de type remet la réponse à zéro,
            puisque la liste change. */}
        <ChoixField
          key={`objectif-${idRendezVous}`}
          name="objectif"
          legende={questionnaire.objectif.label}
          options={optionsObjectif(idRendezVous)}
          requis
          enErreur={envoi.champEnErreur === "objectif"}
        />
      </div>

      {/* 02 — le budget et l'échéance. */}
      <div data-etape={1} hidden={etape !== 1} className="neo-etape flex w-full flex-col gap-[26px]">
        <ChoixField
          name="budget"
          legende={questionnaire.budget.label}
          options={tranchesBudget()}
          requis
          enErreur={envoi.champEnErreur === "budget"}
        />
        <ChoixField
          name="echeance"
          legende={questionnaire.echeance.label}
          options={OPTIONS_ECHEANCE}
          requis={false}
          enErreur={envoi.champEnErreur === "echeance"}
        />
      </div>

      {/* 03 — les coordonnées, un message si l'on veut, puis l'envoi. */}
      <div data-etape={2} hidden={etape !== 2} className="neo-etape flex w-full flex-col gap-[20px]">
        <div className="neo-duo">
          <FormField
            label={footerForm.nameLabel}
            type="text"
            name="nom"
            autoComplete="name"
            placeholder={footerForm.namePlaceholder ?? ""}
            enErreur={envoi.champEnErreur === "nom"}
          />
          {footerForm.telephoneLabel ? (
            <FormField
              label={footerForm.telephoneLabel}
              type="tel"
              name="telephone"
              autoComplete="tel"
              inputMode="tel"
              requis={false}
              placeholder={footerForm.telephonePlaceholder ?? ""}
              enErreur={envoi.champEnErreur === "telephone"}
            />
          ) : null}
        </div>
        <FormField
          label={footerForm.emailLabel}
          /* `type="email"` et non `text` : le clavier des téléphones
             bascule sur la disposition adaptée, et le navigateur
             signale une adresse manifestement fausse avant l'envoi. */
          type="email"
          name="email"
          autoComplete="email"
          placeholder={footerForm.emailPlaceholder ?? ""}
          enErreur={envoi.champEnErreur === "email" || etatEmail === "refuse"}
          etat={etatEmail}
          aide={etatEmail === "refuse" ? (footerForm.emailInvalide ?? "") : ""}
          onBlur={verifierEmail}
          // Une adresse refusée se revérifie à la frappe : le rouge part dès
          // qu'elle est juste, sans attendre de quitter le champ.
          onInput={etatEmail === "refuse" ? verifierEmail : undefined}
        />
        {footerForm.messageLabel ? (
          <FieldTexte
            label={footerForm.messageLabel}
            placeholder={footerForm.messagePlaceholder ?? ""}
            enErreur={envoi.champEnErreur === "message"}
          />
        ) : null}
      </div>

      {/* Retour à gauche, la suite à droite ; la mention n'accompagne que l'envoi. */}
      <div className="flex w-full flex-col gap-[20px]">
        <div className="flex w-full items-center justify-between gap-[16px]">
          {etape > 0 ? (
            <button
              type="button"
              onClick={() => setEtape((courante) => Math.max(courante - 1, 0))}
              className="neo-bouton neo-bouton--retour flex h-[52px] items-center justify-center px-[26px] text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground"
            >
              {etapes.retour}
            </button>
          ) : (
            <span aria-hidden />
          )}
          {/* `key` distinctes : sans elles, React garde le même `<button>` et
              le passe en `type="submit"` pendant le clic sur « Continuer »
              de l'avant-dernière étape. Le navigateur soumettait alors le
              formulaire et signalait le nom vide à peine affiché. */}
          {etape < DERNIERE_ETAPE ? (
            <SubmitButton key="continuer" label={etapes.continuer} onClick={continuer} />
          ) : (
            <SubmitButton key="envoyer" label={footerForm.submitLabel} enCours={envoi.etat === "envoi"} />
          )}
        </div>
        {etape === DERNIERE_ETAPE ? (
          <p className="m-0 w-full text-[12px] font-medium leading-[1.45] tracking-[-0.01em] text-foreground-60">
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
