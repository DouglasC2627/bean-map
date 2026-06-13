import { z } from "zod";

export const processingMethodSchema = z.enum([
  "washed",
  "natural",
  "honey",
  "anaerobic",
  "wet-hulled",
]);

export const roastLevelSchema = z.enum([
  "light",
  "medium-light",
  "medium",
  "medium-dark",
  "dark",
]);

export const grindSizeSchema = z.enum([
  "extra-fine",
  "fine",
  "medium-fine",
  "medium",
  "medium-coarse",
  "coarse",
  "extra-coarse",
]);

export const brewingCategorySchema = z.enum([
  "pour-over",
  "immersion",
  "espresso",
  "cold",
  "stovetop",
]);

export const flavorProfileSchema = z.object({
  acidity: z.number().min(1).max(10),
  body: z.number().min(1).max(10),
  sweetness: z.number().min(1).max(10),
  bitterness: z.number().min(1).max(10),
  complexity: z.number().min(1).max(10),
  fruitiness: z.number().min(1).max(10),
});

export const pourStageSchema = z.object({
  label: z.string(),
  atSeconds: z.number().int().nonnegative(),
  waterMl: z.number().nonnegative(),
  note: z.string().optional(),
});

export const brewRecommendationSchema = z.object({
  methodId: z.string(),
  grindSize: grindSizeSchema,
  grindMicrons: z.number().int().positive(),
  waterTempC: z.number().min(0).max(100),
  ratio: z.string().regex(/^\d+:\d+(\.\d+)?$/),
  bloomSeconds: z.number().int().nonnegative().optional(),
  brewSeconds: z.number().int().positive(),
  pourStages: z.array(pourStageSchema).optional(),
  difficulty: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  affinity: z.number().min(1).max(10),
  tastingNotes: z.string(),
});

export const brewingMethodSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: brewingCategorySchema,
  description: z.string(),
  icon: z.string(),
  equipment: z.array(z.string()),
  defaultParameters: z.object({
    grindSize: grindSizeSchema,
    waterTempC: z.number(),
    ratio: z.string(),
    brewSeconds: z.number().int().positive(),
  }),
});

export const coffeeBeanSchema = z.object({
  id: z.string(),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric + dashes"),
  name: z.string(),
  country: z.string(),
  countryCode: z.string().length(2),
  region: z.string(),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  altitudeMasl: z.tuple([z.number(), z.number()]),
  varieties: z.array(z.string()).min(1),
  processing: processingMethodSchema,
  roastRecommendation: roastLevelSchema,
  flavorProfile: flavorProfileSchema,
  flavorNotes: z.array(z.string()),
  harvestMonths: z.array(z.number().int().min(1).max(12)).min(1),
  description: z.string(),
  funFact: z.string().optional(),
  relatedBeanIds: z.array(z.string()),
  brewingRecommendations: z.array(brewRecommendationSchema),
});

export const coffeeRegionSchema = z.object({
  regionId: z.string(),
  country: z.string(),
  name: z.string(),
  altitudeRange: z.tuple([z.number(), z.number()]),
});

export const flavorCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const flavorSubcategorySchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  name: z.string(),
});

export const flavorNoteSchema = z.object({
  id: z.string(),
  subcategoryId: z.string(),
  name: z.string(),
});

export const flavorNotesDataSchema = z.object({
  categories: z.array(flavorCategorySchema),
  subcategories: z.array(flavorSubcategorySchema),
  notes: z.array(flavorNoteSchema),
});

export const beansDataSchema = z.array(coffeeBeanSchema);
export const brewingMethodsDataSchema = z.array(brewingMethodSchema);
