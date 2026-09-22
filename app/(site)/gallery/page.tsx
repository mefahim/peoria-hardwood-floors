import { metadataForPath } from "@/lib/seo/resolver"
import GalleryClient from "./GalleryClient"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/gallery")

export default function GalleryPage() {
  return <><StructuredData graph={buildPageEntityGraph("/gallery", [{ label: "Home", href: "/" }, { label: "Gallery", href: "/gallery" }])} /><GalleryClient /></>
}
