"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SwapText } from "@/components/ui/SwapText";
// Le module léger, pas `vue-agent.ts` : voir l'en-tête de `vue-agent-accueil.ts`.
import {
  CHEMIN_PROMPT_TEXTE,
  CHEMIN_VUE_AGENT,
  accueilVueAgent,
} from "@/content/vue-agent-accueil";

/**
 * Raccourci de la vue Agent dans la barre basse du héros de l'accueil.
 *
 * UN CLIC, LE PROMPT EST COPIÉ. Le texte n'est pas dans la page : il est
 * cherché au clic sur `/agent/prompt.txt`, pour ne rien ajouter au poids de
 * l'accueil.
 *
 * SAFARI exige que l'écriture dans le presse-papiers parte du geste de
 * l'utilisateur, ce qu'un `await fetch` préalable fait perdre. D'où le
 * `ClipboardItem` construit AVEC la promesse du texte : l'écriture démarre
 * dans le geste et attend la réponse. Les navigateurs sans `ClipboardItem`
 * passent par `writeText` après le chargement.
 *
 * ÉCHEC = LA VUE AGENT. Si la copie échoue, on n'affiche pas une erreur au
 * milieu du héros : on emmène le visiteur sur `/agent`, où le bouton a un
 * repli complet.
 */
async function copierDepuis(url: string): Promise<boolean> {
  const texte = () =>
    fetch(url).then((reponse) => {
      if (!reponse.ok) throw new Error(`HTTP ${reponse.status}`);
      return reponse.text();
    });
  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      const blob = texte().then((t) => new Blob([t], { type: "text/plain" }));
      await navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
      return true;
    }
    await navigator.clipboard.writeText(await texte());
    return true;
  } catch {
    return false;
  }
}

export function DemanderAssistant({ className = "" }: { className?: string }) {
  const t = accueilVueAgent;
  const router = useRouter();
  const [copie, setCopie] = useState(false);
  const minuterie = useRef<number | undefined>(undefined);
  const enCours = useRef(false);

  useEffect(() => () => window.clearTimeout(minuterie.current), []);

  const auClic = async () => {
    // Un double clic pendant le chargement lancerait deux copies.
    if (enCours.current) return;
    enCours.current = true;
    const ok = await copierDepuis(CHEMIN_PROMPT_TEXTE);
    enCours.current = false;
    if (ok) {
      setCopie(true);
      window.clearTimeout(minuterie.current);
      minuterie.current = window.setTimeout(() => setCopie(false), 4000);
    } else {
      router.push(CHEMIN_VUE_AGENT);
    }
  };

  /* Curseur de saisie : ce que le visiteur fera de ce texte. Quatre
     clignotements à l'arrivée puis fixe, pour ne pas tirer l'œil loin du
     rendez-vous ; il reprend au survol et au focus. Figé quand le système
     demande moins d'animations. Un par état, collé à son texte : partagé,
     il restait au bout du libellé le plus long, loin de « Copié ». */
  const curseur = (
    <span
      aria-hidden
      className="h-[12px] w-[6px] flex-none bg-accent animate-[curseur-saisie_1.1s_steps(1,end)_4] group-hover:animate-[curseur-saisie_1.1s_steps(1,end)_infinite] group-focus-visible:animate-[curseur-saisie_1.1s_steps(1,end)_infinite] motion-reduce:animate-none"
    />
  );

  return (
    <>
    <button
      type="button"
      onClick={auClic}
      title={t.titre}
      className={`group relative flex h-min w-max max-w-full cursor-pointer items-center gap-[8px] text-foreground ${className}`}
    >
      <span aria-hidden className="flex-none font-mono text-accent">
        {t.invite}
      </span>
      {/* LES DEUX ÉTATS SONT TOUJOURS RENDUS, empilés dans la même cellule :
          le bouton garde la largeur du plus long. En ne rendant que l'état
          courant, « Copié » raccourcissait le libellé, la barre du héros
          (`flex-wrap` sous 810 px) se réorganisait et « Prendre rendez-vous »
          sautait de place, puis revenait quatre secondes plus tard sans
          aucun geste du visiteur. `invisible` sort aussi l'état caché du nom
          accessible du bouton. */}
      <span className="grid text-left">
        <span className={`col-start-1 row-start-1 flex items-center gap-[8px] ${copie ? "invisible" : ""}`}>
          {/* TROIS FORMES. Sous 810 px la phrase entière, qui peut passer à
              la ligne, sans permutation au survol (il n'y a pas de survol au
              doigt). Entre 810 et 1199, la forme courte, faute de place.
              Au-delà, la phrase entière. L'enveloppe porte l'affichage : sur
              `SwapText` même, son propre `inline-block` l'emportait sur
              `hidden`. */}
          <span>
            <span className="tablet:hidden">{t.libelle}</span>
            <span className="hidden tablet:inline desktop:hidden">
              <SwapText travel={12}>{t.court}</SwapText>
            </span>
            <span className="hidden desktop:inline">
              <SwapText travel={12}>{t.libelle}</SwapText>
            </span>
          </span>
          {curseur}
        </span>
        <span className={`col-start-1 row-start-1 flex items-center gap-[8px] ${copie ? "" : "invisible"}`}>
          <span>
            <span className="tablet:hidden desktop:inline">{t.fait}</span>
            <span className="hidden tablet:inline desktop:hidden">{t.faitCourt}</span>
          </span>
          {curseur}
        </span>
      </span>
    </button>
    {/* Hors du bouton : dedans, elle entrait dans son nom accessible et le
        message était lu deux fois. */}
    <span role="status" className="sr-only">
      {copie ? t.fait : ""}
    </span>
    </>
  );
}
