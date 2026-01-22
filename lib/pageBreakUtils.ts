/**
 * Page Break Utilities for Word Processor
 * Handles page break detection, insertion, and removal
 */

/**
 * Standard page break HTML marker
 */
export const PAGE_BREAK_HTML = '<div class="page-break" style="page-break-after: always; border-top: 2px dashed #ccc; margin: 20px 0; padding: 10px 0; text-align: center; color: #999; font-size: 12px;">Page Break</div>';

/**
 * Extract pages split by page breaks
 */
export function extractPageBreaks(html: string): string[] {
  const breakMarker = '<div class="page-break"';
  
  if (!html.includes(breakMarker)) {
    return [html];
  }

  const parts = html.split(/<div[^>]*class="page-break"[^>]*>.*?<\/div>/);
  return parts.filter(part => part.trim().length > 0);
}

/**
 * Insert page break at cursor position in HTML
 */
export function insertPageBreakAtPosition(html: string, position: number): string {
  return html.slice(0, position) + PAGE_BREAK_HTML + html.slice(position);
}

/**
 * Remove all page breaks from HTML
 */
export function removePageBreaks(html: string): string {
  return html.replace(/<div[^>]*class="page-break"[^>]*>.*?<\/div>/g, '');
}

/**
 * Count pages based on page breaks
 */
export function countPagesWithBreaks(html: string): number {
  const pages = extractPageBreaks(html);
  return Math.max(1, pages.length);
}

/**
 * Check if HTML contains page breaks
 */
export function hasPageBreaks(html: string): boolean {
  return html.includes('class="page-break"');
}

/**
 * Insert page break at current cursor/selection in contentEditable
 */
export function insertPageBreakAtCursor(): boolean {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return false;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();

    const fragment = range.createContextualFragment(PAGE_BREAK_HTML);
    range.insertNode(fragment);

    // Move cursor after page break
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    return true;
  } catch (error) {
    console.error('Error inserting page break:', error);
    return false;
  }
}

/**
 * Convert DOCX page break markers to HTML page breaks
 */
export function convertDocxPageBreaks(html: string): string {
  // Handle various DOCX page break formats that might appear in converted HTML
  let result = html;

  // Common page break patterns from DOCX conversion
  result = result.replace(
    /<p[^>]*>\s*<!--\s*page\s*break\s*-->\s*<\/p>/gi,
    PAGE_BREAK_HTML
  );

  result = result.replace(
    /<div[^>]*>\s*<!--\s*page\s*break\s*-->\s*<\/div>/gi,
    PAGE_BREAK_HTML
  );

  result = result.replace(
    /<br[^>]*style="[^"]*page-break-before[^"]*"[^>]*>/gi,
    PAGE_BREAK_HTML
  );

  return result;
}

/**
 * Normalize page breaks to consistent format
 */
export function normalizePageBreaks(html: string): string {
  // Replace any variation of page break with standard format
  return html.replace(
    /<div[^>]*class="page-break"[^>]*>.*?<\/div>/g,
    PAGE_BREAK_HTML
  );
}

/**
 * Get page break positions in HTML
 */
export function getPageBreakPositions(html: string): number[] {
  const positions: number[] = [];
  const regex = /<div[^>]*class="page-break"[^>]*>.*?<\/div>/g;
  let match;

  while ((match = regex.exec(html)) !== null) {
    positions.push(match.index);
  }

  return positions;
}
