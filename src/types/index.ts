export type ProcessingMethod =
  | "washed"
  | "natural"
  | "honey"
  | "anaerobic"
  | "wet-hulled";

export type RoastLevel =
  | "light"
  | "medium-light"
  | "medium"
  | "medium-dark"
  | "dark";

export type GrindSize =
  | "extra-fine"
  | "fine"
  | "medium-fine"
  | "medium"
  | "medium-coarse"
  | "coarse"
  | "extra-coarse";

export type BrewingCategory =
  | "pour-over"
  | "immersion"
  | "espresso"
  | "cold"
  | "stovetop";

export interface FlavorProfile {
  acidity: number;
  body: number;
  sweetness: number;
  bitterness: number;
  complexity: number;
  fruitiness: number;
}

export interface PourStage {
  label: string;
  atSeconds: number;
  waterMl: number;
  note?: string;
}

export interface BrewRecommendation {
  methodId: string;
  grindSize: GrindSize;
  grindMicrons: number;
  waterTempC: number;
  ratio: string; // e.g. "1:16"
  bloomSeconds?: number;
  brewSeconds: number;
  pourStages?: PourStage[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  affinity: number; // 1-10
  tastingNotes: string;
}

export interface BrewingMethod {
  id: string;
  name: string;
  category: BrewingCategory;
  description: string;
  icon: string;
  equipment: string[];
  defaultParameters: {
    grindSize: GrindSize;
    waterTempC: number;
    ratio: string;
    brewSeconds: number;
  };
}

export interface CoffeeBean {
  id: string;
  slug: string;
  name: string;
  country: string;
  countryCode: string; // ISO-2 for flag
  region: string;
  coordinates: [number, number]; // [lng, lat]
  altitudeMasl: [number, number];
  varieties: string[];
  processing: ProcessingMethod;
  roastRecommendation: RoastLevel;
  flavorProfile: FlavorProfile;
  flavorNotes: string[];
  harvestMonths: number[]; // 1-12
  description: string;
  funFact?: string; // optional trivia surfaced as a "Did you know?" note
  relatedBeanIds: string[];
  brewingRecommendations: BrewRecommendation[];
}

export interface CoffeeRegion {
  regionId: string;
  country: string;
  name: string;
  altitudeRange: [number, number];
}

export interface FlavorCategory {
  id: string;
  name: string;
  color: string;
}

export interface FlavorSubcategory {
  id: string;
  categoryId: string;
  name: string;
}

export interface FlavorNote {
  id: string;
  subcategoryId: string;
  name: string;
}

export interface FlavorNotesData {
  categories: FlavorCategory[];
  subcategories: FlavorSubcategory[];
  notes: FlavorNote[];
}
