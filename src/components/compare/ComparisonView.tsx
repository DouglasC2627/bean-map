"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Trophy, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { BrewingMethod, CoffeeBean, FlavorNotesData } from "@/types";
import { Link } from "@/i18n/navigation";
import {
  cn,
  countryFlagEmoji,
  flavorNoteLabel,
  formatAltitude,
  formatBrewTime,
  monthName,
} from "@/lib/utils";
import { FlavorRadar, RADAR_COLORS } from "@/components/visualization/FlavorRadar";

interface Props {
  beans: CoffeeBean[];
  /** When provided, render as a modal Dialog. Otherwise render inline. */
  onClose?: () => void;
  methods?: BrewingMethod[];
  flavorNotes?: FlavorNotesData;
}

export function ComparisonView({ beans, onClose, methods, flavorNotes }: Props) {
  const t = useTranslations("compareView");
  const series = useMemo(
    () =>
      beans.map((b, i) => ({
        id: b.id,
        label: b.name,
        profile: b.flavorProfile,
        color: RADAR_COLORS[i % RADAR_COLORS.length],
      })),
    [beans],
  );

  const allMethodIds = useMemo(() => {
    const set = new Set<string>();
    for (const b of beans) {
      for (const r of b.brewingRecommendations) set.add(r.methodId);
    }
    return Array.from(set);
  }, [beans]);

  const [selectedMethod, setSelectedMethod] = useState<string>(
    allMethodIds[0] ?? "",
  );

  const body = (
    <ComparisonBody
      beans={beans}
      series={series}
      methodIds={allMethodIds}
      methods={methods}
      flavorNotes={flavorNotes}
      selectedMethod={selectedMethod}
      onSelectMethod={setSelectedMethod}
    />
  );

  if (onClose) {
    return (
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[92vh] max-w-(--breakpoint-lg) overflow-y-auto p-0 sm:max-w-(--breakpoint-lg)"
        >
          <div className="flex items-start justify-between border-b border-border p-4">
            <div>
              <DialogTitle className="font-display text-xl">
                {t("title")}
              </DialogTitle>
              <DialogDescription>
                {t("subtitle", { count: beans.length })}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="rounded-md p-1 text-muted-foreground hover:bg-parchment hover:text-foreground dark:hover:bg-roast-dark"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">{body}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return body;
}

interface BodyProps {
  beans: CoffeeBean[];
  series: Array<{
    id: string;
    label: string;
    profile: CoffeeBean["flavorProfile"];
    color?: string;
  }>;
  methodIds: string[];
  methods?: BrewingMethod[];
  flavorNotes?: FlavorNotesData;
  selectedMethod: string;
  onSelectMethod: (id: string) => void;
}

function ComparisonBody({
  beans,
  series,
  methodIds,
  methods,
  flavorNotes,
  selectedMethod,
  onSelectMethod,
}: BodyProps) {
  const t = useTranslations("compareView");
  const tEnum = useTranslations("enums");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const listSep = locale === "zh-TW" ? "、" : ", ";
  const methodById = useMemo(
    () => new Map((methods ?? []).map((m) => [m.id, m])),
    [methods],
  );

  const recsForSelected = useMemo(
    () =>
      beans.map((b) => ({
        bean: b,
        rec: b.brewingRecommendations.find((r) => r.methodId === selectedMethod),
      })),
    [beans, selectedMethod],
  );

  const bestForSelected = useMemo(() => {
    let best: { beanId: string; affinity: number } | null = null;
    for (const { bean, rec } of recsForSelected) {
      if (!rec) continue;
      if (!best || rec.affinity > best.affinity) {
        best = { beanId: bean.id, affinity: rec.affinity };
      }
    }
    return best;
  }, [recsForSelected]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {beans.map((b, i) => (
          <article
            key={b.id}
            className="rounded-lg border border-border bg-surface/60 p-4"
          >
            <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span aria-hidden className="flag">{countryFlagEmoji(b.countryCode)}</span>
              <span>{b.country}</span>
            </div>
            <Link
              href={`/bean/${b.slug}`}
              className="font-display text-lg leading-tight hover:text-roast-medium"
            >
              {b.name}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">{b.region}</p>
            <span
              aria-hidden
              className="mt-3 inline-block h-1.5 w-10 rounded-full"
              style={{
                background: RADAR_COLORS[i % RADAR_COLORS.length],
              }}
            />
          </article>
        ))}
      </section>

      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("flavorOverlay")}
        </h3>
        <div className="rounded-lg border border-border bg-surface/40 p-4">
          <FlavorRadar series={series} size={300} showLegend />
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("originProcessing")}
        </h3>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-parchment/50 dark:bg-roast-dark/40">
              <tr className="text-left">
                <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("attribute")}
                </th>
                {beans.map((b) => (
                  <th
                    key={b.id}
                    className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                  >
                    {b.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label={t("country")}>
                {beans.map((b) => (
                  <Cell key={b.id}>
                    <span aria-hidden className="flag mr-1">
                      {countryFlagEmoji(b.countryCode)}
                    </span>
                    {b.country}
                  </Cell>
                ))}
              </Row>
              <Row label={t("altitude")}>
                {beans.map((b) => (
                  <Cell key={b.id} className="font-mono text-xs">
                    {formatAltitude(b.altitudeMasl, tCommon("masl"))}
                  </Cell>
                ))}
              </Row>
              <Row label={t("processing")}>
                {beans.map((b) => (
                  <Cell key={b.id}>{tEnum(`processing.${b.processing}`)}</Cell>
                ))}
              </Row>
              <Row label={t("roast")}>
                {beans.map((b) => (
                  <Cell key={b.id}>
                    {tEnum(`roast.${b.roastRecommendation}`)}
                  </Cell>
                ))}
              </Row>
              <Row label={t("varieties")}>
                {beans.map((b) => (
                  <Cell key={b.id} className="text-xs">
                    {b.varieties.join(listSep)}
                  </Cell>
                ))}
              </Row>
              <Row label={t("harvest")}>
                {beans.map((b) => (
                  <Cell key={b.id} className="text-xs">
                    {b.harvestMonths
                      .map((m) => monthName(m, locale))
                      .join(listSep)}
                  </Cell>
                ))}
              </Row>
              <Row label={t("topFlavorNotes")}>
                {beans.map((b) => (
                  <Cell key={b.id}>
                    <div className="flex flex-wrap gap-1">
                      {b.flavorNotes.slice(0, 4).map((id) => (
                        <span
                          key={id}
                          className="rounded-full bg-parchment px-2 py-0.5 text-[10px] text-roast-dark dark:bg-roast-dark dark:text-parchment"
                        >
                          {flavorNotes
                            ? flavorNoteLabel(flavorNotes, id)
                            : id}
                        </span>
                      ))}
                    </div>
                  </Cell>
                ))}
              </Row>
            </tbody>
          </table>
        </div>
      </section>

      {methodIds.length > 0 && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("brewingComparison")}
            </h3>
            <div className="flex flex-wrap gap-1">
              {methodIds.map((id) => {
                const m = methodById.get(id);
                const active = id === selectedMethod;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectMethod(id)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs",
                      active
                        ? "border-roast-medium bg-roast-medium text-cream"
                        : "border-border hover:border-roast-medium",
                    )}
                  >
                    {m?.name ?? id}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-parchment/50 dark:bg-roast-dark/40">
                <tr className="text-left">
                  <th className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("parameter")}
                  </th>
                  {beans.map((b) => (
                    <th
                      key={b.id}
                      className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      <div className="flex items-center gap-1.5">
                        {b.name}
                        {bestForSelected?.beanId === b.id && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-leaf-green/20 px-1.5 py-0.5 text-[10px] font-medium text-leaf-green"
                            title={t("bestTitle")}
                          >
                            <Trophy className="h-3 w-3" />
                            {t("best")}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <Row label={t("affinity")}>
                  {recsForSelected.map(({ bean, rec }) => (
                    <Cell key={bean.id} className="font-mono text-xs">
                      {rec ? `${rec.affinity}/10` : "—"}
                    </Cell>
                  ))}
                </Row>
                <Row label={t("grind")}>
                  {recsForSelected.map(({ bean, rec }) => (
                    <Cell key={bean.id} className="font-mono text-xs">
                      {rec
                        ? `${tEnum(`grind.${rec.grindSize}`)} (${rec.grindMicrons}µm)`
                        : "—"}
                    </Cell>
                  ))}
                </Row>
                <Row label={t("waterTemp")}>
                  {recsForSelected.map(({ bean, rec }) => (
                    <Cell key={bean.id} className="font-mono text-xs">
                      {rec ? `${rec.waterTempC}°C` : "—"}
                    </Cell>
                  ))}
                </Row>
                <Row label={t("ratio")}>
                  {recsForSelected.map(({ bean, rec }) => (
                    <Cell key={bean.id} className="font-mono text-xs">
                      {rec?.ratio ?? "—"}
                    </Cell>
                  ))}
                </Row>
                <Row label={t("brewTime")}>
                  {recsForSelected.map(({ bean, rec }) => (
                    <Cell key={bean.id} className="font-mono text-xs">
                      {rec ? formatBrewTime(rec.brewSeconds) : "—"}
                    </Cell>
                  ))}
                </Row>
                <Row label={t("difficulty")}>
                  {recsForSelected.map(({ bean, rec }) => (
                    <Cell key={bean.id} className="font-mono text-xs">
                      {rec ? `${rec.difficulty}/5` : "—"}
                    </Cell>
                  ))}
                </Row>
                <Row label={t("tastingNotes")}>
                  {recsForSelected.map(({ bean, rec }) => (
                    <Cell key={bean.id} className="text-xs">
                      {rec?.tastingNotes ?? "—"}
                    </Cell>
                  ))}
                </Row>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-t border-border">
      <th
        scope="row"
        className="bg-background px-3 py-2 text-left text-xs font-medium text-muted-foreground"
      >
        {label}
      </th>
      {children}
    </tr>
  );
}

function Cell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("px-3 py-2 align-top", className)}>{children}</td>
  );
}
