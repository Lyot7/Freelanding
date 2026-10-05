"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { capture } from "@/lib/analytics/posthog";
import { estimer } from "@/lib/simulateur/estimation";
import { lienRendezVous } from "@/content/rendez-vous";
import {
  libellesSimulateur,
  plancherEstime,
  suiviEstime,
  typesProjet,
  type IdTypeProjet,
} from "@/content/simulateur";

/**
 * LE SIMULATEUR : deux moitiés, comme le reste du site. À gauche le type de
 * projet et ses questions ; à droite le cadrage, recalculé à chaque réponse
 * et collant à partir de 810 px pour rester sous les yeux pendant qu'on
 * répond.
 *
 * UN OUTIL DE CADRAGE DEPUIS LE 2026-10-05 : le résultat affiche le plancher
 * du type, « prix au devis », et ce qui fera monter le prix selon les
 * réponses. Ni fourchette, ni délai, ni nom de forfait.
 *
 * LE PREMIER TYPE EST CHOISI D'OFFICE : la page rendue côté serveur porte donc
 * déjà un cadrage complet, lisible par un moteur comme par le visiteur
 * qui n'a encore rien coché.
 *
 * LE BOUTON ET LA MENTION SUIVENT LE PRIX, avant le détail : le panneau
 * collant dépasse la hauteur d'un écran d'ordinateur portable, et ce qui est en
 * bas ne se découvre qu'en fin de section.
 *
 * LES RÉPONSES SONT GARDÉES PAR TYPE : passer de « Site vitrine » à « Outil
 * interne » puis revenir ne fait rien perdre.
 */

type Reponses = Readonly<Record<string, string>>;

const LIBELLE = libellesSimulateur;

const ETIQUETTE =
  "text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.02em] text-white/60";

export function SimulateurPrix() {
  const [typeId, setTypeId] = useState<IdTypeProjet>(typesProjet[0].id);
  const [reponses, setReponses] = useState<Partial<Record<IdTypeProjet, Reponses>>>({});
  const signales = useRef(new Set<IdTypeProjet>());

  const type = typesProjet.find((t) => t.id === typeId) ?? typesProjet[0];
  const reponsesType = reponses[type.id] ?? {};
  const estimation = estimer(type, reponsesType);

  /* UNE MESURE PAR TYPE TERMINÉ, et une seule : changer une réponse ensuite
     ne compte pas un second simulateur rempli. */
  useEffect(() => {
    if (estimation.restantes > 0 || signales.current.has(type.id)) return;
    signales.current.add(type.id);
    capture(ANALYTICS_EVENTS.simulatorCompleted, {
      type: type.id,
      nb_facteurs: estimation.facteurs.length,
    });
  }, [estimation.restantes, estimation.facteurs.length, type.id]);

  const repondre = (questionId: string, optionId: string) =>
    setReponses((r) => ({ ...r, [type.id]: { ...r[type.id], [questionId]: optionId } }));

  const effacer = () => setReponses((r) => ({ ...r, [type.id]: {} }));

  return (
    <section
      id="simulateur"
      data-section="simulateur"
      className="relative scroll-mt-[100px] bg-background px-[20px] py-[60px] text-foreground tablet:px-[24px] tablet:py-[90px] desktop:px-[30px]"
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-1/2 hidden w-px bg-white/10 tablet:block"
      />
      <div className="relative mx-auto grid w-full max-w-[1440px] gap-[40px] tablet:grid-cols-2 tablet:gap-x-0">
        <div className="flex min-w-0 flex-col gap-[36px] tablet:pr-[30px] desktop:pr-[40px]">
          <h2 className="accent-room text-[26px] font-semibold uppercase leading-[0.95] tracking-[-0.04em] tablet:text-[34px]">
            {LIBELLE.titre}
          </h2>

          <fieldset className="flex flex-col gap-[14px]">
            <legend className={`${ETIQUETTE} mb-[14px]`}>{LIBELLE.legendeType}</legend>
            <div className="grid grid-cols-1 gap-[10px] desktop:grid-cols-2">
              {typesProjet.map((t) => (
                <label
                  key={t.id}
                  className="group relative flex cursor-pointer flex-col gap-[4px] px-[16px] py-[14px] ring-1 ring-inset ring-white/30 transition-colors duration-200 hover:ring-white/40 has-[:checked]:bg-white/[0.06] has-[:checked]:ring-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent motion-reduce:transition-none"
                >
                  <input
                    type="radio"
                    name="type-projet"
                    value={t.id}
                    checked={t.id === type.id}
                    onChange={() => setTypeId(t.id)}
                    className="sr-only"
                  />
                  <span className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em]">
                    {t.libelle}
                  </span>
                  <span className="text-[13px] font-medium leading-[1.35] tracking-[-0.01em] text-white/60">
                    {t.accroche}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-[6px]">
            <p className={ETIQUETTE}>{LIBELLE.legendeQuestions}</p>
            <ol className="flex flex-col">
              {type.questions.map((question, index) => (
                <li key={`${type.id}-${question.id}`} className="border-t border-white/10 py-[18px]">
                  <div className="grid grid-cols-[32px_1fr] gap-x-[10px]">
                    <span aria-hidden className="pt-[2px] text-[12px] font-medium leading-[1.2] tracking-[-0.01em] text-white/50">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex min-w-0 flex-col gap-[12px]">
                      <p
                        id={`q-${type.id}-${question.id}`}
                        className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em]"
                      >
                        {question.intitule}
                      </p>
                      <div
                        role="radiogroup"
                        aria-labelledby={`q-${type.id}-${question.id}`}
                        className="flex flex-wrap gap-[8px]"
                      >
                        {question.options.map((option) => (
                          <label
                            key={option.id}
                            className="cursor-pointer px-[12px] py-[8px] text-[14px] font-medium leading-[1.3] tracking-[-0.01em] text-white/80 ring-1 ring-inset ring-white/30 transition-colors duration-200 hover:ring-white/50 has-[:checked]:bg-accent has-[:checked]:text-background has-[:checked]:ring-accent has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent motion-reduce:transition-none"
                          >
                            <input
                              type="radio"
                              name={`${type.id}-${question.id}`}
                              value={option.id}
                              checked={reponsesType[question.id] === option.id}
                              onChange={() => repondre(question.id, option.id)}
                              className="sr-only"
                            />
                            {option.libelle}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="min-w-0 tablet:pl-[30px] desktop:pl-[40px]">
          <div className="flex flex-col gap-[22px] bg-muted px-[20px] py-[26px] text-background tablet:sticky tablet:top-[100px] tablet:max-h-[calc(100svh-120px)] tablet:overflow-y-auto tablet:px-[28px] tablet:py-[32px]">
            <p className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.02em] text-background/60">
              {LIBELLE.eyebrowResultat(type.libelle)}
            </p>

            <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-[6px]">
              <p className="text-[12px] font-semibold uppercase leading-[1.2] tracking-[0.02em] text-background/60">
                {LIBELLE.libellePrix}
              </p>
              <p className="text-[30px] font-semibold leading-[1.05] tracking-[-0.04em] desktop:text-[40px]">
                {plancherEstime(type.offre)}
              </p>
              <p className="text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-background/70">
                {LIBELLE.prixAuDevis}
              </p>
              {estimation.restantes > 0 ? (
                <p className="text-[13px] font-medium leading-[1.4] tracking-[-0.01em] text-background/60">
                  {LIBELLE.restantes(estimation.restantes)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-[14px]">
              <div className="flex flex-wrap items-center gap-x-[20px] gap-y-[10px]">
                <Link
                  href={lienRendezVous(type.rdv)}
                  data-cta="true"
                  data-cta-id={`simulateur-${type.id}`}
                  className="flex h-[36px] w-fit flex-none items-center justify-center bg-accent px-[14px] text-[12px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-background no-underline transition-opacity duration-200 hover:opacity-80 motion-reduce:transition-none"
                >
                  <span className="accent-room">{LIBELLE.cta}</span>
                </Link>
                {Object.keys(reponsesType).length > 0 ? (
                  <button
                    type="button"
                    onClick={effacer}
                    className="text-[13px] font-medium leading-[1.3] tracking-[-0.01em] text-background/70 underline decoration-black/25 underline-offset-[3px] transition-colors duration-200 hover:decoration-black"
                  >
                    {LIBELLE.recommencer}
                  </button>
                ) : null}
              </div>
              <p className="text-[13px] font-medium leading-[1.4] tracking-[-0.01em] text-background/65">
                {LIBELLE.mention}
              </p>
            </div>
            <ListeResultat
              titre={LIBELLE.libelleFacteurs}
              lignes={estimation.facteurs}
              vide={LIBELLE.aucunFacteur}
              annoncee
            />
            <ListeResultat titre={LIBELLE.libelleInclus} lignes={type.offre.inclus} />

            <div className="flex flex-col gap-[8px] border-t border-black/[0.08] pt-[18px]">
              <p className="text-[14px] font-semibold leading-[1.3] tracking-[-0.01em]">
                {LIBELLE.libelleHorsForfait}
              </p>
              {estimation.horsForfait.map((note) => (
                <p
                  key={note}
                  className="text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-background/75"
                >
                  {note}
                </p>
              ))}
              <p className="text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-background/75">
                {LIBELLE.libelleSuivi} {suiviEstime(type.offre)}
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Une liste du résultat, sous un filet : ce qui fera monter le prix, puis ce
 * qui est compris dès le plancher. `vide` s'affiche quand la liste l'est.
 * `annoncee` : la liste change à chaque réponse, un lecteur d'écran l'annonce.
 */
function ListeResultat({
  titre,
  lignes,
  vide,
  annoncee = false,
}: {
  titre: string;
  lignes: readonly string[];
  vide?: string;
  annoncee?: boolean;
}) {
  return (
    <div
      aria-live={annoncee ? "polite" : undefined}
      className="flex flex-col gap-[10px] border-t border-black/[0.08] pt-[18px]"
    >
      <p className="text-[14px] font-semibold leading-[1.3] tracking-[-0.01em]">{titre}</p>
      {lignes.length === 0 && vide ? (
        <p className="text-[14px] font-medium leading-[1.4] tracking-[-0.01em] text-background/60">
          {vide}
        </p>
      ) : (
        <ul className="flex flex-col gap-[8px]">
          {lignes.map((ligne) => (
            <li
              key={ligne}
              className="text-[14px] font-medium leading-[1.35] tracking-[-0.01em] text-background/75"
            >
              {ligne}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
