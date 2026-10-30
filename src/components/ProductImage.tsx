import Image from "next/image";

type Props = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  preload?: boolean;
  className?: string;
};

/** Fills its (relative) parent. SVG placeholders skip the optimizer. */
export function ProductImage({ src, alt, sizes, preload, className = "object-cover" }: Props) {
  if (!src) return <div className="absolute inset-0 bg-tile" aria-hidden />;
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      preload={preload}
      unoptimized={src.endsWith(".svg")}
      className={className}
    />
  );
}
