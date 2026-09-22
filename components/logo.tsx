import Image from "next/image"
import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("relative block h-12 w-[250px] leading-none", className)}>
      <Image
        src="/images/peoriahardwoodfloors-logo.png"
        alt="Peoria Hardwood Floors"
        fill
        sizes="(max-width: 640px) 280px, 350px"
        className="object-contain object-left"
        priority
      />
    </span>
  )
}
