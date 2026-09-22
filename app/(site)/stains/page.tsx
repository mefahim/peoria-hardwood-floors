import { metadataForPath } from "@/lib/seo/resolver"
import StainsClient from "./StainsClient"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/stains")

export default function StainsPage() {
  return <><StructuredData graph={buildPageEntityGraph("/stains", [{ label: "Home", href: "/" }, { label: "Stains", href: "/stains" }])} /><StainsClient /></>
}
