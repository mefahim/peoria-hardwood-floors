import type { EntityGraph } from "@/lib/seo/types"
import { serializeJsonLd } from "@/lib/seo/structured-data"

export function StructuredData({ graph }: { graph: EntityGraph }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }} />
}
