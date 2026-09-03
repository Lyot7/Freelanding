/**
 * Port `ContentRepository` — frontière hexagonale (pragmatique) de la couche contenu.
 *
 * Les composants et pages ne connaissent QUE cette interface : ils ignorent d'où
 * vient le contenu. Aujourd'hui l'adapter lit des fichiers TS (`adapters/file-repository`).
 * Demain une autre source l'implémente à l'identique → aucun composant ne change.
 *
 * Toutes les méthodes sont async : le contrat anticipe une source distante (CMS/DB)
 * sans imposer de refonte des call-sites (Server Components `await content.getHome()`).
 */
import type {
  AboutContent,
  BlogContent,
  BlogPost,
  ContentRoute,
  ContactContent,
  FaqItem,
  HomeContent,
  LegalDocument,
  NotFoundContent,
  ServiceItem,
  SiteConfig,
  Stat,
  Testimonial,
  UiLabels,
  WorkContent,
  WorkItem,
} from "./types";

export interface ContentRepository {
  /** Config globale du site (marque, nav, contact, meta SEO…). */
  getSiteConfig(): Promise<SiteConfig>;
  /** Libellés d'interface partagés (chrome, accessibilité, formats). */
  getUiLabels(): Promise<UiLabels>;
  /** Contenu de la page 404. */
  getNotFound(): Promise<NotFoundContent>;

  /** Contenu de la page d'accueil. */
  getHome(): Promise<HomeContent>;
  /** Contenu de la page « à propos ». */
  getAbout(): Promise<AboutContent>;
  /** Contenu de la page contact. */
  getContact(): Promise<ContactContent>;

  /** Page index des projets avec filtres, FAQ et SEO. */
  getWorkPage(): Promise<WorkContent>;
  /** Tous les projets (case studies), dans l'ordre d'affichage. */
  getWorks(): Promise<WorkItem[]>;
  /** Un projet par slug, ou `null` s'il n'existe pas. */
  getWork(slug: string): Promise<WorkItem | null>;

  /** Page index du blog avec catégories, articles et SEO. */
  getBlog(): Promise<BlogContent>;
  /** Tous les articles de blog, dans l'ordre d'affichage. */
  getPosts(): Promise<BlogPost[]>;
  /** Un article par slug, ou `null` s'il n'existe pas. */
  getPost(slug: string): Promise<BlogPost | null>;

  /** Tous les documents légaux publiés. */
  getLegalDocuments(): Promise<LegalDocument[]>;
  /** Un document légal par slug, ou `null` s'il n'existe pas. */
  getLegalDocument(slug: string): Promise<LegalDocument | null>;

  /** Manifest des URLs publiques issues du sitemap live. */
  getRoutes(): Promise<ContentRoute[]>;

  /** Prestations de la section « Services » (accordéon home). */
  getServices(): Promise<ServiceItem[]>;
  /** FAQ (source unique, réutilisée sur plusieurs pages). */
  getFaq(): Promise<FaqItem[]>;
  /** Statistiques chiffrées (section « Numbers »). */
  getStats(): Promise<Stat[]>;
  /** Témoignages clients. */
  getTestimonials(): Promise<Testimonial[]>;
}
