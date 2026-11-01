import { describe, expect, it } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { siteConfig } from "@/content/site";
import { Header } from "./Header";

const rendre = (props) => renderToStaticMarkup(createElement(Header, { site: siteConfig, ...props }));

describe("Header", () => {
  it("sur le héros de l'accueil, passe le logo en volt et l'action en contour", () => {
    const html = rendre({ appear: true });
    expect(html).toContain("text-volt");
    expect(html).toContain("border border-white/25");
    expect(html).not.toContain("bg-accent ");
  });

  it("ailleurs, garde le logo blanc et le seul volt plein sur l'action", () => {
    const html = rendre({});
    expect(html).not.toContain("text-volt");
    expect(html).not.toContain("border-white/25");
    expect(html).toContain("text-accent-ink");
  });
});
