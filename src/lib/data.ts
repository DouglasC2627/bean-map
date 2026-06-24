import beansJson from "@/data/beans.json";
import methodsJson from "@/data/brewing-methods.json";
import flavorNotesJson from "@/data/flavor-notes.json";
import beansZhTW from "@/data/i18n/zh-TW/beans.json";
import methodsZhTW from "@/data/i18n/zh-TW/brewing-methods.json";
import flavorNotesZhTW from "@/data/i18n/zh-TW/flavor-notes.json";
import countriesJson from "@/data/i18n/countries.json";
import {
  beansDataSchema,
  brewingMethodsDataSchema,
  flavorNotesDataSchema,
} from "@/lib/schemas";
import { routing, type Locale } from "@/i18n/routing";
import type {
  BrewingMethod,
  CoffeeBean,
  FlavorNotesData,
} from "@/types";

/**
 * The English JSON files (`@/data/*.json`) are the source of truth for every
 * record's shape and stable `id`s. Each non-default locale ships a small
 * "overlay" file keyed by those ids that translates only the display strings
 * (names, descriptions, etc.); numeric/structural fields are never duplicated.
 * Loaders Zod-validate the English base once, then deep-merge the overlay for
 * the requested locale onto a clone — so the typed shape is guaranteed by the
 * base and translations stay terse and reviewable.
 */

// --- Overlay shapes (loose; completeness is enforced by validate-data.ts) ---

interface BeanOverlay {
  name?: string;
  region?: string;
  varieties?: string[];
  description?: string;
  funFact?: string;
  tastingNotes?: Record<string, string>; // keyed by methodId
}

interface MethodOverlay {
  name?: string;
  description?: string;
  equipment?: string[];
}

interface FlavorNotesOverlay {
  categories?: Record<string, string>;
  subcategories?: Record<string, string>;
  notes?: Record<string, string>;
}

const beanOverlays: Partial<Record<Locale, Record<string, BeanOverlay>>> = {
  "zh-TW": beansZhTW as Record<string, BeanOverlay>,
};
const methodOverlays: Partial<Record<Locale, Record<string, MethodOverlay>>> = {
  "zh-TW": methodsZhTW as Record<string, MethodOverlay>,
};
const flavorNoteOverlays: Partial<Record<Locale, FlavorNotesOverlay>> = {
  "zh-TW": flavorNotesZhTW as FlavorNotesOverlay,
};
const countryNames = countriesJson as Record<
  string,
  Partial<Record<Locale, string>>
>;

// --- Validated English base (parsed once, cached) ---

let baseBeans: CoffeeBean[] | null = null;
let baseMethods: BrewingMethod[] | null = null;
let baseFlavorNotes: FlavorNotesData | null = null;

function getBaseBeans(): CoffeeBean[] {
  if (!baseBeans) baseBeans = beansDataSchema.parse(beansJson) as CoffeeBean[];
  return baseBeans;
}
function getBaseMethods(): BrewingMethod[] {
  if (!baseMethods)
    baseMethods = brewingMethodsDataSchema.parse(methodsJson) as BrewingMethod[];
  return baseMethods;
}
function getBaseFlavorNotes(): FlavorNotesData {
  if (!baseFlavorNotes)
    baseFlavorNotes = flavorNotesDataSchema.parse(
      flavorNotesJson,
    ) as FlavorNotesData;
  return baseFlavorNotes;
}

// --- Per-locale caches of the merged result ---

const beansCache = new Map<Locale, CoffeeBean[]>();
const methodsCache = new Map<Locale, BrewingMethod[]>();
const flavorNotesCache = new Map<Locale, FlavorNotesData>();

function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}

/** Normalize an arbitrary locale string to a configured one (else default). */
function resolveLocale(locale: string): Locale {
  return isLocale(locale) ? locale : routing.defaultLocale;
}

// --- Public loaders (locale-aware) ---

export function getBeans(locale: string = routing.defaultLocale): CoffeeBean[] {
  const loc = resolveLocale(locale);
  const cached = beansCache.get(loc);
  if (cached) return cached;

  const base = getBaseBeans();
  const overlay = beanOverlays[loc];
  const merged =
    loc === routing.defaultLocale
      ? base
      : base.map((bean) => {
          const o = overlay?.[bean.id];
          const country = countryNames[bean.countryCode]?.[loc];
          if (!o && !country) return bean;
          const next = structuredClone(bean);
          if (country) next.country = country;
          if (o?.name) next.name = o.name;
          if (o?.region) next.region = o.region;
          if (o?.varieties) next.varieties = o.varieties;
          if (o?.description) next.description = o.description;
          if (o?.funFact) next.funFact = o.funFact;
          if (o?.tastingNotes) {
            next.brewingRecommendations = next.brewingRecommendations.map(
              (rec) => {
                const t = o.tastingNotes?.[rec.methodId];
                return t ? { ...rec, tastingNotes: t } : rec;
              },
            );
          }
          return next;
        });

  beansCache.set(loc, merged);
  return merged;
}

export function getBeanBySlug(
  slug: string,
  locale: string = routing.defaultLocale,
): CoffeeBean | undefined {
  return getBeans(locale).find((b) => b.slug === slug);
}

export function getBeanById(
  id: string,
  locale: string = routing.defaultLocale,
): CoffeeBean | undefined {
  return getBeans(locale).find((b) => b.id === id);
}

export function getBrewingMethods(
  locale: string = routing.defaultLocale,
): BrewingMethod[] {
  const loc = resolveLocale(locale);
  const cached = methodsCache.get(loc);
  if (cached) return cached;

  const base = getBaseMethods();
  const overlay = methodOverlays[loc];
  const merged =
    loc === routing.defaultLocale || !overlay
      ? base
      : base.map((method) => {
          const o = overlay[method.id];
          if (!o) return method;
          const next = structuredClone(method);
          if (o.name) next.name = o.name;
          if (o.description) next.description = o.description;
          if (o.equipment) next.equipment = o.equipment;
          return next;
        });

  methodsCache.set(loc, merged);
  return merged;
}

export function getBrewingMethod(
  id: string,
  locale: string = routing.defaultLocale,
): BrewingMethod | undefined {
  return getBrewingMethods(locale).find((m) => m.id === id);
}

export function getFlavorNotes(
  locale: string = routing.defaultLocale,
): FlavorNotesData {
  const loc = resolveLocale(locale);
  const cached = flavorNotesCache.get(loc);
  if (cached) return cached;

  const base = getBaseFlavorNotes();
  const overlay = flavorNoteOverlays[loc];
  const merged =
    loc === routing.defaultLocale || !overlay
      ? base
      : {
          categories: base.categories.map((c) => ({
            ...c,
            name: overlay.categories?.[c.id] ?? c.name,
          })),
          subcategories: base.subcategories.map((s) => ({
            ...s,
            name: overlay.subcategories?.[s.id] ?? s.name,
          })),
          notes: base.notes.map((n) => ({
            ...n,
            name: overlay.notes?.[n.id] ?? n.name,
          })),
        };

  flavorNotesCache.set(loc, merged);
  return merged;
}

export function getFlavorNoteName(
  id: string,
  locale: string = routing.defaultLocale,
): string {
  const note = getFlavorNotes(locale).notes.find((n) => n.id === id);
  return note?.name ?? id;
}
