import type { MetadataRoute } from "next"
import { PRODUCTION_ORIGIN } from "@/lib/seo/resolver"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"],
    },
    sitemap: `${PRODUCTION_ORIGIN}/sitemap.xml`,
  }
}
