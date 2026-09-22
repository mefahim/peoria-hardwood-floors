import type React from "react"
import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://peoriahardwoodfloors.com"),
  title: {
    default: "Peoria Hardwood Floors | Installation & Refinishing in Central Illinois",
    template: "%s | Peoria Hardwood Floors",
  },
  description:
    "Family-owned hardwood flooring specialists serving Peoria and Central Illinois with installation, sanding, refinishing, stains, and custom finishes. Call (309) 863-5246.",
  openGraph: {
    title: "Peoria Hardwood Floors | Installation & Refinishing in Central Illinois",
    description:
      "Family-owned hardwood flooring specialists serving Peoria and Central Illinois. Installation, refinishing, stains, and custom finishes.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Bright kitchen with light hardwood flooring",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Peoria Hardwood Floors | Installation & Refinishing in Central Illinois",
    description:
      "Family-owned hardwood flooring specialists serving Peoria and Central Illinois.",
    images: ["/images/og-default.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
