import { metadataForPath } from "@/lib/seo/resolver"
import ProductsClient from "./ProductsClient"
import { StructuredData } from "@/components/seo/structured-data"
import { buildPageEntityGraph } from "@/lib/seo/structured-data"

export const metadata = metadataForPath("/products")

export default function ProductsPage() {
  return <><StructuredData graph={buildPageEntityGraph("/products", [{ label: "Home", href: "/" }, { label: "Products", href: "/products" }])} /><ProductsClient /></>
}
