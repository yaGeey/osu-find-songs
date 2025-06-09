import Image from "next/image";

export default function SVG({
  src,
  alt,
  w: width,
  h: height,
  className,
}: {
  src: string;
  alt: string;
  w: string;
  h: string;
  className?: string;
}) {
  return (
    <div style={{ position: "relative", width, height }}>
      <Image src={src} layout="fill" alt={alt} className={className} />
    </div>
  );
}
