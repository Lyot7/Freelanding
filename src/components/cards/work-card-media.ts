import type { ImageAsset, WorkItem } from "@/lib/content/types";

export type ResolvedWorkCardMedia =
  | { kind: "image"; image: ImageAsset }
  | { kind: "video"; src: string; poster: ImageAsset };

export function getWorkCardMedia(work: WorkItem): ResolvedWorkCardMedia {
  /* Le plateau 3D passe AVANT la capture brute quand il existe : c'est lui la
     forme de la carte. Il porte son propre poster, une image du composite, et
     non la couverture à plat : un poster à plat suivi d'une vidéo en
     perspective ferait sauter la carte au premier tour de lecture. */
  if (work.cardMockup) {
    const { poster, video } = work.cardMockup;
    return video ? { kind: "video", src: video.src, poster } : { kind: "image", image: poster };
  }

  if (work.cardMedia?.kind === "video") {
    return {
      kind: "video",
      src: work.cardMedia.src,
      poster: work.cover,
    };
  }

  return { kind: "image", image: work.cover };
}
