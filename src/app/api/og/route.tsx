import { ImageResponse } from "next/og";
import type { CoffeeBean } from "@/types";
import { getBeanBySlug, getFlavorNotes } from "@/lib/data";
import { flavorNoteLabel } from "@/lib/utils";
import { radarSvgDataUri } from "@/lib/radar-svg";
import { DEFAULT_COLORS } from "@/lib/radar-geometry";

// Runs on Node so the (fs-free, statically-imported) data loaders are safe.
export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

// Coffee palette — the OG card is theme-independent (always the dark roast look).
const BG_FROM = "#1A0F09";
const BG_TO = "#3B2314";
const CREAM = "#FAF6F1";
const TAN = "#D4C4A8";
const CHERRY = "#C1440E";

function localeOf(sp: URLSearchParams): "en" | "zh-TW" {
  return sp.get("locale") === "zh-TW" ? "zh-TW" : "en";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = localeOf(searchParams);
  const flavorNotes = getFlavorNotes(locale);

  const beansParam = searchParams.get("beans");
  if (beansParam) {
    const beans = beansParam
      .split(",")
      .slice(0, 3)
      .map((s) => getBeanBySlug(s.trim(), locale))
      .filter((b): b is CoffeeBean => Boolean(b));
    if (beans.length > 0) {
      const radar = radarSvgDataUri(
        beans.map((b, i) => ({
          profile: b.flavorProfile,
          color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        })),
      );
      return new ImageResponse(<ComparisonCard beans={beans} radar={radar} />, {
        width: WIDTH,
        height: HEIGHT,
      });
    }
  }

  const beanParam = searchParams.get("bean");
  const bean = beanParam ? getBeanBySlug(beanParam.trim(), locale) : undefined;
  if (bean) {
    const notes = bean.flavorNotes
      .slice(0, 4)
      .map((id) => flavorNoteLabel(flavorNotes, id));
    const radar = radarSvgDataUri([
      { profile: bean.flavorProfile, color: CHERRY },
    ]);
    return new ImageResponse(
      <BeanCard bean={bean} notes={notes} radar={radar} />,
      { width: WIDTH, height: HEIGHT },
    );
  }

  return new ImageResponse(<BrandCard />, { width: WIDTH, height: HEIGHT });
}

const rootStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  padding: 64,
  backgroundImage: `linear-gradient(135deg, ${BG_FROM}, ${BG_TO})`,
  color: CREAM,
};

function Wordmark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: 32,
        color: TAN,
        letterSpacing: 1,
      }}
    >
      ☕ BeanMap
    </div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        padding: "8px 18px",
        borderRadius: 999,
        border: `1px solid ${TAN}`,
        color: TAN,
        fontSize: 26,
      }}
    >
      {label}
    </div>
  );
}

function BeanCard({
  bean,
  notes,
  radar,
}: {
  bean: CoffeeBean;
  notes: string[];
  radar: string;
}) {
  return (
    <div style={rootStyle}>
      <Wordmark />
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: 640,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: TAN }}>
            {bean.country} · {bean.region}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              marginTop: 8,
            }}
          >
            {bean.name}
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 28,
            }}
          >
            {notes.map((n) => (
              <Chip key={n} label={n} />
            ))}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={radar} width={360} height={360} alt="" />
      </div>
      <div style={{ display: "flex", fontSize: 26, color: TAN }}>
        Coffee origins, flavors &amp; brewing
      </div>
    </div>
  );
}

function ComparisonCard({
  beans,
  radar,
}: {
  beans: CoffeeBean[];
  radar: string;
}) {
  return (
    <div style={rootStyle}>
      <Wordmark />
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          justifyContent: "space-between",
          gap: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ display: "flex", fontSize: 30, color: TAN }}>
            Compare on BeanMap
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
            {beans.map((b, i) => (
              <div
                key={b.id}
                style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 12 }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    backgroundColor: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                  }}
                />
                <div style={{ display: "flex", fontSize: 46, fontWeight: 700 }}>
                  {b.name}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={radar} width={360} height={360} alt="" />
      </div>
      <div style={{ display: "flex", fontSize: 26, color: TAN }}>
        Side-by-side flavor, origin &amp; brewing
      </div>
    </div>
  );
}

function BrandCard() {
  return (
    <div style={{ ...rootStyle, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", fontSize: 72, fontWeight: 700 }}>
        ☕ BeanMap
      </div>
      <div style={{ display: "flex", fontSize: 32, color: TAN, marginTop: 16 }}>
        Coffee origins, flavors &amp; brewing
      </div>
    </div>
  );
}
