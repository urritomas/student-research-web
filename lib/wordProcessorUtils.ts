/**
 * Word Processor Utility Functions
 */

import { 
  Document, 
  ResearchSection, 
  Reference, 
  DocumentMetadata, 
  DEFAULT_FORMATTING,
  PaperSize,
  PaperSizeType,
  Margins,
  PAPER_SIZES,
  DEFAULT_PAPER_SIZE,
  DEFAULT_MARGINS,
  DimensionUnit,
} from '@/types/word-processor';

/**
 * Calculate word count from HTML content
 */
export function countWords(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length === 0 ? 0 : text.split(' ').length;
}

/**
 * Calculate character count from HTML content
 */
export function countCharacters(html: string): number {
  const text = html.replace(/<[^>]*>/g, '');
  return text.length;
}

/**
 * Estimate page count (assuming ~250 words per page)
 */
export function estimatePageCount(wordCount: number): number {
  return Math.ceil(wordCount / 250);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a new empty document
 */
export function createNewDocument(): Document {
  const now = new Date();
  
  const sections: ResearchSection[] = [
    {
      id: generateId(),
      type: 'title',
      title: 'Title',
      content: '<h1>Research Paper Title</h1>',
      order: 0,
      collapsed: false,
    },
    {
      id: generateId(),
      type: 'abstract',
      title: 'Abstract',
      content: '<p>Enter your abstract here...</p>',
      order: 1,
      collapsed: false,
    },
    {
      id: generateId(),
      type: 'introduction',
      title: 'Introduction',
      content: '<p>Enter your introduction here...</p>',
      order: 2,
      collapsed: false,
    },
    {
      id: generateId(),
      type: 'methodology',
      title: 'Methodology',
      content: '<p>Describe your methodology here...</p>',
      order: 3,
      collapsed: false,
    },
    {
      id: generateId(),
      type: 'results',
      title: 'Results',
      content: '<p>Present your results here...</p>',
      order: 4,
      collapsed: false,
    },
    {
      id: generateId(),
      type: 'discussion',
      title: 'Discussion',
      content: '<p>Discuss your findings here...</p>',
      order: 5,
      collapsed: false,
    },
    {
      id: generateId(),
      type: 'conclusion',
      title: 'Conclusion',
      content: '<p>Conclude your paper here...</p>',
      order: 6,
      collapsed: false,
    },
    {
      id: generateId(),
      type: 'references',
      title: 'References',
      content: '<p>References will appear here...</p>',
      order: 7,
      collapsed: false,
    },
  ];

  const metadata: DocumentMetadata = {
    wordCount: 0,
    characterCount: 0,
    pageCount: 0,
    keywords: [],
    created: now,
    modified: now,
    version: 1,
    paperSize: DEFAULT_PAPER_SIZE,
    margins: DEFAULT_MARGINS,
  };

  return {
    id: generateId(),
    title: 'Untitled Research Paper',
    sections,
    references: [],
    citations: [],
    figures: [],
    tables: [],
    equations: [],
    metadata,
    formatting: DEFAULT_FORMATTING,
  };
}

/**
 * Update document metadata
 */
export function updateDocumentMetadata(document: Document): Document {
  const totalWordCount = document.sections.reduce(
    (total, section) => total + countWords(section.content),
    0
  );
  const totalCharCount = document.sections.reduce(
    (total, section) => total + countCharacters(section.content),
    0
  );

  return {
    ...document,
    metadata: {
      ...document.metadata,
      wordCount: totalWordCount,
      characterCount: totalCharCount,
      pageCount: estimatePageCount(totalWordCount),
      modified: new Date(),
    },
  };
}

/**
 * Save document to localStorage
 */
export function saveDocumentToLocalStorage(document: Document): void {
  try {
    const updated = updateDocumentMetadata(document);
    localStorage.setItem(`document-${document.id}`, JSON.stringify(updated));
    localStorage.setItem('lastDocumentId', document.id);
  } catch (error) {
    console.error('Failed to save document:', error);
  }
}

/**
 * Load document from localStorage
 */
export function loadDocumentFromLocalStorage(documentId: string): Document | null {
  try {
    const stored = localStorage.getItem(`document-${documentId}`);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load document:', error);
    return null;
  }
}

/**
 * Get last document ID
 */
export function getLastDocumentId(): string | null {
  return localStorage.getItem('lastDocumentId');
}

/**
 * Format reference in APA style
 */
export function formatReferenceAPA(ref: Reference): string {
  const authors = ref.authors.join(', ');
  const year = ref.year;
  const title = ref.title;
  const journal = ref.journal || '';
  const volume = ref.volume || '';
  const issue = ref.issue ? `(${ref.issue})` : '';
  const pages = ref.pages ? `, ${ref.pages}` : '';
  const doi = ref.doi ? `. https://doi.org/${ref.doi}` : '';

  if (journal) {
    return `${authors} (${year}). ${title}. ${journal}, ${volume}${issue}${pages}${doi}`;
  } else {
    return `${authors} (${year}). ${title}${doi}`;
  }
}

/**
 * Apply formatting command to selection
 */
export function applyFormatting(command: string, value?: string): void {
  document.execCommand(command, false, value);
}

/**
 * Get current formatting state from selection
 */
export function getCurrentFormatting(): Partial<any> {
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    strikethrough: document.queryCommandState('strikethrough'),
  };
}

/**
 * Insert citation placeholder
 */
export function insertCitation(citationText: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const citation = document.createElement('span');
  citation.className = 'citation';
  citation.contentEditable = 'false';
  citation.textContent = citationText;
  citation.style.cssText = 'color: #0066cc; cursor: pointer; font-weight: 500;';
  
  range.deleteContents();
  range.insertNode(citation);
  
  // Move cursor after citation
  range.setStartAfter(citation);
  range.setEndAfter(citation);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Insert equation placeholder
 */
export function insertEquation(latex: string = 'E = mc^2'): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const equation = document.createElement('div');
  equation.className = 'equation-placeholder';
  equation.contentEditable = 'false';
  equation.textContent = `[Equation: ${latex}]`;
  equation.style.cssText = `
    background: #f0f0f0;
    border: 1px dashed #ccc;
    padding: 10px;
    margin: 10px 0;
    text-align: center;
    font-style: italic;
    cursor: pointer;
  `;
  
  range.deleteContents();
  range.insertNode(equation);
  
  // Move cursor after equation
  range.setStartAfter(equation);
  range.setEndAfter(equation);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Insert figure placeholder
 */
export function insertFigure(caption: string = 'Figure caption'): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const figure = document.createElement('div');
  figure.className = 'figure-placeholder';
  figure.contentEditable = 'false';
  figure.innerHTML = `
    <div style="background: #f9f9f9; border: 2px dashed #ddd; padding: 40px; margin: 15px 0; text-align: center;">
      <div style="color: #999; font-size: 14px; margin-bottom: 10px;">[Figure will appear here]</div>
      <div style="font-style: italic; font-size: 12px;">Figure: ${caption}</div>
    </div>
  `;
  
  range.deleteContents();
  range.insertNode(figure);
  
  // Move cursor after figure
  range.setStartAfter(figure);
  range.setEndAfter(figure);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Insert table placeholder
 */
export function insertTable(rows: number = 3, cols: number = 3, caption: string = 'Table caption'): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  const tableContainer = document.createElement('div');
  tableContainer.className = 'table-placeholder';
  tableContainer.contentEditable = 'false';
  
  let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">';
  for (let i = 0; i < rows; i++) {
    tableHTML += '<tr>';
    for (let j = 0; j < cols; j++) {
      tableHTML += '<td style="border: 1px solid #ddd; padding: 8px;">Cell</td>';
    }
    tableHTML += '</tr>';
  }
  tableHTML += '</table>';
  tableHTML += `<div style="font-style: italic; font-size: 12px; text-align: center;">Table: ${caption}</div>`;
  
  tableContainer.innerHTML = tableHTML;
  
  range.deleteContents();
  range.insertNode(tableContainer);
  
  // Move cursor after table
  range.setStartAfter(tableContainer);
  range.setEndAfter(tableContainer);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Export to LaTeX (placeholder)
 */
export function exportToLaTeX(document: Document): string {
  console.log('Exporting to LaTeX...', document);
  let latex = '\\documentclass{article}\n\\begin{document}\n\n';
  
  document.sections.forEach((section) => {
    if (section.type === 'title') {
      latex += `\\title{${document.title}}\n\\maketitle\n\n`;
    } else {
      latex += `\\section{${section.title}}\n`;
      const content = section.content.replace(/<[^>]*>/g, '');
      latex += `${content}\n\n`;
    }
  });
  
  latex += '\\end{document}';
  return latex;
}

/**
 * Export to DOCX (placeholder)
 */
export function exportToDOCX(document: Document): void {
  console.log('Export to DOCX would happen here', document);
  alert('DOCX export feature coming soon!');
}

/**
 * Export to PDF (placeholder)
 */
export function exportToPDF(document: Document): void {
  console.log('Export to PDF would happen here', document);
  alert('PDF export feature coming soon! Use browser Print to PDF for now.');
}

/**
 * Get paper size by type
 */
export function getPaperSize(type: PaperSizeType): PaperSize {
  return PAPER_SIZES[type];
}

/**
 * Create custom paper size
 */
export function createCustomPaperSize(widthMm: number, heightMm: number): PaperSize {
  return {
    type: 'custom',
    name: 'Custom',
    width: widthMm,
    height: heightMm,
    widthInches: widthMm / 25.4,
    heightInches: heightMm / 25.4,
  };
}

/**
 * Convert millimeters to inches
 */
export function mmToInches(mm: number): number {
  return mm / 25.4;
}

/**
 * Convert inches to millimeters
 */
export function inchesToMm(inches: number): number {
  return inches * 25.4;
}

/**
 * Update document paper size
 */
export function updatePaperSize(document: Document, paperSize: PaperSize): Document {
  return {
    ...document,
    metadata: {
      ...document.metadata,
      paperSize,
      modified: new Date(),
    },
  };
}

/**
 * Update document margins
 */
export function updateMargins(document: Document, margins: Margins): Document {
  return {
    ...document,
    metadata: {
      ...document.metadata,
      margins,
      modified: new Date(),
    },
  };
}

/**
 * Save paper size preference to localStorage
 */
export function savePaperSizePreference(paperSize: PaperSize): void {
  try {
    localStorage.setItem('preferredPaperSize', JSON.stringify(paperSize));
  } catch (error) {
    console.error('Failed to save paper size preference:', error);
  }
}

/**
 * Load paper size preference from localStorage
 */
export function loadPaperSizePreference(): PaperSize | null {
  try {
    const stored = localStorage.getItem('preferredPaperSize');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to load paper size preference:', error);
    return null;
  }
}

/**
 * Save dimension unit preference to localStorage
 */
export function saveDimensionUnitPreference(unit: DimensionUnit): void {
  try {
    localStorage.setItem('preferredDimensionUnit', unit);
  } catch (error) {
    console.error('Failed to save dimension unit preference:', error);
  }
}

/**
 * Load dimension unit preference from localStorage
 */
export function loadDimensionUnitPreference(): DimensionUnit {
  try {
    const stored = localStorage.getItem('preferredDimensionUnit');
    return (stored as DimensionUnit) || 'mm';
  } catch (error) {
    console.error('Failed to load dimension unit preference:', error);
    return 'mm';
  }
}

/**
 * Format paper dimensions for display
 */
export function formatPaperDimensions(paperSize: PaperSize, unit: DimensionUnit): string {
  if (unit === 'mm') {
    return `${paperSize.width} × ${paperSize.height} mm`;
  } else {
    return `${paperSize.widthInches.toFixed(2)} × ${paperSize.heightInches.toFixed(2)} in`;
  }
}
