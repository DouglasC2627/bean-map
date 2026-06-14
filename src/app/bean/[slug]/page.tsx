import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBeanBySlug,
  getBeans,
  getBrewingMethods,
  getFlavorNotes,
} from "@/lib/data";
import {
  countryFlagEmoji,
  flavorNoteLabel,
  formatAltitude,
  monthName,
} from "@/lib/utils";
import { findSimilarBeans } from "@/lib/similar";
import { FlavorRadar } from "@/components/visualization/FlavorRadar";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getBeans().map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const bean = getBeanBySlug(slug);
  if (!bean) return { title: "Bean not found — BeanMap" };
  return {
    title: `${bean.name} — BeanMap`,
    description: bean.description,
    openGraph: {
      title: `${bean.name} · ${bean.country}`,
      description: bean.description,
      type: "article",
    },
  };
}

export default async function BeanDetailPage({ params }: Params) {
  const { slug } = await params;
  const bean = getBeanBySlug(slug);
  if (!bean) notFound();

  const methods = getBrewingMethods();
  const methodById = new Map(methods.map((m) => [m.id, m]));
  const related = findSimilarBeans(bean, getBeans(), 3);
  const flavorNotes = getFlavorNotes();

  return (
    <article className="mx-auto w-full max-w-3xl px-5 py-10">
      <Link
        href={`/?bean=${bean.slug}`}
        className="text-sm text-roast-medium hover:underline"
      >
        ← View on map
      </Link>

      <header className="mt-4 border-b border-border pb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className="text-lg leading-none">
            {countryFlagEmoji(bean.countryCode)}
          </span>
          <span>{bean.country}</span>
        </div>
        <h1 className="mt-1 font-display text-4xl leading-tight">
          {bean.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {bean.region} · {formatAltitude(bean.altitudeMasl)} ·{" "}
          <Link
            href={`/learn/processing/${bean.processing}`}
            className="capitalize text-roast-medium hover:underline"
          >
            {bean.processing.replace("-", " ")}
          </Link>
        </p>
      </header>

      <section className="py-6">
        <p className="text-base leading-relaxed">{bean.description}</p>
      </section>

      {bean.funFact && (
        <aside className="rounded-lg border border-border bg-parchment/40 p-4 dark:bg-roast-dark/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-roast-medium">
            Did you know?
          </div>
          <p className="mt-1 text-sm leading-relaxed">{bean.funFact}</p>
        </aside>
      )}

      <section className="grid gap-6 border-t border-border py-6 sm:grid-cols-2">
        <div>
          <h2 className="font-display text-xl">Flavor profile</h2>
          <div className="mt-3">
            <FlavorRadar
              series={[
                {
                  id: bean.id,
                  label: bean.name,
                  profile: bean.flavorProfile,
                },
              ]}
              size={260}
            />
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl">Details</h2>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Varieties</dt>
              <dd className="text-right">{bean.varieties.join(", ")}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Processing</dt>
              <dd>
                <Link
                  href={`/learn/processing/${bean.processing}`}
                  className="capitalize text-roast-medium hover:underline"
                >
                  {bean.processing.replace("-", " ")}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Roast</dt>
              <dd className="capitalize">{bean.roastRecommendation}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Harvest</dt>
              <dd>{bean.harvestMonths.map(monthName).join(", ")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="font-display text-xl">Tasting notes</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {bean.flavorNotes.map((id) => (
            <span
              key={id}
              className="rounded-full bg-parchment px-2.5 py-0.5 text-xs text-roast-dark dark:bg-roast-dark dark:text-parchment"
            >
              {flavorNoteLabel(flavorNotes, id)}
            </span>
          ))}
        </div>
      </section>

      <section className="border-t border-border py-6">
        <h2 className="font-display text-xl">Brewing recommendations</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[...bean.brewingRecommendations]
            .sort((a, b) => b.affinity - a.affinity)
            .map((rec) => {
              const method = methodById.get(rec.methodId);
              return (
                <div
                  key={rec.methodId}
                  className="rounded-md border border-border bg-surface/60 p-4"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium">
                      {method?.name ?? rec.methodId}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      affinity {rec.affinity}/10
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-muted-foreground">
                    <div>Grind</div>
                    <div className="text-right text-foreground">
                      {rec.grindSize} ({rec.grindMicrons}µm)
                    </div>
                    <div>Temp</div>
                    <div className="text-right text-foreground">
                      {rec.waterTempC}°C
                    </div>
                    <div>Ratio</div>
                    <div className="text-right text-foreground">
                      {rec.ratio}
                    </div>
                    <div>Brew</div>
                    <div className="text-right text-foreground">
                      {rec.brewSeconds >= 600
                        ? `${Math.round(rec.brewSeconds / 3600)}h`
                        : `${rec.brewSeconds}s`}
                    </div>
                  </dl>
                  <p className="mt-2 text-sm">{rec.tastingNotes}</p>
                </div>
              );
            })}
        </div>
      </section>

      {related.length > 0 && (
        <section className="border-t border-border py-6">
          <h2 className="font-display text-xl">Similar beans</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/bean/${r.slug}`}
                  className="block rounded-md border border-border bg-surface/60 p-3 hover:border-roast-medium"
                >
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.region}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
