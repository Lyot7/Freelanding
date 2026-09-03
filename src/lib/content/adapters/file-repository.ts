/**
 * Adapter fichiers du port `ContentRepository`.
 *
 * Source de vérité = les modules `src/content/*.ts` (contenu typé, versionné en Git).
 * Zéro I/O réel : les données sont importées statiquement, renvoyées via `Promise.resolve`
 * pour respecter le contrat async du port. Remplaçable par un autre adapter sans
 * toucher aux appelants.
 */
import { aboutContent } from "@/content/about";
import { blogContent, blogPosts } from "@/content/blog";
import { contactContent } from "@/content/contact";
import { faqItems } from "@/content/faq";
import { homeContent } from "@/content/home";
import { legalDocuments } from "@/content/legal";
import { notFoundContent } from "@/content/not-found";
import { contentRoutes } from "@/content/routes";
import { services } from "@/content/services";
import { siteConfig } from "@/content/site";
import { stats } from "@/content/stats";
import { testimonials } from "@/content/testimonials";
import { uiLabels } from "@/content/ui";
import { workContent, workItems } from "@/content/work";

import type { ContentRepository } from "../repository";
import { findBySlug } from "../slug";

export function createFileContentRepository(): ContentRepository {
  return {
    getSiteConfig: () => Promise.resolve(siteConfig),
    getUiLabels: () => Promise.resolve(uiLabels),
    getNotFound: () => Promise.resolve(notFoundContent),
    getHome: () => Promise.resolve(homeContent),
    getAbout: () => Promise.resolve(aboutContent),
    getContact: () => Promise.resolve(contactContent),

    getWorkPage: () => Promise.resolve(workContent),
    getWorks: () => Promise.resolve([...workItems]),
    getWork: (slug) => Promise.resolve(findBySlug(workItems, slug)),

    getBlog: () => Promise.resolve(blogContent),
    getPosts: () => Promise.resolve([...blogPosts]),
    getPost: (slug) => Promise.resolve(findBySlug(blogPosts, slug)),

    getLegalDocuments: () => Promise.resolve([...legalDocuments]),
    getLegalDocument: (slug) =>
      Promise.resolve(findBySlug(legalDocuments, slug)),

    getRoutes: () => Promise.resolve([...contentRoutes]),

    getServices: () => Promise.resolve(services),
    getFaq: () => Promise.resolve(faqItems),
    getStats: () => Promise.resolve(stats),
    getTestimonials: () => Promise.resolve(testimonials),
  };
}
