// Turns a raw scraped description (real HTML from Workday/iCIMS, or plain
// text from Oracle) into a short, safe excerpt for the job detail page.
//
// Two deliberate choices here, both from the same reasoning: this content is
// untrusted (scraped from external career sites) and reproducing it in full
// raises more copyright/reuse exposure than a job board needs to carry —
// the detail page's real job is to point people at the original posting,
// not republish it wholesale.
//   1. Strip to a conservative tag allowlist with zero attributes — no
//      links, images, scripts, iframes, or inline styles survive, so there's
//      nothing here that can misdirect a click or inject markup.
//   2. Truncate to a short excerpt at a block or word boundary, never
//      mid-tag, and always paired (by the caller) with a prominent link back
//      to the original posting for the full text.

import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "ul", "ol", "li", "strong", "b", "em", "i", "br"];
const EXCERPT_TARGET_CHARS = 600; // visible-text budget, not counting markup
const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {},
  // Drops disallowed tags AND their text content — not just their tags.
  // Needed for iCIMS pages, where non-content chrome sits alongside the real
  // description text rather than cleanly outside an allowlisted wrapper.
  disallowedTagsMode: "discard",
};
const TEXT_ONLY_OPTIONS = { allowedTags: [], allowedAttributes: {} };

function visibleTextLength(html) {
  return sanitizeHtml(html, TEXT_ONLY_OPTIONS).length;
}

// Source HTML is often full of "&nbsp;"-only or otherwise blank <p> tags
// used purely for visual spacing in the original CMS.
function hasVisibleText(html) {
  return sanitizeHtml(html, TEXT_ONLY_OPTIONS).replace(/[\s ]+/g, "").length > 0;
}

function truncateAtWordBoundary(text, limit) {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

// Plain-text (no markup at all) excerpt for feeding an LLM prompt — a
// different use case from sanitizeAndExcerpt's public, tag-preserving HTML
// excerpt. Higher default character budget since this never gets displayed
// or truncated at a visual boundary, just read by the model.
export function toPlainTextExcerpt(rawInput, { isPlainText = false, maxChars = 2000 } = {}) {
  if (!rawInput) return null;
  const text = isPlainText ? rawInput.trim() : sanitizeHtml(rawInput, TEXT_ONLY_OPTIONS);
  return text ? truncateAtWordBoundary(text, maxChars) : null;
}

export function sanitizeAndExcerpt(rawInput, { isPlainText = false } = {}) {
  if (!rawInput) return { excerptHtml: null, isTruncated: false };

  if (isPlainText) {
    const text = sanitizeHtml(rawInput, TEXT_ONLY_OPTIONS);
    const truncated = truncateAtWordBoundary(text, EXCERPT_TARGET_CHARS);
    return { excerptHtml: `<p>${truncated}</p>`, isTruncated: truncated.endsWith("…") };
  }

  const cleanHtml = sanitizeHtml(rawInput, SANITIZE_OPTIONS);
  const blocks = (cleanHtml.match(/<(p|ul|ol)>[\s\S]*?<\/\1>/g) ?? [cleanHtml]).filter(hasVisibleText);

  let used = 0;
  let isTruncated = false;
  const kept = [];

  for (const block of blocks) {
    const len = visibleTextLength(block);
    if (used + len <= EXCERPT_TARGET_CHARS) {
      kept.push(block);
      used += len;
      continue;
    }
    if (kept.length === 0) {
      const innerText = sanitizeHtml(block, TEXT_ONLY_OPTIONS);
      kept.push(`<p>${truncateAtWordBoundary(innerText, EXCERPT_TARGET_CHARS)}</p>`);
    }
    isTruncated = true;
    break;
  }

  // Final pass through the sanitizer guarantees well-formed, allowlisted
  // output even if the block-splitting above mishandled an edge case.
  const excerptHtml = sanitizeHtml(kept.join(""), SANITIZE_OPTIONS);
  return { excerptHtml, isTruncated };
}
