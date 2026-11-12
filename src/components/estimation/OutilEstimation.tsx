"use client";

/**
 * Outil de chiffrage façon conversation limitée : Eliott pose quatre questions
 * à boutons, demande une description, puis les coordonnées, et affiche la
 * fourchette (achat direct et abonnement côte à côte).
 *
 * UN SEUL ENVOI AU SERVEUR, à la fin : rien ne part tant que le visiteur n'a
 * pas laissé son contact et coché le consentement. Le calcul est fait côté
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
  "w-full border border-white/30 bg-white/[0.04] px-[16px] text-[16px] font-medium leading-[1.3] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/40 hover:border-white/55 focus:border-accent focus:outline-none tablet:text-[15px] motion-reduce:transition-none";
const CLASSE_PRINCIPAL =
  "flex h-[56px] w-full items-center justify-center gap-[10px] bg-accent px-[28px] text-[13px] font-semibold uppercase leading-[1.2] tracking-[0.01em] text-accent-ink transition-[opacity,transform] duration-150 ease-out active:scale-[0.98] disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none tablet:w-fit";

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
      <span className="text-[18px] font-semibold leading-[1.15] tracking-[-0.02em] tabular-nums">
        {f.haut === undefined ? `${r.aPartirDe} ` : null}
        {euros(f.bas)}
        {f.haut === undefined ? null : (
          <>
            <span className="px-[0.3em] text-[0.8em] font-medium opacity-60">
              {r.a}
            </span>
            {euros(f.haut)}
          </>
        )}
        &nbsp;€
        <span className="ml-[6px] text-[13px] font-medium opacity-70">
          {unite}
        </span>
      </span>
    );
  }
  const ligne = "flex items-baseline gap-[0.22em]";
  const chiffre =
    "text-[clamp(44px,13vw,64px)] font-black leading-[0.9] tracking-[-0.05em] tabular-nums";
  const mot =
    "w-[1.3em] flex-none text-[15px] font-semibold tracking-[-0.01em] opacity-60";
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
      <span className="pl-[calc(1.3em+0.22em)] text-[13px] font-semibold uppercase tracking-[0.02em] opacity-70">
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
const ContexteMonte = createContext<{ readonly current: boolean }>({ current: false });

function Apparition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduit = useReducedMotion();
  const monte = useContext(ContexteMonte);
  const [animer] = useState(() => monte.current);
  return (
    <motion.li
      className={className}
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
  useEffect(() => {
    if (actif) ref.current?.focus({ preventScroll: true });
  }, [actif]);
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-start gap-[12px]">
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
          className="m-0 text-[19px] font-medium leading-[1.25] tracking-[-0.02em] text-foreground outline-none tablet:text-[22px]"
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
}: {
  texte: string;
  onModifier?: () => void;
}) {
  return (
    <div className="flex items-end justify-end gap-[12px] pl-[48px]">
      {onModifier ? (
        <button
          type="button"
          onClick={onModifier}
          className="min-h-[32px] flex-none text-[13px] font-medium text-foreground/45 underline decoration-white/20 underline-offset-[3px] transition-colors hover:text-accent hover:decoration-accent motion-reduce:transition-none"
        >
          {t.modifier}
        </button>
      ) : null}
      <p className="m-0 min-w-0 whitespace-pre-line break-words border border-accent/40 bg-accent/[0.08] px-[16px] py-[12px] text-[15px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground">
        {texte}
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
      className="grid grid-cols-1 gap-[8px] tablet:grid-cols-2"
    >
      {question.options.map((option, i) => (
        <button
          key={option.valeur}
          type="button"
          onClick={() => onChoisir(option.valeur)}
          className="group flex min-h-[56px] items-center gap-[14px] border border-white/20 bg-white/[0.02] px-[16px] py-[12px] text-left text-[15px] font-medium leading-[1.25] tracking-[-0.01em] text-foreground transition-[border-color,background-color,transform] duration-150 ease-out hover:border-accent hover:bg-accent/[0.06] active:scale-[0.985] motion-reduce:transition-none"
        >
          <span className="flex-none text-[12px] font-semibold tabular-nums text-foreground/45 transition-colors group-hover:text-accent motion-reduce:transition-none">
            {String(i + 1).padStart(2, "0")}
          </span>
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
  source,
  onRecommencer,
}: {
  estimation: Estimation;
  prenom: string;
  source: "ia" | "boutons";
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

  return (
    <div className="flex flex-col gap-[28px]">
      <div className="flex flex-col gap-[10px]">
        <p
          ref={refIntro}
          tabIndex={-1}
          className="m-0 text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] text-foreground outline-none tablet:text-[30px]"
        >
          {r.intro(prenom)}
        </p>
        <p className="m-0 flex items-start gap-[10px] text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-foreground/75">
          <span
            aria-hidden
            className="mt-[6px] size-[7px] flex-none bg-accent"
          />
          {r.avertissement}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-[2px] tablet:grid-cols-2">
        {/* ACHAT DIRECT : surface sombre, chiffre en blanc. */}
        <section
          aria-labelledby="achat"
          className="flex flex-col gap-[22px] border border-white/15 bg-surface-2 p-[22px] tablet:p-[28px]"
        >
          <div className="flex flex-col gap-[4px]">
            <h2
              id="achat"
              className="m-0 text-[13px] font-semibold uppercase tracking-[0.02em] text-foreground"
            >
              {r.achat.titre}
            </h2>
            <p className="m-0 text-[14px] font-medium leading-[1.3] text-foreground/60">
              {r.achat.sousTitre}
            </p>
          </div>
          <p className="m-0 text-foreground">
            <Montant f={estimation.prix} taille="grand" unite={r.ht} />
          </p>
          <div className="mt-auto flex flex-col gap-[4px] border-t border-white/12 pt-[16px]">
            <p className={CLASSE_LIBELLE}>{r.achat.maintenance}</p>
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
          className="flex flex-col gap-[22px] bg-accent p-[22px] text-accent-ink tablet:p-[28px]"
        >
          <div className="flex flex-wrap items-start justify-between gap-[14px]">
            <div className="flex flex-col gap-[4px]">
              <h2
                id="abonnement"
                className="m-0 text-[13px] font-semibold uppercase tracking-[0.02em]"
              >
                {r.abonnement.titre}
              </h2>
              <p className="m-0 text-[14px] font-medium leading-[1.3] opacity-75">
                {r.abonnement.sousTitre}
              </p>
            </div>
            <div
              role="radiogroup"
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
                  role="radio"
                  aria-checked={duree === i}
                  onClick={() => setDuree(i === 0 ? 0 : 1)}
                  className="min-h-[36px] min-w-[64px] px-[12px] text-[12px] font-semibold uppercase tracking-[0.02em] transition-colors aria-checked:bg-accent-ink aria-checked:text-accent motion-reduce:transition-none"
                >
                  {r.abonnement.engagement(a.duree)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-[2px]">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.02em] opacity-70">
              {r.abonnement.miseEnRoute}
            </p>
            <p className="m-0">
              <Montant f={abonnement.miseEnRoute} taille="petit" unite={r.ht} />
            </p>
          </div>
          <div className="flex flex-col gap-[6px]">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.02em] opacity-70">
              {r.abonnement.mensualite(abonnement.duree)}
            </p>
            {/* Changer la durée change le chiffre : un fondu court avec un
                léger flou fait lire une transformation, pas un remplacement. */}
            <motion.p
              key={abonnement.duree}
              className="m-0"
              initial={{ opacity: 0.4, filter: "blur(3px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.2, ease: EASE_OUT }}
            >
              <Montant
                f={abonnement.mensualite}
                taille="grand"
                unite={r.abonnement.parMois}
              />
            </motion.p>
          </div>
          <div className="mt-auto flex flex-col gap-[2px] border-t border-accent-ink/25 pt-[16px]">
            <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.02em] opacity-70">
              {r.abonnement.apres(abonnement.duree)}
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

      {estimation.grandProjet ? (
        <p className="m-0 text-[14px] font-medium leading-[1.4] text-foreground/75">
          {r.grandProjet}
        </p>
      ) : source === "boutons" ? (
        <p className="m-0 text-[14px] font-medium leading-[1.4] text-foreground/75">
          {r.sourceBoutons}
        </p>
      ) : null}

      <div className="flex flex-col gap-[14px] tablet:flex-row tablet:items-center tablet:gap-[24px]">
        <Link
          href={lienRendezVous(estimation.type)}
          className={`${CLASSE_PRINCIPAL} no-underline`}
        >
          {r.rendezVous}
          <span aria-hidden>→</span>
        </Link>
        <p className="m-0 text-[13px] font-medium text-foreground/60">
          {r.rendezVousNote}
        </p>
      </div>
      <button
        type="button"
        onClick={onRecommencer}
        className="w-fit min-h-[44px] text-[12px] font-medium uppercase tracking-[0.02em] text-foreground/55 transition-colors hover:text-accent motion-reduce:transition-none"
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

function libelleChoix(cle: CleChoix, valeur: string): string {
  const q = t.questions[cle] as QuestionChoix<string>;
  return q.options.find((o) => o.valeur === valeur)?.libelle ?? valeur;
}

export function OutilEstimation() {
  const [reponses, setReponses] = useState<ReponsesPartielles>({});
  const [description, setDescription] = useState("");
  const [descriptionValidee, setDescriptionValidee] = useState(false);
  const [contact, setContact] = useState<Coordonnees>(CONTACT_VIDE);
  const [consentement, setConsentement] = useState(false);
  const [etat, setEtat] = useState<Etat>({ etape: "saisie", envoi: false });
  const debut = useRef(0);
  const refFin = useRef<HTMLDivElement | null>(null);
  const protection = useProtectionTurnstile();
  const reduit = useReducedMotion();
  const idDescription = useId();
  const idErreur = useId();

  const monte = useRef(false);
  useEffect(() => {
    debut.current = Date.now();
    monte.current = true;
  }, []);

  const courant: CleChoix | "description" | "contact" =
    ORDRE_CHOIX.find((cle) => reponses[cle] === undefined) ??
    (descriptionValidee ? "contact" : "description");

  // Chaque nouvelle question remonte dans le champ de vision.
  const etapeVisible = etat.etape === "resultat" ? "resultat" : courant;
  const premierRendu = useRef(true);
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    refFin.current?.scrollIntoView({
      behavior: reduit ? "auto" : "smooth",
      block: "nearest",
    });
  }, [etapeVisible, reduit]);

  const choisir = useCallback((cle: CleChoix, valeur: string) => {
    setReponses((r) => ({ ...r, [cle]: valeur }));
  }, []);

  const recommencer = useCallback(() => {
    setReponses({});
    setDescription("");
    setDescriptionValidee(false);
    setConsentement(false);
    setEtat({ etape: "saisie", envoi: false });
    protection.reinitialiser();
    window.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
  }, [protection, reduit]);

  async function envoyer(evenement: FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    if (etat.etape !== "saisie" || etat.envoi) return;
    const { type, equipe, outils, urgence } = reponses;
    if (!type || !equipe || !outils || !urgence) return;
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
          consentement,
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
      const champ =
        typeof objet.champ === "string"
          ? (objet.champ as ChampEstimation)
          : undefined;
      if (champ === "description") setDescriptionValidee(false);
      if (champ && (ORDRE_CHOIX as readonly string[]).includes(champ)) {
        setReponses((r) => ({ ...r, [champ]: undefined }));
      }
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
        <Apparition key={`q-${cle}`}>
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

  const choixFaits = ORDRE_CHOIX.every((cle) => reponses[cle] !== undefined);

  if (choixFaits) {
    const longueur = description.trim().length;
    fils.push(
      <Apparition key="q-description">
        <Question texte={t.description.question} actif={!descriptionValidee}>
          {descriptionValidee ? null : (
            <form
              className="flex flex-col gap-[12px]"
              onSubmit={(e) => {
                e.preventDefault();
                if (longueur >= 20) setDescriptionValidee(true);
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
                placeholder={t.description.exemple}
                className={`${CLASSE_CHAMP} min-h-[200px] resize-y py-[14px]`}
              />
              <div className="flex items-center justify-between gap-[16px]">
                <p
                  aria-live="polite"
                  className="m-0 whitespace-nowrap text-[12px] font-medium tabular-nums text-foreground/50"
                >
                  {t.description.compteur(
                    description.length,
                    LONGUEUR_DESCRIPTION_MAX,
                  )}
                </p>
                <button
                  type="submit"
                  disabled={longueur < 20}
                  className={`${CLASSE_PRINCIPAL.replace("w-full", "w-auto")} disabled:cursor-not-allowed disabled:opacity-35`}
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

  if (choixFaits && descriptionValidee) {
    const champEnErreur = etat.etape === "saisie" ? etat.champ : undefined;
    if (etat.etape === "saisie") {
      fils.push(
        <Apparition key="q-contact">
          <Question texte={t.contact.question} actif>
            <form
              noValidate={false}
              onSubmit={envoyer}
              onFocusCapture={protection.activer}
              aria-describedby={etat.erreur ? idErreur : undefined}
              className="relative flex flex-col gap-[16px]"
            >
              <div className="grid grid-cols-2 gap-[12px]">
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
                      value={contact[champ]}
                      aria-invalid={champEnErreur === champ ? true : undefined}
                      onChange={(e) =>
                        setContact((c) => ({ ...c, [champ]: e.target.value }))
                      }
                      className={`${CLASSE_CHAMP} h-[52px] aria-invalid:border-red-400`}
                    />
                  </label>
                ))}
              </div>
              <label className="flex items-start gap-[12px] text-[13px] font-medium leading-[1.4] text-foreground/75">
                <span className="relative mt-[1px] flex size-[20px] flex-none">
                  <input
                    type="checkbox"
                    required
                    checked={consentement}
                    onChange={(e) => setConsentement(e.target.checked)}
                    aria-invalid={
                      champEnErreur === "consentement" ? true : undefined
                    }
                    className="peer size-[20px] cursor-pointer appearance-none border border-white/50 bg-transparent transition-colors checked:border-accent checked:bg-accent motion-reduce:transition-none"
                  />
                  <svg
                    aria-hidden
                    viewBox="0 0 20 20"
                    className="pointer-events-none absolute inset-0 hidden size-[20px] text-accent-ink peer-checked:block"
                  >
                    <path
                      d="M5 10.5l3.2 3L15 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    />
                  </svg>
                </span>
                <span>
                  {t.contact.consentement}{" "}
                  <Link
                    href={t.contact.cheminConfidentialite}
                    className="text-foreground underline underline-offset-[3px] hover:text-accent"
                  >
                    {t.contact.lienConfidentialite}
                  </Link>
                </span>
              </label>
              <ChampsProtection refConteneur={protection.refConteneur} />
              {etat.erreur ? (
                <p
                  id={idErreur}
                  role="alert"
                  className="m-0 text-[14px] font-medium text-red-300"
                >
                  {etat.erreur}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={etat.envoi}
                className={CLASSE_PRINCIPAL}
              >
                {etat.envoi ? t.contact.envoi : t.contact.valider}
              </button>
              {/* Attente (jusqu'à une dizaine de secondes avec l'IA) : la forme
                  du résultat se dessine déjà, plutôt qu'une roue qui tourne. */}
              {etat.envoi ? (
                <div
                  aria-hidden
                  className="grid grid-cols-1 gap-[2px] pt-[12px] tablet:grid-cols-2"
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
        <Apparition key="resultat" className="pt-[12px]">
          <Resultat
            estimation={etat.estimation}
            prenom={contact.prenom.trim()}
            source={etat.source}
            onRecommencer={recommencer}
          />
        </Apparition>,
      );
    }
  }

  return (
    <ContexteMonte.Provider value={monte}>
      <div className="flex flex-col">
        <ol className="m-0 flex list-none flex-col gap-[22px] p-0">{fils}</ol>
        <div ref={refFin} aria-hidden className="h-px scroll-mb-[40px]" />
      </div>
    </ContexteMonte.Provider>
  );
}
