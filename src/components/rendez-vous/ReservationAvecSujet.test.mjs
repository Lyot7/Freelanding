import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SearchParamsContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import { rendezVousContent } from "@/content/rendez-vous";
import { ReservationAvecSujet } from "./ReservationAvecSujet";

/**
 * LA DÉMONSTRATION ET LE POINT D'ÉTAPE NE S'OUVRENT QUE PAR LEUR LIEN. `?sujet` est lu par
 * `useSearchParams`, servi ici par le contexte que Next pose lui-même.
 */
const C = rendezVousContent;
const nom = (id) => C.types.find((type) => type.id === id).nom;

function rendre(recherche, client = false) {
  return renderToStaticMarkup(
    createElement(
      SearchParamsContext.Provider,
      { value: new URLSearchParams(recherche) },
      createElement(ReservationAvecSujet, { types: C.types, emailContact: "contact@exemple.fr", client }),
    ),
  );
}

describe("ReservationAvecSujet : sujets proposés selon `?sujet`", () => {
  it("sans sujet, les quatre sujets publics sont proposés, ni la démonstration ni le point d'étape", () => {
    const html = rendre("");
    for (const id of ["logiciel", "site", "ia", "decouverte"]) expect(html).toContain(nom(id));
    expect(html).not.toContain(nom("demonstration"));
    expect(html).not.toContain(nom("point-d-etape"));
  });

  it("`?sujet=demonstration` l'ouvre, seul sujet proposé", () => {
    const html = rendre("sujet=demonstration");
    expect(html).toContain(nom("demonstration"));
    expect(html).toContain(C.blocs.creneau);
    expect(html).not.toContain(nom("logiciel"));
    expect(html).not.toContain(nom("point-d-etape"));
  });

  it("`?sujet=point-d-etape` l'ouvre, seul sujet proposé", () => {
    const html = rendre("sujet=point-d-etape");
    expect(html).toContain(nom("point-d-etape"));
    expect(html).not.toContain(nom("logiciel"));
    expect(html).not.toContain(nom("demonstration"));
  });

  it("`?sujet=site` et `?sujet=ia` laissent les sujets publics, sans les sujets privés", () => {
    for (const sujet of ["site", "ia"]) {
      const html = rendre(`sujet=${sujet}`);
      expect(html, sujet).toContain(nom(sujet));
      expect(html, sujet).toContain(nom("logiciel"));
      expect(html, sujet).not.toContain(nom("demonstration"));
      expect(html, sujet).not.toContain(nom("point-d-etape"));
    }
  });

  it("un ancien sujet (`outil`, `cto`, `autre`) est traduit, les sujets privés restent cachés", () => {
    for (const sujet of ["outil", "cto", "autre"]) {
      const html = rendre(`sujet=${sujet}`);
      expect(html, sujet).toContain(nom("logiciel"));
      expect(html, sujet).not.toContain(nom("demonstration"));
      expect(html, sujet).not.toContain(nom("point-d-etape"));
    }
  });

  it("un sujet inconnu est ignoré en silence", () => {
    const html = rendre("sujet=nimporte-quoi");
    expect(html).toContain(nom("logiciel"));
    expect(html).not.toContain(nom("demonstration"));
    expect(html).not.toContain(nom("point-d-etape"));
  });
});

describe("ReservationAvecSujet : la page client", () => {
  it("propose les quatre sujets de clients, sans ceux du premier rendez-vous", () => {
    const html = rendre("", true);
    for (const id of ["point-rapide", "demonstration", "proposition", "point-d-etape"]) {
      expect(html).toContain(nom(id));
    }
    for (const id of ["logiciel", "site", "ia", "decouverte"]) expect(html).not.toContain(`>${nom(id)}<`);
    expect(html).toContain(C.formulaire.telephoneLabel);
  });

  it("`?sujet=proposition` présélectionne le bouton, un sujet de prospect est ignoré", () => {
    expect(rendre("sujet=proposition", true)).toMatch(/value="proposition"[^>]*checked|checked[^>]*value="proposition"/u);
    expect(rendre("sujet=logiciel", true)).not.toMatch(/checked/u);
  });
});
