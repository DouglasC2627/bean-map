import type { MDXComponents } from "mdx/types";
import { BrewTimer } from "@/components/brewing/BrewTimer";
import { ProcessDiagram } from "@/components/visualization/ProcessDiagram";

export const mdxComponents: MDXComponents = {
  h1: ({ children, ...props }) => (
    <h1
      className="mb-2 font-display text-3xl leading-tight tracking-tight"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-8 mb-2 font-display text-2xl tracking-tight" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-6 mb-1 font-display text-xl tracking-tight" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="my-3 text-base leading-relaxed" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-3 list-disc space-y-1 pl-6" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-3 list-decimal space-y-1 pl-6" {...props}>
      {children}
    </ol>
  ),
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table
        className="w-full border-collapse text-left text-sm"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead
      className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground"
      {...props}
    >
      {children}
    </thead>
  ),
  tr: ({ children, ...props }) => (
    <tr className="border-b border-border/60 last:border-0" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-3 py-2 font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-3 py-2 align-top" {...props}>
      {children}
    </td>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-4 border-l-2 border-roast-medium bg-parchment/40 px-4 py-2 italic dark:bg-roast-dark/40"
      {...props}
    >
      {children}
    </blockquote>
  ),
  code: ({ children, ...props }) => (
    <code
      className="rounded bg-parchment px-1 py-0.5 font-mono text-[0.9em] text-roast-dark dark:bg-roast-dark dark:text-parchment"
      {...props}
    >
      {children}
    </code>
  ),
  a: ({ children, ...props }) => (
    <a
      className="text-roast-medium underline-offset-2 hover:underline"
      {...props}
    >
      {children}
    </a>
  ),
  Callout: ({
    title,
    children,
  }: {
    title?: string;
    children: React.ReactNode;
  }) => (
    <aside className="my-4 rounded-md border border-border bg-surface/60 p-4">
      {title && (
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </div>
      )}
      <div className="text-sm">{children}</div>
    </aside>
  ),
  BrewTimer,
  ProcessDiagram,
};
