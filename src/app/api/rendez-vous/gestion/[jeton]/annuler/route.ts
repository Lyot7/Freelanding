/**
 * `POST /api/rendez-vous/gestion/[jeton]/annuler` — annule un rendez-vous
 * depuis la page `/rdv/gerer/[jeton]`. Corps : `{ motif? }`.
 *
 * Relais côté serveur vers le cockpit, qui retire l'événement Google (l'invité
 * est prévenu), écrit le mail et avertit Eliott. Rejouée, elle ne refait rien.
 */
import { creerJournal, json } from "@/lib/api/reponse";
import { creerLimiteur } from "@/lib/contact/rate-limit";
import { annulerRendezVous } from "@/lib/rendez-vous/cockpit";
import { garderGestion, REPLI_GESTION } from "@/lib/rendez-vous/garde-gestion";
import { traduireRefus, validerAnnulation } from "@/lib/rendez-vous/gestion";
import { LIMITE_GESTION } from "@/lib/rendez-vous/limites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const journaliser = creerJournal("rendez-vous");
const limiteur = creerLimiteur(LIMITE_GESTION);

export async function POST(
  requete: Request,
  { params }: { params: Promise<{ jeton: string }> },
): Promise<Response> {
  const garde = garderGestion(requete, (await params).jeton, limiteur, true);
  if (!garde.ok) return garde.reponse;

  let corps: unknown;
  try {
    corps = await requete.json();
  } catch {
    return json({ message: "Requête refusée." }, 400);
  }
  const demande = validerAnnulation(corps);
  if (!demande.ok) {
    return json({ message: "Ce motif est trop long.", champ: "motif" }, 400);
  }

  const resultat = await annulerRendezVous(garde.jeton, demande.motif);
  if (!resultat.ok) {
    journaliser("annulation_echouee", {
      raison: resultat.raison,
      statut: resultat.raison === "refuse" ? resultat.statut : 0,
      detail: resultat.detail,
      appelant: garde.appelant,
    });
    const { statut, message, champ } = traduireRefus(resultat, REPLI_GESTION);
    return json(champ ? { message, champ } : { message }, statut);
  }
  journaliser("rendez_vous_annule", { deja: resultat.donnees.deja ? 1 : 0 });
  return json({ ok: true }, 200);
}
