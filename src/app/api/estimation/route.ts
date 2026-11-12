/**
 * `POST /api/estimation` — l'outil de chiffrage de `/estimation`.
 *
 * Un seul appel par estimation : le navigateur envoie les réponses, la
 * description et les coordonnées ensemble, et reçoit la fourchette. Le
 * visiteur ne voit le résultat qu'après avoir laissé son contact, qui part au
 * cockpit comme fiche entrante.
 *
 * ORDRE DES CONTRÔLES, du moins cher au plus cher (même logique que
 * `/api/contact`) : origine → type de contenu → débit par adresse → corps →
 * captcha → extraction IA (une seule, sous plafond journalier) → calcul →
 * cockpit. Le débit passe avant le captcha pour ne pas faire payer le quota
 * Cloudflare aux robots, et le captcha avant l'IA pour ne jamais la faire
 * tourner pour un robot.
 *
 * LE VISITEUR A SA FOURCHETTE MÊME SI LE COCKPIT TOMBE : le contact part alors
 * par mail à Eliott, et l'échec est journalisé. Seul le cas où rien n'a pu
 * être transmis nulle part est signalé à part dans le journal.
 */
import { creerJournal, empreinte, json, origineEtrangere } from "@/lib/api/reponse";
import { envoyerAuCockpit } from "@/lib/chiffrage/cockpit";
import type { EnvoiEstimation, SourceComposants } from "@/lib/chiffrage/cockpit";
import { creerCompteur, extraire } from "@/lib/chiffrage/extraction";
import { composantsParDefaut, estimer, indicesTexte } from "@/lib/chiffrage/grille";
import type { Composants } from "@/lib/chiffrage/grille";
import { messageSecours } from "@/lib/chiffrage/recap";
import { validerDemande } from "@/lib/chiffrage/validation";
import { resoudreVerificateur } from "@/lib/contact/captcha";
import { resoudreExpediteur } from "@/lib/contact/mailer";
import { adresseAppelante, creerLimiteur } from "@/lib/contact/rate-limit";
import { estimationContent } from "@/content/estimation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const journaliser = creerJournal("estimation");

/** Cinq estimations par adresse et par jour : de quoi corriger une réponse. */
const limiteur = creerLimiteur({
  fenetreMs: 24 * 60 * 60 * 1000,
  maxParFenetre: 5,
  maxCles: 5_000,
});

/** Plafond global des appels d'IA, pour tout le site (voir `extraction.ts`). */
const compteurIA = creerCompteur();

const erreurs = estimationContent.erreurs;

export async function POST(requete: Request): Promise<Response> {
  if (origineEtrangere(requete)) return json({ message: erreurs.generique }, 403);

  const typeContenu = requete.headers.get("content-type") ?? "";
  if (!typeContenu.toLowerCase().includes("application/json")) {
    return json({ message: erreurs.generique }, 415);
  }

  const adresse = adresseAppelante(requete.headers);
  const limite = limiteur.verifier(adresse);
  if (!limite.autorise) {
    journaliser("debit_depasse", { appelant: empreinte(adresse) });
    return json({ message: erreurs.debit }, 429, { "retry-after": String(limite.reessayerDansS) });
  }

  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return json({ message: erreurs.generique }, 400);
  }

  const validation = validerDemande(corps, Date.now());
  if (!validation.ok) {
    journaliser("rejet_validation", { champ: validation.champ ?? "", appelant: empreinte(adresse) });
    return validation.champ
      ? json({ message: erreurs.champ[validation.champ], champ: validation.champ }, 400)
      : json({ message: erreurs.generique }, 400);
  }
  const { demande } = validation;

  const verificateur = resoudreVerificateur();
  const captcha = await verificateur.verifier(demande.jetonCaptcha, adresse);
  if (!captcha.ok) {
    journaliser("captcha_refuse", {
      fournisseur: verificateur.nom,
      raison: captcha.raison,
      contact: empreinte(demande.contact.email),
    });
    return json({ message: erreurs.generique }, captcha.raison === "non_configure" ? 503 : 403);
  }

  // Une extraction au plus. Toute panne retombe sur les boutons et les
  // mots-clés de la description : le visiteur a toujours sa fourchette.
  const extraction = await extraire(demande.reponses, demande.description, { compteur: compteurIA });
  let composants: Composants;
  let source: SourceComposants;
  if (extraction.ok) {
    composants = extraction.composants;
    source = "ia";
  } else {
    if (extraction.raison !== "non_configure") {
      journaliser("extraction_repli", { raison: extraction.raison, detail: extraction.detail ?? "" });
    }
    composants = indicesTexte(demande.description, composantsParDefaut(demande.reponses));
    source = "boutons";
  }

  const estimation = estimer(demande.reponses, composants);
  const envoi: EnvoiEstimation = { demande, estimation, composants, source };

  const cockpit = await envoyerAuCockpit(envoi);
  if (!cockpit.ok) {
    journaliser("cockpit_echoue", { detail: cockpit.detail, contact: empreinte(demande.contact.email) });
    const resolution = resoudreExpediteur();
    const secours = resolution.ok
      ? await resolution.expediteur.envoyer({
          destinataire: resolution.expediteur.versEliott,
          message: messageSecours(envoi, cockpit.detail),
          repondreA: demande.contact.email,
        })
      : undefined;
    if (!secours?.ok) {
      // Ni cockpit ni mail : le seul cas où le contact est perdu. Ligne à part
      // pour qu'une alerte sur le journal la trouve sans ambiguïté.
      journaliser("contact_perdu", {
        detail: secours && !secours.ok ? secours.raison : "expediteur_non_configure",
        contact: empreinte(demande.contact.email),
      });
    }
  }

  return json({ ok: true, estimation, source }, 200);
}
