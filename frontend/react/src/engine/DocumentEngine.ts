/**
 * WORD Document Engine - Full Microsoft Word Feature Set
 * 
 * This is the single source of truth for all document state.
 * The React UI is a client of this engine.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type ElementId = string;

export interface TextRun {
  id: ElementId;
  text: string;
  formatting: RunFormatting;
  hyperlink?: Hyperlink;
  bookmark?: Bookmark;
  commentIds?: ElementId[];
  footnoteId?: ElementId;
  endnoteId?: ElementId;
}

export interface RunFormatting {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  doubleStrikethrough?: boolean;
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  highlight?: string;
  superscript?: boolean;
  subscript?: boolean;
  smallCaps?: boolean;
  allCaps?: boolean;
  emboss?: boolean;
  imprint?: boolean;
  shadow?: boolean;
  outline?: boolean;
  characterSpacing?: number;
  characterScale?: number;
  language?: string;
  hidden?: boolean;
}

export type Alignment = 'left' | 'center' | 'right' | 'justify' | 'distributed';

export type ListType = 'none' | 'bullet' | 'numbered' | 'multilevel' | 'outline';

export interface ListFormat {
  type: ListType;
  level: number;
  startValue?: number;
  format?: string; // e.g., '1)', 'a.', 'I.'
  restart?: boolean;
  abstractLevel?: number;
}

export interface ParagraphFormatting {
  alignment: Alignment;
  leftIndent: number;
  rightIndent: number;
  firstLineIndent: number;
  hangingIndent: number;
  lineSpacing: number;
  lineSpacingRule: 'auto' | 'exact' | 'atLeast';
  spaceBefore: number;
  spaceAfter: number;
  widowControl: boolean;
  keepWithNext: boolean;
  keepLinesTogether: boolean;
  pageBreakBefore: boolean;
  outlineLevel: number;
  listFormat: ListFormat;
  paragraphBorders: ParagraphBorders;
  paragraphShading: ParagraphShading;
  tabs: TabStop[];
  suppressHyphens: boolean;
  suppressLineNumbers: boolean;
  bidi: boolean;
  dropCap: DropCap;
  textDirection: 'ltr' | 'rtl';
}

export interface ParagraphBorders {
  top?: Border;
  bottom?: Border;
  left?: Border;
  right?: Border;
  between?: Border;
}

export interface Border {
  style: BorderStyle;
  size: number;
  color: string;
  space: number;
}

export type BorderStyle = 'none' | 'single' | 'double' | 'thick' | 'thickThinLargeGap' |
  'thinThickSmallGap' | 'dashed' | 'dotted' | 'dashDot' | 'dashDotDot' | 'triple' |
  'thinThickThinMediumGap' | 'thinThickThinSmallGap' | 'wave' | 'diagonalStripe';

export interface ParagraphShading {
  fill: string;
  pattern: ShadingPattern;
  color: string;
}

export type ShadingPattern = 'clear' | 'solid' | 'horizontal' | 'vertical' | 'forwardDiagonal' |
  'backwardDiagonal' | 'darkHorizontal' | 'darkVertical' | 'darkForwardDiagonal' |
  'darkBackwardDiagonal' | 'darkGrid' | 'darkDiagonalCross' | 'darkTrellis' |
  'lightHorizontal' | 'lightVertical' | 'lightForwardDiagonal' | 'lightBackwardDiagonal' |
  'lightGrid' | 'lightDiagonalCross' | 'lightTrellis' | 'percent5' | 'percent10' |
  'percent12' | 'percent15' | 'percent20' | 'percent25' | 'percent30' | 'percent35' |
  'percent40' | 'percent45' | 'percent50' | 'percent55' | 'percent60' | 'percent65' |
  'percent70' | 'percent75' | 'percent80' | 'percent85' | 'percent90' | 'percent95';

export interface TabStop {
  position: number; // in twips (1/20 of a point)
  alignment: 'left' | 'center' | 'right' | 'decimal' | 'bar';
  leader: 'none' | 'dot' | 'hyphen' | 'underscore' | 'heavy' | 'middleDot';
}

export interface DropCap {
  style: 'none' | 'dropped' | 'inMargin';
  lines: number;
  font?: string;
  fontSize?: number;
  distance?: number;
}

export interface Paragraph {
  id: ElementId;
  type: 'paragraph';
  textRuns: TextRun[];
  formatting: ParagraphFormatting;
  style: string;
  sectionProps?: SectionProperties;
  footnotes: Footnote[];
  endnotes: Endnote[];
}

export interface Hyperlink {
  url: string;
  tooltip?: string;
  documentPart?: string;
  anchor?: string;
  color?: string;
  underline?: boolean;
}

export interface Bookmark {
  name: string;
  forward: boolean;
}

// ─── Tables ──────────────────────────────────────────────────────────────────

export interface TableCell {
  id: ElementId;
  textRuns: TextRun[];
  paragraphs: Paragraph[];
  rowSpan: number;
  colSpan: number;
  backgroundColor?: string;
  borders: CellBorders;
  verticalAlignment: 'top' | 'center' | 'bottom';
  width: number;
  cellWidthType: 'auto' | 'fixed' | 'percentage';
  shading: ParagraphShading;
  textDirection: 'ltr' | 'rtl';
  margins: CellMargins;
  noWrap: boolean;
}

export interface CellBorders {
  top?: Border;
  bottom?: Border;
  left?: Border;
  right?: Border;
  insideH?: Border;
  insideV?: Border;
}

export interface CellMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface TableRow {
  id: ElementId;
  cells: TableCell[];
  height: number;
  heightType: 'auto' | 'exact' | 'atLeast';
  headerRow: boolean;
  cantSplit: boolean;
  tableHeader: boolean;
}

export interface Table {
  id: ElementId;
  type: 'table';
  rows: TableRow[];
  columnWidths: number[];
  headerRow: boolean;
  tableBorders: TableBorders;
  tableStyle?: string;
  tableLook: TableLook;
  indentation: number;
  tableWidth: number;
  tableWidthType: 'auto' | 'fixed' | 'percentage';
  overlap: boolean;
  cellMarginDefault: CellMargins;
  tableLayout: 'fixed' | 'autofit';
  bidi: boolean;
  tableCaption?: string;
  tableDescription?: string;
}

export interface TableBorders {
  top?: Border;
  bottom?: Border;
  left?: Border;
  right?: Border;
  insideH?: Border;
  insideV?: Border;
}

export interface TableLook {
  firstRow: boolean;
  lastRow: boolean;
  firstColumn: boolean;
  lastColumn: boolean;
  noHorizontalBand: boolean;
  noVerticalBand: boolean;
}

// ─── Images ──────────────────────────────────────────────────────────────────

export interface ImageBlock {
  id: ElementId;
  type: 'image';
  src: string;
  altText: string;
  width: number;
  height: number;
  alignment: 'left' | 'center' | 'right';
  textWrapping: TextWrapping;
  border?: Border;
  shadow?: boolean;
  reflection?: boolean;
  glow?: GlowEffect;
  rotation: number;
  lockAspectRatio: boolean;
  crop?: CropProperties;
  effects: ImageEffect[];
  description: string;
  title: string;
}

export interface TextWrapping {
  style: 'inline' | 'square' | 'tight' | 'through' | 'topAndBottom' | 'behind' | 'inFront';
  side: 'both' | 'left' | 'right' | 'largest';
  distance: { top: number; bottom: number; left: number; right: number };
}

export interface CropProperties {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface GlowEffect {
  radius: number;
  color: string;
  opacity: number;
}

export interface ImageEffect {
  type: 'brightness' | 'contrast' | 'colorTemperature' | 'saturation' | 'blur' |
    'sharpen' | 'recolor' | 'artisticEffect';
  value: number;
}

// ─── Shapes / Drawing ────────────────────────────────────────────────────────

export type ShapeType = 'rectangle' | 'roundedRectangle' | 'oval' | 'circle' |
  'triangle' | 'rightTriangle' | 'diamond' | 'pentagon' | 'hexagon' | 'heptagon' |
  'octagon' | 'star4' | 'star5' | 'star6' | 'star8' | 'star12' | 'star16' |
  'arrow' | 'arrowRight' | 'arrowLeft' | 'arrowUp' | 'arrowDown' |
  'leftRightArrow' | 'upDownArrow' | 'cross' | 'plus' | 'frame' | 'heart' |
  'lightning' | 'sun' | 'moon' | 'cloud' | 'arc' | 'pie' | 'chord' |
  'callout1' | 'callout2' | 'callout3' | 'cloudCallout' | 'lineCallout1' |
  'leftBracket' | 'rightBracket' | 'leftBrace' | 'rightBrace' |
  'flowchartProcess' | 'flowchartDecision' | 'flowchartTerminator' |
  'bevel' | 'foldedCorner' | 'smileyFace' | 'donut' | 'noShape';

export interface ShapeBlock {
  id: ElementId;
  type: 'shape';
  shapeType: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  fill: ShapeFill;
  outline: ShapeOutline;
  text?: string;
  textRuns?: TextRun[];
  textFormatting: ShapeTextFormatting;
  effects: ShapeEffect[];
  lockAspectRatio: boolean;
  flipH: boolean;
  flipV: boolean;
  zIndex: number;
  description: string;
  title: string;
}

export interface ShapeFill {
  type: 'solid' | 'gradient' | 'pattern' | 'picture' | 'none';
  color?: string;
  opacity: number;
  gradientStops?: GradientStop[];
  gradientType?: 'linear' | 'radial';
  gradientAngle?: number;
  patternType?: ShadingPattern;
  pictureSrc?: string;
}

export interface GradientStop {
  position: number;
  color: string;
  opacity: number;
}

export interface ShapeOutline {
  style: BorderStyle;
  size: number;
  color: string;
  opacity: number;
  dashType?: 'solid' | 'roundDot' | 'squareDot' | 'dash' | 'lgDash' | 'lgDashDot' | 'lgDashDotDot' | 'sysDash' | 'sysDashDot' | 'sysDashDotDot';
  capType?: 'round' | 'square' | 'flat';
  joinType?: 'round' | 'bevel' | 'miter';
}

export interface ShapeTextFormatting {
  alignment: Alignment;
  verticalAlignment: 'top' | 'center' | 'bottom';
  wordWrap: boolean;
  margins: { left: number; right: number; top: number; bottom: number };
  autofit: 'none' | 'shrinkToFit' | 'resizeShapeToFit';
}

export interface ShapeEffect {
  type: 'shadow' | 'reflection' | 'glow' | 'softEdge' | 'bevel' | '3dRotation' | 'preset';
  // shadow
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowInner?: boolean;
  // glow
  glowColor?: string;
  glowRadius?: number;
  glowOpacity?: number;
  // reflection
  reflectionOpacity?: number;
  reflectionDistance?: number;
  reflectionSize?: number;
  reflectionBlur?: number;
  // soft edge
  softEdgeRadius?: number;
  // bevel
  bevelType?: string;
  bevelWidth?: number;
  bevelHeight?: number;
}

// ─── Chart ───────────────────────────────────────────────────────────────────

export interface ChartBlock {
  id: ElementId;
  type: 'chart';
  chartType: 'column' | 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'bubble' |
    'radar' | 'surface' | 'doughnut' | 'waterfall' | 'funnel' | 'treemap' |
    'sunburst' | 'combo' | 'histogram' | 'boxAndWhisker' | 'pareto' | 'stock';
  width: number;
  height: number;
  alignment: 'left' | 'center' | 'right';
  title: ChartTitle;
  legend: ChartLegend;
  data: ChartData;
  style: ChartStyle;
  xAxis?: ChartAxis;
  yAxis?: ChartAxis;
  dataLabels?: ChartDataLabels;
  trendlines?: ChartTrendline[];
}

export interface ChartTitle {
  text: string;
  position: 'above' | 'below' | 'overlayCenter' | 'overlayLeft' | 'overlayRight' | 'none';
  overlay: boolean;
  formatting: RunFormatting;
}

export interface ChartLegend {
  position: 'top' | 'bottom' | 'left' | 'right' | 'insideRight' | 'insideTop' | 'insideBottom';
  overlay: boolean;
  showLegendKeys: boolean;
}

export interface ChartData {
  labels: string[];
  series: ChartSeries[];
}

export interface ChartSeries {
  name: string;
  values: number[];
  color?: string;
  type?: 'column' | 'bar' | 'line' | 'area';
}

export interface ChartStyle {
  variant: number;
  colorScheme: string[];
}

export interface ChartAxis {
  title: string;
  showTitle: boolean;
  majorUnit?: number;
  minorUnit?: number;
  min?: number;
  max?: number;
  logarithmic: boolean;
  reverseOrder: boolean;
  majorGridlines: boolean;
  minorGridlines: boolean;
  labelPosition: 'nextToAxis' | 'high' | 'low' | 'none';
}

export interface ChartDataLabels {
  show: boolean;
  showValue: boolean;
  showCategory: boolean;
  showSeries: boolean;
  showPercentage: boolean;
  separator: string;
  formatting: RunFormatting;
}

export interface ChartTrendline {
  type: 'linear' | 'exponential' | 'movingAverage' | 'polynomial' | 'logarithmic' | 'power';
  name: string;
  order?: number;
  period?: number;
  forward: number;
  backward: number;
  displayEquation: boolean;
  displayRSquared: boolean;
  color: string;
  lineStyle: BorderStyle;
}

// ─── SmartArt ────────────────────────────────────────────────────────────────

export interface SmartArtBlock {
  id: ElementId;
  type: 'smartart';
  layout: SmartArtLayout;
  nodes: SmartArtNode[];
  colorStyle: string;
  width: number;
  height: number;
  alignment: 'left' | 'center' | 'right';
}

export type SmartArtLayout =
  | 'process-continuous' | 'process-alternating' | 'process-steps'
  | 'hierarchy' | 'hierarchyList' | 'orgChart'
  | 'cycle-continuous' | 'cycle-blockCycle' | 'cycle-processor'
  | 'relationship-basic' | 'relationship-dumbbell' | 'relationship-nesting'
  | 'pyramid-accented' | 'pyramid-inverted'
  | 'venn-overlapping' | 'venn-nested'
  | 'matrix-basic' | 'matrix-grid'
  | 'picture-caption' | 'picture-strip' | 'picture-grid';

export interface SmartArtNode {
  id: ElementId;
  text: string;
  textRuns?: TextRun[];
  shapeId: number;
  children: SmartArtNode[];
  parentId?: ElementId;
}

// ─── Equation ────────────────────────────────────────────────────────────────

export interface EquationBlock {
  id: ElementId;
  type: 'equation';
  latex: string;
  formatting: RunFormatting;
  textRuns: TextRun[];
  mathStyle: 'professional' | 'linear';
  justification: 'left' | 'center' | 'right';
}

// ─── Watermark ───────────────────────────────────────────────────────────────

export interface Watermark {
  type: 'none' | 'text' | 'picture';
  text?: string;
  font?: string;
  fontSize?: number;
  color?: string;
  transparency?: number;
  rotation?: number;
  isDiagonal?: boolean;
  pictureSrc?: string;
  scale?: number;
}

// ─── Header / Footer ─────────────────────────────────────────────────────────

export interface HeaderFooter {
  id: ElementId;
  type: 'header' | 'footer';
  default: boolean;
  firstPage: boolean;
  oddPage: boolean;
  evenPage: boolean;
  paragraphs: Paragraph[];
  alignment: 'left' | 'center' | 'right';
}

export interface PageNumber {
  show: boolean;
  format: 'decimal' | 'romanUpper' | 'romanLower' | 'letterUpper' | 'letterLower' |
    'dash' | 'ordinal' | 'ordinalText' | 'hex' | 'chiZodiac' | 'digitSlash';
  startValue?: number;
  position: 'header' | 'footer';
  alignment: 'left' | 'center' | 'right';
}

// ─── Footnotes / Endnotes ────────────────────────────────────────────────────

export interface Footnote {
  id: ElementId;
  marker: string;
  markerFormat: 'symbol' | 'autoNumber';
  text: string;
  paragraphs: Paragraph[];
  referencePosition?: CursorPosition;
}

export interface Endnote {
  id: ElementId;
  marker: string;
  markerFormat: 'symbol' | 'autoNumber';
  text: string;
  paragraphs: Paragraph[];
  referencePosition?: CursorPosition;
}

export interface FootnoteEndnoteConfig {
  position: 'pageBottom' | 'belowText' | 'sectionEnd' | 'documentEnd';
  numberFormat: 'autoNumber' | 'romanLower' | 'romanUpper' | 'letterLower' | 'letterUpper' |
    'arabic' | 'symbol' | ' chicagoManual';
  startValue: number;
  restartNumbering: boolean;
  restartLevel: number;
}

// ─── Table of Contents ───────────────────────────────────────────────────────

export interface TableOfContents {
  id: ElementId;
  title: string;
  headingLevels: number[];
  showPageNumbers: boolean;
  rightAlignPageNumbers: boolean;
  useHyperlinks: boolean;
  showLevels: number;
  tabLeader: 'none' | 'dot' | 'hyphen' | 'underscore';
  entries: TOCEntry[];
  styles?: string[];
}

export interface TOCEntry {
  text: string;
  level: number;
  pageNumber: number;
  bookmarkRef?: string;
  hyperlink?: string;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: ElementId;
  author: string;
  authorInitials: string;
  date: string;
  text: string;
  resolved: boolean;
  replies: CommentReply[];
  rangeStart: CursorPosition;
  rangeEnd: CursorPosition;
  done: boolean;
}

export interface CommentReply {
  id: ElementId;
  author: string;
  authorInitials: string;
  date: string;
  text: string;
}

// ─── Track Changes ───────────────────────────────────────────────────────────

export interface TrackChange {
  id: ElementId;
  type: 'insertion' | 'deletion' | 'formatChange' | 'moveFrom' | 'moveTo';
  author: string;
  date: string;
  content?: string;
  formatting?: RunFormatting;
  rangeStart: CursorPosition;
  rangeEnd: CursorPosition;
}

export interface TrackChangesState {
  enabled: boolean;
  author: string;
  changes: TrackChange[];
  showMarkup: {
    insertions: boolean;
    deletions: boolean;
    formatting: boolean;
    comments: boolean;
    ink: boolean;
  };
}

// ─── Page Setup ──────────────────────────────────────────────────────────────

export type PageSize = 'letter' | 'legal' | 'tabloid' | 'A3' | 'A4' | 'A5' | 'B4' |
  'B5' | ' executive' | 'statement' | 'envelope' | '8x10' | '10x14' | 'custom';

export interface SectionProperties {
  pageSize: PageSize;
  pageWidth: number;
  pageHeight: number;
  orientation: 'portrait' | 'landscape';
  pageMargins: PageMargins;
  columns: number;
  columnSpacing: number;
  columnLines: boolean;
  differentFirstPage: boolean;
  differentOddEven: boolean;
  headerDistance: number;
  footerDistance: number;
  gutter: number;
  gutterPosition: 'left' | 'right' | 'top';
  verticalAlignment: 'top' | 'center' | 'justified' | 'distributed';
  lineNum: number;
  lineNumRestart: 'continuous' | 'restartEachPage' | 'restartEachSection' | 'continuous';
  startPageNumber?: number;
  pageNumberFormat?: PageNumber['format'];
}

export interface PageMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
  gutter: number;
  mirrorMargins: boolean;
  headerFromEdge: number;
  footerFromEdge: number;
  bindingGutter: number;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

export interface StyleDefinition {
  id: ElementId;
  name: string;
  displayName: string;
  type: 'paragraph' | 'character' | 'table' | 'numbering';
  basedOn?: string;
  nextStyle?: string;
  linkStyle?: string;
  runFormatting: RunFormatting;
  paragraphFormatting: ParagraphFormatting;
  paragraphBorders: ParagraphBorders;
  paragraphShading: ParagraphShading;
  isDefault: boolean;
  isBuiltIn: boolean;
  isCustom: boolean;
  isVisible: boolean;
  priority: number;
  semiHidden: boolean;
  locked: boolean;
  quickFormat: boolean;
  uiPriority: number;
  hidden: boolean;
}

// ─── Shapes List Block ───────────────────────────────────────────────────────

export interface HorizontalRule {
  id: ElementId;
  type: 'horizontalRule';
  style: 'single' | 'double' | 'thick' | 'dashed' | 'dotted';
  color: string;
  width: number;
}

export interface PageBreak {
  id: ElementId;
  type: 'pageBreak';
  breakType: 'page' | 'column' | 'section';
}

export interface Bookmark {
  id: ElementId;
  name: string;
}

// ─── Document Model ──────────────────────────────────────────────────────────

export type Block = Paragraph | Table | ImageBlock | ShapeBlock | ChartBlock |
  SmartArtBlock | EquationBlock | HorizontalRule | PageBreak;

export interface Section {
  id: ElementId;
  blocks: Block[];
  properties: SectionProperties;
}

export interface DocumentMetadata {
  title: string;
  author: string;
  createdAt: string;
  modifiedAt: string;
  pageCount: number;
  subject: string;
  keywords: string;
  comments: string;
  category: string;
  company: string;
  manager: string;
  application: string;
  template: string;
  lastModifiedBy: string;
  revisionNumber: number;
  totalEditTime: number;
  dateCreated: string;
  dateModified: string;
  version: string;
}

export interface AutoCorrectEntry {
  trigger: string;
  replacement: string;
}

export interface QuillDocument {
  id: ElementId;
  sections: Section[];
  metadata: DocumentMetadata;
  watermarks: Watermark[];
  headers: HeaderFooter[];
  footers: HeaderFooter[];
  footnotes: Footnote[];
  endnotes: Endnote[];
  comments: Comment[];
  tableOfContents: TableOfContents[];
  bookmarks: Bookmark[];
  styles: StyleDefinition[];
  autoCorrectEntries: AutoCorrectEntry[];
  trackChanges: TrackChangesState;
  pageSetup: SectionProperties;
  pageNumbers: PageNumber[];
  footnoteConfig: FootnoteEndnoteConfig;
  endnoteConfig: FootnoteEndnoteConfig;
}

// ─── Undo/Redo ───────────────────────────────────────────────────────────────

interface UndoState {
  document: QuillDocument;
  cursorPosition: CursorPosition;
}

// ─── Cursor / Selection ──────────────────────────────────────────────────────

export interface CursorPosition {
  blockId: ElementId;
  runIndex: number;
  offset: number;
}

export interface Selection {
  start: CursorPosition;
  end: CursorPosition;
  isCollapsed: boolean;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EngineEventType =
  | 'document-changed'
  | 'selection-changed'
  | 'cursor-moved'
  | 'undo-state-changed'
  | 'track-changes-changed'
  | 'comment-changed'
  | 'style-changed';

export type EngineEventListener = () => void;

// ─── Helper functions ────────────────────────────────────────────────────────

let idCounter = 0;
export function generateId(): ElementId {
  return `el_${Date.now()}_${++idCounter}`;
}

function defaultPageMargins(): PageMargins {
  return {
    top: 1440,
    bottom: 1440,
    left: 1800,
    right: 1800,
    gutter: 0,
    mirrorMargins: false,
    headerFromEdge: 720,
    footerFromEdge: 720,
    bindingGutter: 0,
  };
}

function defaultSectionProperties(): SectionProperties {
  return {
    pageSize: 'letter',
    pageWidth: 12240,
    pageHeight: 15840,
    orientation: 'portrait',
    pageMargins: defaultPageMargins(),
    columns: 1,
    columnSpacing: 720,
    columnLines: false,
    differentFirstPage: false,
    differentOddEven: false,
    headerDistance: 720,
    footerDistance: 720,
    gutter: 0,
    gutterPosition: 'left',
    verticalAlignment: 'top',
    lineNum: 0,
    lineNumRestart: 'continuous',
  };
}

function defaultListFormat(): ListFormat {
  return { type: 'none', level: 0 };
}

function defaultParagraphFormatting(): ParagraphFormatting {
  return {
    alignment: 'left',
    leftIndent: 0,
    rightIndent: 0,
    firstLineIndent: 0,
    hangingIndent: 0,
    lineSpacing: 1.15,
    lineSpacingRule: 'auto',
    spaceBefore: 0,
    spaceAfter: 0,
    widowControl: true,
    keepWithNext: false,
    keepLinesTogether: false,
    pageBreakBefore: false,
    outlineLevel: -1,
    listFormat: defaultListFormat(),
    paragraphBorders: {},
    paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
    tabs: [],
    suppressHyphens: false,
    suppressLineNumbers: false,
    bidi: false,
    dropCap: { style: 'none', lines: 3 },
    textDirection: 'ltr',
  };
}


function defaultCellBorders(): CellBorders {
  return {};
}

function defaultCellMargins(): CellMargins {
  return { top: 60, bottom: 60, left: 120, right: 120 };
}

function defaultShapeFill(): ShapeFill {
  return { type: 'solid', color: '#4472C4', opacity: 1 };
}

function defaultShapeOutline(): ShapeOutline {
  return { style: 'single', size: 1, color: '#4472C4', opacity: 1 };
}

function defaultTrackChanges(): TrackChangesState {
  return {
    enabled: false,
    author: 'User',
    changes: [],
    showMarkup: {
      insertions: true,
      deletions: true,
      formatting: true,
      comments: true,
      ink: true,
    },
  };
}

function cloneFormatting(fmt: ParagraphFormatting): ParagraphFormatting {
  return {
    ...fmt,
    listFormat: { ...fmt.listFormat },
    paragraphBorders: { ...fmt.paragraphBorders },
    paragraphShading: { ...fmt.paragraphShading },
    tabs: fmt.tabs.map(t => ({ ...t })),
    dropCap: { ...fmt.dropCap },
  };
}

function cloneRun(fmt: RunFormatting): RunFormatting {
  return { ...fmt };
}

function cloneTextRun(run: TextRun): TextRun {
  return {
    ...run,
    formatting: cloneRun(run.formatting),
    hyperlink: run.hyperlink ? { ...run.hyperlink } : undefined,
    bookmark: run.bookmark ? { ...run.bookmark } : undefined,
    commentIds: run.commentIds ? [...run.commentIds] : undefined,
  };
}

function cloneParagraph(p: Paragraph): Paragraph {
  return {
    ...p,
    textRuns: p.textRuns.map(cloneTextRun),
    formatting: cloneFormatting(p.formatting),
    footnotes: p.footnotes.map(f => ({ ...f, paragraphs: f.paragraphs.map(cloneParagraph) })),
    endnotes: p.endnotes.map(e => ({ ...e, paragraphs: e.paragraphs.map(cloneParagraph) })),
  };
}

function cloneTableCell(c: TableCell): TableCell {
  return {
    ...c,
    textRuns: c.textRuns.map(cloneTextRun),
    paragraphs: c.paragraphs.map(cloneParagraph),
    borders: { ...c.borders },
    shading: { ...c.shading },
    margins: { ...c.margins },
  };
}

function cloneTable(t: Table): Table {
  return {
    ...t,
    rows: t.rows.map(r => ({
      ...r,
      cells: r.cells.map(cloneTableCell),
    })),
    columnWidths: [...t.columnWidths],
    tableBorders: { ...t.tableBorders },
    tableLook: { ...t.tableLook },
    cellMarginDefault: { ...t.cellMarginDefault },
  };
}

function cloneImageBlock(img: ImageBlock): ImageBlock {
  return {
    ...img,
    textWrapping: { ...img.textWrapping, distance: { ...img.textWrapping.distance } },
    crop: img.crop ? { ...img.crop } : undefined,
    effects: img.effects.map(e => ({ ...e })),
  };
}

function cloneShapeBlock(s: ShapeBlock): ShapeBlock {
  return {
    ...s,
    fill: { ...s.fill, gradientStops: s.fill.gradientStops?.map(gs => ({ ...gs })) },
    outline: { ...s.outline },
    textFormatting: { ...s.textFormatting, margins: { ...s.textFormatting.margins } },
    effects: s.effects.map(e => ({ ...e })),
    textRuns: s.textRuns?.map(cloneTextRun),
  };
}

function cloneChartBlock(c: ChartBlock): ChartBlock {
  return {
    ...c,
    data: {
      labels: [...c.data.labels],
      series: c.data.series.map(s => ({ ...s, values: [...s.values] })),
    },
    title: { ...c.title, formatting: { ...c.title.formatting } },
    legend: { ...c.legend },
    style: { ...c.style, colorScheme: [...c.style.colorScheme] },
    xAxis: c.xAxis ? { ...c.xAxis } : undefined,
    yAxis: c.yAxis ? { ...c.yAxis } : undefined,
    dataLabels: c.dataLabels ? { ...c.dataLabels, formatting: { ...c.dataLabels.formatting } } : undefined,
    trendlines: c.trendlines?.map(t => ({ ...t })),
  };
}

function cloneSmartArtBlock(s: SmartArtBlock): SmartArtBlock {
  return { ...s, nodes: s.nodes.map(n => ({ ...n, children: n.children.map(cn => ({ ...cn })) })) };
}

function cloneEquationBlock(e: EquationBlock): EquationBlock {
  return { ...e, formatting: { ...e.formatting }, textRuns: e.textRuns.map(cloneTextRun) };
}

function cloneHorizontalRule(h: HorizontalRule): HorizontalRule {
  return { ...h };
}

function clonePageBreak(p: PageBreak): PageBreak {
  return { ...p };
}

function cloneBlock(b: Block): Block {
  switch (b.type) {
    case 'paragraph': return cloneParagraph(b);
    case 'table': return cloneTable(b);
    case 'image': return cloneImageBlock(b);
    case 'shape': return cloneShapeBlock(b);
    case 'chart': return cloneChartBlock(b);
    case 'smartart': return cloneSmartArtBlock(b);
    case 'equation': return cloneEquationBlock(b);
    case 'horizontalRule': return cloneHorizontalRule(b);
    case 'pageBreak': return clonePageBreak(b);
  }
}

function cloneComment(c: Comment): Comment {
  return {
    ...c,
    rangeStart: { ...c.rangeStart },
    rangeEnd: { ...c.rangeEnd },
    replies: c.replies.map(r => ({ ...r })),
  };
}

function cloneStyleDef(s: StyleDefinition): StyleDefinition {
  return {
    ...s,
    runFormatting: { ...s.runFormatting },
    paragraphFormatting: cloneFormatting(s.paragraphFormatting),
    paragraphBorders: { ...s.paragraphBorders },
    paragraphShading: { ...s.paragraphShading },
  };
}

function cloneSectionProperties(sp: SectionProperties): SectionProperties {
  return {
    ...sp,
    pageMargins: { ...sp.pageMargins },
  };
}

function cloneDocument(doc: QuillDocument): QuillDocument {
  return {
    ...doc,
    sections: doc.sections.map(s => ({
      ...s,
      blocks: s.blocks.map(cloneBlock),
      properties: cloneSectionProperties(s.properties),
    })),
    metadata: { ...doc.metadata },
    watermarks: doc.watermarks.map(w => ({ ...w })),
    headers: doc.headers.map(h => ({ ...h, paragraphs: h.paragraphs.map(cloneParagraph) })),
    footers: doc.footers.map(f => ({ ...f, paragraphs: f.paragraphs.map(cloneParagraph) })),
    footnotes: doc.footnotes.map(f => ({ ...f, paragraphs: f.paragraphs.map(cloneParagraph) })),
    endnotes: doc.endnotes.map(e => ({ ...e, paragraphs: e.paragraphs.map(cloneParagraph) })),
    comments: doc.comments.map(cloneComment),
    bookmarks: doc.bookmarks.map(b => ({ ...b })),
    styles: doc.styles.map(cloneStyleDef),
    autoCorrectEntries: doc.autoCorrectEntries.map(a => ({ ...a })),
    trackChanges: {
      ...doc.trackChanges,
      changes: doc.trackChanges.changes.map(tc => ({
        ...tc,
        rangeStart: { ...tc.rangeStart },
        rangeEnd: { ...tc.rangeEnd },
      })),
    },
    pageSetup: cloneSectionProperties(doc.pageSetup),
    pageNumbers: doc.pageNumbers.map(pn => ({ ...pn })),
    footnoteConfig: { ...doc.footnoteConfig },
    endnoteConfig: { ...doc.endnoteConfig },
  };
}

// ─── Default Built-in Styles ─────────────────────────────────────────────────

function createBuiltInStyles(): StyleDefinition[] {
  const styles: StyleDefinition[] = [
    {
      id: generateId(), name: 'Normal', displayName: 'Normal', type: 'paragraph',
      runFormatting: { fontFamily: 'Calibri', fontSize: 11, color: '#000000' },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceAfter: 8 },
      paragraphBorders: {}, paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: true, isBuiltIn: true, isCustom: false, isVisible: true, priority: 0,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 0, hidden: false,
    },
    {
      id: generateId(), name: 'Heading1', displayName: 'Heading 1', type: 'paragraph',
      basedOn: 'Normal', nextStyle: 'Normal',
      runFormatting: { fontFamily: 'Calibri Light', fontSize: 16, color: '#2F5496', bold: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceBefore: 12, spaceAfter: 0, keepWithNext: true, keepLinesTogether: true, outlineLevel: 0 },
      paragraphBorders: { bottom: { style: 'single', size: 4, color: '#2F5496', space: 1 } },
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 1,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 1, hidden: false,
    },
    {
      id: generateId(), name: 'Heading2', displayName: 'Heading 2', type: 'paragraph',
      basedOn: 'Normal', nextStyle: 'Normal',
      runFormatting: { fontFamily: 'Calibri Light', fontSize: 13, color: '#2F5496', bold: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceBefore: 8, spaceAfter: 0, keepWithNext: true, keepLinesTogether: true, outlineLevel: 1 },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 2,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 2, hidden: false,
    },
    {
      id: generateId(), name: 'Heading3', displayName: 'Heading 3', type: 'paragraph',
      basedOn: 'Normal', nextStyle: 'Normal',
      runFormatting: { fontFamily: 'Calibri Light', fontSize: 12, color: '#1F3763', bold: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceBefore: 8, spaceAfter: 0, keepWithNext: true, keepLinesTogether: true, outlineLevel: 2 },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 3,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 3, hidden: false,
    },
    {
      id: generateId(), name: 'Heading4', displayName: 'Heading 4', type: 'paragraph',
      basedOn: 'Normal', nextStyle: 'Normal',
      runFormatting: { fontFamily: 'Calibri Light', fontSize: 11, color: '#2F5496', italic: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceBefore: 6, spaceAfter: 0, keepWithNext: true, outlineLevel: 3 },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 4,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 4, hidden: false,
    },
    {
      id: generateId(), name: 'Title', displayName: 'Title', type: 'paragraph',
      basedOn: 'Normal',
      runFormatting: { fontFamily: 'Calibri Light', fontSize: 28, color: '#000000' },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceAfter: 4, alignment: 'center' },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 5,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 5, hidden: false,
    },
    {
      id: generateId(), name: 'Subtitle', displayName: 'Subtitle', type: 'paragraph',
      basedOn: 'Normal',
      runFormatting: { fontFamily: 'Calibri', fontSize: 18, color: '#5A5A5A', italic: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceAfter: 12, alignment: 'center' },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 6,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 6, hidden: false,
    },
    {
      id: generateId(), name: 'Quote', displayName: 'Quote', type: 'paragraph',
      basedOn: 'Normal', nextStyle: 'Normal',
      runFormatting: { fontFamily: 'Calibri', fontSize: 11, color: '#404040', italic: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), leftIndent: 720, rightIndent: 720, spaceBefore: 6, spaceAfter: 6 },
      paragraphBorders: { left: { style: 'single', size: 12, color: '#BFBFBF', space: 10 } },
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 7,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 7, hidden: false,
    },
    {
      id: generateId(), name: 'ListParagraph', displayName: 'List Paragraph', type: 'paragraph',
      basedOn: 'Normal',
      runFormatting: { fontFamily: 'Calibri', fontSize: 11 },
      paragraphFormatting: { ...defaultParagraphFormatting(), leftIndent: 720, listFormat: { type: 'bullet', level: 0 } },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 8,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 8, hidden: false,
    },
    {
      id: generateId(), name: 'IntenseQuote', displayName: 'Intense Quote', type: 'paragraph',
      basedOn: 'Quote', nextStyle: 'Normal',
      runFormatting: { fontFamily: 'Calibri', fontSize: 11, color: '#2F5496', italic: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), leftIndent: 720, rightIndent: 720 },
      paragraphBorders: { left: { style: 'single', size: 12, color: '#2F5496', space: 10 }, bottom: { style: 'single', size: 4, color: '#2F5496', space: 1 } },
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 9,
      semiHidden: false, locked: false, quickFormat: true, uiPriority: 9, hidden: false,
    },
    {
      id: generateId(), name: 'TOCHeading', displayName: 'TOC Heading', type: 'paragraph',
      basedOn: 'Heading1', nextStyle: 'Normal',
      runFormatting: { fontFamily: 'Calibri Light', fontSize: 16, color: '#2F5496', bold: true },
      paragraphFormatting: { ...defaultParagraphFormatting(), spaceBefore: 12, spaceAfter: 4, outlineLevel: 9 },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 10,
      semiHidden: false, locked: false, quickFormat: false, uiPriority: 10, hidden: false,
    },
    {
      id: generateId(), name: 'TitleChar', displayName: 'Title Char', type: 'character',
      basedOn: 'DefaultParagraphFont',
      runFormatting: { fontFamily: 'Calibri Light', fontSize: 28 },
      paragraphFormatting: defaultParagraphFormatting(),
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: false, priority: 11,
      semiHidden: false, locked: false, quickFormat: false, uiPriority: 11, hidden: false,
    },
    {
      id: generateId(), name: 'SubtitleChar', displayName: 'Subtitle Char', type: 'character',
      basedOn: 'DefaultParagraphFont',
      runFormatting: { fontFamily: 'Calibri', fontSize: 18, color: '#5A5A5A', italic: true },
      paragraphFormatting: defaultParagraphFormatting(),
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: false, priority: 12,
      semiHidden: false, locked: false, quickFormat: false, uiPriority: 12, hidden: false,
    },
    {
      id: generateId(), name: 'Hyperlink', displayName: 'Hyperlink', type: 'character',
      runFormatting: { color: '#0563C1', underline: true },
      paragraphFormatting: defaultParagraphFormatting(),
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: false, priority: 13,
      semiHidden: false, locked: false, quickFormat: false, uiPriority: 13, hidden: false,
    },
    {
      id: generateId(), name: 'FollowedHyperlink', displayName: 'Followed Hyperlink', type: 'character',
      runFormatting: { color: '#954F72', underline: true },
      paragraphFormatting: defaultParagraphFormatting(),
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: false, priority: 14,
      semiHidden: false, locked: false, quickFormat: false, uiPriority: 14, hidden: false,
    },
    {
      id: generateId(), name: 'NoSpacing', displayName: 'No Spacing', type: 'paragraph',
      basedOn: 'Normal',
      runFormatting: { fontFamily: 'Calibri', fontSize: 11 },
      paragraphFormatting: { ...defaultParagraphFormatting(), lineSpacing: 1.0, spaceBefore: 0, spaceAfter: 0 },
      paragraphBorders: {},
      paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
      isDefault: false, isBuiltIn: true, isCustom: false, isVisible: true, priority: 15,
      semiHidden: false, locked: false, quickFormat: false, uiPriority: 15, hidden: false,
    },
  ];
  return styles;
}

function createDefaultAutoCorrect(): AutoCorrectEntry[] {
  return [
    { trigger: '(c)', replacement: '©' },
    { trigger: '(r)', replacement: '®' },
    { trigger: '(tm)', replacement: '™' },
    { trigger: '(e)', replacement: '€' },
    { trigger: '(C)', replacement: '©' },
    { trigger: '(R)', replacement: '®' },
    { trigger: '(TM)', replacement: '™' },
    { trigger: '(st)', replacement: 'ST' },
    { trigger: '...', replacement: '…' },
    { trigger: '--', replacement: '–' },
    { trigger: '---', replacement: '—' },
    { trigger: '(1/2)', replacement: '½' },
    { trigger: '(1/3)', replacement: '⅓' },
    { trigger: '(1/4)', replacement: '¼' },
    { trigger: '(3/4)', replacement: '¾' },
    { trigger: 'teh ', replacement: 'the ' },
    { trigger: 'adn ', replacement: 'and ' },
    { trigger: 'taht ', replacement: 'that ' },
    { trigger: 'hte ', replacement: 'the ' },
    { trigger: 'thier ', replacement: 'their ' },
    { trigger: 'recieve ', replacement: 'receive ' },
    { trigger: 'occured ', replacement: 'occurred ' },
    { trigger: 'seperate ', replacement: 'separate ' },
    { trigger: 'definately ', replacement: 'definitely ' },
    { trigger: 'accomodate ', replacement: 'accommodate ' },
    { trigger: 'untill ', replacement: 'until ' },
    { trigger: 'adress ', replacement: 'address ' },
    { trigger: 'goverment ', replacement: 'government ' },
    { trigger: 'independant ', replacement: 'independent ' },
  ];
}

// ─── Document Engine ─────────────────────────────────────────────────────────

export class DocumentEngine {
  private document: QuillDocument;
  private cursor: CursorPosition;
  private selection: Selection;
  private undoStack: UndoState[] = [];
  private redoStack: UndoState[] = [];
  private maxUndoSize = 200;
  private listeners: Map<EngineEventType, Set<EngineEventListener>> = new Map();
  private activeFormatting: RunFormatting = {};
  private _formatPainterActive = false;


  constructor() {
    this.document = this.createEmptyDocument();
    this.cursor = { blockId: '', runIndex: 0, offset: 0 };
    this.selection = { start: this.cursor, end: this.cursor, isCollapsed: true };
    if (this.document.sections[0].blocks[0]) {
      this.cursor.blockId = this.document.sections[0].blocks[0].id;
    }
    this.selection.start = { ...this.cursor };
    this.selection.end = { ...this.cursor };
  }

  // ─── Event system ──────────────────────────────────────────────────────

  on(event: EngineEventType, listener: EngineEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => { this.listeners.get(event)?.delete(listener); };
  }

  private emit(event: EngineEventType): void {
    this.listeners.get(event)?.forEach(fn => fn());
  }

  private emitAll(): void {
    this.emit('document-changed');
    this.emit('selection-changed');
  }

  // ─── Document creation ─────────────────────────────────────────────────

  createEmptyDocument(): QuillDocument {
    const firstBlockId = generateId();
    return {
      id: generateId(),
      sections: [{
        id: generateId(),
        blocks: [{
          id: firstBlockId,
          type: 'paragraph',
          textRuns: [{ id: generateId(), text: '', formatting: {} }],
          formatting: defaultParagraphFormatting(),
          style: 'Normal',
          footnotes: [],
          endnotes: [],
        }],
        properties: defaultSectionProperties(),
      }],
      metadata: {
        title: 'Untitled Document',
        author: '',
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        pageCount: 1,
        subject: '',
        keywords: '',
        comments: '',
        category: '',
        company: '',
        manager: '',
        application: 'WORD Editor',
        template: '',
        lastModifiedBy: '',
        revisionNumber: 1,
        totalEditTime: 0,
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        version: '1.0',
      },
      watermarks: [],
      headers: [{
        id: generateId(), type: 'header', default: true, firstPage: false,
        evenPage: false, oddPage: false,
        paragraphs: [{ id: generateId(), type: 'paragraph', textRuns: [], formatting: { ...defaultParagraphFormatting(), alignment: 'center' }, style: 'Normal', footnotes: [], endnotes: [] }],
        alignment: 'center',
      }],
      footers: [{
        id: generateId(), type: 'footer', default: true, firstPage: false,
        evenPage: false, oddPage: false,
        paragraphs: [{ id: generateId(), type: 'paragraph', textRuns: [], formatting: { ...defaultParagraphFormatting(), alignment: 'center' }, style: 'Normal', footnotes: [], endnotes: [] }],
        alignment: 'center',
      }],
      footnotes: [],
      endnotes: [],
      comments: [],
      tableOfContents: [],
      bookmarks: [],
      styles: createBuiltInStyles(),
      autoCorrectEntries: createDefaultAutoCorrect(),
      trackChanges: defaultTrackChanges(),
      pageSetup: defaultSectionProperties(),
      pageNumbers: [{ show: true, format: 'decimal', position: 'footer', alignment: 'center' }],
      footnoteConfig: { position: 'pageBottom', numberFormat: 'autoNumber', startValue: 1, restartNumbering: false, restartLevel: 0 },
      endnoteConfig: { position: 'documentEnd', numberFormat: 'romanLower', startValue: 1, restartNumbering: false, restartLevel: 0 },
    };
  }

  newDocument(): void {
    this.pushUndo();
    this.document = this.createEmptyDocument();
    this.cursor = { blockId: this.document.sections[0].blocks[0].id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.emitAll();
  }

  // ─── Accessors ─────────────────────────────────────────────────────────

  getDocument(): QuillDocument { return this.document; }
  getCursorPosition(): CursorPosition { return { ...this.cursor }; }
  getSelection(): Selection {
    return { ...this.selection, start: { ...this.selection.start }, end: { ...this.selection.end } };
  }
  canUndo(): boolean { return this.undoStack.length > 0; }
  canRedo(): boolean { return this.redoStack.length > 0; }
  getActiveFormatting(): RunFormatting { return { ...this.activeFormatting }; }

  isFormatPainterActive(): boolean { return this._formatPainterActive; }

  // ─── Block helpers ─────────────────────────────────────────────────────

  private findBlock(blockId: ElementId): { section: Section; block: Block; blockIndex: number; sectionIndex: number } | null {
    for (let si = 0; si < this.document.sections.length; si++) {
      const section = this.document.sections[si];
      const idx = section.blocks.findIndex(b => b.id === blockId);
      if (idx >= 0) return { section, block: section.blocks[idx], blockIndex: idx, sectionIndex: si };
    }
    return null;
  }

  findParagraph(blockId: ElementId): Paragraph | null {
    const found = this.findBlock(blockId);
    if (found && found.block.type === 'paragraph') return found.block as Paragraph;
    return null;
  }

  findBlockByIndex(sectionIndex: number, blockIndex: number): Block | null {
    const sec = this.document.sections[sectionIndex];
    if (!sec) return null;
    return sec.blocks[blockIndex] || null;
  }

  private getAllBlocks(): Block[] {
    const blocks: Block[] = [];
    for (const section of this.document.sections) {
      blocks.push(...section.blocks);
    }
    return blocks;
  }

  private getNextBlock(currentBlockId: ElementId): Block | null {
    const found = this.findBlock(currentBlockId);
    if (!found) return null;
    if (found.blockIndex < found.section.blocks.length - 1) {
      return found.section.blocks[found.blockIndex + 1];
    }
    const secIdx = this.document.sections.indexOf(found.section);
    if (secIdx < this.document.sections.length - 1) {
      const nextSec = this.document.sections[secIdx + 1];
      return nextSec.blocks[0] || null;
    }
    return null;
  }



  // ─── Text content helpers ──────────────────────────────────────────────

  getBlockText(blockId: ElementId): string {
    const found = this.findBlock(blockId);
    if (!found) return '';
    if (found.block.type === 'paragraph') return (found.block as Paragraph).textRuns.map(r => r.text).join('');
    return '';
  }

  getAllText(): string {
    const lines: string[] = [];
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type === 'paragraph') {
          lines.push((block as Paragraph).textRuns.map(r => r.text).join(''));
        }
      }
    }
    return lines.join('\n');
  }

  getWordCount(): number {
    const text = this.getAllText();
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  getCharacterCount(): number { return this.getAllText().length; }
  getCharacterCountNoSpaces(): number { return this.getAllText().replace(/\s/g, '').length; }
  getLineCount(): number {
    return this.document.sections.reduce((sum, s) => sum + s.blocks.filter(b => b.type === 'paragraph').length, 0);
  }
  getParagraphCount(): number { return this.getLineCount(); }
  getSentenceCount(): number {
    const text = this.getAllText();
    return (text.match(/[.!?]+/g) || []).length;
  }
  getSelectedWordCount(): number {
    if (this.selection.isCollapsed) return 0;
    const text = this.getSelectedText();
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }
  getSelectedCharCount(): number {
    if (this.selection.isCollapsed) return 0;
    return this.getSelectedText().length;
  }
  getSelectedCharCountNoSpaces(): number {
    if (this.selection.isCollapsed) return 0;
    return this.getSelectedText().replace(/\s/g, '').length;
  }

  getSelectedText(): string {
    if (this.selection.isCollapsed) return '';
    const startOffset = this.getAbsoluteOffset(this.selection.start);
    const endOffset = this.getAbsoluteOffset(this.selection.end);
    const min = Math.min(startOffset, endOffset);
    const max = Math.max(startOffset, endOffset);
    const allText = this.getAllText();
    return allText.substring(min, max);
  }

  // ─── Cursor position computation ───────────────────────────────────────

  private getTextOffsetForBlock(blockId: ElementId): number {
    let offset = 0;
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.id === blockId) return offset;
        if (block.type === 'paragraph') {
          offset += (block as Paragraph).textRuns.reduce((sum, r) => sum + r.text.length, 0);
        }
      }
    }
    return offset;
  }

  getAbsoluteOffset(pos: CursorPosition): number {
    const blockOffset = this.getTextOffsetForBlock(pos.blockId);
    const para = this.findParagraph(pos.blockId);
    if (!para) return blockOffset;
    let charOffset = 0;
    for (let i = 0; i < pos.runIndex && i < para.textRuns.length; i++) {
      charOffset += para.textRuns[i].text.length;
    }
    return blockOffset + charOffset + pos.offset;
  }

  positionFromAbsoluteOffset(absoluteOffset: number): CursorPosition {
    let runningOffset = 0;
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        const blockTextLength = para.textRuns.reduce((sum, r) => sum + r.text.length, 0);
        if (runningOffset + blockTextLength >= absoluteOffset) {
          const targetWithinBlock = absoluteOffset - runningOffset;
          let charCount = 0;
          for (let r = 0; r < para.textRuns.length; r++) {
            const runLen = para.textRuns[r].text.length;
            if (charCount + runLen >= targetWithinBlock) {
              return { blockId: para.id, runIndex: r, offset: targetWithinBlock - charCount };
            }
            charCount += runLen;
          }
          const lastRun = para.textRuns[para.textRuns.length - 1];
          return { blockId: para.id, runIndex: para.textRuns.length - 1, offset: lastRun ? lastRun.text.length : 0 };
        }
        runningOffset += blockTextLength;
      }
    }
    // At end
    const blocks = this.getAllBlocks();
    const lastBlock = blocks[blocks.length - 1];
    if (lastBlock && lastBlock.type === 'paragraph') {
      const para = lastBlock as Paragraph;
      const lastRun = para.textRuns[para.textRuns.length - 1];
      return { blockId: para.id, runIndex: para.textRuns.length - 1, offset: lastRun ? lastRun.text.length : 0 };
    }
    return this.cursor;
  }

  // ─── Text editing ──────────────────────────────────────────────────────

  insertText(text: string): void {
    this.pushUndo();

    if (!this.selection.isCollapsed) {
      this.deleteSelectionInternal();
    }

    // Auto-correct
    let insertText = text;
    const para = this.findParagraph(this.cursor.blockId);
    if (para && text === ' ') {
      const fullText = para.textRuns.map(r => r.text).join('');
      for (const entry of this.document.autoCorrectEntries) {
        const textBefore = fullText.substring(0, this.getAbsoluteOffset(this.cursor));
        if (textBefore.toLowerCase().endsWith(entry.trigger.toLowerCase())) {
          const triggerStart = this.cursor.offset - entry.trigger.length;
          if (triggerStart >= 0) {
            const run = para.textRuns[this.cursor.runIndex];
            if (run) {
              const before = run.text.substring(0, triggerStart);
              run.text = before + entry.replacement + run.text.substring(this.cursor.offset);
              this.cursor.offset = before.length + entry.replacement.length;
              insertText = ' ';
              break;
            }
          }
        }
      }
    }

    if (!para) return;

    while (para.textRuns.length <= this.cursor.runIndex) {
      para.textRuns.push({ id: generateId(), text: '', formatting: {} });
    }

    const run = para.textRuns[this.cursor.runIndex];
    const mergedFormatting = { ...run.formatting, ...this.activeFormatting };
    run.formatting = mergedFormatting;

    const before = run.text.substring(0, this.cursor.offset);
    const after = run.text.substring(this.cursor.offset);
    run.text = before + insertText + after;
    this.cursor.offset += insertText.length;

    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  deleteBackward(): void {
    if (!this.selection.isCollapsed) {
      this.deleteSelectionInternal();
      this.emitAll();
      return;
    }

    if (this.cursor.runIndex === 0 && this.cursor.offset === 0) {
      const found = this.findBlock(this.cursor.blockId);
      if (!found || found.blockIndex === 0) return;

      this.pushUndo();
      const prevBlock = found.section.blocks[found.blockIndex - 1];
      if (prevBlock.type === 'paragraph' && found.block.type === 'paragraph') {
        const prevPara = prevBlock as Paragraph;
        const curPara = found.block as Paragraph;
        const prevLen = prevPara.textRuns.reduce((sum, r) => sum + r.text.length, 0);
        prevPara.textRuns.push(...curPara.textRuns);
        found.section.blocks.splice(found.blockIndex, 1);
        this.cursor = { blockId: prevPara.id, runIndex: prevPara.textRuns.length - 1, offset: prevLen };
        if (this.cursor.runIndex < 0) this.cursor.runIndex = 0;
        this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      }
      this.document.metadata.modifiedAt = new Date().toISOString();
      this.emitAll();
      return;
    }

    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (!para) return;

    const run = para.textRuns[this.cursor.runIndex];
    if (!run) return;

    if (this.cursor.offset > 0) {
      const before = run.text.substring(0, this.cursor.offset - 1);
      const after = run.text.substring(this.cursor.offset);
      run.text = before + after;
      this.cursor.offset--;
    } else if (this.cursor.runIndex > 0) {
      const prevRun = para.textRuns[this.cursor.runIndex - 1];
      this.cursor.offset = prevRun.text.length;
      prevRun.text += run.text;
      para.textRuns.splice(this.cursor.runIndex, 1);
      this.cursor.runIndex--;
    }

    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  deleteForward(): void {
    if (!this.selection.isCollapsed) {
      this.deleteSelectionInternal();
      this.emitAll();
      return;
    }

    const para = this.findParagraph(this.cursor.blockId);
    if (!para) return;
    const run = para.textRuns[this.cursor.runIndex];
    if (!run) return;

    this.pushUndo();

    if (this.cursor.offset < run.text.length) {
      const before = run.text.substring(0, this.cursor.offset);
      run.text = before + run.text.substring(this.cursor.offset + 1);
    } else if (this.cursor.runIndex < para.textRuns.length - 1) {
      const nextRun = para.textRuns[this.cursor.runIndex + 1];
      run.text += nextRun.text;
      para.textRuns.splice(this.cursor.runIndex + 1, 1);
    }

    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  insertParagraph(): void {
    this.pushUndo();

    if (!this.selection.isCollapsed) {
      this.deleteSelectionInternal();
    }

    const para = this.findParagraph(this.cursor.blockId);
    if (!para) return;
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const leftRuns: TextRun[] = [];
    const rightRuns: TextRun[] = [];

    for (let i = 0; i < para.textRuns.length; i++) {
      const run = para.textRuns[i];
      if (i < this.cursor.runIndex) {
        leftRuns.push(cloneTextRun(run));
      } else if (i === this.cursor.runIndex) {
        const left = run.text.substring(0, this.cursor.offset);
        const right = run.text.substring(this.cursor.offset);
        if (left) leftRuns.push({ id: generateId(), text: left, formatting: cloneRun(run.formatting) });
        if (right) rightRuns.push({ id: generateId(), text: right, formatting: cloneRun(run.formatting) });
      } else {
        rightRuns.push(cloneTextRun(run));
      }
    }

    para.textRuns = leftRuns.length > 0 ? leftRuns : [{ id: generateId(), text: '', formatting: {} }];

    const newPara: Paragraph = {
      id: generateId(),
      type: 'paragraph',
      textRuns: rightRuns.length > 0 ? rightRuns : [{ id: generateId(), text: '', formatting: {} }],
      formatting: cloneFormatting(para.formatting),
      style: para.style,
      footnotes: [],
      endnotes: [],
    };

    found.section.blocks.splice(found.blockIndex + 1, 0, newPara);
    this.cursor = { blockId: newPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  insertPageBreak(): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const pageBreak: PageBreak = { id: generateId(), type: 'pageBreak', breakType: 'page' };
    const emptyPara: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: '', formatting: {} }],
      formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
    };
    found.section.blocks.splice(found.blockIndex + 1, 0, pageBreak, emptyPara);
    this.cursor = { blockId: emptyPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  insertColumnBreak(): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;
    const breakBlock: PageBreak = { id: generateId(), type: 'pageBreak', breakType: 'column' };
    found.section.blocks.splice(found.blockIndex + 1, 0, breakBlock);
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  insertSectionBreak(): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    // Split the current section at this point
    const blocksAfter = found.section.blocks.splice(found.blockIndex + 1);
    const newSection: Section = {
      id: generateId(),
      blocks: blocksAfter.length > 0 ? blocksAfter : [{
        id: generateId(), type: 'paragraph',
        textRuns: [{ id: generateId(), text: '', formatting: {} }],
        formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
      }],
      properties: cloneSectionProperties(found.section.properties),
    };

    const secIdx = this.document.sections.indexOf(found.section);
    this.document.sections.splice(secIdx + 1, 0, newSection);
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  insertHorizontalRule(): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const rule: HorizontalRule = {
      id: generateId(), type: 'horizontalRule',
      style: 'single', color: '#999999', width: 100,
    };
    const emptyPara: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: '', formatting: {} }],
      formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
    };
    found.section.blocks.splice(found.blockIndex + 1, 0, rule, emptyPara);
    this.cursor = { blockId: emptyPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  insertSymbol(symbol: string): void {
    this.pushUndo();
    if (!this.selection.isCollapsed) this.deleteSelectionInternal();
    const para = this.findParagraph(this.cursor.blockId);
    if (!para) return;
    while (para.textRuns.length <= this.cursor.runIndex) {
      para.textRuns.push({ id: generateId(), text: '', formatting: {} });
    }
    const run = para.textRuns[this.cursor.runIndex];
    const before = run.text.substring(0, this.cursor.offset);
    const after = run.text.substring(this.cursor.offset);
    run.text = before + symbol + after;
    this.cursor.offset += symbol.length;
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  insertBookmark(name: string): void {
    this.pushUndo();
    const existing = this.document.bookmarks.find(b => b.name === name);
    if (existing) {
      this.document.bookmarks = this.document.bookmarks.filter(b => b.name !== name);
    }
    this.document.bookmarks.push({ id: generateId(), name, forward: true });

    const para = this.findParagraph(this.cursor.blockId);
    if (para && para.textRuns[this.cursor.runIndex]) {
      const run = para.textRuns[this.cursor.runIndex];
      run.bookmark = { id: generateId(), name, forward: true };
    }
    this.emit('document-changed');
  }

  insertHyperlink(url: string, text?: string): void {
    this.pushUndo();

    const displayText = text || url;

    if (!this.selection.isCollapsed) {
      // Apply hyperlink to selected text
      for (const section of this.document.sections) {
        for (const block of section.blocks) {
          if (block.type !== 'paragraph') continue;
          const para = block as Paragraph;
          for (const run of para.textRuns) {
            run.hyperlink = { url, color: '#0563C1', underline: true };
          }
        }
      }
    } else {
      // Insert hyperlink text
      const para = this.findParagraph(this.cursor.blockId);
      if (!para) return;
      const newRun: TextRun = {
        id: generateId(),
        text: displayText,
        formatting: { color: '#0563C1', underline: true },
        hyperlink: { url, color: '#0563C1', underline: true },
      };
      para.textRuns.splice(this.cursor.runIndex + 1, 0, newRun);
      this.cursor.offset += displayText.length;
    }

    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  // ─── Selection ─────────────────────────────────────────────────────────

  selectAll(): void {
    const firstBlock = this.document.sections[0].blocks[0];
    const lastSection = this.document.sections[this.document.sections.length - 1];
    const lastBlock = lastSection.blocks[lastSection.blocks.length - 1];
    this.selection = {
      start: { blockId: firstBlock.id, runIndex: 0, offset: 0 },
      end: this.getEndOfBlock(lastBlock),
      isCollapsed: false,
    };
    this.cursor = { ...this.selection.end };
    this.emit('selection-changed');
  }

  selectWord(): void {
    const para = this.findParagraph(this.cursor.blockId);
    if (!para) return;
    const fullText = para.textRuns.map(r => r.text).join('');
    const offset = this.getAbsoluteOffset(this.cursor) - this.getTextOffsetForBlock(this.cursor.blockId);

    let wordStart = offset;
    let wordEnd = offset;

    while (wordStart > 0 && fullText[wordStart - 1] !== ' ' && fullText[wordStart - 1] !== '\n') wordStart--;
    while (wordEnd < fullText.length && fullText[wordEnd] !== ' ' && fullText[wordEnd] !== '\n') wordEnd++;

    this.setSelection(
      { blockId: para.id, runIndex: 0, offset: wordStart },
      { blockId: para.id, runIndex: 0, offset: wordEnd }
    );
  }

  selectLine(): void {
    const para = this.findParagraph(this.cursor.blockId);
    if (!para) return;
    const textLength = para.textRuns.reduce((sum, r) => sum + r.text.length, 0);
    this.setSelection(
      { blockId: para.id, runIndex: 0, offset: 0 },
      { blockId: para.id, runIndex: para.textRuns.length - 1, offset: textLength }
    );
  }

  selectParagraph(): void {
    this.selectLine();
  }

  private getEndOfBlock(block: Block): CursorPosition {
    if (block.type === 'paragraph') {
      const para = block as Paragraph;
      if (para.textRuns.length === 0) return { blockId: para.id, runIndex: 0, offset: 0 };
      const lastRun = para.textRuns[para.textRuns.length - 1];
      return { blockId: para.id, runIndex: para.textRuns.length - 1, offset: lastRun.text.length };
    }
    return { blockId: block.id, runIndex: 0, offset: 0 };
  }

  setSelection(start: CursorPosition, end: CursorPosition): void {
    const startOffset = this.getAbsoluteOffset(start);
    const endOffset = this.getAbsoluteOffset(end);
    if (startOffset <= endOffset) {
      this.selection = { start, end, isCollapsed: startOffset === endOffset };
    } else {
      this.selection = { start: end, end: start, isCollapsed: startOffset === endOffset };
    }
    this.cursor = { ...this.selection.end };
    this.emit('selection-changed');
  }

  moveCursorLeft(): void {
    if (!this.selection.isCollapsed) {
      this.cursor = { ...this.selection.start };
      this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      this.emit('selection-changed');
      return;
    }

    if (this.cursor.offset > 0) {
      this.cursor.offset--;
    } else if (this.cursor.runIndex > 0) {
      this.cursor.runIndex--;
      const para = this.findParagraph(this.cursor.blockId);
      if (para) this.cursor.offset = para.textRuns[this.cursor.runIndex]?.text.length || 0;
    } else {
      const found = this.findBlock(this.cursor.blockId);
      if (found && found.blockIndex > 0) {
        const prevBlock = found.section.blocks[found.blockIndex - 1];
        if (prevBlock.type === 'paragraph') {
          this.cursor = this.getEndOfBlock(prevBlock);
        }
      }
    }
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.emit('selection-changed');
  }

  moveCursorRight(): void {
    if (!this.selection.isCollapsed) {
      this.cursor = { ...this.selection.end };
      this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      this.emit('selection-changed');
      return;
    }

    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      const run = para.textRuns[this.cursor.runIndex];
      if (run && this.cursor.offset < run.text.length) {
        this.cursor.offset++;
      } else if (this.cursor.runIndex < para.textRuns.length - 1) {
        this.cursor.runIndex++;
        this.cursor.offset = 0;
      } else {
        const found = this.findBlock(this.cursor.blockId);
        if (found && found.blockIndex < found.section.blocks.length - 1) {
          const nextBlock = found.section.blocks[found.blockIndex + 1];
          if (nextBlock.type === 'paragraph') {
            this.cursor = { blockId: nextBlock.id, runIndex: 0, offset: 0 };
          }
        }
      }
    }
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.emit('selection-changed');
  }

  moveCursorUp(): void {
    if (!this.selection.isCollapsed) {
      this.cursor = { ...this.selection.start };
      this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      this.emit('selection-changed');
      return;
    }
    const found = this.findBlock(this.cursor.blockId);
    if (found && found.blockIndex > 0) {
      const prevBlock = found.section.blocks[found.blockIndex - 1];
      if (prevBlock.type === 'paragraph') {
        const prevPara = prevBlock as Paragraph;
        const prevLen = prevPara.textRuns.reduce((sum, r) => sum + r.text.length, 0);
        const targetOffset = Math.min(this.cursor.offset, prevLen);
        let remaining = targetOffset;
        let ri = 0;
        while (ri < prevPara.textRuns.length - 1 && remaining > prevPara.textRuns[ri].text.length) {
          remaining -= prevPara.textRuns[ri].text.length;
          ri++;
        }
        this.cursor = { blockId: prevPara.id, runIndex: ri, offset: remaining };
        this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
        this.emit('selection-changed');
      }
    }
  }

  moveCursorDown(): void {
    if (!this.selection.isCollapsed) {
      this.cursor = { ...this.selection.end };
      this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      this.emit('selection-changed');
      return;
    }
    const found = this.findBlock(this.cursor.blockId);
    if (found && found.blockIndex < found.section.blocks.length - 1) {
      const nextBlock = found.section.blocks[found.blockIndex + 1];
      if (nextBlock.type === 'paragraph') {
        const nextPara = nextBlock as Paragraph;
        const nextLen = nextPara.textRuns.reduce((sum, r) => sum + r.text.length, 0);
        const targetOffset = Math.min(this.cursor.offset, nextLen);
        let remaining = targetOffset;
        let ri = 0;
        while (ri < nextPara.textRuns.length - 1 && remaining > nextPara.textRuns[ri].text.length) {
          remaining -= nextPara.textRuns[ri].text.length;
          ri++;
        }
        this.cursor = { blockId: nextPara.id, runIndex: ri, offset: remaining };
        this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
        this.emit('selection-changed');
      }
    }
  }

  moveCursorToStart(): void {
    const firstBlock = this.document.sections[0].blocks[0];
    this.cursor = { blockId: firstBlock.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.emit('selection-changed');
  }

  moveCursorToEnd(): void {
    const lastSection = this.document.sections[this.document.sections.length - 1];
    const lastBlock = lastSection.blocks[lastSection.blocks.length - 1];
    this.cursor = this.getEndOfBlock(lastBlock);
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.emit('selection-changed');
  }

  moveCursorToStartOfLine(): void {
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      this.cursor = { blockId: para.id, runIndex: 0, offset: 0 };
      this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      this.emit('selection-changed');
    }
  }

  moveCursorToEndOfLine(): void {
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      const lastRun = para.textRuns[para.textRuns.length - 1];
      this.cursor = { blockId: para.id, runIndex: para.textRuns.length - 1, offset: lastRun ? lastRun.text.length : 0 };
      this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      this.emit('selection-changed');
    }
  }

  extendSelectionLeft(): void {
    if (this.selection.isCollapsed) this.selection.start = { ...this.cursor };
    this.moveCursorLeft();
    this.selection.end = { ...this.cursor };
    this.selection.isCollapsed = this.getAbsoluteOffset(this.selection.start) === this.getAbsoluteOffset(this.selection.end);
    this.emit('selection-changed');
  }

  extendSelectionRight(): void {
    if (this.selection.isCollapsed) this.selection.start = { ...this.cursor };
    this.moveCursorRight();
    this.selection.end = { ...this.cursor };
    this.selection.isCollapsed = this.getAbsoluteOffset(this.selection.start) === this.getAbsoluteOffset(this.selection.end);
    this.emit('selection-changed');
  }

  extendSelectionUp(): void {
    if (this.selection.isCollapsed) this.selection.start = { ...this.cursor };
    this.moveCursorUp();
    this.selection.end = { ...this.cursor };
    this.selection.isCollapsed = this.getAbsoluteOffset(this.selection.start) === this.getAbsoluteOffset(this.selection.end);
    this.emit('selection-changed');
  }

  extendSelectionDown(): void {
    if (this.selection.isCollapsed) this.selection.start = { ...this.cursor };
    this.moveCursorDown();
    this.selection.end = { ...this.cursor };
    this.selection.isCollapsed = this.getAbsoluteOffset(this.selection.start) === this.getAbsoluteOffset(this.selection.end);
    this.emit('selection-changed');
  }

  extendSelectionToStart(): void {
    if (this.selection.isCollapsed) this.selection.start = { ...this.cursor };
    this.moveCursorToStart();
    this.selection.end = { ...this.cursor };
    this.selection.isCollapsed = false;
    this.emit('selection-changed');
  }

  extendSelectionToEnd(): void {
    if (this.selection.isCollapsed) this.selection.start = { ...this.cursor };
    this.moveCursorToEnd();
    this.selection.end = { ...this.cursor };
    this.selection.isCollapsed = false;
    this.emit('selection-changed');
  }

  // ─── Formatting ────────────────────────────────────────────────────────

  toggleBold(): void {
    this.activeFormatting.bold = !this.activeFormatting.bold;
    this.applyFormattingToSelection({ bold: this.activeFormatting.bold });
  }

  toggleItalic(): void {
    this.activeFormatting.italic = !this.activeFormatting.italic;
    this.applyFormattingToSelection({ italic: this.activeFormatting.italic });
  }

  toggleUnderline(): void {
    this.activeFormatting.underline = !this.activeFormatting.underline;
    this.applyFormattingToSelection({ underline: this.activeFormatting.underline });
  }

  toggleStrikethrough(): void {
    this.activeFormatting.strikethrough = !this.activeFormatting.strikethrough;
    this.applyFormattingToSelection({ strikethrough: this.activeFormatting.strikethrough });
  }

  toggleDoubleStrikethrough(): void {
    this.activeFormatting.doubleStrikethrough = !this.activeFormatting.doubleStrikethrough;
    this.applyFormattingToSelection({ doubleStrikethrough: this.activeFormatting.doubleStrikethrough });
  }

  toggleSuperscript(): void {
    this.activeFormatting.superscript = !this.activeFormatting.superscript;
    if (this.activeFormatting.superscript) this.activeFormatting.subscript = false;
    this.applyFormattingToSelection({ superscript: this.activeFormatting.superscript, subscript: false });
  }

  toggleSubscript(): void {
    this.activeFormatting.subscript = !this.activeFormatting.subscript;
    if (this.activeFormatting.subscript) this.activeFormatting.superscript = false;
    this.applyFormattingToSelection({ subscript: this.activeFormatting.subscript, superscript: false });
  }

  toggleSmallCaps(): void {
    this.activeFormatting.smallCaps = !this.activeFormatting.smallCaps;
    this.applyFormattingToSelection({ smallCaps: this.activeFormatting.smallCaps });
  }

  toggleAllCaps(): void {
    this.activeFormatting.allCaps = !this.activeFormatting.allCaps;
    this.applyFormattingToSelection({ allCaps: this.activeFormatting.allCaps });
  }

  setFontFamily(family: string): void {
    this.activeFormatting.fontFamily = family;
    this.applyFormattingToSelection({ fontFamily: family });
  }

  setFontSize(size: number): void {
    this.activeFormatting.fontSize = size;
    this.applyFormattingToSelection({ fontSize: size });
  }

  setTextColor(color: string): void {
    this.activeFormatting.color = color;
    this.applyFormattingToSelection({ color });
  }

  setHighlight(color: string): void {
    this.activeFormatting.highlight = color;
    this.applyFormattingToSelection({ highlight: color });
  }

  setCharacterSpacing(spacing: number): void {
    this.activeFormatting.characterSpacing = spacing;
    this.applyFormattingToSelection({ characterSpacing: spacing });
  }

  clearFormatting(): void {
    if (this.selection.isCollapsed) {
      this.activeFormatting = {};
      return;
    }
    this.pushUndo();
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        for (const run of para.textRuns) {
          run.formatting = {};
          run.hyperlink = undefined;
        }
      }
    }
    this.activeFormatting = {};
    this.emit('document-changed');
  }

  // ─── Format Painter ────────────────────────────────────────────────────

  startFormatPainter(): void {
    if (!this.selection.isCollapsed) {
      const para = this.findParagraph(this.cursor.blockId);
      if (para && para.textRuns[this.cursor.runIndex]) {
        this._formatPainterActive = true;
      }
    }
  }

  stopFormatPainter(): void {
    this._formatPainterActive = false;
  }



  // ─── Change Case ───────────────────────────────────────────────────────

  changeCase(caseType: 'sentenceCase' | 'lowerCase' | 'upperCase' | 'capitalizeEachWord' | 'tOGGLEcASE'): void {
    this.pushUndo();
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        for (const run of para.textRuns) {
          switch (caseType) {
            case 'sentenceCase':
              run.text = run.text.replace(/(^\s*[.!?]\s*[a-z]|[a-z])/g, (match, _p1: string, offset: number) => {
                if (offset === 0) return match.toUpperCase();
                const prevChar = run.text[offset - 1];
                if (prevChar === '.' || prevChar === '!' || prevChar === '?') return match.toUpperCase();
                return match.toLowerCase();
              });
              break;
            case 'lowerCase':
              run.text = run.text.toLowerCase();
              break;
            case 'upperCase':
              run.text = run.text.toUpperCase();
              break;
            case 'capitalizeEachWord':
              run.text = run.text.replace(/\b\w/g, c => c.toUpperCase());
              break;
            case 'tOGGLEcASE':
              run.text = run.text.split('').map((c, i) =>
                i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
              ).join('');
              break;
          }
        }
      }
    }
    this.emit('document-changed');
  }

  private applyFormattingToSelection(fmt: Partial<RunFormatting>): void {
    if (this.selection.isCollapsed) return;
    this.pushUndo();

    const startOffset = this.getAbsoluteOffset(this.selection.start);
    const endOffset = this.getAbsoluteOffset(this.selection.end);
    const minAbs = Math.min(startOffset, endOffset);
    const maxAbs = Math.max(startOffset, endOffset);

    let charPos = 0;
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        for (const run of para.textRuns) {
          const runStart = charPos;
          const runEnd = charPos + run.text.length;
          if (runEnd > minAbs && runStart < maxAbs) {
            run.formatting = { ...run.formatting, ...fmt };
          }
          charPos = runEnd;
        }
      }
    }
    this.emit('document-changed');
  }

  // ─── Paragraph formatting ──────────────────────────────────────────────

  setAlignment(alignment: Alignment): void {
    this.pushUndo();
    if (!this.selection.isCollapsed) {
      // Apply to all paragraphs in selection
      for (const section of this.document.sections) {
        for (const block of section.blocks) {
          if (block.type === 'paragraph') {
            (block as Paragraph).formatting.alignment = alignment;
          }
        }
      }
    } else {
      const para = this.findParagraph(this.cursor.blockId);
      if (para) para.formatting.alignment = alignment;
    }
    this.emit('document-changed');
  }

  setLineSpacing(value: number, rule: 'auto' | 'exact' | 'atLeast' = 'auto'): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.lineSpacing = value;
      para.formatting.lineSpacingRule = rule;
    }
    this.emit('document-changed');
  }

  setSpaceBefore(value: number): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) para.formatting.spaceBefore = value;
    this.emit('document-changed');
  }

  setSpaceAfter(value: number): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) para.formatting.spaceAfter = value;
    this.emit('document-changed');
  }

  setLeftIndent(indent: number): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) para.formatting.leftIndent = indent;
    this.emit('document-changed');
  }

  setRightIndent(indent: number): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) para.formatting.rightIndent = indent;
    this.emit('document-changed');
  }

  setFirstLineIndent(indent: number): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.firstLineIndent = indent;
      para.formatting.hangingIndent = indent > 0 ? -indent : 0;
    }
    this.emit('document-changed');
  }

  setHangingIndent(indent: number): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.hangingIndent = indent;
      para.formatting.firstLineIndent = -indent;
    }
    this.emit('document-changed');
  }

  togglePageBreakBefore(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.pageBreakBefore = !para.formatting.pageBreakBefore;
    }
    this.emit('document-changed');
  }

  toggleKeepWithNext(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.keepWithNext = !para.formatting.keepWithNext;
    }
    this.emit('document-changed');
  }

  toggleKeepLinesTogether(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.keepLinesTogether = !para.formatting.keepLinesTogether;
    }
    this.emit('document-changed');
  }

  toggleWidowControl(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.widowControl = !para.formatting.widowControl;
    }
    this.emit('document-changed');
  }

  setParagraphBorders(borders: ParagraphBorders): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) para.formatting.paragraphBorders = borders;
    this.emit('document-changed');
  }

  setParagraphShading(fill: string): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.paragraphShading = { fill, pattern: fill === 'auto' ? 'clear' : 'solid', color: 'auto' };
    }
    this.emit('document-changed');
  }

  // ─── List operations ───────────────────────────────────────────────────

  setBulletList(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      if (para.formatting.listFormat.type === 'bullet') {
        para.formatting.listFormat = defaultListFormat();
      } else {
        para.formatting.listFormat = { type: 'bullet', level: 0 };
        para.formatting.leftIndent = Math.max(para.formatting.leftIndent, 720);
      }
    }
    this.emit('document-changed');
  }

  setNumberedList(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      if (para.formatting.listFormat.type === 'numbered') {
        para.formatting.listFormat = defaultListFormat();
      } else {
        para.formatting.listFormat = { type: 'numbered', level: 0, startValue: 1 };
        para.formatting.leftIndent = Math.max(para.formatting.leftIndent, 720);
      }
    }
    this.emit('document-changed');
  }

  setMultilevelList(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      if (para.formatting.listFormat.type === 'multilevel') {
        para.formatting.listFormat = defaultListFormat();
      } else {
        para.formatting.listFormat = { type: 'multilevel', level: 0 };
        para.formatting.leftIndent = Math.max(para.formatting.leftIndent, 720);
      }
    }
    this.emit('document-changed');
  }

  increaseListLevel(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para && para.formatting.listFormat.type !== 'none') {
      para.formatting.listFormat.level = Math.min(para.formatting.listFormat.level + 1, 8);
      para.formatting.leftIndent += 720;
    }
    this.emit('document-changed');
  }

  decreaseListLevel(): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para && para.formatting.listFormat.type !== 'none') {
      if (para.formatting.listFormat.level > 0) {
        para.formatting.listFormat.level--;
        para.formatting.leftIndent = Math.max(0, para.formatting.leftIndent - 720);
      } else {
        para.formatting.listFormat = defaultListFormat();
        para.formatting.leftIndent = 0;
      }
    }
    this.emit('document-changed');
  }

  // ─── Styles ────────────────────────────────────────────────────────────

  applyStyle(styleName: string): void {
    this.pushUndo();
    const styleDef = this.document.styles.find(s => s.name === styleName);
    if (!styleDef) return;

    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.style = styleName;
      para.formatting = cloneFormatting(styleDef.paragraphFormatting);
      if (!this.selection.isCollapsed) {
        // Apply run formatting to selection
        for (const section of this.document.sections) {
          for (const block of section.blocks) {
            if (block.type !== 'paragraph') continue;
            const p = block as Paragraph;
            p.style = styleName;
            for (const run of p.textRuns) {
              run.formatting = { ...run.formatting, ...styleDef.runFormatting };
            }
          }
        }
      }
    }
    this.emit('document-changed');
    this.emit('style-changed');
  }

  createCustomStyle(name: string, runFormatting: RunFormatting, paragraphFormatting: ParagraphFormatting): void {
    const existing = this.document.styles.find(s => s.name === name);
    if (existing) {
      existing.runFormatting = { ...runFormatting };
      existing.paragraphFormatting = cloneFormatting(paragraphFormatting);
      existing.isCustom = true;
    } else {
      this.document.styles.push({
        id: generateId(), name, displayName: name, type: 'paragraph',
        runFormatting: { ...runFormatting },
        paragraphFormatting: cloneFormatting(paragraphFormatting),
        paragraphBorders: {}, paragraphShading: { fill: 'auto', pattern: 'clear', color: 'auto' },
        isDefault: false, isBuiltIn: false, isCustom: true, isVisible: true,
        priority: 100, semiHidden: false, locked: false, quickFormat: false, uiPriority: 100, hidden: false,
      });
    }
    this.emit('style-changed');
  }

  // ─── Table operations ──────────────────────────────────────────────────

  insertTable(rows: number, cols: number): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const tableRows: TableRow[] = [];
    for (let r = 0; r < rows; r++) {
      const cells: TableCell[] = [];
      for (let c = 0; c < cols; c++) {
        cells.push({
          id: generateId(),
          textRuns: [{ id: generateId(), text: '', formatting: {} }],
          paragraphs: [],
          rowSpan: 1, colSpan: 1,
          borders: defaultCellBorders(),
          verticalAlignment: 'top',
          width: Math.floor(9000 / cols),
          cellWidthType: 'auto',
          shading: { fill: 'auto', pattern: 'clear', color: 'auto' },
          textDirection: 'ltr',
          margins: defaultCellMargins(),
          noWrap: false,
        });
      }
      tableRows.push({
        id: generateId(), cells,
        height: 0, heightType: 'auto',
        headerRow: r === 0, cantSplit: false, tableHeader: r === 0,
      });
    }

    const table: Table = {
      id: generateId(), type: 'table', rows: tableRows,
      columnWidths: Array(cols).fill(Math.floor(9000 / cols)),
      headerRow: true,
      tableBorders: {
        top: { style: 'single', size: 4, color: '#000000', space: 0 },
        bottom: { style: 'single', size: 4, color: '#000000', space: 0 },
        left: { style: 'single', size: 4, color: '#000000', space: 0 },
        right: { style: 'single', size: 4, color: '#000000', space: 0 },
        insideH: { style: 'single', size: 4, color: '#000000', space: 0 },
        insideV: { style: 'single', size: 4, color: '#000000', space: 0 },
      },
      tableLook: { firstRow: true, lastRow: false, firstColumn: false, lastColumn: false, noHorizontalBand: false, noVerticalBand: false },
      indentation: 0, tableWidth: 0, tableWidthType: 'auto', overlap: false,
      cellMarginDefault: defaultCellMargins(), tableLayout: 'autofit', bidi: false,
    };

    const emptyPara: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: '', formatting: {} }],
      formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
    };

    found.section.blocks.splice(found.blockIndex + 1, 0, table, emptyPara);
    this.cursor = { blockId: emptyPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  // ─── Image operations ──────────────────────────────────────────────────

  insertImage(src: string, altText: string, width: number, height: number): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const image: ImageBlock = {
      id: generateId(), type: 'image', src, altText,
      width, height, alignment: 'center',
      textWrapping: { style: 'inline', side: 'both', distance: { top: 0, bottom: 0, left: 0, right: 0 } },
      rotation: 0, lockAspectRatio: true,
      effects: [], description: altText, title: '',
    };

    const emptyPara: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: '', formatting: {} }],
      formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
    };

    found.section.blocks.splice(found.blockIndex + 1, 0, image, emptyPara);
    this.cursor = { blockId: emptyPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  // ─── Shape operations ──────────────────────────────────────────────────

  insertShape(shapeType: ShapeType): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const shape: ShapeBlock = {
      id: generateId(), type: 'shape', shapeType,
      x: 100, y: 100, width: 200, height: 150, rotation: 0,
      fill: defaultShapeFill(),
      outline: defaultShapeOutline(),
      textFormatting: {
        alignment: 'center', verticalAlignment: 'center', wordWrap: true,
        margins: { left: 7, right: 7, top: 7, bottom: 7 }, autofit: 'none',
      },
      effects: [], lockAspectRatio: false, flipH: false, flipV: false, zIndex: 0,
      description: '', title: '',
    };

    const emptyPara: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: '', formatting: {} }],
      formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
    };

    found.section.blocks.splice(found.blockIndex + 1, 0, shape, emptyPara);
    this.cursor = { blockId: emptyPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  // ─── Chart operations ──────────────────────────────────────────────────

  insertChart(chartType: ChartBlock['chartType']): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const chart: ChartBlock = {
      id: generateId(), type: 'chart', chartType,
      width: 500, height: 350, alignment: 'center',
      title: { text: 'Chart Title', position: 'above', overlay: false, formatting: { bold: true, fontSize: 14 } },
      legend: { position: 'bottom', overlay: false, showLegendKeys: true },
      data: {
        labels: ['Category 1', 'Category 2', 'Category 3', 'Category 4'],
        series: [
          { name: 'Series 1', values: [10, 20, 15, 25], color: '#4472C4' },
          { name: 'Series 2', values: [15, 10, 20, 18], color: '#ED7D31' },
        ],
      },
      style: { variant: 1, colorScheme: ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'] },
      xAxis: { title: '', showTitle: false, logarithmic: false, reverseOrder: false, majorGridlines: false, minorGridlines: false, labelPosition: 'nextToAxis' },
      yAxis: { title: '', showTitle: false, logarithmic: false, reverseOrder: false, majorGridlines: true, minorGridlines: false, labelPosition: 'nextToAxis' },
      dataLabels: { show: false, showValue: false, showCategory: false, showSeries: false, showPercentage: false, separator: ', ', formatting: {} },
      trendlines: [],
    };

    const emptyPara: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: '', formatting: {} }],
      formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
    };

    found.section.blocks.splice(found.blockIndex + 1, 0, chart, emptyPara);
    this.cursor = { blockId: emptyPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  // ─── Equation operations ───────────────────────────────────────────────

  insertEquation(latex: string): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const equation: EquationBlock = {
      id: generateId(), type: 'equation', latex,
      formatting: { italic: true },
      textRuns: [{ id: generateId(), text: latex, formatting: { italic: true } }],
      mathStyle: 'professional', justification: 'center',
    };

    found.section.blocks.splice(found.blockIndex + 1, 0, equation);
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  // ─── SmartArt operations ───────────────────────────────────────────────

  insertSmartArt(layout: SmartArtLayout): void {
    this.pushUndo();
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const defaultNodes: SmartArtNode[] = [
      { id: generateId(), text: 'Level 1', shapeId: 1, children: [
        { id: generateId(), text: 'Level 2', shapeId: 2, children: [] },
        { id: generateId(), text: 'Level 2', shapeId: 3, children: [] },
      ]},
      { id: generateId(), text: 'Level 1', shapeId: 4, children: [
        { id: generateId(), text: 'Level 2', shapeId: 5, children: [] },
      ]},
    ];

    const smartArt: SmartArtBlock = {
      id: generateId(), type: 'smartart', layout,
      nodes: defaultNodes, colorStyle: 'accent1',
      width: 500, height: 300, alignment: 'center',
    };

    const emptyPara: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: '', formatting: {} }],
      formatting: defaultParagraphFormatting(), style: 'Normal', footnotes: [], endnotes: [],
    };

    found.section.blocks.splice(found.blockIndex + 1, 0, smartArt, emptyPara);
    this.cursor = { blockId: emptyPara.id, runIndex: 0, offset: 0 };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  // ─── Comment operations ────────────────────────────────────────────────

  addComment(text: string, author: string = 'User'): void {
    this.pushUndo();
    const comment: Comment = {
      id: generateId(), author,
      authorInitials: author.split(' ').map(w => w[0]).join('').toUpperCase(),
      date: new Date().toISOString(),
      text, resolved: false, replies: [],
      rangeStart: { ...this.selection.start },
      rangeEnd: { ...this.selection.end },
      done: false,
    };
    this.document.comments.push(comment);

    // Add comment ID to runs in selection
    if (!this.selection.isCollapsed) {
      for (const section of this.document.sections) {
        for (const block of section.blocks) {
          if (block.type !== 'paragraph') continue;
          const para = block as Paragraph;
          for (const run of para.textRuns) {
            if (!run.commentIds) run.commentIds = [];
            run.commentIds.push(comment.id);
          }
        }
      }
    }
    this.emit('comment-changed');
    this.emit('document-changed');
  }

  replyToComment(commentId: string, text: string, author: string = 'User'): void {
    this.pushUndo();
    const comment = this.document.comments.find(c => c.id === commentId);
    if (!comment) return;
    comment.replies.push({
      id: generateId(), author,
      authorInitials: author.split(' ').map(w => w[0]).join('').toUpperCase(),
      date: new Date().toISOString(), text,
    });
    this.emit('comment-changed');
  }

  resolveComment(commentId: string): void {
    const comment = this.document.comments.find(c => c.id === commentId);
    if (comment) {
      comment.resolved = !comment.resolved;
      this.emit('comment-changed');
    }
  }

  deleteComment(commentId: string): void {
    this.pushUndo();
    this.document.comments = this.document.comments.filter(c => c.id !== commentId);
    this.emit('comment-changed');
    this.emit('document-changed');
  }

  // ─── Track Changes ─────────────────────────────────────────────────────

  toggleTrackChanges(): void {
    this.document.trackChanges.enabled = !this.document.trackChanges.enabled;
    this.emit('track-changes-changed');
  }

  setTrackChangesAuthor(author: string): void {
    this.document.trackChanges.author = author;
  }

  acceptChange(changeId: string): void {
    this.pushUndo();
    const change = this.document.trackChanges.changes.find(c => c.id === changeId);
    if (!change) return;

    if (change.type === 'insertion') {
      // Keep the text
    } else if (change.type === 'deletion') {
      // Already removed
    }
    this.document.trackChanges.changes = this.document.trackChanges.changes.filter(c => c.id !== changeId);
    this.emit('track-changes-changed');
    this.emit('document-changed');
  }

  rejectChange(changeId: string): void {
    this.pushUndo();
    const change = this.document.trackChanges.changes.find(c => c.id === changeId);
    if (!change) return;

    if (change.type === 'insertion') {
      // Remove the text
    } else if (change.type === 'deletion') {
      // Restore the text
    }
    this.document.trackChanges.changes = this.document.trackChanges.changes.filter(c => c.id !== changeId);
    this.emit('track-changes-changed');
    this.emit('document-changed');
  }

  acceptAllChanges(): void {
    this.pushUndo();
    this.document.trackChanges.changes = [];
    this.emit('track-changes-changed');
    this.emit('document-changed');
  }

  rejectAllChanges(): void {
    this.pushUndo();
    this.document.trackChanges.changes = [];
    this.emit('track-changes-changed');
    this.emit('document-changed');
  }

  // ─── Watermark ─────────────────────────────────────────────────────────

  setTextWatermark(text: string, options?: Partial<Watermark>): void {
    this.pushUndo();
    this.document.watermarks = [{
      type: 'text', text, font: 'Calibri', fontSize: 48, color: '#C0C0C0',
      transparency: 150, rotation: -45, isDiagonal: true, ...options,
    }];
    this.emit('document-changed');
  }

  setPictureWatermark(src: string): void {
    this.pushUndo();
    this.document.watermarks = [{ type: 'picture', pictureSrc: src, scale: 100, transparency: 150 }];
    this.emit('document-changed');
  }

  removeWatermark(): void {
    this.pushUndo();
    this.document.watermarks = [];
    this.emit('document-changed');
  }

  // ─── Page Setup ────────────────────────────────────────────────────────

  setPageSize(size: PageSize): void {
    this.pushUndo();
    const sizes: Record<PageSize, { width: number; height: number }> = {
      letter: { width: 12240, height: 15840 },
      legal: { width: 12240, height: 20160 },
      tabloid: { width: 15840, height: 24480 },
      A3: { width: 16838, height: 23811 },
      A4: { width: 11906, height: 16838 },
      A5: { width: 8396, height: 11906 },
      B4: { width: 14740, height: 20874 },
      B5: { width: 10620, height: 14740 },
      ' executive': { width: 10440, height: 15120 },
      statement: { width: 7920, height: 12240 },
      envelope: { width: 12240, height: 8640 },
      '8x10': { width: 11520, height: 14400 },
      '10x14': { width: 14400, height: 20160 },
      custom: { width: 12240, height: 15840 },
    };
    const dim = sizes[size] || sizes.letter;
    this.document.pageSetup.pageSize = size;
    this.document.pageSetup.pageWidth = dim.width;
    this.document.pageSetup.pageHeight = dim.height;

    // Update all sections
    for (const section of this.document.sections) {
      section.properties.pageSize = size;
      section.properties.pageWidth = dim.width;
      section.properties.pageHeight = dim.height;
    }
    this.emit('document-changed');
  }

  setOrientation(orientation: 'portrait' | 'landscape'): void {
    this.pushUndo();
    const setup = this.document.pageSetup;
    if ((setup.orientation === 'portrait' && orientation === 'landscape') ||
        (setup.orientation === 'landscape' && orientation === 'portrait')) {
      const temp = setup.pageWidth;
      setup.pageWidth = setup.pageHeight;
      setup.pageHeight = temp;
    }
    setup.orientation = orientation;
    for (const section of this.document.sections) {
      section.properties.orientation = orientation;
      const sp = section.properties;
      if ((sp.orientation === 'portrait' && orientation === 'landscape') ||
          (sp.orientation === 'landscape' && orientation === 'portrait')) {
        const temp = sp.pageWidth;
        sp.pageWidth = sp.pageHeight;
        sp.pageHeight = temp;
      }
      sp.orientation = orientation;
    }
    this.emit('document-changed');
  }

  setPageMargins(margins: Partial<PageMargins>): void {
    this.pushUndo();
    Object.assign(this.document.pageSetup.pageMargins, margins);
    for (const section of this.document.sections) {
      Object.assign(section.properties.pageMargins, margins);
    }
    this.emit('document-changed');
  }

  setColumns(columns: number): void {
    this.pushUndo();
    this.document.pageSetup.columns = columns;
    for (const section of this.document.sections) {
      section.properties.columns = columns;
    }
    this.emit('document-changed');
  }

  // ─── Header / Footer ──────────────────────────────────────────────────

  setHeader(text: string, alignment: 'left' | 'center' | 'right' = 'center'): void {
    this.pushUndo();
    if (this.document.headers.length > 0) {
      this.document.headers[0].paragraphs = [{
        id: generateId(), type: 'paragraph',
        textRuns: [{ id: generateId(), text, formatting: { fontSize: 9, color: '#808080' } }],
        formatting: { ...defaultParagraphFormatting(), alignment }, style: 'Normal',
        footnotes: [], endnotes: [],
      }];
    }
    this.emit('document-changed');
  }

  setFooter(text: string, alignment: 'left' | 'center' | 'right' = 'center'): void {
    this.pushUndo();
    if (this.document.footers.length > 0) {
      this.document.footers[0].paragraphs = [{
        id: generateId(), type: 'paragraph',
        textRuns: [{ id: generateId(), text, formatting: { fontSize: 9, color: '#808080' } }],
        formatting: { ...defaultParagraphFormatting(), alignment }, style: 'Normal',
        footnotes: [], endnotes: [],
      }];
    }
    this.emit('document-changed');
  }

  setHeaderFooterEditing(_isEditing: boolean): void {
    // This will be tracked via a separate state in the React layer
    this.emit('document-changed');
  }

  // ─── Table of Contents ────────────────────────────────────────────────

  insertTableOfContents(): void {
    this.pushUndo();

    const entries: TOCEntry[] = [];
    let pageNumber = 1;
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type === 'paragraph') {
          const para = block as Paragraph;
          if (para.style.startsWith('Heading')) {
            const level = parseInt(para.style.replace('Heading', ''), 10) || 1;
            entries.push({
              text: para.textRuns.map(r => r.text).join(''),
              level, pageNumber,
            });
          }
          if (para.textRuns.map(r => r.text).join('') !== '') pageNumber++;
        }
      }
    }

    const toc: TableOfContents = {
      id: generateId(),
      title: 'Table of Contents',
      headingLevels: [1, 2, 3],
      showPageNumbers: true,
      rightAlignPageNumbers: true,
      useHyperlinks: true,
      showLevels: 3,
      tabLeader: 'dot',
      entries,
    };

    this.document.tableOfContents.push(toc);

    // Insert TOC paragraphs
    const found = this.findBlock(this.cursor.blockId);
    if (!found) return;

    const tocTitle: Paragraph = {
      id: generateId(), type: 'paragraph',
      textRuns: [{ id: generateId(), text: 'Table of Contents', formatting: { bold: true, fontSize: 16 } }],
      formatting: { ...defaultParagraphFormatting(), alignment: 'left' },
      style: 'TOCHeading', footnotes: [], endnotes: [],
    };

    const tocBlocks: Block[] = [tocTitle];
    for (const entry of entries) {
      const indent = (entry.level - 1) * 440;
      const dots = '.'.repeat(Math.max(1, 60 - entry.text.length - String(entry.pageNumber).length));
      tocBlocks.push({
        id: generateId(), type: 'paragraph',
        textRuns: [{
          id: generateId(),
          text: `${'  '.repeat(entry.level - 1)}${entry.text} ${dots} ${entry.pageNumber}`,
          formatting: { fontSize: 11 },
        }],
        formatting: { ...defaultParagraphFormatting(), leftIndent: indent },
        style: 'Normal', footnotes: [], endnotes: [],
      } as Paragraph);
    }

    found.section.blocks.splice(found.blockIndex + 1, 0, ...tocBlocks);
    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emitAll();
  }

  updateTableOfContents(): void {
    this.insertTableOfContents();
  }

  // ─── Footnotes / Endnotes ─────────────────────────────────────────────

  insertFootnote(text: string): void {
    this.pushUndo();
    const footnote: Footnote = {
      id: generateId(),
      marker: String(this.document.footnotes.length + 1),
      markerFormat: 'autoNumber',
      text,
      paragraphs: [{
        id: generateId(), type: 'paragraph',
        textRuns: [{ id: generateId(), text, formatting: {} }],
        formatting: defaultParagraphFormatting(), style: 'Normal',
        footnotes: [], endnotes: [],
      }],
      referencePosition: { ...this.cursor },
    };
    this.document.footnotes.push(footnote);

    // Mark current run
    const para = this.findParagraph(this.cursor.blockId);
    if (para && para.textRuns[this.cursor.runIndex]) {
      para.textRuns[this.cursor.runIndex].footnoteId = footnote.id;
    }
    this.emit('document-changed');
  }

  insertEndnote(text: string): void {
    this.pushUndo();
    const endnote: Endnote = {
      id: generateId(),
      marker: String(this.document.endnotes.length + 1),
      markerFormat: 'autoNumber',
      text,
      paragraphs: [{
        id: generateId(), type: 'paragraph',
        textRuns: [{ id: generateId(), text, formatting: {} }],
        formatting: defaultParagraphFormatting(), style: 'Normal',
        footnotes: [], endnotes: [],
      }],
      referencePosition: { ...this.cursor },
    };
    this.document.endnotes.push(endnote);

    const para = this.findParagraph(this.cursor.blockId);
    if (para && para.textRuns[this.cursor.runIndex]) {
      para.textRuns[this.cursor.runIndex].endnoteId = endnote.id;
    }
    this.emit('document-changed');
  }

  // ─── Tab stops ─────────────────────────────────────────────────────────

  addTabStop(position: number, alignment: 'left' | 'center' | 'right' | 'decimal' = 'left', leader: TabStop['leader'] = 'none'): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.tabs.push({ position, alignment, leader });
    }
    this.emit('document-changed');
  }

  removeTabStop(position: number): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.tabs = para.formatting.tabs.filter(t => t.position !== position);
    }
    this.emit('document-changed');
  }

  // ─── Drop Cap ──────────────────────────────────────────────────────────

  setDropCap(style: 'none' | 'dropped' | 'inMargin', lines: number = 3): void {
    this.pushUndo();
    const para = this.findParagraph(this.cursor.blockId);
    if (para) {
      para.formatting.dropCap = { style, lines };
    }
    this.emit('document-changed');
  }

  // ─── Bookmark management ───────────────────────────────────────────────

  deleteBookmark(name: string): void {
    this.pushUndo();
    this.document.bookmarks = this.document.bookmarks.filter(b => b.name !== name);
    this.emit('document-changed');
  }

  // ─── AutoCorrect management ────────────────────────────────────────────

  addAutoCorrectEntry(trigger: string, replacement: string): void {
    this.document.autoCorrectEntries.push({ trigger, replacement });
  }

  removeAutoCorrectEntry(trigger: string): void {
    this.document.autoCorrectEntries = this.document.autoCorrectEntries.filter(e => e.trigger !== trigger);
  }

  // ─── Document properties ───────────────────────────────────────────────

  setDocumentTitle(title: string): void {
    this.document.metadata.title = title;
    this.emit('document-changed');
  }

  setDocumentAuthor(author: string): void {
    this.document.metadata.author = author;
    this.document.metadata.lastModifiedBy = author;
    this.emit('document-changed');
  }

  setDocumentSubject(subject: string): void {
    this.document.metadata.subject = subject;
    this.emit('document-changed');
  }

  setDocumentKeywords(keywords: string): void {
    this.document.metadata.keywords = keywords;
    this.emit('document-changed');
  }

  setDocumentComments(comments: string): void {
    this.document.metadata.comments = comments;
    this.emit('document-changed');
  }

  // ─── Search / Replace ──────────────────────────────────────────────────

  findText(query: string, caseSensitive: boolean = false, wholeWord: boolean = false, useWildcard: boolean = false): CursorPosition[] {
    const results: CursorPosition[] = [];
    if (!query) return results;

    const searchText = caseSensitive ? query : query.toLowerCase();

    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        for (let r = 0; r < para.textRuns.length; r++) {
          const run = para.textRuns[r];
          const text = caseSensitive ? run.text : run.text.toLowerCase();
          let searchStart = 0;
          while (searchStart < text.length) {
            let idx: number;
            if (useWildcard) {
              try {
                const regex = new RegExp(searchText, caseSensitive ? 'g' : 'gi');
                regex.lastIndex = searchStart;
                const match = regex.exec(text);
                idx = match ? match.index : -1;
              } catch {
                idx = text.indexOf(searchText, searchStart);
              }
            } else {
              idx = text.indexOf(searchText, searchStart);
            }
            if (idx === -1) break;

            if (wholeWord) {
              if (idx > 0 && text[idx - 1] !== ' ' && text[idx - 1] !== '\n') { searchStart = idx + 1; continue; }
              if (idx + searchText.length < text.length && text[idx + searchText.length] !== ' ' && text[idx + searchText.length] !== '\n') { searchStart = idx + 1; continue; }
            }

            results.push({ blockId: para.id, runIndex: r, offset: idx });
            searchStart = idx + 1;
          }
        }
      }
    }
    return results;
  }

  replaceText(find: string, replace: string, caseSensitive: boolean = false, wholeWord: boolean = false): number {
    const results = this.findText(find, caseSensitive, wholeWord);
    if (results.length === 0) return 0;

    this.pushUndo();
    let count = 0;

    for (let i = results.length - 1; i >= 0; i--) {
      const pos = results[i];
      const para = this.findParagraph(pos.blockId);
      if (!para) continue;
      const run = para.textRuns[pos.runIndex];
      if (!run) continue;

      const before = run.text.substring(0, pos.offset);
      const after = run.text.substring(pos.offset + find.length);
      run.text = before + replace + after;
      count++;
    }

    this.document.metadata.modifiedAt = new Date().toISOString();
    this.emit('document-changed');
    return count;
  }

  replaceAllText(find: string, replace: string, caseSensitive: boolean = false, wholeWord: boolean = false): number {
    let totalReplaced = 0;
    let results = this.findText(find, caseSensitive, wholeWord);
    while (results.length > 0) {
      totalReplaced += this.replaceText(find, replace, caseSensitive, wholeWord);
      results = this.findText(find, caseSensitive, wholeWord);
    }
    return totalReplaced;
  }

  // ─── Go To ─────────────────────────────────────────────────────────────

  goToPage(pageNumber: number): void {
    let currentPage = 1;
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type === 'pageBreak') {
          currentPage++;
          if (currentPage === pageNumber) {
            const nextBlock = this.getNextBlock(block.id);
            if (nextBlock) {
              this.cursor = { blockId: nextBlock.id, runIndex: 0, offset: 0 };
              this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
              this.emit('selection-changed');
            }
            return;
          }
        }
        if (block.type === 'paragraph' && block.id !== this.cursor.blockId) {
          // Approximate - each paragraph is a line
        }
      }
    }
  }

  goToLine(lineNumber: number): void {
    let currentLine = 1;
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type === 'paragraph') {
          if (currentLine === lineNumber) {
            this.cursor = { blockId: block.id, runIndex: 0, offset: 0 };
            this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
            this.emit('selection-changed');
            return;
          }
          currentLine++;
        }
      }
    }
  }

  goToBookmark(name: string): void {
    const bookmark = this.document.bookmarks.find(b => b.name === name);
    if (!bookmark) return;

    // Find the bookmark in the document
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        for (let r = 0; r < para.textRuns.length; r++) {
          if (para.textRuns[r].bookmark?.name === name) {
            this.cursor = { blockId: para.id, runIndex: r, offset: 0 };
            this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
            this.emit('selection-changed');
            return;
          }
        }
      }
    }
  }

  // ─── Paragraph number bullets/numbering rendering helpers ──────────────

  getBulletCharacter(level: number): string {
    const bullets = ['•', '◦', '▪', '▫', '•', '◦', '▪', '▫', '•'];
    return bullets[level % bullets.length];
  }

  getNumberCharacter(level: number, index: number): string {
    const formats = [
      (i: number) => `${i + 1}.`,
      (i: number) => `${String.fromCharCode(97 + i % 26)}.`,
      (i: number) => `${romanize(i + 1)}.`,
      (i: number) => `${String.fromCharCode(65 + i % 26)}.`,
      (i: number) => `${i + 1})`,
    ];
    return formats[level % formats.length](index);
  }

  // ─── Undo / Redo ──────────────────────────────────────────────────────

  private pushUndo(): void {
    this.undoStack.push({
      document: cloneDocument(this.document),
      cursorPosition: { ...this.cursor },
    });
    if (this.undoStack.length > this.maxUndoSize) this.undoStack.shift();
    this.redoStack = [];
    this.emit('undo-state-changed');
  }

  undo(): void {
    if (this.undoStack.length === 0) return;
    this.redoStack.push({ document: cloneDocument(this.document), cursorPosition: { ...this.cursor } });
    const state = this.undoStack.pop()!;
    this.document = state.document;
    this.cursor = state.cursorPosition;
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.emitAll();
    this.emit('undo-state-changed');
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    this.undoStack.push({ document: cloneDocument(this.document), cursorPosition: { ...this.cursor } });
    const state = this.redoStack.pop()!;
    this.document = state.document;
    this.cursor = state.cursorPosition;
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
    this.emitAll();
    this.emit('undo-state-changed');
  }

  // ─── Serialization ─────────────────────────────────────────────────────

  serialize(): string {
    return JSON.stringify(this.document, null, 2);
  }

  deserialize(json: string): void {
    try {
      this.pushUndo();
      this.document = JSON.parse(json) as QuillDocument;
      if (this.document.sections[0]?.blocks[0]) {
        this.cursor = { blockId: this.document.sections[0].blocks[0].id, runIndex: 0, offset: 0 };
      }
      this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
      this.emitAll();
    } catch (e) {
      console.error('Failed to deserialize document:', e);
    }
  }

  // ─── Export ────────────────────────────────────────────────────────────

  exportAsHTML(): string {
    let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' +
      this.document.metadata.title + '</title></head><body style="font-family:Calibri,sans-serif;max-width:816px;margin:0 auto;">';

    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type === 'paragraph') {
          const para = block as Paragraph;
          const align = para.formatting.alignment !== 'left' ? `text-align:${para.formatting.alignment};` : '';
          const runs = para.textRuns.map(r => {
            let style = '';
            if (r.formatting.bold) style += 'font-weight:bold;';
            if (r.formatting.italic) style += 'font-style:italic;';
            if (r.formatting.underline) style += 'text-decoration:underline;';
            if (r.formatting.strikethrough) style += 'text-decoration:line-through;';
            if (r.formatting.fontFamily) style += `font-family:${r.formatting.fontFamily};`;
            if (r.formatting.fontSize) style += `font-size:${r.formatting.fontSize}pt;`;
            if (r.formatting.color) style += `color:${r.formatting.color};`;
            if (r.formatting.highlight) style += `background-color:${r.formatting.highlight};`;
            if (r.hyperlink) return `<a href="${r.hyperlink.url}" style="${style}">${r.text}</a>`;
            return style ? `<span style="${style}">${r.text}</span>` : r.text;
          }).join('');

          let tag = 'p';
          let tagStyle = align;
          if (para.style.startsWith('Heading')) {
            const level = parseInt(para.style.replace('Heading', ''), 10) || 1;
            tag = `h${level}`;
            const s = this.document.styles.find(st => st.name === para.style);
            if (s) {
              tagStyle += `font-family:${s.runFormatting.fontFamily || 'Calibri Light'};`;
              tagStyle += `color:${s.runFormatting.color || '#2F5496'};`;
            }
          } else if (para.style === 'Title') {
            tag = 'h1';
            tagStyle += 'text-align:center;font-family:Calibri Light;font-size:28pt;';
          } else if (para.style === 'Subtitle') {
            tag = 'p';
            tagStyle += 'text-align:center;font-size:18pt;color:#5A5A5A;font-style:italic;';
          }

          html += `<${tag} style="${tagStyle}">${runs || '&nbsp;'}</${tag}>`;
        } else if (block.type === 'table') {
          const table = block as Table;
          html += '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">';
          for (const row of table.rows) {
            html += '<tr>';
            for (const cell of row.cells) {
              const cellText = cell.textRuns.map(r => r.text).join('');
              html += `<td rowspan="${cell.rowSpan}" colspan="${cell.colSpan}">${cellText || '&nbsp;'}</td>`;
            }
            html += '</tr>';
          }
          html += '</table>';
        } else if (block.type === 'image') {
          const img = block as ImageBlock;
          html += `<div style="text-align:${img.alignment};margin:12px 0;"><img src="${img.src}" alt="${img.altText}" style="width:${img.width}px;height:${img.height}px;" /></div>`;
        } else if (block.type === 'shape') {
          const shape = block as ShapeBlock;
          html += `<div style="width:${shape.width}px;height:${shape.height}px;background:${shape.fill.color || '#4472C4'};border:2px solid ${shape.outline.color};display:inline-block;margin:8px;text-align:center;line-height:${shape.height}px;">${shape.text || ''}</div>`;
        } else if (block.type === 'horizontalRule') {
          html += '<hr />';
        } else if (block.type === 'pageBreak') {
          html += '<div style="page-break-after:always;"></div>';
        } else if (block.type === 'equation') {
          const eq = block as EquationBlock;
          html += `<div style="text-align:center;font-style:italic;font-family:Cambria Math,serif;font-size:18px;margin:12px 0;">${eq.latex}</div>`;
        } else if (block.type === 'chart') {
          html += '<div style="text-align:center;padding:20px;background:#f5f5f5;border:1px solid #ddd;margin:12px 0;">[Chart: ' + (block as ChartBlock).chartType + ']</div>';
        } else if (block.type === 'smartart') {
          html += '<div style="text-align:center;padding:20px;background:#f5f5f5;border:1px solid #ddd;margin:12px 0;">[SmartArt: ' + (block as SmartArtBlock).layout + ']</div>';
        }
      }
    }

    // Footnotes
    if (this.document.footnotes.length > 0) {
      html += '<div style="border-top:1px solid #ccc;margin-top:24px;padding-top:8px;">';
      for (const fn of this.document.footnotes) {
        html += `<p style="font-size:9pt;"><sup>${fn.marker}</sup> ${fn.text}</p>`;
      }
      html += '</div>';
    }

    // Endnotes
    if (this.document.endnotes.length > 0) {
      html += '<div style="border-top:1px solid #ccc;margin-top:12px;padding-top:8px;">';
      for (const en of this.document.endnotes) {
        html += `<p style="font-size:9pt;"><sup>${en.marker}</sup> ${en.text}</p>`;
      }
      html += '</div>';
    }

    html += '</body></html>';
    return html;
  }

  exportAsText(): string {
    return this.getAllText();
  }

  // ─── Internal helpers ──────────────────────────────────────────────────

  private deleteSelectionInternal(): void {
    const startOffset = this.getAbsoluteOffset(this.selection.start);
    const endOffset = this.getAbsoluteOffset(this.selection.end);
    const min = Math.min(startOffset, endOffset);
    const max = Math.max(startOffset, endOffset);

    const allRuns: { para: Paragraph; runIndex: number; run: TextRun }[] = [];
    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        for (let r = 0; r < para.textRuns.length; r++) {
          allRuns.push({ para, runIndex: r, run: para.textRuns[r] });
        }
      }
    }

    let charPos = 0;
    for (const { run } of allRuns) {
      const runStart = charPos;
      const runEnd = charPos + run.text.length;
      if (runEnd <= min || runStart >= max) { charPos = runEnd; continue; }
      const deleteStart = Math.max(0, min - runStart);
      const deleteEnd = Math.min(run.text.length, max - runStart);
      run.text = run.text.substring(0, deleteStart) + run.text.substring(deleteEnd);
      charPos = runEnd;
    }

    for (const section of this.document.sections) {
      for (const block of section.blocks) {
        if (block.type !== 'paragraph') continue;
        const para = block as Paragraph;
        para.textRuns = para.textRuns.filter(r => r.text.length > 0);
        if (para.textRuns.length === 0) {
          para.textRuns.push({ id: generateId(), text: '', formatting: {} });
        }
      }
    }

    this.cursor = { ...this.selection.start };
    this.selection = { start: { ...this.cursor }, end: { ...this.cursor }, isCollapsed: true };
  }
}

// ─── Roman numeral helper ────────────────────────────────────────────────────

function romanize(num: number): string {
  const lookup: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1],
  ];
  let result = '';
  for (const [letter, value] of lookup) {
    while (num >= value) { result += letter; num -= value; }
  }
  return result;
}
