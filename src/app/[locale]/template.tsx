/**
 * App Router re-mounts `template.tsx` on every navigation, so a fresh fade
 * plays when moving between routes (e.g. the map and the beans list).
 *
 * This is deliberately a CSS animation rather than a Framer `motion.div`:
 * the template wraps *every* route, so importing `motion` here pulled the
 * whole Framer animation engine (~43KB gzipped) into the shared bundle of
 * even fully static pages like the Learn articles. The global
 * `prefers-reduced-motion` rule in globals.css neutralises it.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-fade flex flex-1 flex-col">{children}</div>;
}
