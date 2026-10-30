import Image from "next/image";
import Link from "next/link";

// The logo file is 1012×267 with white padding around the mark;
// width/height keep that ratio, CSS only sets the height.
export function Logo({ href = "/app" }: { href?: string }) {
  return (
    <Link href={href} className="-ml-5 flex shrink-0 items-center lg:-ml-6">
      <Image
        src="/logo.png"
        alt="Kassa AI"
        width={197}
        height={52}
        loading="eager"
        className="h-11 w-auto mix-blend-multiply lg:h-13"
      />
    </Link>
  );
}
