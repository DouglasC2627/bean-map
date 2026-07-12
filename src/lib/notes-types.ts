/** A brew note as serialized by the /api/notes routes. */
export interface BrewNote {
  id: string;
  beanSlug: string;
  methodId: string | null;
  note: string;
  rating: number | null;
  /** yyyy-mm-dd, or null. */
  brewedAt: string | null;
  createdAt: number;
  updatedAt: number;
}

/** Minimal method reference passed to the note form's method picker. */
export interface MethodOption {
  id: string;
  name: string;
}
