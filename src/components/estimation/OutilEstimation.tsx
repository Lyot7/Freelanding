"use client";

/**
 * Outil de chiffrage façon conversation limitée : Eliott pose quatre questions
 * à boutons, demande une description, puis les coordonnées, et affiche la
 * fourchette (achat direct et abonnement côte à côte).
 *
 * UN SEUL ENVOI AU SERVEUR, à la fin : rien ne part tant que le visiteur n'a
 * pas laissé son contact. Le calcul est fait côté
 * serveur (`/api/estimation`) pour que la grille et l'IA restent privées.
 *
 * MODIFIER UNE RÉPONSE la vide et la repose ; les réponses suivantes sont
 * gardées et réapparaissent dès qu'elle est redonnée.
 */
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { FormEvent, ReactNode } from "react";
import { ChampsProtection } from "@/components/forms/ProtectionFormulaire";
import { useProtectionTurnstile } from "@/components/forms/turnstile";
import { CHAMP_PIEGE } from "@/lib/chiffrage/validation";
import type { ChampEstimation } from "@/lib/chiffrage/validation";
import { LONGUEUR_DESCRIPTION_MAX } from "@/lib/chiffrage/extraction";
import type { Estimation, Fourchette, Reponses } from "@/lib/chiffrage/grille";
import { estimationContent, lienRendezVous } from "@/content/estimation";
import type { QuestionChoix } from "@/content/estimation";

const t = estimationContent;
const ORDRE_CHOIX = ["type", "equipe", "outils", "urgence"] as const;
type CleChoix = (typeof ORDRE_CHOIX)[number];
type ReponsesPartielles = { -readonly [K in keyof Reponses]?: Reponses[K] };

interface Coordonnees {
  prenom: string;
  nom: string;
  societe: string;
  email: string;
  telephone: string;
}
const CHAMPS_CONTACT = [
  "prenom",
  "nom",
  "societe",
  "email",
  "telephone",
] as const;
const AUTOCOMPLETE: Readonly<Record<(typeof CHAMPS_CONTACT)[number], string>> =
  {
    prenom: "given-name",
    nom: "family-name",
    societe: "organization",
    email: "email",
    telephone: "tel",
  };
const TYPE_CHAMP: Readonly<Record<(typeof CHAMPS_CONTACT)[number], string>> = {
  prenom: "text",
  nom: "text",
  societe: "text",
  email: "email",
  telephone: "tel",
};

/* ─── Classes ──────────────────────────────────────────────────────────── */

const CLASSE_LIBELLE =
  "text-[12px] font-medium uppercase leading-[1.2] tracking-[0.02em] text-foreground/70";
const CLASSE_CHAMP =
  "w-full border border-white/45 bg-white/[0.04] px-[16px] text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/55 hover:border-white/60 focus:border-accent aria-invalid:border-accent motion-reduce:transition-none";
const CLASSE_PRINCIPAL =
  "flex h-[56px] w-full items-center justify-center gap-[10px] bg-accent px-[30px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.01em] text-accent-ink transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none tablet:w-fit";

/* ─── Format ───────────────────────────────────────────────────────────── */

/**
 * Séparateur de milliers en espace insécable ordinaire : l'espace fine de
 * `toLocaleString` disparaît dans l'approche serrée des grands chiffres.
 */
function euros(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "\u00A0");
}

/**
 * Une fourchette. En grand, elle s'empile sur deux lignes (« de » / « à ») :
 * « 8 000 à 16 000 € » ne tient pas sur une ligne de téléphone en gras noir.
 * L'unité (`unite`) suit le dernier chiffre.
 */
function Montant({
  f,
  taille,
  unite,
}: {
  f: Fourchette;
  taille: "grand" | "petit";
  unite: string;
}) {
  const r = t.resultat;
  if (taille === "petit") {
    return (
      <span className="text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] tabular-nums">
        {f.haut === undefined ? `${r.aPartirDe} ` : null}
        {euros(f.bas)}
        {f.haut === undefined ? null : (
          <>
            <span className="px-[0.3em] text-[0.8em] font-medium opacity-75">
              {r.a}
            </span>
            {euros(f.haut)}
          </>
        )}
        &nbsp;€
        <span className="ml-[6px] text-[12px] font-medium opacity-75">
          {unite}
        </span>
      </span>
    );
  }
  const ligne = "flex items-baseline gap-[0.22em]";
  const chiffre =
    "text-[44px] font-black tablet:text-[52px] leading-[0.9] tracking-[-0.05em] tabular-nums";
  const mot =
    "w-[1.7em] flex-none text-[14px] font-semibold tracking-[-0.01em] opacity-75";
  return (
    <span className="flex flex-col gap-[2px]">
      <span className={ligne}>
        <span className={mot}>{f.haut === undefined ? r.des : r.de}</span>
        <span className={chiffre}>
          {euros(f.bas)}
          {f.haut === undefined ? <>&nbsp;€</> : null}
        </span>
      </span>
      {f.haut === undefined ? null : (
        <span className={ligne}>
          <span className={mot}>{r.a}</span>
          <span className={chiffre}>{euros(f.haut)}&nbsp;€</span>
        </span>
      )}
      <span className="pl-[calc(1.7em+0.22em)] text-[14px] font-medium opacity-75">
        {unite}
      </span>
    </span>
  );
}

/* ─── Bulles ───────────────────────────────────────────────────────────── */

/**
 * Entrée d'une ligne de conversation : 260 ms, sortie rapide de la courbe
 * (ease-out fort), `transform` complet pour rester sur le GPU. Mouvement réduit :
 * le fondu reste, le déplacement disparaît.
 */
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/**
 * Vrai une fois l'outil monté. Ce qui est rendu au premier passage (la première
 * question) s'affiche sans animation : rendu serveur, il serait sinon invisible
 * (opacité 0) jusqu'à l'hydratation, soit une page vide plusieurs secondes sur
 * un téléphone lent.
 */
const ContexteMonte = createContext<{ readonly current: boolean }>({
  current: false,
});

function Apparition({
  children,
  className,
  etape,
}: {
  children: ReactNode;
  className?: string;
  /** Étape active à faire défiler dans le champ de vision. */
  etape?: string;
}) {
  const reduit = useReducedMotion();
  const monte = useContext(ContexteMonte);
  const [animer] = useState(() => monte.current);
  return (
    <motion.li
      className={`scroll-mt-[100px] ${className ?? ""}`}
      data-etape={etape}
      initial={
        !animer
          ? false
          : reduit
            ? { opacity: 0 }
            : { opacity: 0, transform: "translateY(8px)" }
      }
      animate={
        reduit ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }
      }
      transition={{ duration: 0.26, ease: EASE_OUT }}
    >
      {children}
    </motion.li>
  );
}

/** Ligne d'Eliott : portrait carré et question. Le titre reçoit le focus. */
function Question({
  texte,
  actif,
  children,
}: {
  texte: string;
  actif: boolean;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const monte = useContext(ContexteMonte);
  // Pas de focus au chargement : il sauterait le lien d'évitement et le titre.
  // Une question prend le focus si elle apparaît après le chargement, ou si
  // elle redevient active (« Modifier »). Lu au rendu et non dans l'effet :
  // le double passage des effets en mode strict verrait l'outil déjà monté.
  const [apparueApres] = useState(() => monte.current);
  const etaitActif = useRef(actif);
  useEffect(() => {
    if (actif && (apparueApres || !etaitActif.current))
      ref.current?.focus({ preventScroll: true });
    etaitActif.current = actif;
  }, [actif, apparueApres]);
  return (
    <div className="flex flex-col gap-[20px]">
      <div className="flex items-start gap-[10px]">
        <Image
          src={t.auteur.avatar}
          alt={t.auteur.nom}
          width={36}
          height={36}
          className="mt-[2px] size-[36px] flex-none object-cover grayscale"
        />
        <p
          ref={ref}
          tabIndex={-1}
          className="m-0 text-[18px] font-medium leading-[1.3] tracking-[-0.02em] text-foreground outline-none tablet:text-[22px]"
        >
          {texte}
        </p>
      </div>
      {children ? <div className="tablet:pl-[48px]">{children}</div> : null}
    </div>
  );
}

/**
 * Réponse du visiteur, alignée à droite. « Modifier » reste discret, à gauche
 * de la bulle, en casse normale : répété sous chaque réponse en capitales, il
 * prenait plus de place que les réponses elles-mêmes.
 */
function Reponse({
  texte,
  onModifier,
  long = false,
}: {
  texte: string;
  onModifier?: () => void;
  /** Description : six lignes au plus, le texte entier reste sous « Modifier ». */
  long?: boolean;
}) {
  return (
    <div className="flex items-end justify-end gap-[12px] pl-[48px]">
      {onModifier ? (
        <button
          type="button"
          onClick={onModifier}
          className="min-h-[44px] flex-none px-[4px] text-[14px] font-medium text-foreground/65 underline decoration-white/30 underline-offset-[3px] transition-colors hover:text-accent hover:decoration-accent motion-reduce:transition-none"
        >
          {t.modifier}
        </button>
      ) : null}
      <p className="m-0 min-w-0 whitespace-pre-line break-words border border-accent/40 bg-accent/[0.08] px-[16px] py-[10px] text-[16px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground">
        {/* La coupe vit sur un enfant : sur la bulle, le remplissage laissait
            dépasser le haut de la septième ligne. */}
        <span className={long ? "line-clamp-6" : undefined}>{texte}</span>
      </p>
    </div>
  );
}

function Choix<T extends string>({
  question,
  onChoisir,
}: {
  question: QuestionChoix<T>;
  onChoisir: (valeur: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={question.question}
      className={`grid grid-cols-1 gap-[10px] ${question.options.length === 3 ? "tablet:grid-cols-3" : "tablet:grid-cols-2"}`}
    >
      {question.options.map((option) => (
        <button
          key={option.valeur}
          type="button"
          onClick={() => onChoisir(option.valeur)}
          className="flex min-h-[56px] items-center border border-white/25 bg-white/[0.02] px-[20px] py-[10px] text-left text-[16px] font-medium leading-[1.25] tracking-[-0.01em] text-foreground transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent hover:bg-accent/[0.06] active:scale-[0.985] motion-reduce:transition-none"
        >
          {option.libelle}
        </button>
      ))}
    </div>
  );
}

/* ─── Résultat ─────────────────────────────────────────────────────────── */

function Resultat({
  estimation,
  prenom,
  onRecommencer,
}: {
  estimation: Estimation;
  prenom: string;
  onRecommencer: () => void;
}) {
  const [duree, setDuree] = useState<0 | 1>(0);
  const abonnement = estimation.abonnements[duree];
  const r = t.resultat;
  const idDuree = useId();
  const refIntro = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    refIntro.current?.focus({ preventScroll: true });
  }, []);
  const reduit = useReducedMotion();
  const sousLibelle = "m-0 text-[14px] font-medium leading-[1.3] opacity-75";

  /**
   * Prise de rendez-vous. En haut, bouton plein ; en bas, juste sous l'aplat
   * volt de l'abonnement, un bouton plein s'y fondrait : contour seul.
   */
  const action = (plein: boolean) => (
    <div className="flex flex-col gap-[10px] tablet:flex-row tablet:items-center tablet:gap-[20px]">
      <Link
        href={lienRendezVous(estimation.type)}
        className={
          plein
            ? `${CLASSE_PRINCIPAL} no-underline`
            : `${CLASSE_PRINCIPAL.replace("bg-accent", "border border-accent bg-transparent").replace("text-accent-ink", "text-accent")} no-underline`
        }
      >
        {plein ? r.rendezVous : r.rendezVousBas}
        <span aria-hidden>→</span>
      </Link>
      <p className="m-0 text-[14px] font-medium text-foreground/70">
        {r.rendezVousNote}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col gap-[30px]">
      {/* L'action d'abord : sur téléphone, les deux panneaux font deux écrans. */}
      <div className="flex flex-col gap-[20px]">
        <div className="flex flex-col gap-[10px]">
          <p
            ref={refIntro}
            tabIndex={-1}
            className="m-0 text-[26px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground outline-none tablet:text-[32px]"
          >
            {r.intro(prenom)}
          </p>
          <p className="m-0 flex items-start gap-[10px] text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-foreground/75">
            <span
              aria-hidden
              className="mt-[6px] size-[7px] flex-none bg-accent"
            />
            <span>
              {r.avertissement} {estimation.grandProjet ? r.grandProjet : null}
            </span>
          </p>
        </div>
        {action(true)}
      </div>

      <div className="grid grid-cols-1 gap-[2px] tablet:grid-cols-2">
        {/* ACHAT DIRECT : surface sombre, chiffre en blanc. */}
        <section
          aria-labelledby="achat"
          className="flex flex-col gap-[20px] border border-white/15 bg-surface-2 p-[20px] tablet:p-[30px]"
        >
          <div className="flex flex-col gap-[4px]">
            <h2
              id="achat"
              className="m-0 text-[12px] font-semibold uppercase tracking-[0.02em] text-foreground"
            >
              {r.achat.titre}
            </h2>
            <p className={`${sousLibelle} text-foreground`}>
              {r.achat.sousTitre}
            </p>
          </div>
          <p className="m-0 text-foreground">
            <Montant f={estimation.prix} taille="grand" unite={r.ht} />
          </p>
          <div className="mt-auto flex flex-col gap-[4px] border-t border-white/15 pt-[20px]">
            <p className={`${sousLibelle} text-foreground`}>
              {r.achat.maintenance}
            </p>
            <p className="m-0 text-foreground">
              <Montant
                f={estimation.maintenance}
                taille="petit"
                unite={r.achat.parMois}
              />
            </p>
          </div>
        </section>

        {/* ABONNEMENT : aplat de l'accent, c'est l'offre qu'Eliott pousse. */}
        <section
          aria-labelledby="abonnement"
          className="flex flex-col gap-[20px] bg-accent p-[20px] text-accent-ink tablet:p-[30px]"
        >
          <div className="flex flex-wrap items-start justify-between gap-[10px]">
            <div className="flex flex-col gap-[4px]">
              <h2
                id="abonnement"
                className="m-0 text-[12px] font-semibold uppercase tracking-[0.02em]"
              >
                {r.abonnement.titre}
              </h2>
              <p className={sousLibelle}>{r.abonnement.sousTitre}</p>
            </div>
            {/* Deux boutons à bascule plutôt qu'un radiogroup : pas de promesse
                de navigation aux flèches qu'on ne tiendrait pas. */}
            <div
              role="group"
              aria-labelledby={idDuree}
              className="flex border border-accent-ink/80"
            >
              <span id={idDuree} className="sr-only">
                {r.abonnement.choixDuree}
              </span>
              {estimation.abonnements.map((a, i) => (
                <button
                  key={a.duree}
                  type="button"
                  aria-pressed={duree === i}
                  onClick={() => setDuree(i === 0 ? 0 : 1)}
                  className="min-h-[44px] min-w-[72px] px-[10px] text-[12px] font-semibold uppercase tracking-[0.02em] transition-colors aria-pressed:bg-accent-ink aria-pressed:text-accent motion-reduce:transition-none"
                >
                  {r.abonnement.engagement(a.duree)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-[4px]">
            <p className={sousLibelle}>{r.abonnement.miseEnRoute}</p>
            <p className="m-0">
              <Montant f={abonnement.miseEnRoute} taille="petit" unite={r.ht} />
            </p>
          </div>
          <div className="flex flex-col gap-[6px]">
            <p className={sousLibelle}>
              {r.abonnement.mensualite(abonnement.duree)}
            </p>
            {/* Changer la durée change le chiffre : un fondu court qui monte de
                quelques pixels fait lire une transformation, pas un remplacement. */}
            <motion.p
              key={abonnement.duree}
              className="m-0"
              aria-live="polite"
              initial={
                reduit
                  ? { opacity: 0.4 }
                  : { opacity: 0.4, transform: "translateY(4px)" }
              }
              animate={
                reduit
                  ? { opacity: 1 }
                  : { opacity: 1, transform: "translateY(0px)" }
              }
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Montant
                f={abonnement.mensualite}
                taille="grand"
                unite={r.abonnement.parMois}
              />
            </motion.p>
          </div>
          <div className="mt-auto flex flex-col gap-[4px] border-t border-accent-ink/25 pt-[20px]">
            <p className={sousLibelle}>
              {r.abonnement.apres(abonnement.duree, estimation.type !== "site")}
            </p>
            <p className="m-0">
              <Montant
                f={abonnement.suiviApres}
                taille="petit"
                unite={r.abonnement.parMois}
              />
            </p>
          </div>
        </section>
      </div>

      {action(false)}
      <button
        type="button"
        onClick={onRecommencer}
        className="w-fit min-h-[44px] text-[14px] font-medium text-foreground/70 underline decoration-white/30 underline-offset-[3px] transition-colors hover:text-accent motion-reduce:transition-none"
      >
        {r.recommencer}
      </button>
    </div>
  );
}

/* ─── Outil ────────────────────────────────────────────────────────────── */

type Etat =
  | {
      readonly etape: "saisie";
      readonly envoi: boolean;
      readonly erreur?: string;
      readonly champ?: ChampEstimation;
    }
  | {
      readonly etape: "resultat";
      readonly estimation: Estimation;
      readonly source: "ia" | "boutons";
    };

const CONTACT_VIDE: Coordonnees = {
  prenom: "",
  nom: "",
  societe: "",
  email: "",
  telephone: "",
};

export function libelleChoix(cle: CleChoix, valeur: string): string {
  const q = t.questions[cle] as QuestionChoix<string>;
  return q.options.find((o) => o.valeur === valeur)?.libelle ?? valeur;
}

export function OutilEstimation() {
  const [reponses, setReponses] = useState<ReponsesPartielles>({});
  const [description, setDescription] = useState("");
  const [descriptionValidee, setDescriptionValidee] = useState(false);
  const [descriptionTropCourte, setDescriptionTropCourte] = useState(false);
  const [contact, setContact] = useState<Coordonnees>(CONTACT_VIDE);
  const [etat, setEtat] = useState<Etat>({ etape: "saisie", envoi: false });
  const debut = useRef(0);
  const refListe = useRef<HTMLOListElement | null>(null);
  const refFormulaire = useRef<HTMLFormElement | null>(null);
  const protection = useProtectionTurnstile();
  const reduit = useReducedMotion();
  const idDescription = useId();
  const idAideDescription = useId();
  const idErreur = useId();
  const idObligatoires = useId();

  const monte = useRef(false);
  useEffect(() => {
    debut.current = Date.now();
    monte.current = true;
  }, []);

  const courant: CleChoix | "description" | "contact" =
    ORDRE_CHOIX.find((cle) => reponses[cle] === undefined) ??
    (descriptionValidee ? "contact" : "description");

  // Chaque nouvelle étape remonte en haut de l'écran (sous l'en-tête fixe).
  // Le résultat aussi : c'est le prix qu'on vient voir, pas le bas de page.
  const etapeVisible = etat.etape === "resultat" ? "resultat" : courant;
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const cible = refListe.current?.querySelector(
      `[data-etape="${etapeVisible}"]`,
    );
    cible?.scrollIntoView({
      behavior: reduit ? "auto" : "smooth",
      block: "start",
    });
  }, [etapeVisible, reduit]);

  // Une erreur serveur sur un champ de contact y ramène le focus.
  const champEnErreur = etat.etape === "saisie" ? etat.champ : undefined;
  useEffect(() => {
    if (!champEnErreur) return;
    const champ = refFormulaire.current?.querySelector<HTMLInputElement>(
      `input[name="${champEnErreur}"]`,
    );
    champ?.focus();
  }, [champEnErreur]);

  const choisir = useCallback((cle: CleChoix, valeur: string) => {
    setReponses((r) => ({ ...r, [cle]: valeur }));
  }, []);

  const recommencer = useCallback(() => {
    setReponses({});
    setDescription("");
    setDescriptionValidee(false);
    setEtat({ etape: "saisie", envoi: false });
    protection.reinitialiser();
    window.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
  }, [protection, reduit]);

  async function envoyer(
    evenement: FormEvent<HTMLFormElement>,
    completes: Reponses,
  ) {
    evenement.preventDefault();
    if (etat.etape !== "saisie" || etat.envoi) return;
    const { type, equipe, outils, urgence } = completes;
    setEtat({ etape: "saisie", envoi: true });
    const piege = new FormData(evenement.currentTarget).get(CHAMP_PIEGE);
    const jetonCaptcha = await protection.obtenirJeton();
    try {
      const reponse = await fetch("/api/estimation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reponses: { type, equipe, outils, urgence },
          description,
          contact,
          // La mention affichée sous le bouton vaut accord : envoyer est l'acte.
          consentement: true,
          jetonCaptcha,
          debutMs: debut.current,
          [CHAMP_PIEGE]: typeof piege === "string" ? piege : "",
        }),
      });
      const charge: unknown = await reponse.json().catch(() => undefined);
      const objet =
        typeof charge === "object" && charge !== null
          ? (charge as Record<string, unknown>)
          : {};
      if (
        reponse.ok &&
        typeof objet.estimation === "object" &&
        objet.estimation !== null
      ) {
        setEtat({
          etape: "resultat",
          estimation: objet.estimation as Estimation,
          source: objet.source === "ia" ? "ia" : "boutons",
        });
        return;
      }
      protection.reinitialiser();
      // Les étapes déjà répondues restent en place : l'erreur s'affiche toujours
      // dans le formulaire, à côté du bouton, et rien ne disparaît sous le doigt.
      const champ =
        typeof objet.champ === "string" &&
        (CHAMPS_CONTACT as readonly string[]).includes(objet.champ)
          ? (objet.champ as ChampEstimation)
          : undefined;
      setEtat({
        etape: "saisie",
        envoi: false,
        erreur:
          typeof objet.message === "string"
            ? objet.message
            : t.erreurs.generique,
        champ,
      });
    } catch {
      protection.reinitialiser();
      setEtat({ etape: "saisie", envoi: false, erreur: t.erreurs.reseau });
    }
  }

  const fils: ReactNode[] = [];

  for (const cle of ORDRE_CHOIX) {
    const question = t.questions[cle] as QuestionChoix<string>;
    const valeur = reponses[cle];
    if (valeur === undefined) {
      fils.push(
        <Apparition key={`q-${cle}`} etape={cle}>
          <Question texte={question.question} actif>
            <Choix question={question} onChoisir={(v) => choisir(cle, v)} />
          </Question>
        </Apparition>,
      );
      break;
    }
    fils.push(
      <Apparition key={`q-${cle}`}>
        <Question texte={question.question} actif={false} />
      </Apparition>,
      <Apparition key={`r-${cle}`}>
        <Reponse
          texte={libelleChoix(cle, valeur)}
          onModifier={
            etat.etape === "saisie"
              ? () => setReponses((r) => ({ ...r, [cle]: undefined }))
              : undefined
          }
        />
      </Apparition>,
    );
  }

  // Les quatre choix faits, typés comme tels : le formulaire de contact n'existe
  // qu'avec eux, et l'envoi les reçoit sans avoir à revérifier.
  const { type, equipe, outils, urgence } = reponses;
  const completes: Reponses | undefined =
    type && equipe && outils && urgence
      ? { type, equipe, outils, urgence }
      : undefined;
  const choixFaits = completes !== undefined;

  if (choixFaits) {
    const longueur = description.trim().length;
    const tropCourte = descriptionTropCourte && longueur < 20;
    fils.push(
      <Apparition key="q-description" etape="description">
        <Question texte={t.description.question} actif={!descriptionValidee}>
          {descriptionValidee ? null : (
            <form
              className="flex flex-col gap-[10px]"
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (longueur >= 20) {
                  setDescriptionTropCourte(false);
                  setDescriptionValidee(true);
                } else {
                  setDescriptionTropCourte(true);
                  document.getElementById(idDescription)?.focus();
                }
              }}
            >
              <label htmlFor={idDescription} className="sr-only">
                {t.description.libelle}
              </label>
              <textarea
                id={idDescription}
                value={description}
                onChange={(e) =>
                  setDescription(
                    e.target.value.slice(0, LONGUEUR_DESCRIPTION_MAX),
                  )
                }
                maxLength={LONGUEUR_DESCRIPTION_MAX}
                rows={7}
                aria-describedby={idAideDescription}
                aria-invalid={tropCourte ? true : undefined}
                placeholder={t.description.exemple}
                className={`${CLASSE_CHAMP} min-h-[200px] resize-y py-[14px]`}
              />
              <div className="flex items-center justify-between gap-[20px]">
                <p
                  id={idAideDescription}
                  aria-live="polite"
                  className={`m-0 whitespace-nowrap text-[12px] font-medium tabular-nums ${tropCourte ? "text-accent" : "text-foreground/65"}`}
                >
                  {longueur < 20
                    ? tropCourte
                      ? t.description.manque(20 - longueur)
                      : t.description.minimum
                    : t.description.compteur(
                        description.length,
                        LONGUEUR_DESCRIPTION_MAX,
                      )}
                </p>
                <button
                  type="submit"
                  className={CLASSE_PRINCIPAL.replace("w-full", "w-auto")}
                >
                  {t.description.valider}
                </button>
              </div>
            </form>
          )}
        </Question>
      </Apparition>,
    );
    if (descriptionValidee) {
      fils.push(
        <Apparition key="r-description">
          <Reponse
            texte={description.trim()}
            long
            onModifier={
              etat.etape === "saisie"
                ? () => setDescriptionValidee(false)
                : undefined
            }
          />
        </Apparition>,
      );
    }
  }

  if (completes && descriptionValidee) {
    if (etat.etape === "saisie") {
      fils.push(
        <Apparition key="q-contact" etape="contact">
          <Question texte={t.contact.question} actif>
            <form
              ref={refFormulaire}
              onSubmit={(e) => envoyer(e, completes)}
              onFocusCapture={protection.activer}
              className="relative flex flex-col gap-[20px]"
            >
              <p className="m-0 text-[14px] font-medium leading-[1.4] text-foreground/75">
                {t.contact.preuve}{" "}
                <Link
                  href={t.contact.cheminPreuve}
                  className="text-foreground underline decoration-white/40 underline-offset-[3px] hover:text-accent"
                >
                  {t.contact.lienPreuve}
                </Link>
              </p>
              <div className="flex flex-col gap-[10px]">
                <p
                  id={idObligatoires}
                  className="m-0 text-[12px] font-medium text-foreground/65"
                >
                  {t.contact.obligatoires}
                </p>
                <div className="grid grid-cols-2 gap-[10px]">
                  {CHAMPS_CONTACT.map((champ) => (
                    <label
                      key={champ}
                      className={`flex min-w-0 flex-col gap-[6px] ${champ === "prenom" || champ === "nom" ? "" : "col-span-2"}`}
                    >
                      <span className={CLASSE_LIBELLE}>
                        {t.contact.champs[champ]}
                      </span>
                      <input
                        name={champ}
                        type={TYPE_CHAMP[champ]}
                        autoComplete={AUTOCOMPLETE[champ]}
                        required
                        aria-describedby={
                          champEnErreur === champ ? idErreur : idObligatoires
                        }
                        value={contact[champ]}
                        aria-invalid={
                          champEnErreur === champ ? true : undefined
                        }
                        onChange={(e) =>
                          setContact((c) => ({ ...c, [champ]: e.target.value }))
                        }
                        className={`${CLASSE_CHAMP} h-[52px]`}
                      />
                    </label>
                  ))}
                </div>
              </div>
              <ChampsProtection refConteneur={protection.refConteneur} />
              {/* Région toujours montée : l'erreur et l'attente sont annoncées. */}
              <p
                id={idErreur}
                role="alert"
                className="m-0 text-[14px] font-medium text-accent"
              >
                {etat.erreur ?? ""}
              </p>
              <p role="status" className="sr-only">
                {etat.envoi ? t.contact.envoi : ""}
              </p>
              <div className="flex flex-col gap-[10px]">
                <button
                  type="submit"
                  disabled={etat.envoi}
                  className={CLASSE_PRINCIPAL}
                >
                  {etat.envoi ? t.contact.envoi : t.contact.valider}
                </button>
                <p className="m-0 text-[12px] font-medium leading-[1.4] text-foreground/65">
                  {t.contact.consentement}{" "}
                  <Link
                    href={t.contact.cheminConfidentialite}
                    className="text-foreground/80 underline decoration-white/30 underline-offset-[3px] hover:text-accent"
                  >
                    {t.contact.lienConfidentialite}
                  </Link>
                </p>
              </div>
              {/* Attente (jusqu'à une dizaine de secondes avec l'IA) : la forme
                  du résultat se dessine déjà, plutôt qu'une roue qui tourne. */}
              {etat.envoi ? (
                <div
                  aria-hidden
                  className="grid grid-cols-1 gap-[2px] tablet:grid-cols-2"
                >
                  <div className="h-[220px] animate-pulse border border-white/10 bg-surface-2 motion-reduce:animate-none" />
                  <div className="h-[220px] animate-pulse bg-accent/25 motion-reduce:animate-none" />
                </div>
              ) : null}
            </form>
          </Question>
        </Apparition>,
      );
    } else {
      fils.push(
        <Apparition key="q-contact">
          <Question texte={t.contact.question} actif={false} />
        </Apparition>,
        <Apparition key="r-contact">
          <Reponse
            texte={`${contact.prenom} ${contact.nom}, ${contact.societe}`}
          />
        </Apparition>,
        <Apparition key="resultat" etape="resultat" className="pt-[10px]">
          <Resultat
            estimation={etat.estimation}
            prenom={contact.prenom.trim()}
            onRecommencer={recommencer}
          />
        </Apparition>,
      );
    }
  }

  return (
    <ContexteMonte.Provider value={monte}>
      <ol ref={refListe} className="m-0 flex list-none flex-col gap-[20px] p-0">
        {fils}
      </ol>
    </ContexteMonte.Provider>
  );
}
