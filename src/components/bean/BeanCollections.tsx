import { getTranslations } from "next-intl/server";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { BeanCard } from "./BeanCard";
import discover from "@/data/discover.json";

const LIMIT = 4;

/**
 * Curated + seasonal highlights shown at the top of the Beans catalog (the
 * former standalone Discover page, merged in). Server component so the seasonal
 * "In season now" list reflects the current month at request time.
 */
export async function BeanCollections({
  beans,
  flavorNotes,
  locale,
}: {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
  locale: string;
}) {
  const t = await getTranslations({ locale, namespace: "discover" });
  const bySlug = new Map(beans.map((b) => [b.slug, b]));
  const pick = (slugs: string[]) =>
    slugs
      .map((s) => bySlug.get(s))
      .filter((b): b is CoffeeBean => Boolean(b))
      .slice(0, LIMIT);

  const month = new Date().getMonth() + 1;
  const sections = [
    {
      title: t("inSeason"),
      beans: beans.filter((b) => b.harvestMonths.includes(month)).slice(0, LIMIT),
    },
    { title: t("editorsPicks"), beans: pick(discover.editorsPicks) },
    { title: t("newAdditions"), beans: [...beans].slice(-LIMIT).reverse() },
  ].filter((s) => s.beans.length > 0);

  if (sections.length === 0) return null;

  return (
    <div className="mb-10 space-y-8">
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="mb-3 font-display text-xl leading-tight">{s.title}</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {s.beans.map((b, i) => (
              <BeanCard
                key={b.id}
                bean={b}
                flavorNotes={flavorNotes}
                index={i}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
