import {
  FloatingNav,
  Footer,
  Header,
} from "@/components/layout";
import { siteFeatures } from "@/content/features";
import type { SiteConfig, WorkItem } from "@/lib/content";
import { RelatedWork } from "./RelatedWork";
import { WorkDetailHero } from "./WorkDetailHero";
import { WorkNarrative } from "./WorkNarrative";
import { WorkTestimonial } from "./WorkTestimonial";
import {
  createWorkDetailContent,
  resolveNextWork,
} from "./work-detail-content";

export function WorkDetailPage({
  site,
  work,
  works,
}: {
  site: SiteConfig;
  work: WorkItem;
  works: readonly WorkItem[];
}) {
  const detail = createWorkDetailContent(work);
  const nextWork = resolveNextWork(work, works);

  return (
    <>
      <Header site={site} />
      {/* Cible du lien d'évitement (voir SkipLink.tsx et focus.css). */}
      <main id="main-content" tabIndex={-1}>
        <WorkDetailHero work={work} />
        <WorkNarrative detail={detail} work={work} />
        {siteFeatures.testimonials && work.testimonial ? (
          // La citation vient du témoignage ; `testimonialFollowUp` est un
          // paragraphe SÉPARÉ posé après elle, pas un remplacement.
          // Masqué avec les autres témoignages tant qu'aucun n'est réel (voir
          // `src/content/features.ts`).
          <WorkTestimonial
            testimonial={work.testimonial}
            followUp={work.testimonialFollowUp}
          />
        ) : null}
        {nextWork ? <RelatedWork work={nextWork} /> : null}
      </main>
      <Footer />
      <FloatingNav site={site} />
    </>
  );
}
