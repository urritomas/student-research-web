/**
 * DOCX Diagnostic Utilities
 * Helper functions to diagnose and debug DOCX loading and editing issues
 */

/**
 * Analyze DOCX HTML content for potential issues
 */
export function analyzeDOCXContent(html: string): {
  totalImages: number;
  validImages: number;
  brokenImages: number;
  emptyImages: number;
  tables: number;
  lists: number;
  pageBreaks: number;
  contentSize: number;
  issues: string[];
} {
  const issues: string[] = [];
  
  // Count images
  const allImages = html.match(/<img[^>]*>/g) || [];
  const validImages = html.match(/<img[^>]*src="data:image[^"]*"[^>]*>/g) || [];
  const emptyImages = html.match(/<img[^>]*src=""[^>]*>/g) || [];
  const brokenImages = allImages.length - validImages.length;
  
  // Count other elements
  const tables = (html.match(/<table/g) || []).length;
  const lists = (html.match(/<[ou]l/g) || []).length;
  const pageBreaks = (html.match(/class="page-break"/g) || []).length;
  
  // Check for issues
  if (emptyImages.length > 0) {
    issues.push(`${emptyImages.length} image(s) have empty src attributes`);
  }
  
  if (brokenImages > 0) {
    issues.push(`${brokenImages} image(s) may not display correctly`);
  }
  
  if (html.length > 5 * 1024 * 1024) {
    issues.push(`Content size (${(html.length / 1024 / 1024).toFixed(2)}MB) is very large`);
  }
  
  // Check for potential cursor issues
  if (html.includes('contenteditable')) {
    issues.push('HTML contains nested contenteditable elements (may cause cursor issues)');
  }
  
  return {
    totalImages: allImages.length,
    validImages: validImages.length,
    brokenImages,
    emptyImages: emptyImages.length,
    tables,
    lists,
    pageBreaks,
    contentSize: html.length,
    issues,
  };
}

/**
 * Validate image data URLs
 */
export function validateImageDataURLs(html: string): {
  valid: boolean;
  invalidImages: string[];
  warnings: string[];
} {
  const invalidImages: string[] = [];
  const warnings: string[] = [];
  
  const imageRegex = /<img[^>]*src="([^"]*)"[^>]*>/g;
  let match;
  
  while ((match = imageRegex.exec(html)) !== null) {
    const src = match[1];
    
    if (!src) {
      invalidImages.push('Empty src attribute');
      continue;
    }
    
    if (!src.startsWith('data:image')) {
      if (!src.startsWith('http')) {
        invalidImages.push(`Invalid src: ${src.substring(0, 50)}...`);
      }
    } else {
      // Check data URL format
      const parts = src.split(',');
      if (parts.length !== 2) {
        invalidImages.push('Malformed data URL');
      } else if (parts[1].length < 100) {
        warnings.push('Suspiciously small image data');
      }
    }
  }
  
  return {
    valid: invalidImages.length === 0,
    invalidImages,
    warnings,
  };
}

/**
 * Test cursor position preservation
 */
export function testCursorPreservation(): {
  supported: boolean;
  message: string;
} {
  try {
    const selection = window.getSelection();
    if (!selection) {
      return { supported: false, message: 'Selection API not available' };
    }
    
    if (selection.rangeCount === 0) {
      return { supported: true, message: 'No active selection to test' };
    }
    
    const range = selection.getRangeAt(0);
    const { startContainer, startOffset, endContainer, endOffset } = range;
    
    // Verify we can access selection properties
    if (!startContainer || startOffset === undefined) {
      return { supported: false, message: 'Cannot access selection properties' };
    }
    
    return { supported: true, message: 'Cursor preservation should work' };
  } catch (error) {
    return { 
      supported: false, 
      message: `Selection API error: ${error instanceof Error ? error.message : 'Unknown'}` 
    };
  }
}

/**
 * Check if contentEditable is properly configured
 */
export function checkContentEditableConfig(element: HTMLElement | null): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!element) {
    issues.push('Element not found');
    return { valid: false, issues };
  }
  
  const isContentEditable = element.isContentEditable || 
    element.getAttribute('contenteditable') === 'true';
  
  if (!isContentEditable) {
    issues.push('Element is not contentEditable');
  }
  
  // Check for nested contentEditable
  const nested = element.querySelectorAll('[contenteditable="true"]');
  if (nested.length > 0) {
    issues.push(`Found ${nested.length} nested contentEditable element(s)`);
  }
  
  // Check for images
  const images = element.querySelectorAll('img');
  if (images.length > 0) {
    const brokenImages = Array.from(images).filter(img => !img.src || img.src === '');
    if (brokenImages.length > 0) {
      issues.push(`${brokenImages.length} broken image(s) in editor`);
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Generate diagnostic report
 */
export function generateDiagnosticReport(html: string, editorElement?: HTMLElement | null): string {
  const contentAnalysis = analyzeDOCXContent(html);
  const imageValidation = validateImageDataURLs(html);
  const cursorTest = testCursorPreservation();
  const editorCheck = editorElement ? checkContentEditableConfig(editorElement) : null;
  
  let report = '=== DOCX Diagnostic Report ===\n\n';
  
  // Content Analysis
  report += '📄 Content Analysis:\n';
  report += `  - Total Images: ${contentAnalysis.totalImages}\n`;
  report += `  - Valid Images: ${contentAnalysis.validImages}\n`;
  report += `  - Broken Images: ${contentAnalysis.brokenImages}\n`;
  report += `  - Tables: ${contentAnalysis.tables}\n`;
  report += `  - Lists: ${contentAnalysis.lists}\n`;
  report += `  - Page Breaks: ${contentAnalysis.pageBreaks}\n`;
  report += `  - Content Size: ${(contentAnalysis.contentSize / 1024).toFixed(2)} KB\n`;
  
  if (contentAnalysis.issues.length > 0) {
    report += '\n⚠️  Issues Found:\n';
    contentAnalysis.issues.forEach(issue => {
      report += `  - ${issue}\n`;
    });
  }
  
  // Image Validation
  report += '\n🖼️  Image Validation:\n';
  report += `  - Valid: ${imageValidation.valid ? 'YES' : 'NO'}\n`;
  if (imageValidation.invalidImages.length > 0) {
    report += `  - Invalid Images: ${imageValidation.invalidImages.length}\n`;
    imageValidation.invalidImages.slice(0, 5).forEach(img => {
      report += `    • ${img}\n`;
    });
  }
  if (imageValidation.warnings.length > 0) {
    report += '  - Warnings:\n';
    imageValidation.warnings.forEach(warning => {
      report += `    • ${warning}\n`;
    });
  }
  
  // Cursor Test
  report += '\n🖱️  Cursor Preservation:\n';
  report += `  - Supported: ${cursorTest.supported ? 'YES' : 'NO'}\n`;
  report += `  - ${cursorTest.message}\n`;
  
  // Editor Check
  if (editorCheck) {
    report += '\n✏️  Editor Configuration:\n';
    report += `  - Valid: ${editorCheck.valid ? 'YES' : 'NO'}\n`;
    if (editorCheck.issues.length > 0) {
      report += '  - Issues:\n';
      editorCheck.issues.forEach(issue => {
        report += `    • ${issue}\n`;
      });
    }
  }
  
  report += '\n=== End Report ===\n';
  
  return report;
}

/**
 * Log diagnostic report to console
 */
export function logDiagnosticReport(html: string, editorElement?: HTMLElement | null): void {
  const report = generateDiagnosticReport(html, editorElement);
  console.log(report);
  
  // Also return structured data for programmatic use
  return {
    content: analyzeDOCXContent(html),
    images: validateImageDataURLs(html),
    cursor: testCursorPreservation(),
    editor: editorElement ? checkContentEditableConfig(editorElement) : null,
  } as any;
}

/**
 * Quick diagnostic check
 */
export function quickDiagnostic(html: string): { ok: boolean; message: string } {
  const analysis = analyzeDOCXContent(html);
  
  if (analysis.emptyImages > 0) {
    return { 
      ok: false, 
      message: `${analysis.emptyImages} image(s) failed to load. Check console for details.` 
    };
  }
  
  if (analysis.brokenImages > 0) {
    return { 
      ok: false, 
      message: `${analysis.brokenImages} image(s) may not display correctly.` 
    };
  }
  
  if (analysis.issues.length > 0) {
    return { 
      ok: false, 
      message: `Found ${analysis.issues.length} potential issue(s). Run full diagnostic for details.` 
    };
  }
  
  return { 
    ok: true, 
    message: `Document looks good! ${analysis.validImages} image(s), ${analysis.tables} table(s), ${analysis.lists} list(s)` 
  };
}
