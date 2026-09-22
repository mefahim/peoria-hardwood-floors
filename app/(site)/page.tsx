import { metadataForPath } from "@/lib/seo/resolver"
import { HomeHero } from "@/components/home/home-hero"
import { Awards, ClientsStrip } from "@/components/awards"
import { HomeIntro } from "@/components/home/home-intro"
import { HomeServices } from "@/components/home/home-services"
import { HomeVisualizer } from "@/components/home/home-visualizer"
import { ServiceAreaBand } from "@/components/service-area-band"
import { HomeTestimonials } from "@/components/home/home-testimonials"
import { CtaBand } from "@/components/cta-band"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/")

export default function HomePage() {
  return (
    <>
      <StructuredData graph={buildPageEntityGraph("/", [])} />
      <HomeHero />
      <Awards />
      <HomeIntro />
      <HomeServices />
      <HomeVisualizer />
      <ServiceAreaBand />
      <HomeTestimonials />
      <ClientsStrip />
      <CtaBand />
    </>
  )
}
