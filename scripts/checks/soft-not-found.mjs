/**
 * Soft-404 detection for the external-links checker.
 *
 * 2026-10: three LinkedIn essays linked from src/data had been dead for an
 * unknown time while the ledger reported them 'live' with httpCode 200.
 * LinkedIn re-slugged them (a trailing "-" was appended) and now answers the
 * old URL with HTTP 200 and a "We can't find the page you're looking for"
 * body. A checker that trusts the status code cannot see that.
 *
 * Signatures are keyed by host on purpose. A generic phrase list was tried
 * first and was wrong immediately: Parchment's credential page ships "no
 * longer available" inside its JS bundle and rendered the credential fine in
 * a real browser. Each entry below was measured against the host's actual
 * not-found page; add one only after seeing that page, never from a guess.
 *
 * Matching runs on visible text (scripts, styles and tags stripped), so a
 * phrase that appears only inside a bundle cannot trip it.
 */

/** host suffix -> phrases that appear in the visible text of its not-found page */
export const SOFT_NOT_FOUND_SIGNATURES = {
  'linkedin.com': ["We can’t find the page you’re looking for", "We can't find the page you're looking for"],
};

/** Strip script/style blocks and tags, collapse whitespace. Linear in the input. */
export function visibleText(html) {
  return html
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

/**
 * Returns the matched phrase when `html` served from `hostname` is that
 * host's not-found page, otherwise null. Hosts without a measured signature
 * always return null.
 */
export function detectSoftNotFound(hostname, html) {
  for (const [host, phrases] of Object.entries(SOFT_NOT_FOUND_SIGNATURES)) {
    if (hostname !== host && !hostname.endsWith(`.${host}`)) continue;
    const text = visibleText(html);
    for (const phrase of phrases) {
      if (text.includes(phrase)) return phrase;
    }
  }
  return null;
}
