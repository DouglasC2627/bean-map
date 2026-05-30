import { Skeleton } from "@/components/ui/skeleton";

export default function BeansLoading() {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 pb-24">
      <header className="mb-6 text-center">
        <Skeleton className="mx-auto h-8 w-40" />
        <Skeleton className="mx-auto mt-2 h-4 w-64" />
      </header>

      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-40" />
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <li
            key={i}
            className="rounded-lg border border-border bg-surface/60 p-4"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-5 w-3/4" />
            <Skeleton className="mt-2 h-3 w-32" />
            <div className="mt-3 flex flex-wrap gap-1">
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-10 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-28" />
          </li>
        ))}
      </ul>
    </div>
  );
}
