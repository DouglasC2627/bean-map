"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = true,
  className,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();

  return (
    <section className={className}>
      <header className="mb-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={regionId}
          className="group flex w-full items-start gap-2 text-left"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground",
              !open && "-rotate-90",
            )}
          />
          <span>
            <span className="block font-display text-xl">{title}</span>
            {description && (
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {description}
              </span>
            )}
          </span>
        </button>
      </header>
      <div id={regionId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}

export default CollapsibleSection;
