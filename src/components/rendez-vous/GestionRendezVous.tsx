"use client";

/**
 * Actions de la page `/rdv/gerer/[jeton]` : annuler (motif facultatif) ou
 * déplacer un rendez-vous confirmé.
 *
 * AUCUN NOUVEAU DESSIN : le calendrier et la colonne des heures sont ceux du
 * formulaire de réservation (`Calendrier`, `Heures`), avec ses classes. Les
 * créneaux viennent de `/api/rendez-vous/gestion/[jeton]/creneaux`, qui rend
 * la même forme que la route du formulaire, au type et à la durée du
 * rendez-vous.
 *
 * APRÈS UN DÉPLACEMENT, le cockpit rend un jeton neuf : l'adresse est
 * remplacée (`router.replace`) pour que la page rechargée ou mise en favori
 * gère le bon rendez-vous, et le message de succès reste affiché.
 */
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { MessageEtat } from "@/components/forms/ProtectionFormulaire";
import type { EtatEnvoi } from "@/components/forms/useEnvoiFormulaire";
import { MESSAGE_RESEAU } from "@/components/rendez-vous/messages";
import {
  Calendrier,
  CLASSE_BOUTON_PRINCIPAL,
  CLASSE_BOUTON_SECONDAIRE,
  CLASSE_LIBELLE,
  CLASSE_TEXTE,
  Heures,
} from "@/components/rendez-vous/ReservationRendezVous";
import { Spinner } from "@/components/ui";
import { rendezVousContent } from "@/content/rendez-vous";
import { ajouterMois, lireReponseCreneaux } from "@/lib/rendez-vous/creneaux";
import type { Creneau, ReponseCreneaux } from "@/lib/rendez-vous/creneaux";

const contenu = rendezVousContent;
const gestion = contenu.gestion;

type Mode = "choix" | "annuler" | "deplacer" | "annule" | "deplace";

interface ResultatCreneaux {
  readonly cle: string;
  readonly etat: "aucune" | "reseau";
  readonly donnees?: ReponseCreneaux;
}

function lireMessage(charge: unknown): string | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const message = (charge as Record<string, unknown>).message;
  return typeof message === "string" ? message : undefined;
}

function lireJeton(charge: unknown): string | undefined {
  if (typeof charge !== "object" || charge === null) return undefined;
  const jeton = (charge as Record<string, unknown>).jeton;
  return typeof jeton === "string" && /^[\w-]{43}$/.test(jeton) ? jeton : undefined;
}

async function envoyer(url: string, corps: Record<string, unknown>): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(corps),
  });
}

export function GestionRendezVous({ jeton }: { jeton: string }) {
  const router = useRouter();
  const instance = `gestion${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [mode, setMode] = useState<Mode>("choix");
  const [motif, setMotif] = useState("");
  const [etatEnvoi, setEtatEnvoi] = useState<EtatEnvoi>("repos");
  const [messageEnvoi, setMessageEnvoi] = useState("");
  const [creneau, setCreneau] = useState<Creneau | undefined>(undefined);
  const [resumeDeplace, setResumeDeplace] = useState<string | undefined>(undefined);
  const [mois, setMois] = useState("");
  const [jourChoisi, setJourChoisi] = useState("");
  const [tentative, setTentative] = useState(0);
  const [resultat, setResultat] = useState<ResultatCreneaux>({ cle: "", etat: "aucune" });

  const base = `/api/rendez-vous/gestion/${encodeURIComponent(jeton)}`;
  const cle = mode === "deplacer" ? `${mois}|${tentative}` : "";
  const chargement = mode === "deplacer" && resultat.cle !== cle;
  const donnees = resultat.donnees;
  const jourActif = donnees?.jours.find((jour) => jour.jour === jourChoisi) ?? donnees?.jours[0];

  // Même mécanique que le formulaire : la clef de la question posée est
  // rangée avec la réponse, le chargement s'en déduit.
  useEffect(() => {
    if (mode !== "deplacer") return;
    const controleur = new AbortController();
    const parametres = new URLSearchParams();
    if (mois) parametres.set("mois", mois);
    fetch(`${base}/creneaux?${parametres.toString()}`, { signal: controleur.signal })
      .then(async (reponse) => {
        if (!reponse.ok) throw new Error(String(reponse.status));
        const charge = lireReponseCreneaux(await reponse.json());
        if (!charge) throw new Error("charge_illisible");
        setResultat({ cle, etat: "aucune", donnees: charge });
      })
      .catch(() => {
        if (controleur.signal.aborted) return;
        setResultat((precedent) => ({ ...precedent, cle, etat: "reseau" }));
      });
    return () => controleur.abort();
  }, [mode, mois, base, cle]);

  const refTitre = useRef<HTMLParagraphElement | null>(null);
  useEffect(() => {
    if (mode === "annule" || mode === "deplace") refTitre.current?.focus();
  }, [mode]);

  function changerMode(suivant: Mode) {
    setMode(suivant);
    setEtatEnvoi("repos");
    setMessageEnvoi("");
  }

  async function confirmer() {
    if (etatEnvoi === "envoi") return;
    setEtatEnvoi("envoi");
    setMessageEnvoi("");
    try {
      const reponse =
        mode === "annuler"
          ? await envoyer(`${base}/annuler`, motif.trim() ? { motif: motif.trim() } : {})
          : await envoyer(`${base}/deplacer`, { debut: creneau?.debut });
      const charge: unknown = await reponse.json().catch(() => undefined);
      if (!reponse.ok) {
        setEtatEnvoi("erreur");
        setMessageEnvoi(lireMessage(charge) ?? gestion.etats.indisponible.texte);
        // Créneau pris entre-temps : la liste est rechargée, le choix retiré.
        if (reponse.status === 409 && mode === "deplacer") {
          setCreneau(undefined);
          setTentative((valeur) => valeur + 1);
        }
        return;
      }
      setEtatEnvoi("succes");
      if (mode === "annuler") {
        changerMode("annule");
        return;
      }
      setResumeDeplace(creneau?.resume);
      changerMode("deplace");
      const nouveau = lireJeton(charge);
      if (nouveau) router.replace(`/rdv/gerer/${nouveau}`);
    } catch {
      setEtatEnvoi("erreur");
      setMessageEnvoi(MESSAGE_RESEAU);
    }
  }

  if (mode === "annule" || mode === "deplace") {
    const succes = mode === "annule" ? gestion.succes.annule : gestion.succes.deplace;
    return (
      <div className="flex flex-col gap-[16px] border border-accent bg-accent/[0.07] p-[20px]">
        <p
          ref={refTitre}
          tabIndex={-1}
          className="text-[22px] font-medium leading-[1.1] tracking-[-0.02em] text-foreground outline-none"
        >
          {succes.titre}
        </p>
        {mode === "deplace" && resumeDeplace ? (
          <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
            {resumeDeplace}
          </p>
        ) : null}
        <p className={CLASSE_TEXTE}>{succes.texte}</p>
      </div>
    );
  }

  const envoiEnCours = etatEnvoi === "envoi";

  return (
    <div className="flex flex-col gap-[24px]">
      {mode === "choix" ? (
        <div className="flex flex-col gap-[12px] tablet:flex-row">
          <button type="button" className={CLASSE_BOUTON_PRINCIPAL} onClick={() => changerMode("deplacer")}>
            {gestion.actions.deplacer}
          </button>
          <button
            type="button"
            className="flex h-[52px] w-full items-center justify-center border border-border px-[28px] text-[13px] font-semibold uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none tablet:w-fit"
            onClick={() => changerMode("annuler")}
          >
            {gestion.actions.annuler}
          </button>
        </div>
      ) : null}

      {mode === "annuler" ? (
        <div className="flex flex-col gap-[16px]">
          <label htmlFor={`${instance}-motif`} className={CLASSE_LIBELLE}>
            {gestion.motif.libelle}
          </label>
          <textarea
            id={`${instance}-motif`}
            name="motif"
            maxLength={1000}
            value={motif}
            onChange={(evenement) => setMotif(evenement.target.value)}
            aria-describedby={`${instance}-motif-aide`}
            className="min-h-[90px] w-full resize-y border border-white/25 bg-white/[0.04] p-[16px] text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground transition-colors placeholder:text-white/45 hover:border-white/45 focus:border-accent tablet:text-[15px]"
          />
          <p id={`${instance}-motif-aide`} className={CLASSE_TEXTE}>
            {gestion.motif.aide}
          </p>
          <button type="button" className={CLASSE_BOUTON_PRINCIPAL} disabled={envoiEnCours} onClick={confirmer}>
            {envoiEnCours ? <Spinner size="sm" label={gestion.actions.confirmerAnnulation} /> : gestion.actions.confirmerAnnulation}
          </button>
        </div>
      ) : null}

      {mode === "deplacer" ? (
        <div className="flex flex-col gap-[24px]">
          <p className={CLASSE_LIBELLE}>{gestion.choisirCreneau}</p>

          {resultat.cle === cle && resultat.etat === "reseau" ? (
            <div className="flex flex-col items-start gap-[12px]">
              <p className={CLASSE_TEXTE}>{contenu.creneaux.erreur}</p>
              <button
                type="button"
                onClick={() => setTentative((valeur) => valeur + 1)}
                className="min-h-[44px] border border-border px-[16px] text-[13px] font-medium uppercase leading-[1.2] tracking-[-0.01em] text-foreground transition-colors hover:border-accent hover:text-accent motion-reduce:transition-none"
              >
                {contenu.actions.reessayer}
              </button>
            </div>
          ) : null}

          {chargement && !donnees ? (
            <div className="flex min-h-[320px] items-center gap-[10px]">
              <Spinner size="sm" label={contenu.creneaux.chargement} />
              <span aria-hidden className={CLASSE_LIBELLE}>
                {contenu.creneaux.chargement}
              </span>
            </div>
          ) : null}

          {donnees ? (
            <div className="grid grid-cols-1 gap-[28px] desktop:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
              <Calendrier
                donnees={donnees}
                jourActif={jourActif}
                chargement={chargement}
                onChoisirJour={setJourChoisi}
                onDecaler={(decalage) => {
                  setMois(ajouterMois(donnees.fenetre.mois, decalage));
                  setJourChoisi("");
                }}
              />
              {jourActif ? (
                <div
                  className={`transition-opacity motion-reduce:transition-none desktop:min-h-[300px] ${
                    chargement ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <Heures jour={jourActif} choisi={creneau} onChoisir={setCreneau} />
                </div>
              ) : (
                <p className={`${CLASSE_TEXTE} desktop:pt-[50px]`}>{contenu.creneaux.vide}</p>
              )}
            </div>
          ) : null}

          <p className={CLASSE_LIBELLE}>{contenu.noteFuseau}</p>

          {creneau ? (
            <div className="flex flex-col gap-[12px]">
              <p className="text-[16px] font-medium leading-[1.2] tracking-[-0.01em] text-foreground">
                {creneau.resume}
              </p>
              <button type="button" className={CLASSE_BOUTON_PRINCIPAL} disabled={envoiEnCours} onClick={confirmer}>
                {envoiEnCours ? <Spinner size="sm" label={gestion.actions.confirmerDeplacement} /> : gestion.actions.confirmerDeplacement}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode !== "choix" ? (
        <div>
          <button type="button" className={CLASSE_BOUTON_SECONDAIRE} onClick={() => changerMode("choix")}>
            {gestion.actions.retour}
          </button>
        </div>
      ) : null}

      <MessageEtat etat={etatEnvoi} message={messageEnvoi} ton="clair" className="max-w-[420px]" />
    </div>
  );
}
