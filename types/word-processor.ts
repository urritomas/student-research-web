/**
 * Word Processor Type Definitions
 * For Academic Research Paper Editor
 */

export type SectionType =
  | 'title'
  | 'abstract'
  | 'introduction'
  | 'methodology'
  | 'results'
  | 'discussion'
  | 'conclusion'
  | 'references'
  | 'custom';

export type FontFamily = 'Times New Roman' | 'Arial' | 'Georgia' | 'Calibri';

export type FontSize = 10 | 11 | 12 | 14 | 16 | 18 | 20 | 24 | 28 | 32 | 36 | 42;

export type LineSpacing = 1.0 | 1.5 | 2.0;

export type TextAlign = 'left' | 'center' | 'right' | 'justify';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'paragraph';

export type PaperSizeType = 'a4' | 'letter' | 'legal' | 'a3' | 'b5' | 'us-trade' | 'custom';

export type DimensionUnit = 'mm' | 'inches';

export interface PaperSize {
  type: PaperSizeType;
  name: string;
  width: number;  // in millimeters
  height: number; // in millimeters
  widthInches: number;
  heightInches: number;
}

export interface Margins {
  top: number;    // in millimeters
  right: number;
  bottom: number;
  left: number;
  unit: DimensionUnit;
}

export interface Formatting {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  fontFamily: FontFamily;
  fontSize: FontSize;
  lineSpacing: LineSpacing;
  textAlign: TextAlign;
  headingLevel: HeadingLevel;
  listType?: 'bullet' | 'numbered' | null;
  color?: string;
  backgroundColor?: string;
}

export interface Reference {
  id: string;
  authors: string[];
  title: string;
  journal?: string;
  year: number;
  doi?: string;
  url?: string;
  pages?: string;
  volume?: string;
  issue?: string;
  publisher?: string;
  citationKey: string; // e.g., "Smith2024"
}

export interface Citation {
  id: string;
  referenceId: string;
  position: number; // Character position in document
  displayText: string; // e.g., "[1]" or "(Smith, 2024)"
}

export interface ResearchSection {
  id: string;
  type: SectionType;
  title: string;
  content: string; // HTML content
  order: number;
  collapsed: boolean;
  metadata?: {
    wordCount?: number;
    lastEdited?: Date;
  };
}

export interface Figure {
  id: string;
  caption: string;
  url?: string; // For future image support
  placeholder: string;
  order: number;
}

export interface Table {
  id: string;
  caption: string;
  rows: number;
  columns: number;
  data?: string[][]; // For future table data
  order: number;
}

export interface Equation {
  id: string;
  latex: string;
  displayMode: 'inline' | 'block';
  position: number;
}

export interface DocumentMetadata {
  wordCount: number;
  characterCount: number;
  pageCount: number;
  keywords: string[];
  lastSaved?: Date;
  created: Date;
  modified: Date;
  author?: string;
  version: number;
  paperSize?: PaperSize;
  margins?: Margins;
}

export interface Document {
  id: string;
  title: string;
  sections: ResearchSection[];
  references: Reference[];
  citations: Citation[];
  figures: Figure[];
  tables: Table[];
  equations: Equation[];
  metadata: DocumentMetadata;
  formatting: Formatting;
}

export interface User {
  id: string;
  name: string;
  email: string;
  color?: string; // For collaboration cursors
}

export interface CollaborationCursor {
  userId: string;
  userName: string;
  position: number;
  color: string;
}

export interface DocumentHistory {
  content: string;
  timestamp: Date;
}

export interface EditorState {
  document: Document;
  currentFormatting: Formatting;
  selection: {
    start: number;
    end: number;
  } | null;
  history: DocumentHistory[];
  historyIndex: number;
  autoSaveStatus: 'saved' | 'saving' | 'unsaved';
  currentSection: string | null; // Section ID
}

export interface ExportFormat {
  type: 'pdf' | 'latex' | 'docx' | 'markdown';
  options?: {
    includeReferences?: boolean;
    includeFigures?: boolean;
    paperSize?: 'letter' | 'a4';
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
}

export const DEFAULT_FORMATTING: Formatting = {
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  fontFamily: 'Times New Roman',
  fontSize: 12,
  lineSpacing: 2.0,
  textAlign: 'left',
  headingLevel: 'paragraph',
  listType: null,
};

export const ACADEMIC_MARGINS = {
  standard: { top: 1, right: 1, bottom: 1, left: 1 }, // inches
  apa: { top: 1, right: 1, bottom: 1, left: 1 },
  mla: { top: 1, right: 1, bottom: 1, left: 1 },
  chicago: { top: 1, right: 1, bottom: 1, left: 1.5 },
};

export const FONT_SIZES: FontSize[] = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42];

export const LINE_SPACING_OPTIONS: LineSpacing[] = [1.0, 1.5, 2.0];

// Paper size presets (dimensions in millimeters)
export const PAPER_SIZES: Record<PaperSizeType, PaperSize> = {
  'a4': {
    type: 'a4',
    name: 'A4',
    width: 210,
    height: 297,
    widthInches: 8.27,
    heightInches: 11.69,
  },
  'letter': {
    type: 'letter',
    name: 'Letter',
    width: 216,
    height: 279,
    widthInches: 8.5,
    heightInches: 11,
  },
  'legal': {
    type: 'legal',
    name: 'Legal',
    width: 216,
    height: 356,
    widthInches: 8.5,
    heightInches: 14,
  },
  'a3': {
    type: 'a3',
    name: 'A3',
    width: 297,
    height: 420,
    widthInches: 11.69,
    heightInches: 16.54,
  },
  'b5': {
    type: 'b5',
    name: 'B5',
    width: 176,
    height: 250,
    widthInches: 6.93,
    heightInches: 9.84,
  },
  'us-trade': {
    type: 'us-trade',
    name: 'US Trade',
    width: 152,
    height: 229,
    widthInches: 6,
    heightInches: 9,
  },
  'custom': {
    type: 'custom',
    name: 'Custom',
    width: 210,
    height: 297,
    widthInches: 8.27,
    heightInches: 11.69,
  },
};

export const DEFAULT_MARGINS: Margins = {
  top: 25.4,    // 1 inch in mm
  right: 25.4,
  bottom: 25.4,
  left: 25.4,
  unit: 'mm',
};

export const DEFAULT_PAPER_SIZE: PaperSize = PAPER_SIZES['a4'];
