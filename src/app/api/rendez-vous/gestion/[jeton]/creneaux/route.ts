/**
 * `GET /api/rendez-vous/gestion/[jeton]/creneaux?mois=` — créneaux libres pour
 * DÉPLACER un rendez-vous : même type et même durée que lui, lus au cockpit à
 * partir du jeton. Le navigateur ne choisit ni le type ni la durée.
 *
 * Même réponse que `/api/rendez-vous/creneaux`, pour que la page de gestion
 * réutilise le calendrier du formulaire tel quel.
 */
import { creerJournal, json } from "@/lib/api/reponse";
import { creerLimiteur } from "@/lib/contact/rate-limit";
import { lireGestion, recupererCreneaux } from "@/lib/rendez-vous/cockpit";
import {
  estDernierMois,
  estPremierMois,
  fenetreMois,
  formaterMois,
  lireCreneaux,
} from "@/lib/rendez-vous/creneaux";
import { garderGestion, REPLI_GESTION } from "@/lib/rendez-vous/garde-gestion";
import { etatRendezVous, traduireRefus } from "@/lib/rendez-vous/gestion";
import { LIMITE_CRENEAUX } from "@/lib/rendez-vous/limites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const journaliser = creerJournal("rendez-vous");
const limiteur = creerLimiteur(LIMITE_CRENEAUX);

export async function GET(
  requete: Request,
  { params }: { params: Promise<{ jeton: string }> },
): Promise<Response> {
  const garde = garderGestion(requete, (await params).jeton, limiteur, false);
  if (!garde.ok) return garde.reponse;

  const maintenant = new Date();
  const lecture = await lireGestion(garde.jeton);
  if (!lecture.ok) {
    const { statut, message } = traduireRefus(lecture, REPLI_GESTION);
    return json({ message }, statut);
  }
  const rdv = lecture.donnees;
  if (etatRendezVous(rdv, maintenant) !== "confirme") {
    return json({ message: "Ce rendez-vous ne peut plus être déplacé. Rechargez la page." }, 409);
  }

  const fenetre = fenetreMois(new URL(requete.url).searchParams.get("mois") ?? "", maintenant);
  const resultat = await recupererCreneaux(rdv.type, fenetre.debut, fenetre.fin, rdv.duree);
  if (!resultat.ok) {
    journaliser("creneaux_indisponibles", {
      type: rdv.type,
      raison: resultat.raison,
      statut: resultat.raison === "refuse" ? resultat.statut : 0,
      detail: resultat.detail,
      appelant: garde.appelant,
    });
    return json({ message: "Créneaux indisponibles." }, 502);
  }

  return json(
    {
      fenetre: {
        debut: fenetre.debut,
        fin: fenetre.fin,
        mois: fenetre.mois,
        libelle: formaterMois(fenetre.mois),
        premiere: estPremierMois(fenetre.mois, maintenant),
        derniere: estDernierMois(fenetre.mois, maintenant),
      },
      durees: null,
      duree: rdv.duree,
      jours: lireCreneaux(resultat.donnees, maintenant),
    },
    200,
  );
}
