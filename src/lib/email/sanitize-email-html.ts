import sanitizeHtml from "sanitize-html";

// Server-side sanitization for rendering a stored email body in the UI.
// Strips scripts/styles/iframes/event handlers and images (drops tracking
// pixels and remote-content leaks); keeps basic formatting + layout tables.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr", "div", "span", "blockquote", "pre", "code",
    "b", "strong", "i", "em", "u", "s", "small", "sub", "sup",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "ul", "ol", "li", "dl", "dt", "dd",
    "a",
    "table", "thead", "tbody", "tfoot", "tr", "td", "th", "caption", "colgroup", "col",
  ],
  allowedAttributes: {
    a: ["href"],
    td: ["colspan", "rowspan", "align", "valign"],
    th: ["colspan", "rowspan", "align", "valign"],
    col: ["span"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  // Force safe link behavior on every anchor.
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        target: "_blank",
        rel: "noopener noreferrer",
      },
    }),
  },
  // Drop the contents of these entirely rather than just unwrapping them.
  nonTextTags: ["style", "script", "textarea", "noscript", "title", "head"],
};

export function sanitizeEmailHtml(dirty: string | null | undefined): string | null {
  if (!dirty) return null;
  const clean = sanitizeHtml(dirty, OPTIONS).trim();
  return clean.length > 0 ? clean : null;
}
