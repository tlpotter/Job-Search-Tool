/**
 * Decode HTML entities and strip HTML tags from description text while
 * preserving paragraph structure (block-level tags become newlines).
 */
export function cleanDescription(raw: string): string {
  return raw
    // Strip script and style blocks entirely (including content)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Convert block-level structural tags to newlines BEFORE stripping
    .replace(/<\/(p|div|h[1-6]|article|section|header|footer|blockquote)>/gi, "\n\n")
    .replace(/<\/(li|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    // List items get a bullet
    .replace(/<li\b[^>]*>/gi, "• ")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, " ")
    // Collapse horizontal whitespace but preserve newlines
    .replace(/[ \t]+/g, " ")
    // Trim spaces around newlines
    .replace(/ *\n */g, "\n")
    // Collapse 3+ newlines into 2 (one blank line max)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
