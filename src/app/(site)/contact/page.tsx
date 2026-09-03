import type { Metadata } from "next";
import { ContactPage } from "@/components/pages/contact/ContactPage";
import { content } from "@/lib/content";
import { pageMetadata } from "@/lib/page-metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = await content.getContact();
  return pageMetadata(seo, "/contact");
}

export default function Contact() {
  /*
   * LE `FAQPage` A ÉTÉ RETIRÉ D'ICI, ET IL N'EST PAS PERDU. Le même jeu de dix
   * questions était déclaré DEUX FOIS sur le domaine, ici et sur l'accueil.
   * Deux `FAQPage` au contenu identique sur deux adresses n'ajoutent aucune
   * chance d'être repris : ils obligent un moteur à choisir laquelle des deux
   * pages répond, et c'est du contenu dupliqué déclaré par nous-mêmes.
   *
   * Le raisonnement d'origine, « un visiteur qui arrive directement ici ne
   * verrait pas les réponses », confondait ce qui est AFFICHÉ et ce qui est
   * DÉCLARÉ. Le bloc reste affiché sur cette page, il n'y est plus balisé.
   * L'accueil porte la déclaration, une seule fois, pour tout le site.
   */
  return <ContactPage />;
}
