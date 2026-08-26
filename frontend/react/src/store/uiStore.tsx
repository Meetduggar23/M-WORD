import React, { createContext, useContext, useCallback, useMemo, useState, ReactNode } from 'react';

export type RightPanel = 'properties' | 'comments' | 'ai' | 'health' | 'inspector' | null;
export type RibbonTabId =
  | 'File' | 'Home' | 'Insert' | 'Draw' | 'Design' | 'Layout'
  | 'References' | 'Mailings' | 'Review' | 'View' | 'Developer' | 'Help';
export type DialogKind =
  | 'find' | 'replace' | 'wordCount' | 'pageSetup' | 'symbolPicker'
  | 'autoCorrect' | 'tableGrid' | 'settings'
  /* Intelligent features */
  | 'commandPalette' | 'cleanup' | 'documentTest' | 'pasteOptions'
  | 'codeBlock' | 'timeline' | 'diff' | 'analytics' | 'generator' | null;
export type NavView =
  | 'outline' | 'pages' | 'search' | 'bookmarks' | 'comments' | 'history' | 'attachments';

export const ZOOM_STEPS = [50, 75, 90, 100, 125, 150, 200];

interface UIState {
  activeRibbonTab: RibbonTabId;
  setActiveRibbonTab: (tab: RibbonTabId) => void;

  ribbonCollapsed: boolean;
  toggleRibbonCollapsed: () => void;

  navView: NavView | null;
  setNavView: (view: NavView | null) => void;
  toggleNavView: (view: NavView) => void;

  navigationOpen: boolean;
  setNavigationOpen: (open: boolean) => void;
  toggleNavigation: () => void;

  rightPanel: RightPanel;
  setRightPanel: (panel: RightPanel) => void;
  toggleRightPanel: (panel: Exclude<RightPanel, null>) => void;

  dialog: DialogKind;
  openDialog: (dialog: Exclude<DialogKind, null>) => void;
  closeDialog: () => void;

  zoom: number;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;

  showRuler: boolean;
  toggleRuler: () => void;

  focusMode: boolean;
  setFocusMode: (on: boolean) => void;

  /** Developer Mode — code blocks, JSON tools, markdown, diff surfaces */
  devMode: boolean;
  setDevMode: (on: boolean) => void;
  toggleDevMode: () => void;

  /** Payload for parameterized dialogs (paste options, diff, generator…) */
  dialogPayload: unknown;
  openDialogWith: <T>(dialog: Exclude<DialogKind, null>, payload: T) => void;
}

const UIContext = createContext<UIState | null>(null);

function clampZoom(z: number): number {
  return Math.min(400, Math.max(25, Math.round(z)));
}

function stepZoom(current: number, direction: 1 | -1): number {
  if (direction === 1) {
    const next = ZOOM_STEPS.find((z) => z > current);
    return next ?? current;
  }
  const prev = [...ZOOM_STEPS].reverse().find((z) => z < current);
  return prev ?? ZOOM_STEPS[0];
}

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRibbonTab, setActiveRibbonTab] = useState<RibbonTabId>('Home');
  const [ribbonCollapsed, setRibbonCollapsed] = useState(false);
  const [navView, setNavViewState] = useState<NavView | null>('outline');
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [zoom, setZoomState] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [focusMode, setFocusModeState] = useState(false);
  const [devMode, setDevModeState] = useState(false);
  const [dialogPayload, setDialogPayload] = useState<unknown>(null);

  const toggleRibbonCollapsed = useCallback(() => setRibbonCollapsed((c) => !c), []);

  const setNavView = useCallback((view: NavView | null) => setNavViewState(view), []);

  // Clicking the active rail icon closes the panel; clicking another switches views
  const toggleNavView = useCallback((view: NavView) => {
    setNavViewState((cur) => (cur === view ? null : view));
  }, []);

  const setNavigationOpen = useCallback((open: boolean) => {
    setNavViewState((cur) => (open ? (cur ?? 'outline') : null));
  }, []);

  const toggleNavigation = useCallback(() => {
    setNavViewState((cur) => (cur ? null : 'outline'));
  }, []);

  // Right-side panels are mutually exclusive
  const toggleRightPanel = useCallback((panel: Exclude<RightPanel, null>) => {
    setRightPanel((cur) => (cur === panel ? null : panel));
  }, []);

  const openDialog = useCallback((d: Exclude<DialogKind, null>) => setDialog(d), []);
  const closeDialog = useCallback(() => setDialog(null), []);
  const openDialogWith = useCallback(<T,>(dialog: Exclude<DialogKind, null>, payload: T) => {
    setDialogPayload(payload);
    setDialog(dialog);
  }, []);
  const setDevMode = useCallback((on: boolean) => setDevModeState(on), []);
  const toggleDevMode = useCallback(() => setDevModeState((d) => !d), []);

  const setZoom = useCallback((z: number) => setZoomState(clampZoom(z)), []);
  const zoomIn = useCallback(() => setZoomState((z) => stepZoom(z, 1)), []);
  const zoomOut = useCallback(() => setZoomState((z) => stepZoom(z, -1)), []);

  const toggleRuler = useCallback(() => setShowRuler((r) => !r), []);

  const setFocusMode = useCallback((on: boolean) => {
    setFocusModeState(on);
    if (on) {
      setDialog(null);
      setNavViewState(null);
      setRightPanel(null);
    }
  }, []);

  const navigationOpen = navView !== null;

  const value = useMemo<UIState>(
    () => ({
      activeRibbonTab, setActiveRibbonTab,
      ribbonCollapsed, toggleRibbonCollapsed,
      navView, setNavView, toggleNavView,
      navigationOpen, setNavigationOpen, toggleNavigation,
      rightPanel, setRightPanel, toggleRightPanel,
      dialog, openDialog, closeDialog, openDialogWith, dialogPayload,
      zoom, setZoom, zoomIn, zoomOut,
      showRuler, toggleRuler,
      focusMode, setFocusMode,
      devMode, setDevMode, toggleDevMode,
    }),
    [
      activeRibbonTab, ribbonCollapsed, toggleRibbonCollapsed,
      navView, setNavView, toggleNavView,
      navigationOpen, setNavigationOpen, toggleNavigation,
      rightPanel, toggleRightPanel,
      dialog, openDialog, closeDialog, openDialogWith, dialogPayload,
      zoom, setZoom, zoomIn, zoomOut,
      showRuler, toggleRuler,
      focusMode, setFocusMode,
      devMode, setDevMode, toggleDevMode,
    ],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export function useUI(): UIState {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within a UIProvider');
  return ctx;
}
