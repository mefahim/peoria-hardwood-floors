// Phase 2 — Options & Configuration (visualizer-docs/02-PHASE-OPTIONS.md)
// Single source of truth for visualizer option definitions, internal values, and state shape.
// Display labels live next to their stable internal `value` so the UI never has to
// treat a label as a business identifier.

import { serviceAreas } from "@/lib/site"

export interface OptionDef<T extends string = string> {
  value: T
  label: string
}

export const ROOM_TYPE_OPTIONS = [
  { value: "kitchen", label: "Kitchen" },
  { value: "living_room", label: "Living room" },
  { value: "hallway", label: "Hallway" },
  { value: "bedroom", label: "Bedroom" },
  { value: "office", label: "Office" },
  { value: "retail_gym", label: "Retail / gym" },
] as const

export const PROJECT_TYPE_OPTIONS = [
  { value: "new_installation", label: "New installation" },
  { value: "refinish_existing_floor", label: "Refinish existing floor" },
  { value: "sandless_refresh", label: "Sandless refresh" },
  { value: "commercial_sports", label: "Commercial / sports" },
  { value: "deck", label: "Deck" },
  { value: "cabinets", label: "Cabinets" },
] as const

export const PREFERRED_STYLE_OPTIONS = [
  { value: "light_natural", label: "Light / natural" },
  { value: "warm_traditional", label: "Warm / traditional" },
  { value: "gray_weathered", label: "Gray / weathered" },
  { value: "dark_modern", label: "Dark / modern" },
  { value: "custom", label: "Custom" },
] as const

export const WOOD_SPECIES_OPTIONS = [
  { value: "oak", label: "Oak" },
  { value: "maple", label: "Maple" },
  { value: "hickory", label: "Hickory" },
  { value: "mixed_unsure", label: "Mixed / Unsure" },
  { value: "existing_floor", label: "Existing Floor" },
] as const

export const FLOOR_DIRECTION_OPTIONS = [
  { value: "parallel", label: "Parallel" },
  { value: "perpendicular", label: "Perpendicular" },
  { value: "diagonal", label: "Diagonal" },
  { value: "herringbone", label: "Herringbone" },
  { value: "existing_direction", label: "Existing Direction" },
  { value: "unsure", label: "Unsure" },
] as const

export const FINISH_PREFERENCE_OPTIONS = [
  { value: "bona_traffic_hd", label: "Bona Traffic HD" },
  { value: "rubio_monocoat", label: "Rubio Monocoat" },
  { value: "polyurethane", label: "Polyurethane" },
  { value: "unsure", label: "Unsure" },
] as const

export const SHEEN_OPTIONS = [
  { value: "matte", label: "Matte" },
  { value: "satin", label: "Satin" },
  { value: "semi_gloss", label: "Semi-gloss" },
  { value: "unsure", label: "Unsure" },
] as const

export type RoomType = (typeof ROOM_TYPE_OPTIONS)[number]["value"]
export type ProjectType = (typeof PROJECT_TYPE_OPTIONS)[number]["value"]
export type PreferredStyle = (typeof PREFERRED_STYLE_OPTIONS)[number]["value"]
export type WoodSpecies = (typeof WOOD_SPECIES_OPTIONS)[number]["value"]
export type FloorDirection = (typeof FLOOR_DIRECTION_OPTIONS)[number]["value"]
export type FinishPreference = (typeof FINISH_PREFERENCE_OPTIONS)[number]["value"]
export type Sheen = (typeof SHEEN_OPTIONS)[number]["value"]

// Service City has no separate internal-id source in the project today — `lib/site.ts`
// only exports display-name strings. Rather than inventing/merging a new city list, or
// modifying lib/site.ts, a stable slug is derived deterministically from each existing
// city label. The label itself remains the canonical source of truth.
function slugifyCityLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

export const SERVICE_CITY_OPTIONS: OptionDef[] = serviceAreas.map((label) => ({
  value: slugifyCityLabel(label),
  label,
}))

export const CUSTOM_STYLE_VALUE: PreferredStyle = "custom"

export interface VisualizerOptions {
  roomType: RoomType | null
  projectType: ProjectType | null
  preferredStyle: PreferredStyle | null
  customStyleDescription: string
  woodSpecies: WoodSpecies | null
  floorDirection: FloorDirection | null
  finishPreference: FinishPreference | null
  sheen: Sheen | null
  serviceCity: string | null
  squareFootage: number | null
}

export const INITIAL_VISUALIZER_OPTIONS: VisualizerOptions = {
  roomType: null,
  projectType: null,
  preferredStyle: null,
  customStyleDescription: "",
  woodSpecies: null,
  floorDirection: null,
  finishPreference: null,
  sheen: null,
  serviceCity: null,
  squareFootage: null,
}

// Normalizes raw square-footage input into the canonical state shape.
// Empty input -> null. Non-numeric, non-finite, zero, or negative input -> null
// (invalid input is never coerced into a fabricated "valid" number).
// Full user-facing validation/error messaging belongs to Phase 3.
export function normalizeSquareFootageInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === "") return null
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}
