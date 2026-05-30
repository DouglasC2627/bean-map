import { cn } from "@/lib/utils";

/** A shimmering placeholder block. See `.skeleton` in globals.css. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-md", className)}
      {...props}
    />
  );
}
