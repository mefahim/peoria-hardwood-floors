import { metadataForPath } from "@/lib/seo/resolver"
import EstimateCalculatorClient from "./EstimateCalculatorClient"

export const metadata = metadataForPath("/estimate-calculator")

export default function EstimateCalculatorPage() {
  return <EstimateCalculatorClient />
}
