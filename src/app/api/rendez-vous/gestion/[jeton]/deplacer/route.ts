/**
 * `POST /api/rendez-vous/gestion/[jeton]/deplacer` — déplace un rendez-vous
 * depuis la page `/rdv/gerer/[jeton]`. Corps : `{ debut, duree? }`.
 *
 * Le cockpit modifie le même événement Google (même lien Meet) et rend un
 * JETON NEUF : l'ancien lien ne gère plus rien. La page s'y redirige.
 */
import { creerJournal, json } from "@/lib/api/reponse";
import { creerLimiteur } from "@/lib/contact/rate-limit";
import { deplacerRendezVous } from "@/lib/rendez-vous/cockpit";
import { garderGestion, REPLI_GESTION } from "@/lib/rendez-vous/garde-gestion";
import { traduireRefus, validerDeplacement } from "@/lib/rendez-vous/gestion";
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
  const demande = validerDeplacement(corps, Date.now());
  if (!demande.ok) {
    return json(
      demande.champ === "duree"
        ? { message: "Cette durée n’est plus proposée.", champ: "duree" }
        : { message: "Ce créneau n’est plus proposé. Choisissez-en un autre dans la liste.", champ: "creneau" },
      400,
    );
  }

  const resultat = await deplacerRendezVous(garde.jeton, {
    debutUtc: demande.debutUtc,
    ...(demande.duree !== undefined ? { duree: demande.duree } : {}),
  });
  if (!resultat.ok) {
    journaliser("deplacement_echoue", {
      raison: resultat.raison,
      statut: resultat.raison === "refuse" ? resultat.statut : 0,
      detail: resultat.detail,
      appelant: garde.appelant,
    });
    const { statut, message, champ } = traduireRefus(resultat, REPLI_GESTION);
    return json(champ ? { message, champ } : { message }, statut);
  }
  journaliser("rendez_vous_deplace", {});
  return json({ ok: true, jeton: resultat.donnees.jetonGestion }, 200);
}
