import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { rendezVousContent } from "@/content/rendez-vous";
import { ReservationAvecSujet } from "./ReservationAvecSujet";

/**
 * LE POINT D'ÉTAPE NE S'OUVRE QUE PAR SON LIEN. `?sujet` est lu par
 * `useSearchParams`, servi ici par le contexte que Next pose lui-même.
 */
const C = rendezVousContent;
const nom = (id) => C.types.find((type) => type.id === id).nom;

function rendre(recherche) {
  return renderToStaticMarkup(
    createElement(
      SearchParamsContext.Provider,
      { value: new URLSearchParams(recherche) },
      createElement(ReservationAvecSujet, { types: C.types, emailContact: "contact@exemple.fr" }),
    ),
  );
}

describe("ReservationAvecSujet — sujets proposés selon `?sujet`", () => {
  it("sans sujet, le point d'étape n'est pas proposé", () => {
    const html = rendre("");
    expect(html).toContain(nom("logiciel"));
    expect(html).toContain(nom("demonstration"));
    expect(html).not.toContain(nom("point-d-etape"));
  });

  it("`?sujet=demonstration` ouvre la démonstration, sans le point d'étape", () => {
    const html = rendre("sujet=demonstration");
    expect(html).toContain(nom("demonstration"));
    expect(html).toContain(C.etapes.creneau);
    expect(html).not.toContain(nom("point-d-etape"));
  });

  it("`?sujet=point-d-etape` l'ouvre, seul sujet proposé", () => {
    const html = rendre("sujet=point-d-etape");
    expect(html).toContain(nom("point-d-etape"));
    expect(html).not.toContain(nom("logiciel"));
    expect(html).not.toContain(nom("demonstration"));
  });

  it("un sujet inconnu est ignoré en silence", () => {
    const html = rendre("sujet=nimporte-quoi");
    expect(html).toContain(nom("logiciel"));
    expect(html).not.toContain(nom("point-d-etape"));
  });
});
