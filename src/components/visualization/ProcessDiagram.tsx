import { Fragment } from "react";

export interface ProcessStep {
  /** Short stage name, e.g. "Depulp". */
  label: string;
  /** Optional one-word detail shown under the label, e.g. "12–36h". */
  sub?: string;
}

interface ProcessDiagramProps {
  steps: ProcessStep[];
  /** Index of the stage that most defines the method (gets the accent fill). */
  highlight?: number;
  /** Caption rendered under the diagram. */
  caption?: string;
}

const NODE_W = 116;
const NODE_H = 56;
const GAP = 34; // space for the connecting arrow
const PAD = 4;

/**
 * A pure-SVG, theme-aware "pipeline" diagram of a coffee processing workflow.
 * Renders a horizontal flow of labelled stages joined by arrows. No client JS —
 * it's a server component embedded in MDX processing articles.
 */
export function ProcessDiagram({ steps, highlight, caption }: ProcessDiagramProps) {
  const width = PAD * 2 + steps.length * NODE_W + (steps.length - 1) * GAP;
  const height = PAD * 2 + NODE_H + 18; // room for the sub labels below
  const cy = PAD + NODE_H / 2;

  const accent = "var(--color-roast-medium, #6F4E37)";
  const base = "var(--color-tan, #D4C4A8)";

  return (
    <figure className="my-5 not-prose">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="h-auto w-full min-w-[520px] max-w-full"
          role="img"
          aria-label={
            caption ??
            `Processing flow: ${steps.map((s) => s.label).join(" then ")}`
          }
        >
          <defs>
            <marker
              id="pd-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill={accent} />
            </marker>
          </defs>

          {steps.map((step, i) => {
            const x = PAD + i * (NODE_W + GAP);
            const isHot = i === highlight;
            const arrowFromX = x + NODE_W;
            const arrowToX = arrowFromX + GAP;
            return (
              <Fragment key={`${step.label}-${i}`}>
                {i < steps.length - 1 && (
                  <line
                    x1={arrowFromX + 4}
                    y1={cy}
                    x2={arrowToX - 4}
                    y2={cy}
                    stroke={accent}
                    strokeWidth={2}
                    markerEnd="url(#pd-arrow)"
                  />
                )}
                <rect
                  x={x}
                  y={PAD}
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  fill={isHot ? accent : "transparent"}
                  stroke={isHot ? accent : base}
                  strokeWidth={2}
                />
                <text
                  x={x + NODE_W / 2}
                  y={cy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-display"
                  fontSize="14"
                  fill={isHot ? "var(--color-cream, #FAF6F1)" : "currentColor"}
                >
                  {step.label}
                </text>
                {step.sub && (
                  <text
                    x={x + NODE_W / 2}
                    y={PAD + NODE_H + 13}
                    textAnchor="middle"
                    fontSize="10"
                    className="font-mono"
                    fill="currentColor"
                    opacity={0.6}
                  >
                    {step.sub}
                  </text>
                )}
              </Fragment>
            );
          })}
        </svg>
      </div>
      {caption && (
        <figcaption className="mt-1 text-center text-xs text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

export default ProcessDiagram;
