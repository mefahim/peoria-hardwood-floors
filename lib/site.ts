export const site = {
  name: "Peoria Hardwood Floors",
  phone: "(309) 863-5246",
  phoneHref: "tel:+13098635246",
  email: "peoriahardwoodfloors@gmail.com",
  emailHref: "mailto:peoriahardwoodfloors@gmail.com",
  facebook: "",
  instagram: "",
  tagline: "Family-owned hardwood flooring, serving Peoria & Central Illinois.",
  serviceRadius: "within roughly 75 miles of Peoria, Illinois",
}

export const serviceAreas = [
  "Peoria",
  "Peoria Heights",
  "Dunlap",
  "Chillicothe",
  "Morton",
  "Macomb",
  "Galesburg",
  "Bloomington",
  "Normal",
  "Springfield",
  "Champaign",
  "Pekin",
  "Kewanee",
]

export type NavItem = { label: string; href: string }

export const primaryNav: NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Finishes", href: "/finishes" },
  { label: "Stains", href: "/stains" },
  { label: "Products", href: "/products" },
  { label: "Gallery", href: "/gallery" },
  { label: "Pricing", href: "/pricing" },
  { label: "Visualizer", href: "/visualizer" },
]

export type Service = {
  slug: string
  title: string
  short: string
  intent: string
  hero: string
  image: string
  who: string
  process: string[]
  factors: string[]
  faqs: { q: string; a: string }[]
}

export const services: Service[] = [
  {
    slug: "hardwood-floor-installation-peoria-il",
    title: "Hardwood Floor Installation",
    short: "New solid, engineered, laminate, and LVP flooring installed with a craftsman's eye.",
    intent: "hardwood floor installation Peoria IL",
    hero: "New floors, installed to last.",
    image: "/images/new-images/IMG_0039.JPG",
    who: "Homeowners and businesses adding new flooring during a remodel, a new build, or replacing worn carpet and tile throughout Peoria and Central Illinois.",
    process: [
      "In-home measurement and subfloor assessment.",
      "Product and layout selection — solid, engineered, laminate, or LVP.",
      "Acclimation of material to your home's conditions.",
      "Precise installation, trim, and transitions.",
      "Final inspection and care guidance.",
    ],
    factors: [
      "Square footage and room complexity.",
      "Material type and grade selected.",
      "Subfloor prep and existing floor removal.",
      "Stairs, borders, and custom detail work.",
    ],
    faqs: [
      { q: "What flooring do you install?", a: "Prefinished solid hardwood, engineered wood, laminate, and luxury vinyl plank (LVP). We can also install and finish unfinished wood flooring on site." },
      { q: "How long does installation take?", a: "Most residential installs take a few days depending on square footage, layout, and whether old flooring must be removed. We give a realistic timeline at your estimate." },
      { q: "Do you move furniture?", a: "We can discuss furniture and appliance handling during your estimate so there are no surprises on install day." },
    ],
  },
  {
    slug: "hardwood-floor-refinishing-peoria-il",
    title: "Sanding & Refinishing",
    short: "Restore scratched, worn, or dated floors with a renewed finish.",
    intent: "hardwood floor refinishing Peoria IL",
    hero: "Bring tired floors back to life.",
    image: "/images/new-images/IMG_0214.jpg",
    who: "Owners of solid or engineered hardwood floors that are scratched, faded, water-marked, or simply dated and ready for a fresh look.",
    process: [
      "Assess wear, board condition, and remaining wear layer.",
      "Dustless-system sanding to bare wood.",
      "Optional stain color of your choice.",
      "Finish applied in multiple coats.",
      "Cure and care guidance for the finished floor.",
    ],
    factors: [
      "Square footage and number of rooms.",
      "Whether you add a custom stain color.",
      "Choice of standard or commercial-grade finish.",
      "Board repairs and detail sanding around cabinets and stairs.",
    ],
    faqs: [
      { q: "How do I know if my floor can be refinished?", a: "Most solid hardwood can be refinished several times over its life. We check the wear layer and board condition during a project assessment before recommending sanding or a sandless refresh." },
      { q: "Is there a lot of dust?", a: "We use a dust-containment sanding system that captures the large majority of sanding dust. Some fine cleanup is normal, and we leave your space tidy." },
      { q: "Can you match my existing floor?", a: "In many cases we can blend repairs and stain color to closely match adjacent areas. We will set clear expectations before we begin." },
    ],
  },
  {
    slug: "sandless-floor-refinishing-peoria-il",
    title: "Sandless Refinishing",
    short: "A lower-disruption buff-and-recoat for eligible floors.",
    intent: "sandless hardwood floor refinishing Peoria",
    hero: "A fresh coat, far less disruption.",
    image: "/images/new-images/IMG_1088.JPG",
    who: "Homeowners whose floors have surface wear but a sound existing finish — an ideal refresh before listing a home or hosting, when a full sand isn't required.",
    process: [
      "Inspect the existing finish for adhesion and eligibility.",
      "Deep clean and abrade (buff) the surface.",
      "Apply a fresh maintenance coat of finish.",
      "Review when light use is appropriate after the finish is applied.",
    ],
    factors: [
      "Square footage of eligible area.",
      "Standard versus commercial or Rubio Monocoat finish.",
      "Condition of the existing finish.",
    ],
    faqs: [
      { q: "Is sandless right for my floor?", a: "Sandless refinishing works when the existing finish is intact and the damage is limited to the surface. If wood is bare, deeply scratched, or water-damaged, a full sand-and-refinish is the better choice. We help you decide." },
      { q: "How is it different from full refinishing?", a: "Sandless (buff-and-recoat) refreshes the top finish layer without sanding to bare wood. It can involve less disruption than a full refinish, but it will not remove deep scratches or change raw wood color the way a full refinish can." },
    ],
  },
  {
    slug: "commercial-sports-flooring-central-illinois",
    title: "Commercial & Sports Floors",
    short: "Durable installation and refinishing for gyms, studios, retail, and hospitality.",
    intent: "commercial sports flooring Central Illinois",
    hero: "Floors built for heavy traffic.",
    image: "/images/new-images/IMG_1221.jpeg",
    who: "Schools, churches, gyms, dance studios, retail, and hospitality spaces across Central Illinois that need hardwood floors installed or refinished to a durable, professional standard.",
    process: [
      "Site visit and scope planning around your schedule.",
      "Recommendations for game lines, logos, and durable finishes.",
      "Sanding, staining, or installation as required.",
      "Commercial-grade finish selected for the intended use.",
      "Coordinated timing to minimize downtime.",
    ],
    factors: [
      "Total square footage and access.",
      "Game lines, logos, and custom detail.",
      "Finish system and number of coats.",
      "After-hours or phased scheduling.",
    ],
    faqs: [
      { q: "Can you refinish a gymnasium floor?", a: "Yes. We handle gym and sports floor sanding, game-line work, and durable commercial finishing, scheduled around your facility's calendar." },
      { q: "Do you work after hours?", a: "For many commercial projects we can phase work or schedule around operating hours to reduce disruption. We plan this together during the estimate." },
    ],
  },
  {
    slug: "deck-refinishing-peoria-il",
    title: "Deck Refinishing",
    short: "Clean, repair, and re-coat exterior wood for another Illinois season.",
    intent: "deck refinishing Peoria IL",
    hero: "Protect your outdoor wood.",
    image: "/images/new-images/IMG_1329.jpeg",
    who: "Homeowners with weathered wood decks that need cleaning, sanding, and a fresh protective stain or seal before another Central Illinois season.",
    process: [
      "Assess boards, railings, and fasteners.",
      "Clean and prep the surface.",
      "Sand where needed for a smooth base.",
      "Apply exterior stain or protective sealant.",
    ],
    factors: [
      "Deck size and railing detail.",
      "Amount of prep and board repair required.",
      "Stain versus clear protective seal.",
      "Weather windows for proper cure.",
    ],
    faqs: [
      { q: "When is the best time to refinish a deck?", a: "Dry, mild weather gives the best results so the finish can cure properly. We watch the forecast and schedule accordingly." },
      { q: "Can you match my deck's current color?", a: "We can review exterior stain directions with you and aim for a color close to your current look or a new direction you prefer." },
    ],
  },
  {
    slug: "cabinet-refinishing-peoria-il",
    title: "Cabinet Refinishing",
    short: "Refresh kitchen and bath cabinets without the cost of full replacement.",
    intent: "cabinet refinishing Peoria IL",
    hero: "A new kitchen, without the remodel.",
    image: "/images/new-images/IMG_1629.jpeg",
    who: "Homeowners who like their cabinet layout but want an updated color or a renewed finish without the expense and disruption of replacing cabinetry.",
    process: [
      "Assess cabinet material and current finish.",
      "Clean, prep, and mask surrounding surfaces.",
      "Sand and prime as needed.",
      "Apply a smooth, durable finish or new color.",
    ],
    factors: [
      "Number of doors, drawers, and boxes.",
      "Current finish and required prep.",
      "Color change versus refresh.",
      "Detail and hardware handling.",
    ],
    faqs: [
      { q: "Do I have to replace my cabinets?", a: "Often, no. If the boxes and doors are structurally sound, refinishing can update the look without replacing the cabinetry." },
      { q: "How durable is the finish?", a: "We use durable finishes suited to kitchen and bath use. We'll review care tips so your refreshed cabinets stay looking great." },
    ],
  },
]

export type Finish = {
  name: string
  family: string
  image: string
  sheen: string
  bestFor: string
  notes: string
}

export const finishes: Finish[] = [
  { name: "Waterborne Satin", family: "Waterborne", image: "/images/new-images/IMG_0444.jpeg", sheen: "Low to medium sheen", bestFor: "Busy homes and most residential floors", notes: "Clear, durable, and easy to live with." },
  { name: "Oil-Based Satin", family: "Oil-based", image: "/images/new-images/IMG_0466.jpeg", sheen: "Warm satin", bestFor: "Traditional rooms and richer amber tone", notes: "A classic look with depth and warmth." },
  { name: "Matte Finish", family: "Low-sheen", image: "/images/new-images/IMG_0500.jpeg", sheen: "Soft matte", bestFor: "Contemporary spaces and lower-maintenance living", notes: "Minimizes glare and softens everyday wear." },
  { name: "Rubio Monocoat", family: "Hardwax oil", image: "/images/new-images/IMG_0530.jpeg", sheen: "Natural matte", bestFor: "Custom color and tactile wood character", notes: "A single-coat system with a natural, hand-finished feel." },
]

export type Stain = { name: string; family: string; image: string; tone: string; notes: string; color: string; brand: string }
export const stains: Stain[] = [
  { name: "Natural", family: "Clear / natural", image: "/images/new-images/IMG_0590.jpeg", tone: "Natural", notes: "Lets the species and grain speak for themselves.", color: "#c79d69", brand: "DuraSeal" },
  { name: "Warm Oak", family: "Warm neutral", image: "/images/new-images/IMG_0592.jpeg", tone: "Warm", notes: "A welcoming, time-tested direction.", color: "#9a633d", brand: "Bona" },
  { name: "Weathered Gray", family: "Cool neutral", image: "/images/new-images/IMG_0608.jpeg", tone: "Gray", notes: "A modern look with visible wood movement.", color: "#8d8981", brand: "DuraSeal" },
  { name: "Espresso", family: "Deep neutral", image: "/images/new-images/IMG_0628.jpeg", tone: "Dark", notes: "Dramatic contrast for tailored interiors.", color: "#4a3028", brand: "Minwax" },
]

export const clients = ["Bona", "DuraSeal", "Minwax", "Rubio Monocoat", "Loba"]

export const galleryImages = [
  { src: "/images/new-images/IMG_0039.JPG", alt: "Warm hardwood floor in a finished room", service: "Installation" },
  { src: "/images/new-images/IMG_0070.JPG", alt: "Detailed wood flooring installation", service: "Installation" },
  { src: "/images/new-images/IMG_0176.JPG", alt: "Wide plank flooring project", service: "Installation" },
  { src: "/images/new-images/IMG_0214.jpg", alt: "Refinished hardwood floor detail", service: "Refinishing" },
  { src: "/images/new-images/IMG_0216.jpg", alt: "Wood floor craftsmanship", service: "Refinishing" },
  { src: "/images/new-images/IMG_0235.jpg", alt: "Finished hardwood room", service: "Finishes" },
  { src: "/images/new-images/IMG_0266.JPG", alt: "Patterned wood floor detail", service: "Custom detail" },
  { src: "/images/new-images/IMG_0379.jpeg", alt: "Chevron and herringbone flooring", service: "Custom detail" },
  { src: "/images/new-images/IMG_0484.jpeg", alt: "Reclaimed wood floor character", service: "Reclaimed" },
  { src: "/images/new-images/IMG_0660.JPG", alt: "Beautiful completed hardwood floor", service: "Installation" },
  { src: "/images/new-images/IMG_0763.JPG", alt: "Natural wood grain and finish", service: "Finishes" },
  { src: "/images/new-images/IMG_1088.JPG", alt: "Hardwood flooring close-up", service: "Refinishing" },
  { src: "/images/new-images/IMG_1101.JPG", alt: "Finished wood floor with natural light", service: "Refinishing" },
  { src: "/images/new-images/IMG_1163.JPG", alt: "Detailed flooring transition", service: "Custom detail" },
  { src: "/images/new-images/IMG_1221.jpeg", alt: "Commercial wood flooring project", service: "Commercial" },
  { src: "/images/new-images/IMG_1224.jpeg", alt: "Wood flooring craftsmanship", service: "Installation" },
  { src: "/images/new-images/IMG_1243.jpeg", alt: "Refinished floor detail", service: "Refinishing" },
  { src: "/images/new-images/IMG_1329.jpeg", alt: "Exterior wood deck project", service: "Decks" },
  { src: "/images/new-images/IMG_1335.jpeg", alt: "Custom woodwork detail", service: "Custom detail" },
  { src: "/images/new-images/IMG_1629.jpeg", alt: "Cabinet refinishing project", service: "Cabinets" },
  { src: "/images/new-images/IMG_1678.jpeg", alt: "Warm finished hardwood floor", service: "Finishes" },
  { src: "/images/new-images/IMG_1778.JPG", alt: "Wide plank hardwood flooring", service: "Installation" },
  { src: "/images/new-images/IMG_2083.JPG", alt: "Custom patterned wood floor", service: "Custom detail" },
  { src: "/images/new-images/IMG_2134.JPG", alt: "Residential hardwood flooring", service: "Installation" },
  { src: "/images/new-images/IMG_3364.JPG", alt: "Detailed wood floor finish", service: "Finishes" },
  { src: "/images/new-images/IMG_3366.JPG", alt: "Refinished hardwood room", service: "Refinishing" },
  { src: "/images/new-images/IMG_3378.JPG", alt: "Wood grain and stain detail", service: "Stains" },
  { src: "/images/new-images/IMG_3390.JPG", alt: "Completed flooring project", service: "Installation" },
  { src: "/images/new-images/IMG_3392.JPG", alt: "Custom flooring close-up", service: "Custom detail" },
]
