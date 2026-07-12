import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getBeanBySlug, getBrewingMethod } from "@/lib/data";
import { formatBrewTime } from "@/lib/utils";

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;
const BG_FROM = "#1A0F09";
const BG_TO = "#3B2314";
const CREAM = "#FAF6F1";
const TAN = "#D4C4A8";
const CHERRY = "#C1440E";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") === "zh-TW" ? "zh-TW" : "en";
  const beanSlug = searchParams.get("bean");
  const methodId = searchParams.get("method");

  const bean = beanSlug ? getBeanBySlug(beanSlug.trim(), locale) : undefined;
  const rec = bean?.brewingRecommendations.find((r) => r.methodId === methodId);
  const method = methodId ? getBrewingMethod(methodId, locale) : undefined;

  if (!bean || !rec) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundImage: `linear-gradient(135deg, ${BG_FROM}, ${BG_TO})`,
            color: CREAM,
          }}
        >
          <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>
            ☕ BeanMap
          </div>
        </div>
      ),
      { width: WIDTH, height: HEIGHT },
    );
  }

  // Localized labels, with English fallbacks if translations are unavailable
  // in this (non-locale-routed) request context.
  let labels = {
    badge: "Recipe",
    grind: "Grind",
    temp: "Temp",
    ratio: "Ratio",
    time: "Time",
  };
  try {
    const t = await getTranslations({ locale, namespace: "recipeCard" });
    labels = {
      badge: t("badge"),
      grind: t("grind"),
      temp: t("temp"),
      ratio: t("ratio"),
      time: t("time"),
    };
  } catch {
    // keep English fallbacks
  }

  const params: Array<{ label: string; value: string }> = [
    { label: labels.grind, value: `~${rec.grindMicrons}μm` },
    { label: labels.temp, value: `${rec.waterTempC}°C` },
    { label: labels.ratio, value: rec.ratio },
    { label: labels.time, value: formatBrewTime(rec.brewSeconds) },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          backgroundImage: `linear-gradient(135deg, ${BG_FROM}, ${BG_TO})`,
          color: CREAM,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 32,
            color: TAN,
            letterSpacing: 1,
          }}
        >
          ☕ BeanMap · {labels.badge}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 24 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700 }}>
            {method?.name ?? methodId}
          </div>
          <div style={{ display: "flex", fontSize: 34, color: TAN, marginTop: 8 }}>
            {bean.name} · {bean.country}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "auto",
            gap: 24,
          }}
        >
          {params.map((p) => (
            <div
              key={p.label}
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                padding: "20px 24px",
                borderRadius: 16,
                border: `1px solid ${TAN}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  color: TAN,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {p.label}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 40,
                  fontWeight: 700,
                  color: CHERRY,
                  marginTop: 6,
                }}
              >
                {p.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
