import React, { useState, useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Ribbon } from './components/toolbar/Ribbon';
import { DocumentCanvas } from './components/editor/DocumentCanvas';
import { Ruler } from './components/editor/Ruler';
import { StatusBar } from './components/panels/StatusBar';
import { NavigationPane } from './components/panels/NavigationPane';
import { PropertiesPanel } from './components/panels/PropertiesPanel';
import { CommentsPanel } from './components/panels/CommentsPanel';
import { FileMenu } from './components/menubar/FileMenu';
import { ContextMenu } from './components/menus/ContextMenu';
import { FindReplaceDialog } from './components/dialogs/FindReplaceDialog';
import { WordCountDialog } from './components/dialogs/WordCountDialog';
import { PageSetupDialog } from './components/dialogs/PageSetupDialog';
import { SymbolPicker } from './components/dialogs/SymbolPicker';
import { AutoCorrectDialog } from './components/dialogs/AutoCorrectDialog';
import { TableGridPicker } from './components/dialogs/TableGridPicker';
import { SettingsDialog } from './components/dialogs/SettingsDialog';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider, useToast } from './components/toast/Toast';
import { DocumentEngineProvider, useDocumentEngine } from './hooks/useDocumentEngine';
import { UIProvider, useUI } from './store/uiStore';
import { AIPanel } from './components/ai/AIPanel';
import { StartPage, TemplateDef } from './components/documents/StartPage';
import { DocumentTabs, DocTab } from './components/documents/DocumentTabs';
import { FloatingToolbar } from './components/editor/FloatingToolbar';
import { TitleBar, SaveStatus } from './components/titlebar/TitleBar';
import { AppPrefs, loadPrefs, loadRecents, removeRecent, savePrefs, upsertRecent, RecentDoc } from './services/storage';
import './styles/App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <DocumentEngineProvider>
          <UIProvider>
            <AppShell />
          </UIProvider>
        </DocumentEngineProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

/* ============================================================
   Application shell — owns session state (tabs, saves, dialogs)
   ============================================================ */

function generateId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Populate a freshly created document with starter content for a template. */
function applyTemplate(
  engine: ReturnType<typeof useDocumentEngine>,
  template: TemplateDef,
): void {
  template.blocks.forEach((block, i) => {
    if (i > 0) engine.insertParagraph();
    if (block.text) engine.insertText(block.text);
    if (block.style && block.style !== 'Normal') engine.applyStyle(block.style);
  });
}

const AppShell: React.FC = () => {
  const engine = useDocumentEngine();
  const ui = useUI();
  const { toast } = useToast();

  /* ---------- Session state ---------- */
  const [tabs, setTabs] = useState<DocTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [prefs, setPrefsState] = useState<AppPrefs>(() => loadPrefs());
  const [recents, setRecents] = useState<RecentDoc[]>(() => loadRecents());
  const [currentPage, setCurrentPage] = useState(1);

  const suppressDirtyRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const saveStatusRef = useRef<SaveStatus>('saved');
  const handleSaveRef = useRef<(() => void) | null>(null);
  saveStatusRef.current = saveStatus;

  /* ---------- Preferences persistence ---------- */
  const updatePrefs = useCallback((next: AppPrefs) => {
    setPrefsState(next);
    savePrefs(next);
  }, []);

  /* ---------- Dirty tracking ---------- */
  useEffect(() => {
    const off = engine.engine.on('document-changed', () => {
      if (!suppressDirtyRef.current) {
        setSaveStatus((s) => (s === 'saving' ? s : 'unsaved'));
      }
    });
    return off;
  }, [engine]);

  /* ---------- Tab helpers ---------- */
  /** Write the live engine document back into the currently active tab. */
  const stashActive = useCallback((currentTabs: DocTab[], currentId: string | null) => {
    if (!currentId) return currentTabs;
    const snapshot = engine.exportJSON();
    return currentTabs.map((t) =>
      t.id === currentId ? { ...t, snapshot, title: t.title || engine.document?.metadata.title || '' } : t,
    );
  }, [engine]);

  /** Load a tab's document into the engine without marking the app dirty. */
  const loadIntoEngine = useCallback((tab: DocTab) => {
    suppressDirtyRef.current = true;
    try {
      if (tab.snapshot) {
        engine.importJSON(tab.snapshot);
      } else {
        engine.newDocument();
      }
      engine.setDocumentTitle(tab.title || 'Untitled Document');
    } finally {
      // Let queued engine events flush before re-enabling dirty tracking
      window.setTimeout(() => { suppressDirtyRef.current = false; }, 0);
    }
  }, [engine]);

  const openTab = useCallback((tab: DocTab) => {
    setTabs([...stashActive(tabs, activeTabId), tab]);
    loadIntoEngine(tab);
    setActiveTabId(tab.id);
    setSaveStatus('saved');
  }, [tabs, activeTabId, loadIntoEngine, stashActive]);

  const createNewDocument = useCallback((template?: TemplateDef) => {
    const id = generateId();
    const title = template ? template.name : 'Untitled Document';

    suppressDirtyRef.current = true;
    try {
      engine.newDocument();
      engine.setDocumentTitle(title);
      if (template) applyTemplate(engine, template);
    } finally {
      window.setTimeout(() => { suppressDirtyRef.current = false; }, 0);
    }

    setTabs([...stashActive(tabs, activeTabId), { id, title, snapshot: null, dirty: false }]);
    setActiveTabId(id);
    setSaveStatus('saved');
    setShowFileMenu(false);
  }, [tabs, activeTabId, engine, stashActive]);

  const selectTab = useCallback((id: string) => {
    if (id === activeTabId) return;
    const stashed = stashActive(tabs, activeTabId);
    const target = stashed.find((t) => t.id === id);
    if (!target) return;
    loadIntoEngine(target);
    setTabs(stashed);
    setActiveTabId(id);
    setSaveStatus('saved');
  }, [tabs, activeTabId, loadIntoEngine, stashActive]);

  const closeTab = useCallback((id: string) => {
    const idx = tabs.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const next = tabs.filter((t) => t.id !== id);
    if (id === activeTabId) {
      const neighbor = next[Math.min(idx, next.length - 1)];
      if (neighbor) {
        loadIntoEngine(neighbor);
        setActiveTabId(neighbor.id);
      } else {
        setActiveTabId(null);
      }
    }
    setTabs(next);
  }, [tabs, activeTabId, loadIntoEngine]);

  /* ---------- Saving ---------- */
  const handleSave = useCallback(() => {
    if (!activeTabId) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);

    setSaveStatus('saving');
    const json = engine.exportJSON();
    const title = engine.document?.metadata.title || 'Untitled Document';

    saveTimerRef.current = window.setTimeout(() => {
      setSaveStatus('saved');
      if (prefs.autosave) {
        setRecents(upsertRecent(activeTabId, title, json));
      }
      setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, snapshot: json, dirty: false, title } : t)));
      toast('success', 'Document saved', `“${title}” was saved on this device.`);
    }, 650);
  }, [activeTabId, engine, prefs.autosave, toast]);

  handleSaveRef.current = handleSave;

  /* ---------- Global keyboard shortcuts ----------
     The editor surface handles text-level keys (B/I/U/Z/Y/A/K…) itself and
     calls preventDefault; this handler skips anything already consumed. */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const mod = e.ctrlKey || e.metaKey;

      if (mod) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            createNewDocument();
            return;
          case 'o':
            e.preventDefault();
            engine.openDocument();
            return;
          case 's':
            e.preventDefault();
            if (e.shiftKey) setShowFileMenu(true);
            else handleSave();
            return;
          case 'p':
            e.preventDefault();
            window.print();
            return;
          case 'f':
            e.preventDefault();
            ui.openDialog('find');
            return;
          case 'h':
            e.preventDefault();
            ui.openDialog('replace');
            return;
        }
      }

      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.();
        return;
      }

      if (e.key === 'Escape') {
        if (ui.dialog) {
          ui.closeDialog();
        } else if (showFileMenu) {
          setShowFileMenu(false);
        } else if (ui.focusMode) {
          ui.setFocusMode(false);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createNewDocument, engine, handleSave, showFileMenu, ui]);

  /* ---------- Current page tracking (scroll based) ---------- */
  useEffect(() => {
    const wrapper = document.querySelector('.document-canvas-wrapper');
    if (!wrapper) return;

    const pages = Math.max(1, Math.ceil(engine.getWordCount() / 320));
    const onScroll = () => {
      const el = wrapper as HTMLElement;
      const range = el.scrollHeight - el.clientHeight;
      const frac = range > 0 ? el.scrollTop / range : 0;
      setCurrentPage(Math.min(pages, Math.floor(frac * pages) + 1));
    };
    onScroll();
    wrapper.addEventListener('scroll', onScroll, { passive: true });
    return () => wrapper.removeEventListener('scroll', onScroll);
  }, [engine.document, engine]);

  const pageCount = Math.max(1, Math.ceil(engine.getWordCount() / 320));

  /* ---------- Window title + unsaved guard ---------- */
  useEffect(() => {
    const title = engine.document?.metadata.title;
    document.title = title && activeTabId ? `${title} — WORD` : 'WORD';
  }, [engine.document?.metadata.title, activeTabId]);

  useEffect(() => {
    if (saveStatus !== 'unsaved') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [saveStatus]);

  /* ---------- Silent autosave into recents ---------- */
  useEffect(() => {
    if (!prefs.autosave) return;
    const interval = window.setInterval(() => {
      if (saveStatusRef.current === 'unsaved' && activeTabId) {
        handleSaveRef.current?.();
      }
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [prefs.autosave, activeTabId]);

  /* ---------- Canvas interactions ---------- */
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.document-canvas')) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
    }
  }, []);

  /* ---------- Rendering ---------- */
  const showStart = tabs.length === 0 || !activeTabId;

  return (
    <div className="app-container" onContextMenu={handleContextMenu}>
      {!ui.focusMode && !showStart && (
        <DocumentTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onSelect={selectTab}
          onClose={closeTab}
          onNew={() => createNewDocument()}
        />
      )}

      <TitleBar saveStatus={saveStatus} onSave={handleSave} />

      {showFileMenu && (
        <FileMenu
          onClose={() => setShowFileMenu(false)}
          onOpenSettings={() => ui.openDialog('settings')}
        />
      )}

      {!showStart && (
        <>
          {/* Ribbon */}
          {!ui.focusMode && (
            <Ribbon onOpenFileMenu={() => setShowFileMenu(true)} />
          )}

          {/* Ruler */}
          {!ui.focusMode && ui.showRuler && <Ruler zoom={ui.zoom} />}
        </>
      )}

      {/* Main content area */}
      {showStart ? (
        <div className="main-content">
          <StartPage
            recents={recents}
            userName={prefs.userName}
            onOpenTemplate={(tpl) => createNewDocument(tpl)}
            onOpenRecent={(doc) => {
              const tab: DocTab = {
                id: generateId(),
                title: doc.title,
                snapshot: doc.snapshot,
                dirty: false,
              };
              openTab(tab);
              // The reopened doc gets a fresh session id — drop the stale entry
              // so saving later doesn't leave duplicates in the list.
              setRecents(removeRecent(doc.id));
              toast('info', 'Document opened', `“${doc.title}” loaded from recent files.`);
            }}
            onRemoveRecent={(id) => setRecents(removeRecent(id))}
            onOpenFile={() => engine.openDocument()}
          />
        </div>
      ) : (
        <div className={`main-content${ui.focusMode ? ' focus-mode' : ''}`}>
          {/* Navigation Pane */}
          {!ui.focusMode && ui.navigationOpen && (
            <NavigationPane onClose={() => ui.setNavigationOpen(false)} />
          )}

          {/* Document Canvas */}
          <DocumentCanvas zoom={ui.zoom} />

          {/* Right panels — mutually exclusive */}
          {!ui.focusMode && ui.rightPanel === 'properties' && <PropertiesPanel />}
          {!ui.focusMode && ui.rightPanel === 'comments' && <CommentsPanel />}
          {!ui.focusMode && ui.rightPanel === 'ai' && <AIPanel />}
        </div>
      )}

      {/* Status Bar */}
      {!showStart && !ui.focusMode && (
        <StatusBar saveStatus={saveStatus} currentPage={currentPage} pageCount={pageCount} />
      )}

      {/* Contextual floating toolbar for selections */}
      {!showStart && <FloatingToolbar />}

      {/* Focus-mode exit affordance */}
      {ui.focusMode && (
        <button
          className="focus-exit"
          onClick={() => ui.setFocusMode(false)}
          title="Exit Focus Mode (Esc)"
          aria-label="Exit focus mode"
        >
          <X size={13} strokeWidth={2.4} />
          Exit Focus
        </button>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu position={contextMenu} onClose={() => setContextMenu(null)} />
      )}

      {/* Dialogs */}
      {(ui.dialog === 'find' || ui.dialog === 'replace') && (
        <FindReplaceDialog
          key={ui.dialog}
          mode={ui.dialog}
          onClose={() => ui.closeDialog()}
        />
      )}
      {ui.dialog === 'wordCount' && <WordCountDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'pageSetup' && <PageSetupDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'symbolPicker' && <SymbolPicker onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'autoCorrect' && <AutoCorrectDialog onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'tableGrid' && <TableGridPicker onClose={() => ui.closeDialog()} />}
      {ui.dialog === 'settings' && (
        <SettingsDialog prefs={prefs} onPrefsChange={updatePrefs} onClose={() => ui.closeDialog()} />
      )}
    </div>
  );
};

export default App;
