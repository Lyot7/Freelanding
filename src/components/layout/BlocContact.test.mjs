import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { Suspense } from "react";

import { siteConfig } from "@/content/site";
import { BlocContact } from "./BlocContact";
import { FooterContact } from "./FooterContact";
import { FooterContactAvecSujet } from "./FooterContactAvecSujet";

const CLEFS = ["CAL_COM_USERNAME", "CAL_COM_EVENT_LOGICIEL", "CAL_COM_EVENT_DECOUVERTE"];

describe("BlocContact", () => {
  const formulaire = siteConfig.footerForm;
  const precedent = Object.fromEntries(CLEFS.map((clef) => [clef, process.env[clef]]));

  beforeEach(() => {
    for (const clef of CLEFS) delete process.env[clef];
  });

  afterEach(() => {
    siteConfig.footerForm = formulaire;
    for (const clef of CLEFS) {
      if (precedent[clef] === undefined) delete process.env[clef];
      else process.env[clef] = precedent[clef];
    }
  });

  const avecAgenda = () => {
    process.env.CAL_COM_USERNAME = "eliott";
    process.env.CAL_COM_EVENT_LOGICIEL = "logiciel-30min";
  };

  it("ne rend rien sans formulaire", async () => {
    siteConfig.footerForm = undefined;
    expect(await BlocContact({})).toBeNull();
  });

  it("sans agenda configuré, il ne reste que le message", async () => {
    const bloc = await BlocContact({});
    expect(bloc.type).toBe(Suspense);
    expect(bloc.props.children.type).toBe(FooterContactAvecSujet);
    expect(bloc.props.children.props.rendezVous).toBeUndefined();
    expect(bloc.props.fallback.props.rendezVous).toBeUndefined();
  });

  it("avec un agenda, propose la réservation, repli compris", async () => {
    avecAgenda();
    const bloc = await BlocContact({});
    expect(bloc.props.children.props.rendezVous).toBeDefined();
    expect(bloc.props.fallback.props.rendezVous).toBeDefined();
  });

  it("présélectionne le sujet de la page, s'il est réservable", async () => {
    avecAgenda();
    const bloc = await BlocContact({ sujetRendezVous: "logiciel" });
    expect(bloc.type).toBe(FooterContact);
    expect(bloc.props.rendezVous.props.typeInitial).toBe("logiciel");

    const autre = await BlocContact({ sujetRendezVous: "decouverte" });
    expect(autre.props.rendezVous.props.typeInitial).toBeUndefined();
  });

  it("sur une page à sujet sans agenda, garde le message", async () => {
    const bloc = await BlocContact({ sujetRendezVous: "logiciel" });
    expect(bloc.props.rendezVous).toBeUndefined();
  });
});
