/**
 * Renders a JSON-LD block. Server component — no client JS.
 *
 * `JSON.stringify` output is escaped so a `</script>` sequence appearing in
 * any data-derived string (a bean description, an article title) can't break
 * out of the script element.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
