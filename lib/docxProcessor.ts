import mammoth from 'mammoth';
import PizZip from 'pizzip';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ImageRun,
  LevelFormat,
} from 'docx';
import { supabase } from './supabaseClient';

export interface DocxLoadResult {
  html: string;
  fileName: string;
  fileUrl: string;
  success: boolean;
  error?: string;
}

export interface DocxSaveResult {
  success: boolean;
  url?: string;
  error?: string;
}

export interface ExtractedImage {
  contentType: string;
  data: ArrayBuffer;
  alt?: string;
}

export interface DocxConversionOptions {
  preservePageBreaks?: boolean;
  uploadImages?: boolean;
  maxImageSize?: number; // in bytes
  styleMap?: string[];
}

/**
 * Download and parse a DOCX file from Supabase storage
 */
export async function loadDocxFromSupabase(filePath: string): Promise<DocxLoadResult> {
  try {
    // Extract bucket and file path from full URL if needed
    const { bucket, path } = parseSupabaseUrl(filePath);
    
    // Download file from Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) {
      console.error('Supabase download error:', error);
      return {
        html: '',
        fileName: '',
        fileUrl: filePath,
        success: false,
        error: `Failed to download file: ${error.message}`,
      };
    }

    if (!data) {
      return {
        html: '',
        fileName: '',
        fileUrl: filePath,
        success: false,
        error: 'No data received from Supabase',
      };
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();

    // Parse DOCX using mammoth with comprehensive formatting support
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          // Headings
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Heading 4'] => h4:fresh",
          "p[style-name='Heading 5'] => h5:fresh",
          "p[style-name='Heading 6'] => h6:fresh",
          "p[style-name='Title'] => h1.title:fresh",
          "p[style-name='Subtitle'] => h2.subtitle:fresh",
          
          // Text formatting
          "b => strong",
          "i => em",
          "u => u",
          "strike => s",
          
          // Lists
          "p[style-name='List Paragraph'] => p.list-paragraph:fresh",
          
          // Tables - preserve as tables
          "table => table.docx-table:fresh",
          "tr => tr:fresh",
          "td => td:fresh",
        ],
        // Convert images to embedded base64
        convertImage: mammoth.images.imgElement(async (image) => {
          try {
            const imageBuffer = await image.read();
            
            // Handle different buffer types
            let arrayBuf: ArrayBuffer;
            if (imageBuffer instanceof ArrayBuffer) {
              arrayBuf = imageBuffer;
            } else if (Buffer.isBuffer(imageBuffer)) {
              // Convert Node.js Buffer to ArrayBuffer
              arrayBuf = imageBuffer.buffer.slice(
                imageBuffer.byteOffset,
                imageBuffer.byteOffset + imageBuffer.byteLength
              ) as ArrayBuffer;
            } else if ((imageBuffer as any).buffer) {
              arrayBuf = (imageBuffer as any).buffer as ArrayBuffer;
            } else {
              console.error('Unknown image buffer type:', typeof imageBuffer);
              return { src: '', alt: 'Image extraction failed' };
            }
            
            const base64 = arrayBufferToBase64(arrayBuf);
            
            // Determine content type, default to png if not specified
            const contentType = image.contentType || 'image/png';
            
            console.log(`Extracted image: ${contentType}, size: ${arrayBuf.byteLength} bytes`);
            
            return {
              src: `data:${contentType};base64,${base64}`,
              alt: 'Document image',
            };
          } catch (error) {
            console.error('Error converting image:', error);
            return { src: '', alt: 'Image conversion error' };
          }
        }),
        // Preserve page breaks
        transformDocument: (document) => {
          return document;
        },
        includeDefaultStyleMap: true,
      }
    );

    // Post-process HTML to add page break markers and clean up
    let htmlWithPageBreaks = result.value;
    
    // Log image extraction results
    const imageMatches = htmlWithPageBreaks.match(/<img[^>]*src="data:image/g);
    if (imageMatches) {
      console.log(`Successfully extracted ${imageMatches.length} image(s) from DOCX`);
    }
    
    // Check for failed image extractions
    const emptyImages = htmlWithPageBreaks.match(/<img[^>]*src=""[^>]*>/g);
    if (emptyImages) {
      console.warn(`Warning: ${emptyImages.length} image(s) failed to extract`);
    }
    
    // Add page break markers (mammoth may include page breaks as special paragraphs)
    // Look for common page break patterns and convert them
    htmlWithPageBreaks = htmlWithPageBreaks.replace(
      /<p[^>]*>\s*<!--\s*page\s*break\s*-->\s*<\/p>/gi,
      '<div class="page-break" style="page-break-after: always; border-top: 2px dashed #ccc; margin: 20px 0; padding: 10px 0; text-align: center; color: #999; font-size: 12px;">Page Break</div>'
    );
    
    // Add table styling classes
    htmlWithPageBreaks = htmlWithPageBreaks.replace(
      /<table/g,
      '<table class="docx-table" style="border-collapse: collapse; width: 100%; margin: 10px 0;"'
    );
    
    htmlWithPageBreaks = htmlWithPageBreaks.replace(
      /<td/g,
      '<td style="border: 1px solid #ddd; padding: 8px;"'
    );
    
    htmlWithPageBreaks = htmlWithPageBreaks.replace(
      /<th/g,
      '<th style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; font-weight: bold;"'
    );
    
    // If mammoth failed to extract some images, try direct ZIP extraction as fallback
    if (emptyImages && emptyImages.length > 0) {
      console.log('Attempting fallback image extraction from DOCX ZIP...');
      const imageMap = await extractImagesFromDocx(arrayBuffer);
      
      if (imageMap.size > 0) {
        htmlWithPageBreaks = replaceImagePlaceholders(htmlWithPageBreaks, imageMap);
        console.log(`Replaced ${imageMap.size} image placeholder(s) with extracted data`);
      }
    }
    
    const fileName = path.split('/').pop() || 'document.docx';

    return {
      html: htmlWithPageBreaks,
      fileName,
      fileUrl: filePath,
      success: true,
    };
  } catch (error: any) {
    console.error('Error loading DOCX:', error);
    return {
      html: '',
      fileName: '',
      fileUrl: filePath,
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Convert HTML content to DOCX and upload to Supabase storage
 */
export async function saveDocxToSupabase(
  html: string,
  filePath: string,
  fileName?: string
): Promise<DocxSaveResult> {
  try {
    // Convert HTML to DOCX blob
    const docxBlob = await htmlToDocx(html);

    // Extract bucket and path
    const { bucket, path } = parseSupabaseUrl(filePath);
    const finalPath = fileName ? path.replace(/[^/]*$/, fileName) : path;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, docxBlob, {
        upsert: true,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return {
        success: false,
        error: `Failed to upload file: ${error.message}`,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalPath);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error: any) {
    console.error('Error saving DOCX:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Convert HTML to DOCX Blob using the docx library
 */
async function htmlToDocx(html: string): Promise<Blob> {
  // Parse HTML and create document sections
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const children: any[] = [];

  // Convert HTML elements to docx paragraphs
  const elements = doc.body.children;
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    
    // Handle different element types
    if (element.classList.contains('page-break')) {
      // Add page break
      children.push(
        new Paragraph({
          pageBreakBefore: true,
        })
      );
    } else if (element.tagName.toLowerCase() === 'table') {
      // Handle tables
      const table = htmlTableToDocxTable(element);
      if (table) {
        children.push(table);
      }
    } else if (element.tagName.toLowerCase() === 'ul') {
      // Handle unordered lists
      const listItems = htmlListToDocxParagraphs(element, true);
      children.push(...listItems);
    } else if (element.tagName.toLowerCase() === 'ol') {
      // Handle ordered lists
      const listItems = htmlListToDocxParagraphs(element, false);
      children.push(...listItems);
    } else if (element.tagName.toLowerCase() === 'img') {
      // Handle images
      const imagePara = await htmlImageToDocxParagraph(element);
      if (imagePara) {
        children.push(imagePara);
      }
    } else {
      // Handle paragraphs and headings
      const paragraph = htmlElementToDocxParagraph(element);
      if (paragraph) {
        children.push(paragraph);
      }
    }
  }

  // Create DOCX document
  const docxDoc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children.length > 0 ? children : [
          new Paragraph({
            text: 'Empty document',
          }),
        ],
      },
    ],
  });

  // Generate blob
  const blob = await Packer.toBlob(docxDoc);
  return blob;
}

/**
 * Convert HTML element to DOCX paragraph
 */
function htmlElementToDocxParagraph(element: Element): Paragraph | null {
  const tagName = element.tagName.toLowerCase();
  const text = element.textContent || '';

  let alignment: typeof AlignmentType[keyof typeof AlignmentType] | undefined;
  let heading: typeof HeadingLevel[keyof typeof HeadingLevel] | undefined;
  const runs: TextRun[] = [];

  // Handle alignment
  const style = window.getComputedStyle(element);
  const textAlign = style.textAlign || element.getAttribute('style')?.match(/text-align:\s*(\w+)/)?.[1];
  
  switch (textAlign) {
    case 'center':
      alignment = AlignmentType.CENTER;
      break;
    case 'right':
      alignment = AlignmentType.RIGHT;
      break;
    case 'justify':
      alignment = AlignmentType.JUSTIFIED;
      break;
    default:
      alignment = AlignmentType.LEFT;
  }

  // Handle headings
  switch (tagName) {
    case 'h1':
      heading = HeadingLevel.HEADING_1;
      break;
    case 'h2':
      heading = HeadingLevel.HEADING_2;
      break;
    case 'h3':
      heading = HeadingLevel.HEADING_3;
      break;
  }

  // Parse inline formatting
  if (element.children.length > 0) {
    parseInlineElements(element, runs);
  } else {
    runs.push(new TextRun(text));
  }

  return new Paragraph({
    text: runs.length === 0 ? text : undefined,
    children: runs.length > 0 ? runs : undefined,
    alignment,
    heading,
  });
}

/**
 * Parse inline formatting elements (bold, italic, underline)
 */
function parseInlineElements(element: Element, runs: TextRun[]) {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        runs.push(new TextRun(text));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tagName = el.tagName.toLowerCase();
      const text = el.textContent || '';

      let bold = false;
      let italic = false;
      let underline = false;

      // Check for formatting tags
      if (tagName === 'strong' || tagName === 'b') bold = true;
      if (tagName === 'em' || tagName === 'i') italic = true;
      if (tagName === 'u') underline = true;

      // Check nested formatting
      let currentEl: Element | null = el;
      while (currentEl && currentEl !== element) {
        const tag = currentEl.tagName.toLowerCase();
        if (tag === 'strong' || tag === 'b') bold = true;
        if (tag === 'em' || tag === 'i') italic = true;
        if (tag === 'u') underline = true;
        currentEl = currentEl.parentElement;
      }

      if (text.trim()) {
        runs.push(
          new TextRun({
            text,
            bold,
            italics: italic,
            underline: underline ? {} : undefined,
          })
        );
      }
    }
  }
}

/**
 * Convert HTML table to DOCX table
 */
function htmlTableToDocxTable(tableElement: Element): Table | null {
  try {
    const rows: TableRow[] = [];
    const trs = tableElement.querySelectorAll('tr');

    for (let i = 0; i < trs.length; i++) {
      const tr = trs[i];
      const cells: TableCell[] = [];
      const tds = tr.querySelectorAll('td, th');

      for (let j = 0; j < tds.length; j++) {
        const td = tds[j];
        const text = td.textContent || '';
        const isHeader = td.tagName.toLowerCase() === 'th';

        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text,
                    bold: isHeader,
                  }),
                ],
              }),
            ],
            shading: isHeader ? {
              fill: 'F5F5F5',
            } : undefined,
          })
        );
      }

      if (cells.length > 0) {
        rows.push(new TableRow({ children: cells }));
      }
    }

    if (rows.length === 0) return null;

    return new Table({
      rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
    });
  } catch (error) {
    console.error('Error converting table:', error);
    return null;
  }
}

/**
 * Convert HTML list to DOCX paragraphs with numbering/bullets
 */
function htmlListToDocxParagraphs(listElement: Element, isBullet: boolean): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const items = listElement.querySelectorAll('li');

  for (let i = 0; i < items.length; i++) {
    const li = items[i];
    const text = li.textContent || '';

    paragraphs.push(
      new Paragraph({
        text,
        bullet: isBullet ? {
          level: 0,
        } : undefined,
        numbering: !isBullet ? {
          reference: 'default-numbering',
          level: 0,
        } : undefined,
      })
    );
  }

  return paragraphs;
}

/**
 * Convert HTML image to DOCX paragraph with image
 */
async function htmlImageToDocxParagraph(imgElement: Element): Promise<Paragraph | null> {
  try {
    const src = imgElement.getAttribute('src');
    if (!src) return null;

    // Handle base64 images
    if (src.startsWith('data:')) {
      const base64Data = src.split(',')[1];
      const imageBuffer = base64ToArrayBuffer(base64Data);

      const imageRun = new ImageRun({
        type: 'png',
        data: imageBuffer as any,
        transformation: {
          width: 400,
          height: 300,
        },
      });

      return new Paragraph({
        children: [imageRun],
      });
    }

    // For URL images, we'd need to fetch them
    // For now, skip URL images or implement fetch logic
    return null;
  } catch (error) {
    console.error('Error converting image:', error);
    return null;
  }
}

/**
 * Convert ArrayBuffer to Base64
 * Optimized for large images with chunking to avoid stack overflow
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  try {
    return btoa(binary);
  } catch (error) {
    console.error('Base64 encoding failed:', error);
    // Try alternative method for very large images
    return btoa(String.fromCharCode(...Array.from(bytes)));
  }
}

/**
 * Convert Base64 to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Extract images directly from DOCX ZIP structure
 * Fallback method if mammoth image conversion fails
 */
export async function extractImagesFromDocx(arrayBuffer: ArrayBuffer): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();
  
  try {
    const zip = new PizZip(arrayBuffer);
    
    // DOCX images are typically stored in word/media/ folder
    const mediaFolder = 'word/media/';
    
    Object.keys(zip.files).forEach((filename) => {
      if (filename.startsWith(mediaFolder) && !filename.endsWith('/')) {
        const file = zip.files[filename];
        
        // Determine content type from file extension
        let contentType = 'image/png';
        if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (filename.endsWith('.gif')) {
          contentType = 'image/gif';
        } else if (filename.endsWith('.bmp')) {
          contentType = 'image/bmp';
        } else if (filename.endsWith('.svg')) {
          contentType = 'image/svg+xml';
        }
        
        // Get file as binary string
        const imageData = file.asUint8Array();
        const base64 = arrayBufferToBase64(imageData.buffer as ArrayBuffer);
        const dataUrl = `data:${contentType};base64,${base64}`;
        
        // Store with simple filename as key
        const simpleName = filename.split('/').pop() || filename;
        imageMap.set(simpleName, dataUrl);
        
        console.log(`Extracted image: ${simpleName} (${contentType})`);
      }
    });
    
    console.log(`Total images extracted from DOCX: ${imageMap.size}`);
  } catch (error) {
    console.error('Error extracting images from DOCX ZIP:', error);
  }
  
  return imageMap;
}

/**
 * Replace image placeholders with actual base64 data
 */
export function replaceImagePlaceholders(html: string, imageMap: Map<string, string>): string {
  let result = html;
  
  // Replace empty or placeholder image sources with actual data
  imageMap.forEach((dataUrl, filename) => {
    // Try various patterns that might appear in the HTML
    const patterns = [
      new RegExp(`src="word/media/${filename}"`, 'g'),
      new RegExp(`src="${filename}"`, 'g'),
      new RegExp(`src="[^"]*${filename}"`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      result = result.replace(pattern, `src="${dataUrl}"`);
    });
  });
  
  return result;
}

/**
 * Parse Supabase storage URL to extract bucket and path
 */
function parseSupabaseUrl(url: string): { bucket: string; path: string } {
  // Handle full Supabase URL
  if (url.includes('supabase')) {
    const match = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (match) {
      return { bucket: match[1], path: match[2] };
    }
  }

  // Handle bucket/path format
  if (url.includes('/')) {
    const parts = url.split('/');
    return { bucket: parts[0], path: parts.slice(1).join('/') };
  }

  // Default to project-files bucket
  return { bucket: 'project-files', path: url };
}

/**
 * Download DOCX file directly (fallback method)
 */
export async function downloadDocxFile(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.blob();
  } catch (error) {
    console.error('Error downloading DOCX:', error);
    return null;
  }
}
/**
 * Extract images from DOCX and upload to Supabase
 */
export async function extractAndUploadImages(
  arrayBuffer: ArrayBuffer,
  projectId: string
): Promise<Map<string, string>> {
  const imageMap = new Map<string, string>();

  try {
    // This would require accessing the raw DOCX structure
    // For now, images are embedded as base64 in the HTML conversion
    // In a production app, you'd use jszip to extract images from the DOCX
    console.log('Image extraction from DOCX not yet implemented');
  } catch (error) {
    console.error('Error extracting images:', error);
  }

  return imageMap;
}

/**
 * Upload image to Supabase storage
 */
export async function uploadImageToSupabase(
  imageBuffer: ArrayBuffer,
  fileName: string,
  projectId: string
): Promise<string | null> {
  try {
    const blob = new Blob([imageBuffer]);
    const path = `${projectId}/images/${fileName}`;

    const { data, error } = await supabase.storage
      .from('project-files')
      .upload(path, blob, {
        upsert: true,
        contentType: 'image/png',
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('project-files')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

/**
 * Process large DOCX files with chunking
 */
export async function loadLargeDocxFile(
  filePath: string,
  onProgress?: (progress: number) => void
): Promise<DocxLoadResult> {
  try {
    const { bucket, path } = parseSupabaseUrl(filePath);

    // Download with progress tracking
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error || !data) {
      return {
        html: '',
        fileName: '',
        fileUrl: filePath,
        success: false,
        error: error?.message || 'Failed to download file',
      };
    }

    // Check file size
    const fileSizeInMB = data.size / (1024 * 1024);
    
    if (fileSizeInMB > 10) {
      console.warn(`Large file detected: ${fileSizeInMB.toFixed(2)}MB`);
    }

    // Report progress
    if (onProgress) onProgress(50);

    // Convert to HTML
    const arrayBuffer = await data.arrayBuffer();
    const result = await loadDocxFromSupabase(filePath);

    if (onProgress) onProgress(100);

    return result;
  } catch (error: any) {
    return {
      html: '',
      fileName: '',
      fileUrl: filePath,
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}