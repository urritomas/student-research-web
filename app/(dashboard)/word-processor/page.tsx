'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Document, 
  Formatting, 
  DEFAULT_FORMATTING,
  FontFamily,
  FontSize,
  FONT_SIZES,
  PaperSize,
  PaperSizeType,
  PAPER_SIZES,
  DimensionUnit,
  Margins,
  DEFAULT_MARGINS,
} from '@/types/word-processor';
import {
  createNewDocument,
  saveDocumentToLocalStorage,
  loadDocumentFromLocalStorage,
  getLastDocumentId,
  applyFormatting,
  insertCitation,
  insertEquation,
  insertFigure,
  insertTable,
  exportToDOCX,
  exportToPDF,
  countWords,
  updatePaperSize,
  updateMargins,
  savePaperSizePreference,
  loadPaperSizePreference,
  saveDimensionUnitPreference,
  loadDimensionUnitPreference,
  formatPaperDimensions,
  createCustomPaperSize,
  mmToInches,
  inchesToMm,
} from '@/lib/wordProcessorUtils';
import {
  loadDocxFromSupabase,
  loadLargeDocxFile,
  saveDocxToSupabase,
  DocxLoadResult,
} from '@/lib/docxProcessor';
import {
  insertPageBreakAtCursor,
  extractPageBreaks,
  convertDocxPageBreaks,
  hasPageBreaks,
} from '@/lib/pageBreakUtils';
import {
  logDiagnosticReport,
  quickDiagnostic,
} from '@/lib/docxDiagnostics';

export default function WordProcessorPage() {
  const searchParams = useSearchParams();
  const [document, setDocument] = useState<Document | null>(null);
  const [content, setContent] = useState<string>('');
  const [currentFormatting, setCurrentFormatting] = useState<Formatting>(DEFAULT_FORMATTING);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [currentPaperSize, setCurrentPaperSize] = useState<PaperSize>(PAPER_SIZES['a4']);
  const [dimensionUnit, setDimensionUnit] = useState<DimensionUnit>('mm');
  const [showPaperSettings, setShowPaperSettings] = useState(false);
  const [showMoreSizes, setShowMoreSizes] = useState(false);
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [activeTab, setActiveTab] = useState<string>('home');
  
  // DOCX file handling state
  const [isLoadingDocx, setIsLoadingDocx] = useState(false);
  const [docxFileUrl, setDocxFileUrl] = useState<string | null>(null);
  const [docxFileName, setDocxFileName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSavingDocx, setIsSavingDocx] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  
  // Multi-page state
  const [pages, setPages] = useState<string[]>(['']);
  const [currentPage, setCurrentPage] = useState(0);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(0);
  const paginationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cursor position preservation
  const savedSelection = useRef<{
    anchorNode: Node | null;
    anchorOffset: number;
    focusNode: Node | null;
    focusOffset: number;
    pageIndex: number;
  } | null>(null);
  const shouldRestoreSelection = useRef(false);

  // Initialize document
  useEffect(() => {
    // Check for DOCX file URL from query params
    const fileUrl = searchParams.get('file');
    const fileName = searchParams.get('name');

    if (fileUrl) {
      // Load DOCX file from Supabase
      loadDocxFile(fileUrl, fileName || undefined);
    } else {
      // Normal initialization
      initializeNewDocument();
    }
  }, [searchParams]);

  const initializeNewDocument = () => {
    const lastId = getLastDocumentId();
    let loadedDoc: Document | null = null;
    
    if (lastId) {
      loadedDoc = loadDocumentFromLocalStorage(lastId);
    }
    
    if (!loadedDoc) {
      loadedDoc = createNewDocument();
      // Apply saved paper size preference to new documents
      const savedPaperSize = loadPaperSizePreference();
      if (savedPaperSize) {
        loadedDoc = updatePaperSize(loadedDoc, savedPaperSize);
      }
    }
    
    setDocument(loadedDoc);
    
    // Set paper size from document or default
    const paperSize = loadedDoc.metadata.paperSize || PAPER_SIZES['a4'];
    setCurrentPaperSize(paperSize);
    
    // Load dimension unit preference
    const savedUnit = loadDimensionUnitPreference();
    setDimensionUnit(savedUnit);
    
    // Set initial content from first section or empty
    const initialContent = loadedDoc.sections.length > 0 
      ? loadedDoc.sections.map(s => s.content).join('') 
      : '<p>Start typing your document here...</p>';
    setContent(initialContent);
    setPages([initialContent]);
    updateCounts(initialContent);
    
    // Initialize history
    historyRef.current = [initialContent];
    historyIndexRef.current = 0;
  };

  const loadDocxFile = async (fileUrl: string, fileName?: string) => {
    setIsLoadingDocx(true);
    setLoadError(null);
    setLoadProgress(0);

    try {
      // Use large file loader with progress tracking
      const result: DocxLoadResult = await loadLargeDocxFile(
        fileUrl,
        (progress) => setLoadProgress(progress)
      );

      if (!result.success) {
        setLoadError(result.error || 'Failed to load document');
        // Fall back to new document
        initializeNewDocument();
        return;
      }

      // Store file info for saving later
      setDocxFileUrl(result.fileUrl);
      setDocxFileName(result.fileName || fileName || 'document.docx');

      // Convert DOCX page breaks to HTML page breaks
      let processedHtml = convertDocxPageBreaks(result.html);
      
      // Run diagnostic check on loaded content
      console.log('=== DOCX Load Diagnostics ===');
      const diagnostic = quickDiagnostic(processedHtml);
      console.log(diagnostic.message);
      
      // Run full diagnostic in development
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          logDiagnosticReport(processedHtml, editorRef.current);
        }, 1000);
      }

      // Create document with loaded content
      const newDoc = createNewDocument();
      
      setDocument(newDoc);
      setContent(processedHtml);
      
      // Check for page breaks and split content
      if (hasPageBreaks(processedHtml)) {
        const extractedPages = extractPageBreaks(processedHtml);
        setPages(extractedPages);
      } else {
        setPages([processedHtml]);
      }
      
      updateCounts(processedHtml);

      // Initialize history
      historyRef.current = [processedHtml];
      historyIndexRef.current = 0;

      setAutoSaveStatus('saved');
    } catch (error: any) {
      console.error('Error loading DOCX file:', error);
      setLoadError(error.message || 'An unexpected error occurred');
      initializeNewDocument();
    } finally {
      setIsLoadingDocx(false);
      setLoadProgress(100);
    }
  };

  // Update word and character counts
  const updateCounts = (html: string) => {
    setWordCount(countWords(html));
    setCharCount(html.replace(/<[^>]*>/g, '').length);
  };

  // Paginate content based on paper size and content height
  const paginateContent = useCallback(() => {
    if (!editorRef.current || typeof window === 'undefined') return;

    // Clear any existing timer
    if (paginationTimerRef.current) {
      clearTimeout(paginationTimerRef.current);
    }

    // Debounce pagination calculation
    paginationTimerRef.current = setTimeout(() => {
      const fullContent = content;
      
      // Split content by manual page breaks first
      const manualPageBreaks = fullContent.split('<div class="page-break"></div>');
      
      if (manualPageBreaks.length > 1) {
        // Has manual page breaks - use them
        setPages(manualPageBreaks.filter(p => p.trim()));
      } else {
        // Auto-paginate based on height
        const pageHeightPx = (currentPaperSize.height - 50.8) * 3.78; // height minus 1 inch margins, converted to px
        const tempDiv = window.document.createElement('div');
        tempDiv.style.width = `${currentPaperSize.width * 3.78}px`;
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.fontFamily = currentFormatting.fontFamily;
        tempDiv.innerHTML = fullContent;
        window.document.body.appendChild(tempDiv);

        const newPages: string[] = [];
        let currentPageContent = '';
        const children = Array.from(tempDiv.children);

        for (const child of children) {
          const element = child as HTMLElement;
          const testContent = currentPageContent + element.outerHTML;
          tempDiv.innerHTML = testContent;
          
          if (tempDiv.offsetHeight > pageHeightPx && currentPageContent) {
            // Current page is full, start new page
            newPages.push(currentPageContent);
            currentPageContent = element.outerHTML;
          } else {
            currentPageContent = testContent;
          }
        }

        // Add remaining content as last page
        if (currentPageContent) {
          newPages.push(currentPageContent);
        }

        window.document.body.removeChild(tempDiv);
        
        if (newPages.length > 0) {
          setPages(newPages);
        } else {
          setPages([fullContent || '<p>Start typing your document here...</p>']);
        }
      }
    }, 500);
  }, [content, currentPaperSize, currentFormatting.fontFamily]);

  // Trigger pagination when content or paper size changes
  useEffect(() => {
    paginateContent();
  }, [paginateContent]);

  // Auto-save functionality
  useEffect(() => {
    if (!document) return;

    // Skip localStorage auto-save if editing a Supabase file
    if (docxFileUrl) {
      setAutoSaveStatus('unsaved');
      return;
    }

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setAutoSaveStatus('unsaved');

    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saving');
      
      // Update document with current content
      const updatedDoc = {
        ...document,
        sections: [{
          id: 'main',
          type: 'custom' as const,
          title: 'Document',
          content: content,
          order: 0,
          collapsed: false,
        }],
        metadata: {
          ...document.metadata,
          wordCount,
          characterCount: charCount,
          pageCount: pages.length,
          modified: new Date(),
        },
      };
      
      try {
        saveDocumentToLocalStorage(updatedDoc);
        setTimeout(() => setAutoSaveStatus('saved'), 500);
      } catch (error: any) {
        console.error('Auto-save failed:', error);
        
        // Handle QuotaExceededError
        if (error.name === 'QuotaExceededError' || error.message?.includes('quota')) {
          console.warn('localStorage quota exceeded - clearing old documents');
          
          // Try to clear old documents to free space
          try {
            localStorage.removeItem('lastDocumentId');
            const keys = Object.keys(localStorage);
            const docKeys = keys.filter(k => k.startsWith('doc_'));
            
            // Remove all but the current document
            docKeys.forEach(key => {
              if (key !== `doc_${document.id}`) {
                localStorage.removeItem(key);
              }
            });
            
            // Try saving again with the same updatedDoc
            saveDocumentToLocalStorage(updatedDoc);
            setTimeout(() => setAutoSaveStatus('saved'), 500);
          } catch (retryError) {
            console.error('Failed to save even after cleanup:', retryError);
            setAutoSaveStatus('unsaved');
            setStorageWarning('Document is too large for auto-save. Please save to Supabase or export to DOCX.');
          }
        } else {
          setAutoSaveStatus('unsaved');
        }
      }
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, document, wordCount, charCount, pages.length, docxFileUrl]);

  // Selection preservation utilities
  const saveSelection = useCallback((pageIndex: number) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    try {
      savedSelection.current = {
        anchorNode: sel.anchorNode,
        anchorOffset: sel.anchorOffset,
        focusNode: sel.focusNode,
        focusOffset: sel.focusOffset,
        pageIndex,
      };
      shouldRestoreSelection.current = true;
    } catch (e) {
      console.warn('Failed to save selection:', e);
    }
  }, []);

  const restoreSelection = useCallback(() => {
    if (!shouldRestoreSelection.current || !savedSelection.current) return;
    
    try {
      const sel = window.getSelection();
      if (!sel) return;
      
      const { anchorNode, anchorOffset, focusNode, focusOffset, pageIndex } = savedSelection.current;
      
      // Verify nodes are still in the document
      if (!anchorNode || !focusNode || !window.document.body.contains(anchorNode) || !window.document.body.contains(focusNode)) {
        return;
      }
      
      const range = window.document.createRange();
      range.setStart(anchorNode, Math.min(anchorOffset, anchorNode.textContent?.length || 0));
      range.setEnd(focusNode, Math.min(focusOffset, focusNode.textContent?.length || 0));
      
      sel.removeAllRanges();
      sel.addRange(range);
      
      shouldRestoreSelection.current = false;
    } catch (e) {
      console.warn('Failed to restore selection:', e);
      shouldRestoreSelection.current = false;
    }
  }, []);

  // Restore selection after React updates the DOM
  useEffect(() => {
    if (shouldRestoreSelection.current) {
      restoreSelection();
    }
  }, [pages, restoreSelection]);

  // Handle content change
  const handleContentChange = useCallback((newContent: string, pageIndex?: number) => {
    // Save cursor position before state update
    if (pageIndex !== undefined) {
      saveSelection(pageIndex);
    }
    
    if (pageIndex !== undefined) {
      // Update specific page
      const newPages = [...pages];
      newPages[pageIndex] = newContent;
      const fullContent = newPages.join('');
      setContent(fullContent);
      updateCounts(fullContent);

      // Add to history
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(fullContent);
      historyIndexRef.current = historyRef.current.length - 1;

      // Limit history to 50 items
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }
    } else {
      // Update entire content
      setContent(newContent);
      updateCounts(newContent);

      // Add to history
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(newContent);
      historyIndexRef.current = historyRef.current.length - 1;

      // Limit history to 50 items
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
        historyIndexRef.current--;
      }
    }
  }, [pages, saveSelection]);

  // Formatting functions
  const toggleBold = () => {
    applyFormatting('bold');
    setCurrentFormatting({ ...currentFormatting, bold: !currentFormatting.bold });
  };

  const toggleItalic = () => {
    applyFormatting('italic');
    setCurrentFormatting({ ...currentFormatting, italic: !currentFormatting.italic });
  };

  const toggleUnderline = () => {
    applyFormatting('underline');
    setCurrentFormatting({ ...currentFormatting, underline: !currentFormatting.underline });
  };

  const toggleStrikethrough = () => {
    applyFormatting('strikethrough');
    setCurrentFormatting({ ...currentFormatting, strikethrough: !currentFormatting.strikethrough });
  };

  const changeFontFamily = (font: FontFamily) => {
    applyFormatting('fontName', font);
    setCurrentFormatting({ ...currentFormatting, fontFamily: font });
  };

  const changeFontSize = (size: FontSize) => {
    applyFormatting('fontSize', String(size));
    setCurrentFormatting({ ...currentFormatting, fontSize: size });
  };

  const changeAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    const commands = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull',
    };
    applyFormatting(commands[align]);
    setCurrentFormatting({ ...currentFormatting, textAlign: align });
  };

  const insertBulletList = () => {
    applyFormatting('insertUnorderedList');
  };

  const insertNumberedList = () => {
    applyFormatting('insertOrderedList');
  };

  const insertPageBreak = () => {
    // Use the utility function to insert page break
    const success = insertPageBreakAtCursor();
    
    if (success && editorRef.current) {
      // Update content after inserting page break
      const newContent = editorRef.current.innerHTML;
      handleContentChange(newContent);
    }
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const prevContent = historyRef.current[historyIndexRef.current];
      setContent(prevContent);
      updateCounts(prevContent);
      
      // Update pages display
      paginateContent();
    }
  };

  const redo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++;
      const nextContent = historyRef.current[historyIndexRef.current];
      setContent(nextContent);
      updateCounts(nextContent);
      
      // Update pages display
      paginateContent();
    }
  };

  // Paper size handlers
  const handlePaperSizeChange = (type: PaperSizeType) => {
    if (!document) return;
    
    const paperSize = PAPER_SIZES[type];
    setCurrentPaperSize(paperSize);
    
    const updatedDoc = updatePaperSize(document, paperSize);
    setDocument(updatedDoc);
    saveDocumentToLocalStorage(updatedDoc);
    savePaperSizePreference(paperSize);
  };

  const handleDimensionUnitToggle = () => {
    const newUnit = dimensionUnit === 'mm' ? 'inches' : 'mm';
    setDimensionUnit(newUnit);
    saveDimensionUnitPreference(newUnit);
  };

  const handleCustomPaperSize = () => {
    if (!document || !customWidth || !customHeight) return;
    
    let widthMm = parseFloat(customWidth);
    let heightMm = parseFloat(customHeight);
    
    if (isNaN(widthMm) || isNaN(heightMm)) {
      alert('Please enter valid dimensions');
      return;
    }
    
    // Convert to mm if in inches
    if (dimensionUnit === 'inches') {
      widthMm = inchesToMm(widthMm);
      heightMm = inchesToMm(heightMm);
    }
    
    const customPaper = createCustomPaperSize(widthMm, heightMm);
    setCurrentPaperSize(customPaper);
    
    const updatedDoc = updatePaperSize(document, customPaper);
    setDocument(updatedDoc);
    saveDocumentToLocalStorage(updatedDoc);
    savePaperSizePreference(customPaper);
    
    setCustomWidth('');
    setCustomHeight('');
  };

  // Save DOCX to Supabase
  const saveToSupabase = async () => {
    if (!docxFileUrl || !content) {
      alert('No file loaded from Supabase or no content to save');
      return;
    }

    setIsSavingDocx(true);
    setAutoSaveStatus('saving');

    try {
      const result = await saveDocxToSupabase(content, docxFileUrl, docxFileName || undefined);

      if (!result.success) {
        alert(`Failed to save: ${result.error}`);
        setAutoSaveStatus('unsaved');
        return;
      }

      setAutoSaveStatus('saved');
      alert('Document saved successfully to Supabase!');
    } catch (error: any) {
      console.error('Error saving to Supabase:', error);
      alert(`Error: ${error.message}`);
      setAutoSaveStatus('unsaved');
    } finally {
      setIsSavingDocx(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            toggleBold();
            break;
          case 'i':
            e.preventDefault();
            toggleItalic();
            break;
          case 'u':
            e.preventDefault();
            toggleUnderline();
            break;
          case 'z':
            e.preventDefault();
            undo();
            break;
          case 'y':
            e.preventDefault();
            redo();
            break;
          case 's':
            e.preventDefault();
            if (document) saveDocumentToLocalStorage(document);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFormatting, document]);

  if (isLoadingDocx) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center space-y-4 max-w-md w-full px-4">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-lg text-gray-700 font-medium">Loading DOCX document...</p>
          <p className="text-sm text-gray-500">Parsing formatting, images, and tables</p>
          
          {/* Progress Bar */}
          {loadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${loadProgress}%` }}
              ></div>
            </div>
          )}
          
          <p className="text-xs text-gray-400">
            {loadProgress < 50 ? 'Downloading file...' : 'Converting to HTML...'}
          </p>
        </div>
      </div>
    );
  }

  if (!document) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Error Notification */}
      {loadError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to load document</h3>
              <p className="text-sm text-red-700 mt-1">{loadError}</p>
              <button
                onClick={() => setLoadError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Storage Warning */}
      {storageWarning && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-yellow-500 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Storage Limit Reached</h3>
              <p className="text-sm text-yellow-700 mt-1">{storageWarning}</p>
              <div className="mt-2 flex gap-2">
                {docxFileUrl && (
                  <button
                    onClick={saveToSupabase}
                    className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                  >
                    Save to Supabase
                  </button>
                )}
                <button
                  onClick={() => exportToDOCX(document!)}
                  className="text-sm bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                >
                  Export DOCX
                </button>
                <button
                  onClick={() => setStorageWarning(null)}
                  className="text-sm text-yellow-600 hover:text-yellow-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Info Banner */}
      {docxFileUrl && docxFileName && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">📄</span>
            <span className="text-sm font-medium text-blue-900">Editing: {docxFileName}</span>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Supabase</span>
          </div>
          <button
            onClick={saveToSupabase}
            disabled={isSavingDocx}
            className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
          >
            {isSavingDocx ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Top Navigation Tabs - Primary Row */}
      <div className="bg-white border-b border-gray-300">
        <div className="flex items-center gap-1 px-2">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'home'
                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-5 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === 'layout'
                ? 'text-blue-600 bg-white border-b-2 border-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Layout
          </button>
        </div>
      </div>

      {/* Ribbon Area - Secondary Row (Changes based on active tab) */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-300 shadow-sm">
        {/* Home Ribbon */}
        {activeTab === 'home' && (
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              {/* File Group */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                <button
                  onClick={() => {
                    setDocument(createNewDocument());
                    setContent('<p>Start typing your document here...</p>');
                    updateCounts('');
                    setDocxFileUrl(null);
                    setDocxFileName(null);
                  }}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm flex items-center gap-1 transition-colors"
                  title="New Document"
                >
                  <span className="text-base">📄</span>
                  <span>New</span>
                </button>
                {docxFileUrl && (
                  <button
                    onClick={saveToSupabase}
                    disabled={isSavingDocx}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Save to Supabase"
                  >
                    <span className="text-base">💾</span>
                    <span>{isSavingDocx ? 'Saving...' : 'Save'}</span>
                  </button>
                )}
                <button
                  onClick={() => exportToPDF(document)}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm flex items-center gap-1 transition-colors"
                  title="Export to PDF"
                >
                  <span className="text-base">📑</span>
                  <span>PDF</span>
                </button>
                <button
                  onClick={() => exportToDOCX(document)}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm flex items-center gap-1 transition-colors"
                  title="Export to DOCX"
                >
                  <span className="text-base">📘</span>
                  <span>DOCX</span>
                </button>
              </div>

              {/* History Group */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                <button
                  onClick={undo}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <span className="text-lg">↶</span>
                </button>
                <button
                  onClick={redo}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <span className="text-lg">↷</span>
                </button>
              </div>

              {/* Font Group */}
              <div className="flex items-center gap-2 pr-3 border-r border-gray-300">
                <select
                  onChange={(e) => changeFontFamily(e.target.value as FontFamily)}
                  value={currentFormatting.fontFamily}
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Arial">Arial</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Calibri">Calibri</option>
                </select>
                
                <select
                  onChange={(e) => changeFontSize(Number(e.target.value) as FontSize)}
                  value={currentFormatting.fontSize}
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm bg-white hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              {/* Text Formatting Group */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                <button
                  onClick={toggleBold}
                  className={`w-8 h-8 rounded text-sm font-bold flex items-center justify-center transition-colors ${
                    currentFormatting.bold ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>
                <button
                  onClick={toggleItalic}
                  className={`w-8 h-8 rounded text-sm italic flex items-center justify-center transition-colors ${
                    currentFormatting.italic ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>
                <button
                  onClick={toggleUnderline}
                  className={`w-8 h-8 rounded text-sm underline flex items-center justify-center transition-colors ${
                    currentFormatting.underline ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  U
                </button>
                <button
                  onClick={toggleStrikethrough}
                  className={`w-8 h-8 rounded text-sm line-through flex items-center justify-center transition-colors ${
                    currentFormatting.strikethrough ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>

              {/* Alignment Group */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                <button
                  onClick={() => changeAlignment('left')}
                  className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-colors ${
                    currentFormatting.textAlign === 'left' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Align Left"
                >
                  ☰
                </button>
                <button
                  onClick={() => changeAlignment('center')}
                  className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-colors ${
                    currentFormatting.textAlign === 'center' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Align Center"
                >
                  ☷
                </button>
                <button
                  onClick={() => changeAlignment('right')}
                  className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-colors ${
                    currentFormatting.textAlign === 'right' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Align Right"
                >
                  ☱
                </button>
                <button
                  onClick={() => changeAlignment('justify')}
                  className={`w-8 h-8 rounded text-sm flex items-center justify-center transition-colors ${
                    currentFormatting.textAlign === 'justify' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                  title="Justify"
                >
                  ☴
                </button>
              </div>

              {/* Lists Group */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                <button
                  onClick={insertBulletList}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm transition-colors"
                  title="Bullet List"
                >
                  • List
                </button>
                <button
                  onClick={insertNumberedList}
                  className="px-3 py-1.5 hover:bg-gray-100 rounded text-sm transition-colors"
                  title="Numbered List"
                >
                  1. List
                </button>
              </div>

              {/* Insert Group */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => insertCitation('[1]')}
                  className="px-3 py-1.5 hover:bg-blue-100 rounded text-sm bg-blue-50 transition-colors"
                  title="Insert Citation"
                >
                  📝 Citation
                </button>
                <button
                  onClick={() => insertEquation()}
                  className="px-3 py-1.5 hover:bg-green-100 rounded text-sm bg-green-50 transition-colors"
                  title="Insert Equation"
                >
                  ∑ Equation
                </button>
                <button
                  onClick={() => insertFigure()}
                  className="px-3 py-1.5 hover:bg-purple-100 rounded text-sm bg-purple-50 transition-colors"
                  title="Insert Figure"
                >
                  🖼 Figure
                </button>
                <button
                  onClick={() => insertTable()}
                  className="px-3 py-1.5 hover:bg-yellow-100 rounded text-sm bg-yellow-50 transition-colors"
                  title="Insert Table"
                >
                  ⊞ Table
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Layout Ribbon */}
        {activeTab === 'layout' && (
          <div className="px-4 py-2.5">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Paper Size Group */}
              <div className="pr-3 border-r border-gray-300">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-600 font-medium px-1">Page Setup</span>
                  <div className="flex items-center gap-2">
                    {/* Paper Size Dropdown/Gallery */}
                    <div className="relative">
                      <button
                        onClick={() => setShowPaperSettings(!showPaperSettings)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-2 min-w-[180px] justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">📄</span>
                          <div className="text-left">
                            <div className="text-sm font-medium">{currentPaperSize.name}</div>
                            <div className="text-xs text-gray-500">{formatPaperDimensions(currentPaperSize, dimensionUnit)}</div>
                          </div>
                        </div>
                        <span className="text-gray-400">▼</span>
                      </button>

                      {/* Paper Size Gallery Dropdown */}
                      {showPaperSettings && (
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-[400px]">
                          <div className="p-3">
                            <div className="text-sm font-semibold text-gray-700 mb-3 px-2">Select Paper Size</div>
                            
                            {/* Paper Size Grid */}
                            <div className="grid grid-cols-2 gap-2 mb-3">
                              {/* A4 */}
                              <button
                                onClick={() => {
                                  handlePaperSizeChange('a4');
                                  setShowPaperSettings(false);
                                }}
                                className={`p-3 rounded-md border-2 text-left hover:bg-blue-50 transition-colors ${
                                  currentPaperSize.type === 'a4' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                              >
                                <div className="font-semibold text-sm">A4 {currentPaperSize.type === 'a4' && '✓'}</div>
                                <div className="text-xs text-gray-600">210×297mm</div>
                                <div className="text-xs text-gray-500">8.27"×11.69"</div>
                                <div className="text-xs text-blue-600 font-medium mt-1">[Default]</div>
                              </button>

                              {/* Letter */}
                              <button
                                onClick={() => {
                                  handlePaperSizeChange('letter');
                                  setShowPaperSettings(false);
                                }}
                                className={`p-3 rounded-md border-2 text-left hover:bg-blue-50 transition-colors ${
                                  currentPaperSize.type === 'letter' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                              >
                                <div className="font-semibold text-sm">Letter {currentPaperSize.type === 'letter' && '✓'}</div>
                                <div className="text-xs text-gray-600">8.5"×11"</div>
                                <div className="text-xs text-gray-500">216×279mm</div>
                              </button>

                              {/* Legal */}
                              <button
                                onClick={() => {
                                  handlePaperSizeChange('legal');
                                  setShowPaperSettings(false);
                                }}
                                className={`p-3 rounded-md border-2 text-left hover:bg-blue-50 transition-colors ${
                                  currentPaperSize.type === 'legal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                              >
                                <div className="font-semibold text-sm">Legal {currentPaperSize.type === 'legal' && '✓'}</div>
                                <div className="text-xs text-gray-600">8.5"×14"</div>
                                <div className="text-xs text-gray-500">216×356mm</div>
                              </button>

                              {/* A3 */}
                              <button
                                onClick={() => {
                                  handlePaperSizeChange('a3');
                                  setShowPaperSettings(false);
                                }}
                                className={`p-3 rounded-md border-2 text-left hover:bg-blue-50 transition-colors ${
                                  currentPaperSize.type === 'a3' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                              >
                                <div className="font-semibold text-sm">A3 {currentPaperSize.type === 'a3' && '✓'}</div>
                                <div className="text-xs text-gray-600">297×420mm</div>
                                <div className="text-xs text-gray-500">11.69"×16.54"</div>
                              </button>

                              {/* B5 */}
                              <button
                                onClick={() => {
                                  handlePaperSizeChange('b5');
                                  setShowPaperSettings(false);
                                }}
                                className={`p-3 rounded-md border-2 text-left hover:bg-blue-50 transition-colors ${
                                  currentPaperSize.type === 'b5' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                              >
                                <div className="font-semibold text-sm">B5 {currentPaperSize.type === 'b5' && '✓'}</div>
                                <div className="text-xs text-gray-600">176×250mm</div>
                                <div className="text-xs text-gray-500">6.93"×9.84"</div>
                              </button>

                              {/* US Trade */}
                              <button
                                onClick={() => {
                                  handlePaperSizeChange('us-trade');
                                  setShowPaperSettings(false);
                                }}
                                className={`p-3 rounded-md border-2 text-left hover:bg-blue-50 transition-colors ${
                                  currentPaperSize.type === 'us-trade' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                                }`}
                              >
                                <div className="font-semibold text-sm">US Trade {currentPaperSize.type === 'us-trade' && '✓'}</div>
                                <div className="text-xs text-gray-600">6"×9"</div>
                                <div className="text-xs text-gray-500">152×229mm</div>
                              </button>
                            </div>

                            {/* More Sizes Button */}
                            <button
                              onClick={() => {
                                setShowMoreSizes(true);
                                setShowPaperSettings(false);
                              }}
                              className="w-full p-3 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm font-medium text-gray-700"
                            >
                              ✏️ More Sizes... (Custom Dimensions)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Current Size Indicator */}
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <div className="text-xs text-gray-600">Current:</div>
                      <div className="font-bold text-blue-700">{currentPaperSize.name}</div>
                    </div>

                    {/* Unit Toggle */}
                    <button
                      onClick={handleDimensionUnitToggle}
                      className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium transition-colors"
                      title="Toggle measurement unit"
                    >
                      {dimensionUnit === 'mm' ? 'mm' : 'inches'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Page Break & Options Group */}
              <div className="flex items-center gap-1 pr-3 border-r border-gray-300">
                <button
                  onClick={insertPageBreak}
                  className="px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
                  title="Insert Page Break"
                >
                  <span>📄</span>
                  <span>Page Break</span>
                </button>
                <button
                  onClick={() => setShowPageNumbers(!showPageNumbers)}
                  className={`px-3 py-2 border rounded text-sm font-medium transition-colors ${
                    showPageNumbers ? 'bg-blue-500 text-white border-blue-500' : 'bg-white border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Toggle Page Numbers"
                >
                  {showPageNumbers ? '🔢 Numbers On' : '🔢 Numbers Off'}
                </button>
              </div>

              {/* Additional Options */}
              <div className="text-sm text-gray-600">
                Pages: {pages.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Size Dialog/Modal */}
      {showMoreSizes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Custom Paper Size</h3>
              <button
                onClick={() => setShowMoreSizes(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width ({dimensionUnit})
                </label>
                <input
                  type="number"
                  placeholder={dimensionUnit === 'mm' ? '210' : '8.27'}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height ({dimensionUnit})
                </label>
                <input
                  type="number"
                  placeholder={dimensionUnit === 'mm' ? '297' : '11.69'}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  step="0.1"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => {
                    handleCustomPaperSize();
                    setShowMoreSizes(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                >
                  Apply Custom Size
                </button>
                <button
                  onClick={() => setShowMoreSizes(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area - Multi-Page View */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {pages.map((pageContent, pageIndex) => (
            <div
              key={pageIndex}
              className="relative bg-white shadow-xl transition-all duration-300"
              style={{
                width: `${currentPaperSize.width * 3.78}px`,
                minHeight: `${currentPaperSize.height * 3.78}px`,
                maxWidth: '100%',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Page Number Badge */}
              {showPageNumbers && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-md z-10">
                  Page {pageIndex + 1} of {pages.length}
                </div>
              )}

              {/* Page Content */}
              <div
                ref={(el) => {
                  pageRefs.current[pageIndex] = el;
                  if (pageIndex === 0) editorRef.current = el;
                }}
                className="p-16 min-h-full"
                style={{
                  fontFamily: currentFormatting.fontFamily,
                  minHeight: `${currentPaperSize.height * 3.78}px`,
                }}
              >
                <div
                  key={`page-${pageIndex}-editor`}
                  contentEditable
                  suppressContentEditableWarning
                  dir="ltr"
                  onInput={(e) => {
                    e.stopPropagation();
                    handleContentChange(e.currentTarget.innerHTML, pageIndex);
                  }}
                  onFocus={() => setCurrentPage(pageIndex)}
                  onBlur={() => {
                    // Clear saved selection on blur
                    shouldRestoreSelection.current = false;
                  }}
                  className="min-h-[600px] outline-none focus:ring-2 focus:ring-blue-200"
                  style={{
                    lineHeight: currentFormatting.lineSpacing,
                    textAlign: currentFormatting.textAlign,
                    direction: 'ltr',
                    unicodeBidi: 'normal',
                  }}
                  dangerouslySetInnerHTML={{ __html: pageContent }}
                />
              </div>

              {/* Page Number Footer */}
              {showPageNumbers && (
                <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-gray-400">
                  {pageIndex + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span>Words: {wordCount}</span>
          <span>|</span>
          <span>Characters: {charCount}</span>
          <span>|</span>
          <span className="font-medium">Page {currentPage + 1} of {pages.length}</span>
          <span>|</span>
          <span>Paper: {currentPaperSize.name}</span>
          {docxFileName && (
            <>
              <span>|</span>
              <span className="flex items-center gap-1">
                <span>📁</span>
                <span>{docxFileName}</span>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {docxFileUrl && (
            <span className="text-blue-400 text-xs">
              Supabase File
            </span>
          )}
          <span className={`flex items-center gap-1 ${
            autoSaveStatus === 'saved' ? 'text-green-400' : 
            autoSaveStatus === 'saving' ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            <span className="inline-block w-2 h-2 rounded-full bg-current"></span>
            {autoSaveStatus === 'saved' ? 'Saved' : autoSaveStatus === 'saving' ? 'Saving...' : 'Unsaved'}
          </span>
        </div>
      </div>
    </div>
  );
}
