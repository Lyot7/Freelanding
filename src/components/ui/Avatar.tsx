import Image from "next/image";

/**
 * Avatar — image ronde (radius 100%), next/image optimisé.
 * `alt` obligatoire (a11y). Tailles sm (32px) / md (48px).
 */
export type AvatarSize = "sm" | "md";

const SIZES: Record<AvatarSize, number> = {
  sm: 32,
  md: 48,
};

export interface AvatarProps {
  src: string;
  alt: string;
  size?: AvatarSize;
  className?: string;
}

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const px = SIZES[size];
  return (
    <Image
      src={src}
      alt={alt}
      width={px}
      height={px}
      className={
        "inline-block shrink-0 rounded-full object-cover " +
        `${className ?? ""}`
      }
    />
  );
}
