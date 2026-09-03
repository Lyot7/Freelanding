import type { ImageAsset, Metric, WorkItem } from "@/lib/content";

export interface WorkDetailContent {
  overview: string;
  problemTitle: string;
  problemBody: string;
  outcomeTitle: string;
  approachTitle: string;
  approachBody: string;
  metrics: readonly Metric[];
  gallery: readonly ImageAsset[];
  projectVideoUrl?: string;
}

export function createWorkDetailContent(work: WorkItem): WorkDetailContent {
  return {
    overview: work.overview,
    problemTitle: work.problem[0] ?? "",
    problemBody: work.problem.slice(1).join(" "),
    outcomeTitle: work.outcome.join(" "),
    approachTitle: work.approach[0] ?? "",
    approachBody: work.approach.slice(1).join(" "),
    metrics: work.results ?? [],
    gallery: work.gallery,
    projectVideoUrl: work.projectVideoUrl,
  };
}

export function resolveNextWork(
  current: WorkItem,
  works: readonly WorkItem[],
): WorkItem | null {
  if (works.length < 2) {
    return null;
  }

  const explicitNext = works.find(
    (work) => work.slug === current.nextProject && work.slug !== current.slug,
  );
  if (explicitNext) {
    return explicitNext;
  }

  const currentIndex = works.findIndex((work) => work.slug === current.slug);
  if (currentIndex < 0) {
    return works[0] ?? null;
  }

  return works[(currentIndex + 1) % works.length] ?? null;
}
