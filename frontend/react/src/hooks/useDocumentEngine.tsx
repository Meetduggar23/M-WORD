import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import {
  DocumentEngine, QuillDocument, Selection, CursorPosition, RunFormatting, Alignment,
  Comment, ShapeType, ChartBlock, SmartArtLayout, PageSize, PageMargins,
  TrackChangesState, StyleDefinition, AutoCorrectEntry, TOCEntry,
  TableOfContents, Footnote, Endnote, Watermark, Bookmark, ListFormat,
  TabStop, Border, SectionProperties
} from '../engine/DocumentEngine';

export type {
  QuillDocument, Selection, CursorPosition, RunFormatting, Alignment,
  Comment, ShapeType, ChartBlock, SmartArtLayout, PageSize, PageMargins,
  TrackChangesState, StyleDefinition, AutoCorrectEntry, TOCEntry,
  TableOfContents, Footnote, Endnote, Watermark, Bookmark, ListFormat,
  TabStop, Border, SectionProperties
};

interface DocumentEngineContextType {
  // Document
  document: QuillDocument | null;
  newDocument: () => void;
  saveDocument: () => void;
  openDocument: () => void;

  // Text editing
  insertText: (text: string) => void;
  deleteBackward: () => void;
  deleteForward: () => void;
  insertParagraph: () => void;
  selectAll: () => void;

  // Cursor / Selection
  selection: Selection;
  cursorPosition: CursorPosition;

  // Formatting
  activeFormatting: RunFormatting;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrikethrough: () => void;
  toggleDoubleStrikethrough: () => void;
  toggleSuperscript: () => void;
  toggleSubscript: () => void;
  toggleSmallCaps: () => void;
  toggleAllCaps: () => void;
  setFontFamily: (family: string) => void;
  setFontSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setHighlight: (color: string) => void;
  setAlignment: (alignment: Alignment) => void;
  setCharacterSpacing: (spacing: number) => void;
  clearFormatting: () => void;
  changeCase: (caseType: 'sentenceCase' | 'lowerCase' | 'upperCase' | 'capitalizeEachWord' | 'tOGGLEcASE') => void;

  // Format Painter
  startFormatPainter: () => void;
  stopFormatPainter: () => void;
  isFormatPainterActive: boolean;

  // Paragraph formatting
  setLineSpacing: (value: number, rule?: 'auto' | 'exact' | 'atLeast') => void;
  setSpaceBefore: (value: number) => void;
  setSpaceAfter: (value: number) => void;
  setLeftIndent: (indent: number) => void;
  setRightIndent: (indent: number) => void;
  setFirstLineIndent: (indent: number) => void;
  togglePageBreakBefore: () => void;
  toggleKeepWithNext: () => void;
  toggleKeepLinesTogether: () => void;

  // Lists
  setBulletList: () => void;
  setNumberedList: () => void;
  setMultilevelList: () => void;
  increaseListLevel: () => void;
  decreaseListLevel: () => void;

  // Styles
  applyStyle: (styleName: string) => void;
  styles: StyleDefinition[];
  createCustomStyle: (name: string, runFmt: RunFormatting, paraFmt: any) => void;

  // Tables
  insertTable: (rows: number, cols: number) => void;
  insertTableWithData: (data: string[][]) => void;

  // Images
  insertImage: (src: string, altText: string, width: number, height: number) => void;

  // Shapes
  insertShape: (shapeType: ShapeType) => void;

  // Charts
  insertChart: (chartType: ChartBlock['chartType']) => void;

  // Equations
  insertEquation: (latex: string) => void;

  // SmartArt
  insertSmartArt: (layout: SmartArtLayout) => void;

  // Special inserts
  insertPageBreak: () => void;
  insertColumnBreak: () => void;
  insertSectionBreak: () => void;
  insertHorizontalRule: () => void;
  insertSymbol: (symbol: string) => void;
  insertBookmark: (name: string) => void;
  insertHyperlink: (url: string, text?: string) => void;
  insertFootnote: (text: string) => void;
  insertEndnote: (text: string) => void;
  insertTableOfContents: () => void;

  // Comments
  addComment: (text: string) => void;
  replyToComment: (commentId: string, text: string) => void;
  resolveComment: (commentId: string) => void;
  deleteComment: (commentId: string) => void;
  comments: Comment[];

  // Track Changes
  toggleTrackChanges: () => void;
  acceptChange: (changeId: string) => void;
  rejectChange: (changeId: string) => void;
  acceptAllChanges: () => void;
  rejectAllChanges: () => void;
  trackChanges: TrackChangesState;

  // Watermark
  setTextWatermark: (text: string) => void;
  removeWatermark: () => void;

  // Page Setup
  setPageSize: (size: PageSize) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  setPageMargins: (margins: Partial<PageMargins>) => void;
  setColumns: (columns: number) => void;
  pageSetup: SectionProperties;

  // Header/Footer
  setHeader: (text: string) => void;
  setFooter: (text: string) => void;

  // Search
  findText: (query: string, caseSensitive?: boolean, wholeWord?: boolean, useWildcard?: boolean) => CursorPosition[];
  replaceText: (find: string, replace: string, caseSensitive?: boolean, wholeWord?: boolean) => number;
  replaceAllText: (find: string, replace: string, caseSensitive?: boolean, wholeWord?: boolean) => number;

  // Bookmarks
  bookmarks: Bookmark[];

  // Footnotes/Endnotes
  footnotes: Footnote[];
  endnotes: Endnote[];

  // TOC
  tableOfContents: TableOfContents[];

  // AutoCorrect
  addAutoCorrectEntry: (trigger: string, replacement: string) => void;
  removeAutoCorrectEntry: (trigger: string) => void;
  autoCorrectEntries: AutoCorrectEntry[];

  // Document Properties
  setDocumentTitle: (title: string) => void;
  setDocumentAuthor: (author: string) => void;
  setDocumentSubject: (subject: string) => void;
  setDocumentKeywords: (keywords: string) => void;

  // Go To
  goToPage: (page: number) => void;
  goToLine: (line: number) => void;
  goToBookmark: (name: string) => void;

  // Stats
  getWordCount: () => number;
  getCharacterCount: () => number;
  getCharacterCountNoSpaces: () => number;
  getLineCount: () => number;
  getParagraphCount: () => number;
  getSentenceCount: () => number;
  getSelectedWordCount: () => number;
  getSelectedCharCount: () => number;
  getSelectedText: () => string;

  // Paragraph Borders & Shading
  setParagraphBorders: (borders: any) => void;
  setParagraphShading: (fill: string) => void;

  // Selection manipulation
  setSelection: (start: CursorPosition, end: CursorPosition) => void;

  // Text access
  getAllText: () => string;

  // Undo/Redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  /** Whole-document undoable transform (cleanup, normalize, renumbering…) */
  transformDocument: (transform: (doc: QuillDocument) => boolean) => boolean;

  // Serialization
  exportJSON: () => string;
  exportAsHTML: () => string;
  importJSON: (json: string) => void;

  // Engine reference
  engine: DocumentEngine;
}

const DocumentEngineContext = createContext<DocumentEngineContextType | null>(null);

interface DocumentEngineProviderProps {
  children: ReactNode;
}

export const DocumentEngineProvider: React.FC<DocumentEngineProviderProps> = ({ children }) => {
  const engineRef = useRef<DocumentEngine>(new DocumentEngine());
  const [, forceUpdate] = useState(0);
  const engine = engineRef.current;

  useEffect(() => {
    const unsubDoc = engine.on('document-changed', () => forceUpdate(n => n + 1));
    const unsubSel = engine.on('selection-changed', () => forceUpdate(n => n + 1));
    const unsubUndo = engine.on('undo-state-changed', () => forceUpdate(n => n + 1));
    const unsubComment = engine.on('comment-changed', () => forceUpdate(n => n + 1));
    const unsubTC = engine.on('track-changes-changed', () => forceUpdate(n => n + 1));
    const unsubStyle = engine.on('style-changed', () => forceUpdate(n => n + 1));
    return () => { unsubDoc(); unsubSel(); unsubUndo(); unsubComment(); unsubTC(); unsubStyle(); };
  }, [engine]);

  const getDocument = useCallback(() => engine.getDocument(), [engine]);
  const newDocument = useCallback(() => engine.newDocument(), [engine]);

  const saveDocument = useCallback(() => {
    const json = engine.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (engine.getDocument().metadata.title || 'document') + '.word';
    a.click();
    URL.revokeObjectURL(url);
  }, [engine]);

  const openDocument = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.word,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      engine.deserialize(text);
    };
    input.click();
  }, [engine]);

  const cb = useCallback;
  const insertText = cb((t: string) => engine.insertText(t), [engine]);
  const deleteBackward = cb(() => engine.deleteBackward(), [engine]);
  const deleteForward = cb(() => engine.deleteForward(), [engine]);
  const insertParagraph = cb(() => engine.insertParagraph(), [engine]);
  const selectAll = cb(() => engine.selectAll(), [engine]);

  const toggleBold = cb(() => engine.toggleBold(), [engine]);
  const toggleItalic = cb(() => engine.toggleItalic(), [engine]);
  const toggleUnderline = cb(() => engine.toggleUnderline(), [engine]);
  const toggleStrikethrough = cb(() => engine.toggleStrikethrough(), [engine]);
  const toggleDoubleStrikethrough = cb(() => engine.toggleDoubleStrikethrough(), [engine]);
  const toggleSuperscript = cb(() => engine.toggleSuperscript(), [engine]);
  const toggleSubscript = cb(() => engine.toggleSubscript(), [engine]);
  const toggleSmallCaps = cb(() => engine.toggleSmallCaps(), [engine]);
  const toggleAllCaps = cb(() => engine.toggleAllCaps(), [engine]);
  const setFontFamily = cb((f: string) => engine.setFontFamily(f), [engine]);
  const setFontSize = cb((s: number) => engine.setFontSize(s), [engine]);
  const setTextColor = cb((c: string) => engine.setTextColor(c), [engine]);
  const setHighlight = cb((c: string) => engine.setHighlight(c), [engine]);
  const setAlignment = cb((a: Alignment) => engine.setAlignment(a), [engine]);
  const setCharacterSpacing = cb((s: number) => engine.setCharacterSpacing(s), [engine]);
  const clearFormatting = cb(() => engine.clearFormatting(), [engine]);
  const changeCase = cb((ct: any) => engine.changeCase(ct), [engine]);

  const startFormatPainter = cb(() => engine.startFormatPainter(), [engine]);
  const stopFormatPainter = cb(() => engine.stopFormatPainter(), [engine]);

  const setLineSpacing = cb((v: number, r?: any) => engine.setLineSpacing(v, r), [engine]);
  const setSpaceBefore = cb((v: number) => engine.setSpaceBefore(v), [engine]);
  const setSpaceAfter = cb((v: number) => engine.setSpaceAfter(v), [engine]);
  const setLeftIndent = cb((i: number) => engine.setLeftIndent(i), [engine]);
  const setRightIndent = cb((i: number) => engine.setRightIndent(i), [engine]);
  const setFirstLineIndent = cb((i: number) => engine.setFirstLineIndent(i), [engine]);
  const togglePageBreakBefore = cb(() => engine.togglePageBreakBefore(), [engine]);
  const toggleKeepWithNext = cb(() => engine.toggleKeepWithNext(), [engine]);
  const toggleKeepLinesTogether = cb(() => engine.toggleKeepLinesTogether(), [engine]);

  const setBulletList = cb(() => engine.setBulletList(), [engine]);
  const setNumberedList = cb(() => engine.setNumberedList(), [engine]);
  const setMultilevelList = cb(() => engine.setMultilevelList(), [engine]);
  const increaseListLevel = cb(() => engine.increaseListLevel(), [engine]);
  const decreaseListLevel = cb(() => engine.decreaseListLevel(), [engine]);

  const applyStyle = cb((n: string) => engine.applyStyle(n), [engine]);
  const createCustomStyle = cb((n: string, r: any, p: any) => engine.createCustomStyle(n, r, p), [engine]);

  const insertTable = cb((r: number, c: number) => engine.insertTable(r, c), [engine]);
  const insertTableWithData = cb((data: string[][]) => engine.insertTableWithData(data), [engine]);
  const insertImage = cb((s: string, a: string, w: number, h: number) => engine.insertImage(s, a, w, h), [engine]);
  const insertShape = cb((st: ShapeType) => engine.insertShape(st), [engine]);
  const insertChart = cb((ct: any) => engine.insertChart(ct), [engine]);
  const insertEquation = cb((l: string) => engine.insertEquation(l), [engine]);
  const insertSmartArt = cb((l: SmartArtLayout) => engine.insertSmartArt(l), [engine]);
  const insertPageBreak = cb(() => engine.insertPageBreak(), [engine]);
  const insertColumnBreak = cb(() => engine.insertColumnBreak(), [engine]);
  const insertSectionBreak = cb(() => engine.insertSectionBreak(), [engine]);
  const insertHorizontalRule = cb(() => engine.insertHorizontalRule(), [engine]);
  const insertSymbol = cb((s: string) => engine.insertSymbol(s), [engine]);
  const insertBookmark = cb((n: string) => engine.insertBookmark(n), [engine]);
  const insertHyperlink = cb((u: string, t?: string) => engine.insertHyperlink(u, t), [engine]);
  const insertFootnote = cb((t: string) => engine.insertFootnote(t), [engine]);
  const insertEndnote = cb((t: string) => engine.insertEndnote(t), [engine]);
  const insertTableOfContents = cb(() => engine.insertTableOfContents(), [engine]);

  const addComment = cb((t: string) => engine.addComment(t), [engine]);
  const replyToComment = cb((id: string, t: string) => engine.replyToComment(id, t), [engine]);
  const resolveComment = cb((id: string) => engine.resolveComment(id), [engine]);
  const deleteComment = cb((id: string) => engine.deleteComment(id), [engine]);

  const toggleTrackChanges = cb(() => engine.toggleTrackChanges(), [engine]);
  const acceptChange = cb((id: string) => engine.acceptChange(id), [engine]);
  const rejectChange = cb((id: string) => engine.rejectChange(id), [engine]);
  const acceptAllChanges = cb(() => engine.acceptAllChanges(), [engine]);
  const rejectAllChanges = cb(() => engine.rejectAllChanges(), [engine]);

  const setTextWatermark = cb((t: string) => engine.setTextWatermark(t), [engine]);
  const removeWatermark = cb(() => engine.removeWatermark(), [engine]);

  const setPageSize = cb((s: PageSize) => engine.setPageSize(s), [engine]);
  const setOrientation = cb((o: 'portrait' | 'landscape') => engine.setOrientation(o), [engine]);
  const setPageMargins = cb((m: Partial<PageMargins>) => engine.setPageMargins(m), [engine]);
  const setColumns = cb((c: number) => engine.setColumns(c), [engine]);

  const setHeader = cb((t: string) => engine.setHeader(t), [engine]);
  const setFooter = cb((t: string) => engine.setFooter(t), [engine]);

  const findText = cb((q: string, cs?: boolean, ww?: boolean, uw?: boolean) => engine.findText(q, cs, ww, uw), [engine]);
  const replaceText = cb((f: string, r: string, cs?: boolean, ww?: boolean) => engine.replaceText(f, r, cs, ww), [engine]);
  const replaceAllText = cb((f: string, r: string, cs?: boolean, ww?: boolean) => engine.replaceAllText(f, r, cs, ww), [engine]);

  const goToPage = cb((p: number) => engine.goToPage(p), [engine]);
  const goToLine = cb((l: number) => engine.goToLine(l), [engine]);
  const goToBookmark = cb((n: string) => engine.goToBookmark(n), [engine]);

  const addAutoCorrectEntry = cb((t: string, r: string) => engine.addAutoCorrectEntry(t, r), [engine]);
  const removeAutoCorrectEntry = cb((t: string) => engine.removeAutoCorrectEntry(t), [engine]);

  const setDocumentTitle = cb((t: string) => engine.setDocumentTitle(t), [engine]);
  const setDocumentAuthor = cb((a: string) => engine.setDocumentAuthor(a), [engine]);
  const setDocumentSubject = cb((s: string) => engine.setDocumentSubject(s), [engine]);
  const setDocumentKeywords = cb((k: string) => engine.setDocumentKeywords(k), [engine]);

  const undo = cb(() => engine.undo(), [engine]);
  const redo = cb(() => engine.redo(), [engine]);

  const getWordCount = cb(() => engine.getWordCount(), [engine]);
  const getCharacterCount = cb(() => engine.getCharacterCount(), [engine]);
  const getCharacterCountNoSpaces = cb(() => engine.getCharacterCountNoSpaces(), [engine]);
  const getLineCount = cb(() => engine.getLineCount(), [engine]);
  const getParagraphCount = cb(() => engine.getParagraphCount(), [engine]);
  const getSentenceCount = cb(() => engine.getSentenceCount(), [engine]);
  const getSelectedWordCount = cb(() => engine.getSelectedWordCount(), [engine]);
  const getSelectedCharCount = cb(() => engine.getSelectedCharCount(), [engine]);
  const getSelectedText = cb(() => engine.getSelectedText(), [engine]);

  const setParagraphBorders = cb((b: any) => engine.setParagraphBorders(b), [engine]);
  const setParagraphShading = cb((f: string) => engine.setParagraphShading(f), [engine]);
  const setSelection = cb((s: CursorPosition, e: CursorPosition) => engine.setSelection(s, e), [engine]);
  const getAllText = cb(() => engine.getAllText(), [engine]);

  const exportJSON = cb(() => engine.serialize(), [engine]);
  const exportAsHTML = cb(() => engine.exportAsHTML(), [engine]);
  const importJSON = cb((j: string) => engine.deserialize(j), [engine]);

  const doc = getDocument();

  const value: DocumentEngineContextType = {
    document: doc,
    newDocument, saveDocument, openDocument,
    insertText, deleteBackward, deleteForward, insertParagraph, selectAll,
    selection: engine.getSelection(),
    cursorPosition: engine.getCursorPosition(),
    activeFormatting: engine.getActiveFormatting(),
    toggleBold, toggleItalic, toggleUnderline, toggleStrikethrough,
    toggleDoubleStrikethrough, toggleSuperscript, toggleSubscript, toggleSmallCaps, toggleAllCaps,
    setFontFamily, setFontSize, setTextColor, setHighlight, setAlignment,
    setCharacterSpacing, clearFormatting, changeCase,
    startFormatPainter, stopFormatPainter, isFormatPainterActive: engine.isFormatPainterActive(),
    setLineSpacing, setSpaceBefore, setSpaceAfter, setLeftIndent, setRightIndent, setFirstLineIndent,
    togglePageBreakBefore, toggleKeepWithNext, toggleKeepLinesTogether,
    setBulletList, setNumberedList, setMultilevelList, increaseListLevel, decreaseListLevel,
    applyStyle, styles: doc.styles, createCustomStyle,
    insertTable, insertTableWithData, insertImage, insertShape, insertChart, insertEquation, insertSmartArt,
    insertPageBreak, insertColumnBreak, insertSectionBreak, insertHorizontalRule,
    insertSymbol, insertBookmark, insertHyperlink, insertFootnote, insertEndnote, insertTableOfContents,
    addComment, replyToComment, resolveComment, deleteComment, comments: doc.comments,
    toggleTrackChanges, acceptChange, rejectChange, acceptAllChanges, rejectAllChanges,
    trackChanges: doc.trackChanges,
    setTextWatermark, removeWatermark,
    setPageSize, setOrientation, setPageMargins, setColumns, pageSetup: doc.pageSetup,
    setHeader, setFooter,
    findText, replaceText, replaceAllText,
    bookmarks: doc.bookmarks, footnotes: doc.footnotes, endnotes: doc.endnotes,
    tableOfContents: doc.tableOfContents,
    addAutoCorrectEntry, removeAutoCorrectEntry, autoCorrectEntries: doc.autoCorrectEntries,
    setDocumentTitle, setDocumentAuthor, setDocumentSubject, setDocumentKeywords,
    goToPage, goToLine, goToBookmark,
    getWordCount, getCharacterCount, getCharacterCountNoSpaces, getLineCount, getParagraphCount,
    getSentenceCount, getSelectedWordCount, getSelectedCharCount, getSelectedText,
    exportJSON, exportAsHTML, importJSON,
    canUndo: engine.canUndo(), canRedo: engine.canRedo(), undo, redo,
    transformDocument: (t) => engine.transformDocument(t),
    setParagraphBorders, setParagraphShading, setSelection, getAllText,
    engine,
  };

  return (
    <DocumentEngineContext.Provider value={value}>
      {children}
    </DocumentEngineContext.Provider>
  );
};

export const useDocumentEngine = (): DocumentEngineContextType => {
  const context = useContext(DocumentEngineContext);
  if (!context) throw new Error('useDocumentEngine must be used within a DocumentEngineProvider');
  return context;
};
