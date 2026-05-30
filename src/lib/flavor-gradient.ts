import type { CoffeeBean, FlavorNotesData } from "@/types";

/**
 * Builds a deterministic CSS gradient that visually represents a bean's flavor.
 *
 * Hue comes from the colours of the bean's dominant flavour-note *categories*
 * (note -> subcategory -> category -> `color`), so a fruity/floral/sweet bean
 * reads warm red-pink-gold while a roasted/nutty one reads brown. The gradient
 * geometry (angle + highlight position) is derived from the numeric
 * `flavorProfile` so two beans sharing categories still differ.
 *
 * Returns a `background-image` value (a radial highlight over a linear ramp).
 * Pure + stable: the same bean always yields the same string. `color-mix` is
 * used for tint/shade — matching the existing usage in globals.css.
 */

// Coffee-toned default for the rare bean whose notes resolve to no category.
const FALLBACK = ["#6F4E37", "#A67C52", "#D4C4A8"];

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function flavorGradient(
  bean: CoffeeBean,
  data: FlavorNotesData,
): string {
  const noteToSub = new Map(data.notes.map((n) => [n.id, n.subcategoryId]));
  const subToCat = new Map(data.subcategories.map((s) => [s.id, s.categoryId]));
  const catColor = new Map(data.categories.map((c) => [c.id, c.color]));

  // Tally categories present in the bean's notes (insertion order preserved).
  const counts = new Map<string, number>();
  for (const noteId of bean.flavorNotes) {
    const cat = subToCat.get(noteToSub.get(noteId) ?? "");
    if (cat) counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }

  // Dominant categories first; stable sort keeps note order on ties.
  const colors = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat]) => catColor.get(cat))
    .filter((c): c is string => Boolean(c))
    .slice(0, 3);

  const palette = colors.length > 0 ? colors : FALLBACK;
  const first = palette[0];
  const last = palette[palette.length - 1];

  // Light lead + the category hues + a dark tail give the band depth.
  const stops =
    palette.length === 1
      ? [
          `color-mix(in srgb, ${first} 80%, white)`,
          first,
          `color-mix(in srgb, ${first} 68%, black)`,
        ]
      : [
          `color-mix(in srgb, ${first} 85%, white)`,
          ...palette,
          `color-mix(in srgb, ${last} 72%, black)`,
        ];

  const p = bean.flavorProfile;
  // Angle leans with acidity vs. body; highlight drifts with fruitiness/sweetness.
  const angle = clamp(120 + (p.acidity - p.body) * 6, 60, 180);
  const hx = clamp(30 + p.fruitiness * 5, 20, 85);
  const hy = clamp(15 + (10 - p.sweetness) * 4, 10, 70);

  const linear = `linear-gradient(${angle}deg, ${stops.join(", ")})`;
  const highlight = `radial-gradient(115% 85% at ${hx}% ${hy}%, color-mix(in srgb, ${first} 55%, white) 0%, transparent 55%)`;

  return `${highlight}, ${linear}`;
}
