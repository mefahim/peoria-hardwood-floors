export type SchemaReference = { "@id": string }

export type OrganizationNode = {
  "@type": "Organization"
  "@id": string
  name: string
  url: string
  telephone: string
  email: string
  description: string
}

export type WebSiteNode = {
  "@type": "WebSite"
  "@id": string
  url: string
  name: string
  publisher: SchemaReference
}

export type WebPageNode = {
  "@type": "WebPage"
  "@id": string
  url: string
  name: string
  description: string
  isPartOf: SchemaReference
  about: SchemaReference
}

export type ServiceNode = {
  "@type": "Service"
  "@id": string
  name: string
  description: string
  url: string
  provider: SchemaReference
  mainEntityOfPage: SchemaReference
}

export type LocalBusinessNode = {
  "@type": "LocalBusiness" | "HomeAndConstructionBusiness" | "Contractor"
  "@id": string
  name: string
  url: string
  telephone: string
  email: string
  address: {
    "@type": "PostalAddress"
    streetAddress: string
    addressLocality: string
    addressRegion: string
    postalCode: string
    addressCountry: string
  }
  geo?: {
    "@type": "GeoCoordinates"
    latitude: number
    longitude: number
  }
  openingHoursSpecification?: {
    "@type": "OpeningHoursSpecification"
    dayOfWeek: string
    opens: string
    closes: string
  }[]
}

export type BreadcrumbListItem = {
  "@type": "ListItem"
  position: number
  name: string
  item: string
}

export type BreadcrumbListNode = {
  "@type": "BreadcrumbList"
  "@id": string
  itemListElement: BreadcrumbListItem[]
}

export type EntityNode = OrganizationNode | WebSiteNode | WebPageNode | ServiceNode | LocalBusinessNode | BreadcrumbListNode

export type EntityGraph = {
  "@context": "https://schema.org"
  "@graph": EntityNode[]
}
