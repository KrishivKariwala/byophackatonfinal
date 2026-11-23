import Image from "next/image";

/** The official supplied logo artwork, used as-is (no redraw, recolour or filter). Its cream background is intrinsic. */
export function Logo({ width = 120, className = "", priority = false }: { width?: number; className?: string; priority?: boolean }) {
  // Intrinsic size of public/brand/save-a-plate-logo-cropped.png is 847 × 676.
  const height = Math.round((width * 676) / 847);
  return (
    <Image
      src="/brand/save-a-plate-logo-cropped.png"
      alt="SAVE A PLATE"
      width={width}
      height={height}
      priority={priority}
      className={`object-contain ${className}`}
      style={{ width, height }}
    />
  );
}
