import { metadataForPath } from "@/lib/seo/resolver"
import VisualizerClient from "./VisualizerClient"

export const metadata = metadataForPath("/visualizer")

export default function VisualizerPage() {
  return <VisualizerClient />
}
