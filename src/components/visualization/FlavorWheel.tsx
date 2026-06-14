"use client";

import { useMemo, useState } from "react";
import {
  hierarchy,
  type HierarchyRectangularNode,
  partition,
} from "d3-hierarchy";
import { arc } from "d3-shape";
import { animated, useSpring } from "@react-spring/web";
import type { CoffeeBean, FlavorNotesData } from "@/types";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/use-media-query";
import { categoryIcon } from "@/lib/flavor-icons";

type NodeKind = "root" | "category" | "subcategory" | "note";

interface WheelNode {
  id: string;
  kind: NodeKind;
  name: string;
  /** Hex color inherited from the top-level category. */
  baseColor: string;
  children?: WheelNode[];
}

type WheelRect = HierarchyRectangularNode<WheelNode>;

interface Props {
  beans: CoffeeBean[];
  flavorNotes: FlavorNotesData;
  size?: number;
  selectedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  className?: string;
  /**
   * When true, the center disc only shows the hovered segment's name —
   * no "Category / Subcategory / Note" kind label and no bean count.
   * Designed for the compact map-view overlay where the inner disc is small.
   */
  compactCenter?: boolean;
}

const TWO_PI = Math.PI * 2;

/**
 * Blend the given hex color toward white by `amount` (0–1).
 */
function lighten(hex: string, amount: number): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const blend = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${blend(r)}, ${blend(g)}, ${blend(b)})`;
}

function buildTree(data: FlavorNotesData): WheelNode {
  const subsByCat = new Map<string, FlavorNotesData["subcategories"]>();
  for (const s of data.subcategories) {
    const arr = subsByCat.get(s.categoryId) ?? [];
    arr.push(s);
    subsByCat.set(s.categoryId, arr);
  }
  const notesBySub = new Map<string, FlavorNotesData["notes"]>();
  for (const n of data.notes) {
    const arr = notesBySub.get(n.subcategoryId) ?? [];
    arr.push(n);
    notesBySub.set(n.subcategoryId, arr);
  }

  const root: WheelNode = {
    id: "__root__",
    kind: "root",
    name: "Flavor",
    baseColor: "#6F4E37",
    children: data.categories.map((c) => ({
      id: c.id,
      kind: "category",
      name: c.name,
      baseColor: c.color,
      children: (subsByCat.get(c.id) ?? []).map((s) => ({
        id: s.id,
        kind: "subcategory",
        name: s.name,
        baseColor: c.color,
        children: (notesBySub.get(s.id) ?? []).map((n) => ({
          id: n.id,
          kind: "note",
          name: n.name,
          baseColor: c.color,
        })),
      })),
    })),
  };
  return root;
}

interface BeanCounts {
  byId: Map<string, number>;
}

function computeCounts(
  beans: CoffeeBean[],
  data: FlavorNotesData,
): BeanCounts {
  const subToCat = new Map<string, string>();
  for (const s of data.subcategories) subToCat.set(s.id, s.categoryId);
  const noteToSub = new Map<string, string>();
  for (const n of data.notes) noteToSub.set(n.id, n.subcategoryId);

  const byId = new Map<string, number>();

  for (const bean of beans) {
    // Some ids overlap across levels (e.g. subcategory "tobacco" + note
    // "tobacco"). Dedupe per bean so a single tag doesn't double-count.
    const seen = new Set<string>();
    for (const noteId of bean.flavorNotes) {
      const ids = [noteId];
      const subId = noteToSub.get(noteId);
      if (subId) ids.push(subId);
      if (subId) {
        const catId = subToCat.get(subId);
        if (catId) ids.push(catId);
      }
      for (const id of ids) {
        if (seen.has(id)) continue;
        seen.add(id);
        byId.set(id, (byId.get(id) ?? 0) + 1);
      }
    }
  }
  return { byId };
}

export function FlavorWheel({
  beans,
  flavorNotes,
  size = 480,
  selectedIds,
  onToggle,
  className,
  compactCenter = false,
}: Props) {
  const [hover, setHover] = useState<{
    id: string;
    name: string;
    kind: NodeKind;
    count: number;
  } | null>(null);

  const tree = useMemo(() => buildTree(flavorNotes), [flavorNotes]);
  const counts = useMemo(
    () => computeCounts(beans, flavorNotes),
    [beans, flavorNotes],
  );

  const root: WheelRect = useMemo(() => {
    const root = hierarchy<WheelNode>(tree)
      .count()
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    partition<WheelNode>().size([TWO_PI, 3])(root);
    return root as WheelRect;
  }, [tree]);

  const radius = size / 2;
  const center = size / 2;
  // 3 rings: category, subcategory, note
  const ringStops = [0.15, 0.42, 0.72, 1.0].map((f) => f * radius);

  const arcGen = useMemo(
    () =>
      arc<WheelRect>()
        .startAngle((d) => d.x0)
        .endAngle((d) => d.x1)
        .innerRadius((d) => ringStops[d.depth - 1] ?? 0)
        .outerRadius((d) => ringStops[d.depth] ?? 0)
        .padAngle(0.002)
        .padRadius(radius),
    [ringStops, radius],
  );

  const allNodes: WheelRect[] = useMemo(
    () => (root.descendants() as WheelRect[]).filter((d) => d.depth > 0),
    [root],
  );

  const onSegmentEnter = (n: WheelRect) => {
    setHover({
      id: n.data.id,
      name: n.data.name,
      kind: n.data.kind,
      count: counts.byId.get(n.data.id) ?? 0,
    });
  };

  // d3.arc() puts angle 0 at 12 o'clock and proceeds clockwise. Positions for
  // icons / labels must use the same convention: x = sin(θ)·r, y = -cos(θ)·r.
  const polarToXY = (angle: number, r: number): [number, number] => [
    Math.sin(angle) * r,
    -Math.cos(angle) * r,
  ];

  // Highlight set: the selected node, all its ancestors (so the inner rings
  // stay opaque when a deeper segment is selected), and all its descendants
  // (so the outer rings stay opaque when a category is selected). `null`
  // means nothing is selected — everything renders at full opacity.
  //
  // Keys are `${kind}:${id}` rather than raw id, because some ids overlap
  // across levels (e.g. subcategory "brown-spice" and note "brown-spice").
  // Without the kind prefix, selecting "cinnamon" would also highlight the
  // sibling note "brown-spice" because it shares its parent's id.
  const nodeKey = (n: WheelRect) => `${n.data.kind}:${n.data.id}`;

  const highlightedKeys: Set<string> | null = useMemo(() => {
    if (selectedIds.size === 0) return null;
    const out = new Set<string>();
    const all = root.descendants() as WheelRect[];
    for (const sel of selectedIds) {
      for (const node of all) {
        if (node.data.id !== sel) continue;
        out.add(nodeKey(node));
        let p = node.parent;
        while (p && p.data.id !== "__root__") {
          out.add(nodeKey(p as WheelRect));
          p = p.parent;
        }
        for (const desc of node.descendants() as WheelRect[]) {
          out.add(nodeKey(desc));
        }
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, root]);

  const isNodeHighlighted = (n: WheelRect): boolean =>
    highlightedKeys === null || highlightedKeys.has(nodeKey(n));

  // Category icons straddle the middle/outer ring boundary at each category's
  // mid angle. Size scales with the outer ring's thickness.
  const categoryIconSize = Math.max(24, (ringStops[3] - ringStops[2]) * 0.72);

  // Hovered label / fallback for center display
  const centerLabel = hover?.name ?? null;
  const centerCount = hover?.count ?? null;
  const centerKind = hover?.kind ?? null;
  // Long names (e.g. "Tropical Fruit") need a smaller font in the inner disc.
  const innerR = ringStops[0];
  const centerFontSize = centerLabel
    ? Math.min(innerR * 0.28, centerLabel.length > 10 ? innerR * 0.22 : innerR * 0.28)
    : innerR * 0.22;

  // In compact mode the inner disc is too small (~22px radius at size=300) to
  // host readable text on its own — instead we use an absolute font size and
  // back the label with a pill that sits over the wheel so it really pops.
  const compactFontSize = Math.max(15, size * 0.055);
  const compactIdleFontSize = Math.max(11, size * 0.04);
  const compactCharWidth = compactFontSize * 0.58; // approximation
  const compactRectW = centerLabel
    ? Math.max(innerR * 2 + 12, centerLabel.length * compactCharWidth + 24)
    : innerR * 2 + 12;
  const compactRectH = compactFontSize * 2;

  // Spring the pill's width/x so swapping labels of different lengths
  // (e.g. "Citrus" → "Tropical Fruit") slides smoothly instead of snapping.
  const reduceMotion = usePrefersReducedMotion();
  const compactPillSpring = useSpring({
    width: compactRectW,
    x: center - compactRectW / 2,
    opacity: compactCenter && centerLabel ? 1 : 0,
    immediate: reduceMotion,
    config: { tension: 320, friction: 32 },
  });

  return (
    <div
      className={cn(
        "relative mx-auto w-full select-none motion-safe:animate-[radar-fade_400ms_ease-out]",
        className,
      )}
      style={{ maxWidth: size }}
      onMouseLeave={() => setHover(null)}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label="Coffee flavor wheel"
        // Render fluidly: the viewBox keeps the internal coordinate space at
        // `size`, while width:100% + height:auto scale the wheel down to fit
        // narrow viewports (mobile) instead of overflowing horizontally.
        className="block h-auto w-full overflow-visible"
      >
        <g transform={`translate(${center}, ${center})`}>
          {allNodes.map((n) => {
            const lightenAmount =
              n.depth === 1 ? 0 : n.depth === 2 ? 0.2 : 0.4;
            const isSelected = selectedIds.has(n.data.id);
            const isHighlighted = isNodeHighlighted(n);
            const count = counts.byId.get(n.data.id) ?? 0;
            const empty = count === 0;
            const fill = lighten(n.data.baseColor, lightenAmount);
            const fillOpacity = empty
              ? 0.15
              : isHighlighted
                ? 0.95
                : 0.18;

            return (
              <path
                key={`${n.data.kind}-${n.data.id}`}
                d={arcGen(n) ?? undefined}
                fill={fill}
                fillOpacity={fillOpacity}
                stroke={
                  isSelected ? "var(--color-foreground, #1A0F09)" : "#FAF6F1"
                }
                strokeWidth={isSelected ? 2 : 0.5}
                strokeOpacity={isHighlighted ? 1 : 0.4}
                className="cursor-pointer transition-[fill-opacity,stroke-width,stroke-opacity] duration-200"
                onMouseEnter={() => onSegmentEnter(n)}
                onClick={() => onToggle(n.data.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onToggle(n.data.id);
                  }
                }}
                aria-label={`${n.data.name}, ${count} bean${count === 1 ? "" : "s"}${isSelected ? ", selected" : ""}`}
                aria-pressed={isSelected}
              />
            );
          })}

          {/* Category icon (illustration or emoji fallback) on the outer ring */}
          {allNodes
            .filter((n) => n.depth === 1 && (n.value ?? 0) > 0)
            .map((n) => {
              const icon = categoryIcon(n.data.id);
              if (!icon) return null;
              const mid = (n.x0 + n.x1) / 2;
              // Sit at the boundary between the middle (subcategory) and outer
              // (note) rings, so the icon straddles both — closer to the wheel
              // center than the mid of the outer ring.
              const r = ringStops[2];
              const [x, y] = polarToXY(mid, r);
              const highlighted = isNodeHighlighted(n);
              const iconOpacity = highlighted ? 1 : 0.35;
              if (icon.type === "image") {
                const s = categoryIconSize;
                return (
                  <image
                    key={`cat-icon-${n.data.id}`}
                    href={icon.url}
                    x={x - s / 2}
                    y={y - s / 2}
                    width={s}
                    height={s}
                    opacity={iconOpacity}
                    className="motion-safe:transition-opacity motion-safe:duration-200"
                    style={{ pointerEvents: "none" }}
                  />
                );
              }
              return (
                <text
                  key={`cat-icon-${n.data.id}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={categoryIconSize}
                  opacity={iconOpacity}
                  className="motion-safe:transition-opacity motion-safe:duration-200"
                  style={{ pointerEvents: "none" }}
                >
                  {icon.char}
                </text>
              );
            })}
        </g>

        <circle
          cx={center}
          cy={center}
          r={ringStops[0]}
          fill="var(--color-background, #FAF6F1)"
          stroke="var(--color-border, #D4C4A8)"
          strokeWidth={1}
        />
        {compactCenter ? (
          <>
            <animated.rect
              x={compactPillSpring.x}
              y={center - compactRectH / 2}
              width={compactPillSpring.width}
              height={compactRectH}
              rx={compactRectH / 2}
              fill="var(--color-background, #FAF6F1)"
              stroke="var(--color-roast-medium, #6F4E37)"
              strokeWidth={1.5}
              opacity={compactPillSpring.opacity}
              style={{ pointerEvents: "none" }}
            />
            {centerLabel ? (
              <text
                x={center}
                y={center}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={compactFontSize}
                className="fill-foreground font-display font-medium"
                style={{ pointerEvents: "none" }}
              >
                {centerLabel}
              </text>
            ) : (
              <text
                x={center}
                y={center}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={compactIdleFontSize}
                className="fill-muted-foreground font-display"
                style={{ pointerEvents: "none" }}
              >
                Flavors
              </text>
            )}
          </>
        ) : centerLabel ? (
          <>
            <text
              x={center}
              y={center - innerR * 0.18}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground text-[10px] uppercase tracking-wider"
            >
              {centerKind === "note"
                ? "Note"
                : centerKind === "subcategory"
                  ? "Subcategory"
                  : "Category"}
            </text>
            <text
              x={center}
              y={center + innerR * 0.05}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={centerFontSize}
              className="fill-foreground font-display"
            >
              {centerLabel}
            </text>
            <text
              x={center}
              y={center + innerR * 0.4}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground text-[10px] font-mono"
            >
              {centerCount} bean{centerCount === 1 ? "" : "s"}
            </text>
          </>
        ) : (
          <>
            <text
              x={center}
              y={center - innerR * 0.18}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground text-[10px] uppercase tracking-wider"
            >
              Flavor
            </text>
            <text
              x={center}
              y={center + innerR * 0.12}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={innerR * 0.3}
              className="fill-foreground font-display"
            >
              Wheel
            </text>
            <text
              x={center}
              y={center + innerR * 0.5}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-muted-foreground text-[9px]"
            >
              Hover or tap a segment
            </text>
          </>
        )}
      </svg>

      {/* Wrapped in an sr-only <div>, not applied to the <table> directly: a
          table ignores the utility's width:1px and lays out at full content
          width, overflowing and widening the mobile layout viewport. The div
          collapses and clips it. See FlavorRadar for the full explanation. */}
      <div className="sr-only">
        <table>
          <caption>
            Coffee flavor wheel — categories, subcategories, and notes
          </caption>
          <thead>
            <tr>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Note</th>
              <th>Beans</th>
            </tr>
          </thead>
          <tbody>
            {flavorNotes.notes.map((n) => {
              const sub = flavorNotes.subcategories.find(
                (s) => s.id === n.subcategoryId,
              );
              const cat = sub
                ? flavorNotes.categories.find((c) => c.id === sub.categoryId)
                : undefined;
              return (
                <tr key={n.id}>
                  <td>{cat?.name ?? ""}</td>
                  <td>{sub?.name ?? ""}</td>
                  <td>{n.name}</td>
                  <td>{counts.byId.get(n.id) ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default FlavorWheel;
